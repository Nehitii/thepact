
-- BUG 2: fix COALESCE type mismatch (text vs date) in update_achievement_tracking
CREATE OR REPLACE FUNCTION public.update_achievement_tracking(p_updates jsonb)
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

  INSERT INTO achievement_tracking (user_id) VALUES (v_user_id) ON CONFLICT DO NOTHING;

  UPDATE achievement_tracking SET
    consecutive_login_days = COALESCE((p_updates->>'consecutive_login_days')::int, consecutive_login_days),
    last_login_date = COALESCE((p_updates->>'last_login_date')::date, last_login_date),
    logins_at_same_hour_streak = COALESCE((p_updates->>'logins_at_same_hour_streak')::int, logins_at_same_hour_streak),
    usual_login_hour = COALESCE((p_updates->>'usual_login_hour')::int, usual_login_hour),
    midnight_logins_count = COALESCE((p_updates->>'midnight_logins_count')::int, midnight_logins_count),
    has_pact = COALESCE((p_updates->>'has_pact')::boolean, has_pact),
    has_edited_pact = COALESCE((p_updates->>'has_edited_pact')::boolean, has_edited_pact),
    updated_at = now()
  WHERE user_id = v_user_id;
END;
$$;

-- BUG 3: add real unique constraint for PostgREST upsert on_conflict
-- (the existing partial unique index is not usable by PostgREST's on_conflict).
-- Drop partial index to avoid redundancy, then create non-partial unique constraint.
-- NULL values remain distinct in unique constraints, so regular wishlist items are unaffected.
DROP INDEX IF EXISTS public.idx_wishlist_unique_cost_source;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wishlist_items_user_source_goal_cost_unique'
  ) THEN
    ALTER TABLE public.wishlist_items
      ADD CONSTRAINT wishlist_items_user_source_goal_cost_unique
      UNIQUE (user_id, source_goal_cost_id);
  END IF;
END $$;
