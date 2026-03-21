
-- Create a SECURITY DEFINER function to return only community-safe profile fields
CREATE OR REPLACE FUNCTION public.get_community_profile(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  accent_color text,
  avatar_frame text,
  active_frame_id uuid,
  active_banner_id uuid,
  active_title_id uuid,
  personal_quote text,
  community_profile_discoverable boolean,
  displayed_badges text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.accent_color,
    p.avatar_frame,
    p.active_frame_id,
    p.active_banner_id,
    p.active_title_id,
    p.personal_quote,
    p.community_profile_discoverable,
    p.displayed_badges
  FROM profiles p
  WHERE p.id = p_user_id
    AND p.community_profile_discoverable = true;
$$;

-- Create a batch version for looking up multiple community profiles
CREATE OR REPLACE FUNCTION public.get_community_profiles(p_user_ids uuid[])
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  accent_color text,
  avatar_frame text,
  active_frame_id uuid,
  active_banner_id uuid,
  active_title_id uuid,
  personal_quote text,
  community_profile_discoverable boolean,
  displayed_badges text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.accent_color,
    p.avatar_frame,
    p.active_frame_id,
    p.active_banner_id,
    p.active_title_id,
    p.personal_quote,
    p.community_profile_discoverable,
    p.displayed_badges
  FROM profiles p
  WHERE p.id = ANY(p_user_ids);
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view community profiles" ON public.profiles;
