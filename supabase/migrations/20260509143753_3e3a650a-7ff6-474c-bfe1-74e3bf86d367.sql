CREATE TABLE IF NOT EXISTS public.goal_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  depends_on_goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'blocks' CHECK (kind IN ('blocks','related')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (goal_id, depends_on_goal_id),
  CHECK (goal_id <> depends_on_goal_id)
);

CREATE INDEX IF NOT EXISTS idx_goal_dependencies_goal ON public.goal_dependencies(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_dependencies_dep ON public.goal_dependencies(depends_on_goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_dependencies_user ON public.goal_dependencies(user_id);

ALTER TABLE public.goal_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deps_select_own" ON public.goal_dependencies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "deps_insert_own" ON public.goal_dependencies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deps_delete_own" ON public.goal_dependencies
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "deps_update_own" ON public.goal_dependencies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public._check_goal_dependency_cycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_cycle boolean;
BEGIN
  IF NEW.kind <> 'blocks' THEN
    RETURN NEW;
  END IF;
  WITH RECURSIVE chain AS (
    SELECT depends_on_goal_id AS node
    FROM public.goal_dependencies
    WHERE goal_id = NEW.depends_on_goal_id AND kind = 'blocks'
    UNION
    SELECT d.depends_on_goal_id
    FROM public.goal_dependencies d
    JOIN chain c ON d.goal_id = c.node
    WHERE d.kind = 'blocks'
  )
  SELECT EXISTS (SELECT 1 FROM chain WHERE node = NEW.goal_id) INTO v_cycle;

  IF v_cycle THEN
    RAISE EXCEPTION 'Cycle detected in goal dependencies';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_goal_dep_cycle ON public.goal_dependencies;
CREATE TRIGGER trg_goal_dep_cycle
  BEFORE INSERT OR UPDATE ON public.goal_dependencies
  FOR EACH ROW EXECUTE FUNCTION public._check_goal_dependency_cycle();