-- Create function to increment tracking counters
CREATE OR REPLACE FUNCTION public.increment_tracking_counter(
  p_user_id uuid,
  p_field text,
  p_increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if tracking record exists
  IF NOT EXISTS (SELECT 1 FROM achievement_tracking WHERE user_id = p_user_id) THEN
    INSERT INTO achievement_tracking (user_id) VALUES (p_user_id);
  END IF;

  -- Update the specific field
  EXECUTE format(
    'UPDATE achievement_tracking SET %I = COALESCE(%I, 0) + $1 WHERE user_id = $2',
    p_field, p_field
  ) USING p_increment, p_user_id;
END;
$$;