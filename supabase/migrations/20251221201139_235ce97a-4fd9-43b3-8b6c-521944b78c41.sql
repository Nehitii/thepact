-- Fix SQL Injection vulnerability in increment_tracking_counter function
-- Replace dynamic SQL with a CASE statement and strict field validation

CREATE OR REPLACE FUNCTION public.increment_tracking_counter(p_user_id uuid, p_field text, p_increment integer DEFAULT 1)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if tracking record exists
  IF NOT EXISTS (SELECT 1 FROM achievement_tracking WHERE user_id = p_user_id) THEN
    INSERT INTO achievement_tracking (user_id) VALUES (p_user_id);
  END IF;

  -- Use CASE statement with explicit field whitelist instead of dynamic SQL
  -- This prevents SQL injection by only allowing known field names
  CASE p_field
    WHEN 'total_goals_created' THEN
      UPDATE achievement_tracking SET total_goals_created = COALESCE(total_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'easy_goals_created' THEN
      UPDATE achievement_tracking SET easy_goals_created = COALESCE(easy_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'medium_goals_created' THEN
      UPDATE achievement_tracking SET medium_goals_created = COALESCE(medium_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'hard_goals_created' THEN
      UPDATE achievement_tracking SET hard_goals_created = COALESCE(hard_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'extreme_goals_created' THEN
      UPDATE achievement_tracking SET extreme_goals_created = COALESCE(extreme_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'impossible_goals_created' THEN
      UPDATE achievement_tracking SET impossible_goals_created = COALESCE(impossible_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'custom_goals_created' THEN
      UPDATE achievement_tracking SET custom_goals_created = COALESCE(custom_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'goals_completed_total' THEN
      UPDATE achievement_tracking SET goals_completed_total = COALESCE(goals_completed_total, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'easy_goals_completed' THEN
      UPDATE achievement_tracking SET easy_goals_completed = COALESCE(easy_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'medium_goals_completed' THEN
      UPDATE achievement_tracking SET medium_goals_completed = COALESCE(medium_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'hard_goals_completed' THEN
      UPDATE achievement_tracking SET hard_goals_completed = COALESCE(hard_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'extreme_goals_completed' THEN
      UPDATE achievement_tracking SET extreme_goals_completed = COALESCE(extreme_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'impossible_goals_completed' THEN
      UPDATE achievement_tracking SET impossible_goals_completed = COALESCE(impossible_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'custom_goals_completed' THEN
      UPDATE achievement_tracking SET custom_goals_completed = COALESCE(custom_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'steps_completed_total' THEN
      UPDATE achievement_tracking SET steps_completed_total = COALESCE(steps_completed_total, 0) + p_increment WHERE user_id = p_user_id;
    ELSE
      -- Invalid field name - do nothing (silently ignore to prevent information disclosure)
      NULL;
  END CASE;
END;
$function$;

-- Fix Storage Bucket Exposure
-- Make goal-images bucket private and update RLS policies to only allow owners to view their images

UPDATE storage.buckets 
SET public = false 
WHERE id = 'goal-images';

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view goal images" ON storage.objects;

-- Create a new policy that only allows users to view their own images
CREATE POLICY "Users can view their own goal images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'goal-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);