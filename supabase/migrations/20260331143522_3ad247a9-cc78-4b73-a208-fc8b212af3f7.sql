
-- =============================================
-- FIX 1: Remove public INSERT policy on bond_transactions
-- Bond transactions should only be written by SECURITY DEFINER functions
-- =============================================
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.bond_transactions;

-- =============================================
-- FIX 2: Remove public (unauthenticated) SELECT on community_reactions
-- Keep only the authenticated policy
-- =============================================
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.community_reactions;

-- =============================================
-- FIX 3: Secure the user_2fa_settings_safe view
-- The view already filters by auth.uid(), but we add RLS on it as defense-in-depth
-- Since views can't have RLS directly, we recreate it as SECURITY INVOKER (default)
-- and rely on the underlying table's RLS. But the underlying table blocks SELECT.
-- So we create a SECURITY DEFINER function instead.
-- =============================================
-- Drop the old view
DROP VIEW IF EXISTS public.user_2fa_settings_safe;

-- Create a SECURITY DEFINER function to safely expose 2FA status
CREATE OR REPLACE FUNCTION public.get_own_2fa_status()
RETURNS TABLE(
  user_id uuid,
  totp_enabled boolean,
  email_2fa_enabled boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, totp_enabled, email_2fa_enabled, created_at, updated_at
  FROM public.user_2fa_settings
  WHERE user_id = auth.uid();
$$;

-- =============================================
-- FIX 4a: Remove INSERT/UPDATE policies on user_achievements
-- Writes should go through a SECURITY DEFINER function
-- =============================================
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON public.user_achievements;

-- =============================================
-- FIX 4b: Remove INSERT/UPDATE policies on achievement_tracking
-- Writes already go through increment_tracking_counter RPC (SECURITY DEFINER)
-- Add new RPCs for remaining write operations
-- =============================================
DROP POLICY IF EXISTS "Users can insert their own tracking" ON public.achievement_tracking;
DROP POLICY IF EXISTS "Users can update their own tracking" ON public.achievement_tracking;

-- =============================================
-- FIX 4c: Remove INSERT/UPDATE policies on todo_stats
-- Writes should go through a SECURITY DEFINER function
-- =============================================
DROP POLICY IF EXISTS "Users can insert their own stats" ON public.todo_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON public.todo_stats;

-- =============================================
-- Create SECURITY DEFINER RPCs for the removed policies
-- =============================================

-- RPC: Initialize achievement tracking for current user
CREATE OR REPLACE FUNCTION public.init_achievement_tracking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO achievement_tracking (user_id)
  VALUES (auth.uid())
  ON CONFLICT DO NOTHING;
END;
$$;

-- RPC: Update achievement tracking fields (only allowed fields)
CREATE OR REPLACE FUNCTION public.update_achievement_tracking(
  p_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Ensure tracking exists
  INSERT INTO achievement_tracking (user_id) VALUES (v_user_id) ON CONFLICT DO NOTHING;

  -- Only allow whitelisted fields
  UPDATE achievement_tracking SET
    consecutive_login_days = COALESCE((p_updates->>'consecutive_login_days')::int, consecutive_login_days),
    last_login_date = COALESCE(p_updates->>'last_login_date', last_login_date),
    logins_at_same_hour_streak = COALESCE((p_updates->>'logins_at_same_hour_streak')::int, logins_at_same_hour_streak),
    usual_login_hour = COALESCE((p_updates->>'usual_login_hour')::int, usual_login_hour),
    midnight_logins_count = COALESCE((p_updates->>'midnight_logins_count')::int, midnight_logins_count),
    has_pact = COALESCE((p_updates->>'has_pact')::boolean, has_pact),
    has_edited_pact = COALESCE((p_updates->>'has_edited_pact')::boolean, has_edited_pact),
    updated_at = now()
  WHERE user_id = v_user_id;
END;
$$;

-- RPC: Unlock an achievement (validates it doesn't already exist)
CREATE OR REPLACE FUNCTION public.grant_achievement(
  p_achievement_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify the achievement key exists in definitions
  IF NOT EXISTS (SELECT 1 FROM achievement_definitions WHERE key = p_achievement_key) THEN
    RETURN false;
  END IF;

  -- Insert if not already unlocked
  INSERT INTO user_achievements (user_id, achievement_key, seen)
  VALUES (v_user_id, p_achievement_key, false)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- RPC: Mark achievements as seen (the only UPDATE users need)
CREATE OR REPLACE FUNCTION public.mark_achievements_seen(
  p_achievement_keys text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_achievements
  SET seen = true
  WHERE user_id = auth.uid()
    AND achievement_key = ANY(p_achievement_keys);
END;
$$;

-- RPC: Initialize and update todo stats
CREATE OR REPLACE FUNCTION public.init_todo_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_stats record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO todo_stats (user_id) VALUES (v_user_id) ON CONFLICT DO NOTHING;

  SELECT * INTO v_stats FROM todo_stats WHERE user_id = v_user_id;

  RETURN to_jsonb(v_stats);
END;
$$;

-- RPC: Record todo completion (validates and updates atomically)
CREATE OR REPLACE FUNCTION public.record_todo_completion(
  p_score_increment int,
  p_new_streak int,
  p_longest_streak int,
  p_completion_date date,
  p_month_count int,
  p_year_count int,
  p_current_month int,
  p_current_year int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Clamp score increment to prevent abuse
  IF p_score_increment < 0 OR p_score_increment > 100 THEN
    RAISE EXCEPTION 'Invalid score increment';
  END IF;

  UPDATE todo_stats SET
    score = score + p_score_increment,
    current_streak = GREATEST(p_new_streak, 0),
    longest_streak = GREATEST(p_longest_streak, longest_streak),
    last_completion_date = p_completion_date,
    tasks_completed_month = GREATEST(p_month_count, 0),
    tasks_completed_year = GREATEST(p_year_count, 0),
    current_month = p_current_month,
    current_year = p_current_year,
    updated_at = now()
  WHERE user_id = v_user_id;
END;
$$;
