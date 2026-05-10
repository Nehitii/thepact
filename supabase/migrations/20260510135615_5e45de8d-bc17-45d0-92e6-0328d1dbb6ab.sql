
ALTER TABLE public.habit_logs
  ADD COLUMN IF NOT EXISTS is_freeze boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS freeze_cost integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.get_streak_freeze_price()
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$ SELECT 50 $$;

CREATE OR REPLACE FUNCTION public.use_streak_freeze(_goal_id uuid, _date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_price integer := public.get_streak_freeze_price();
  v_bal record;
  v_existing record;
  v_streak integer := 0;
  v_log_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Goal must belong to user
  IF NOT EXISTS (SELECT 1 FROM public.goals WHERE id = _goal_id AND user_id = v_user) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal not found');
  END IF;

  -- Cannot freeze future
  IF _date > CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot freeze a future date');
  END IF;

  -- Cannot freeze older than 7 days
  IF _date < CURRENT_DATE - INTERVAL '7 days' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Date too old to freeze');
  END IF;

  -- Already logged?
  SELECT * INTO v_existing FROM public.habit_logs
  WHERE user_id = v_user AND goal_id = _goal_id AND log_date = _date;

  IF FOUND AND (v_existing.completed OR v_existing.is_freeze) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Day already counted');
  END IF;

  -- Lock + check balance
  SELECT * INTO v_bal FROM public.bond_balance WHERE user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No balance');
  END IF;
  IF v_bal.balance < v_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient bonds', 'price', v_price);
  END IF;

  -- Compute streak from previous day
  SELECT COALESCE(streak_count, 0) INTO v_streak FROM public.habit_logs
  WHERE user_id = v_user AND goal_id = _goal_id
    AND log_date = _date - INTERVAL '1 day'
    AND (completed OR is_freeze);

  -- Deduct bonds
  UPDATE public.bond_balance
    SET balance = balance - v_price,
        total_spent = total_spent + v_price,
        updated_at = now()
    WHERE user_id = v_user;

  INSERT INTO public.bond_transactions(user_id, amount, transaction_type, description, reference_id, reference_type)
  VALUES (v_user, -v_price, 'spend', 'Streak freeze', _goal_id, 'streak_freeze');

  -- Insert or update freeze log
  IF FOUND AND v_existing.id IS NOT NULL THEN
    UPDATE public.habit_logs
       SET is_freeze = true,
           freeze_cost = v_price,
           streak_count = COALESCE(v_streak, 0) + 1
     WHERE id = v_existing.id
     RETURNING id INTO v_log_id;
  ELSE
    INSERT INTO public.habit_logs(user_id, goal_id, log_date, completed, streak_count, bond_reward, is_freeze, freeze_cost)
    VALUES (v_user, _goal_id, _date, false, COALESCE(v_streak,0) + 1, 0, true, v_price)
    RETURNING id INTO v_log_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id, 'price', v_price, 'new_balance', v_bal.balance - v_price);
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_streak_freeze(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_streak_freeze_price() TO authenticated;
