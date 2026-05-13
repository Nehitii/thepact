
-- 1) Extend goal_templates
ALTER TABLE public.goal_templates
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_goal_templates_public ON public.goal_templates(is_public, rating_avg DESC) WHERE is_public = true;

-- Update SELECT policy to include is_public
DROP POLICY IF EXISTS "View featured or own templates" ON public.goal_templates;
CREATE POLICY "View public, featured, own templates"
ON public.goal_templates FOR SELECT
TO authenticated
USING (
  COALESCE(is_public, false) = true
  OR COALESCE(is_featured, false) = true
  OR created_by IS NULL
  OR created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow owner to update is_public on their template
DROP POLICY IF EXISTS "Users update own templates" ON public.goal_templates;
CREATE POLICY "Users update own templates"
ON public.goal_templates FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users delete own templates" ON public.goal_templates;
CREATE POLICY "Users delete own templates"
ON public.goal_templates FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- 2) Template ratings
CREATE TABLE IF NOT EXISTS public.template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.goal_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON public.template_ratings(template_id);

ALTER TABLE public.template_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tr_read_all_authenticated" ON public.template_ratings FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "tr_write_own" ON public.template_ratings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_template_ratings_updated_at
  BEFORE UPDATE ON public.template_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) RPC rate_template (recompute average)
CREATE OR REPLACE FUNCTION public.rate_template(
  _template_id UUID,
  _rating SMALLINT,
  _review TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_avg NUMERIC;
  v_count INT;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF _rating < 1 OR _rating > 5 THEN RETURN jsonb_build_object('success', false, 'error', 'Rating must be 1-5'); END IF;

  INSERT INTO public.template_ratings (template_id, user_id, rating, review)
  VALUES (_template_id, v_user, _rating, NULLIF(trim(_review), ''))
  ON CONFLICT (template_id, user_id) DO UPDATE
  SET rating = EXCLUDED.rating,
      review = EXCLUDED.review,
      updated_at = now();

  SELECT ROUND(AVG(rating)::numeric, 2), COUNT(*)
    INTO v_avg, v_count
  FROM public.template_ratings
  WHERE template_id = _template_id;

  UPDATE public.goal_templates
  SET rating_avg = COALESCE(v_avg, 0),
      rating_count = COALESCE(v_count, 0),
      updated_at = now()
  WHERE id = _template_id;

  RETURN jsonb_build_object('success', true, 'rating_avg', v_avg, 'rating_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.rate_template(UUID, SMALLINT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rate_template(UUID, SMALLINT, TEXT) TO authenticated;

-- 4) Habit skip rules
CREATE TABLE IF NOT EXISTS public.habit_skip_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  -- weekdays: array of int 0..6 (0=Sunday) -- skip these days
  weekdays SMALLINT[] DEFAULT '{}'::smallint[],
  -- specific dates to skip (YYYY-MM-DD)
  skip_dates DATE[] DEFAULT '{}'::date[],
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id)
);
CREATE INDEX IF NOT EXISTS idx_habit_skip_rules_user ON public.habit_skip_rules(user_id);

ALTER TABLE public.habit_skip_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hsr_read_own" ON public.habit_skip_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "hsr_write_own" ON public.habit_skip_rules FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_habit_skip_rules_updated_at
  BEFORE UPDATE ON public.habit_skip_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Negative habits flag
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS is_negative BOOLEAN NOT NULL DEFAULT false;
