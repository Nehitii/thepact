CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  function_name text NOT NULL,
  call_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day, function_name)
);

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_daily_owner_read" ON public.ai_usage_daily;
CREATE POLICY "ai_usage_daily_owner_read" ON public.ai_usage_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_quota(
  _function_name text,
  _daily_limit int DEFAULT 50
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  current_count int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;

  INSERT INTO public.ai_usage_daily(user_id, day, function_name, call_count)
    VALUES (uid, CURRENT_DATE, _function_name, 1)
    ON CONFLICT (user_id, day, function_name)
    DO UPDATE SET call_count = ai_usage_daily.call_count + 1, updated_at = now()
    RETURNING call_count INTO current_count;

  IF current_count > _daily_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'quota_exceeded', 'limit', _daily_limit, 'count', current_count);
  END IF;
  RETURN jsonb_build_object('allowed', true, 'count', current_count, 'limit', _daily_limit);
END $$;

GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_quota(text, int) TO authenticated;