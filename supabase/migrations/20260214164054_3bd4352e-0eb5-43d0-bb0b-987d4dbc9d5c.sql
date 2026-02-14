
CREATE OR REPLACE FUNCTION public.reset_pact_data(p_pact_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_user_id
  FROM pacts WHERE id = p_pact_id;

  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Delete active missions (references goals)
  DELETE FROM active_missions WHERE user_id = v_user_id;

  -- Delete all goals (FK cascades handle steps, tags, cost_items, history)
  DELETE FROM goals WHERE pact_id = p_pact_id;

  -- Reset pact counters
  UPDATE pacts SET
    points = 0,
    global_progress = 0,
    checkin_streak = 0,
    checkin_total_count = 0
  WHERE id = p_pact_id;

  -- Reset achievement tracking
  UPDATE achievement_tracking SET
    total_goals_created = 0, easy_goals_created = 0,
    medium_goals_created = 0, hard_goals_created = 0,
    extreme_goals_created = 0, impossible_goals_created = 0,
    custom_goals_created = 0, goals_completed_total = 0,
    easy_goals_completed = 0, medium_goals_completed = 0,
    hard_goals_completed = 0, extreme_goals_completed = 0,
    impossible_goals_completed = 0, custom_goals_completed = 0,
    steps_completed_total = 0
  WHERE user_id = v_user_id;

  RETURN TRUE;
END;
$$;
