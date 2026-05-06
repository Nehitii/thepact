CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  rollout_percent SMALLINT NOT NULL DEFAULT 0 CHECK (rollout_percent BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feature_flags_read_all" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "feature_flags_admin_write" ON public.feature_flags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.user_feature_overrides (
  user_id UUID NOT NULL,
  key TEXT NOT NULL REFERENCES public.feature_flags(key) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  PRIMARY KEY (user_id, key)
);
ALTER TABLE public.user_feature_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ufo_read_own" ON public.user_feature_overrides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ufo_admin_write" ON public.user_feature_overrides
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.goal_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  witnesses UUID[] NOT NULL DEFAULT '{}'::uuid[],
  stake_bonds INTEGER NOT NULL DEFAULT 0 CHECK (stake_bonds >= 0),
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','succeeded','failed','canceled')),
  signed_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goal_contracts_owner ON public.goal_contracts(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_goal_contracts_goal ON public.goal_contracts(goal_id);

ALTER TABLE public.goal_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gc_read_own_or_witness" ON public.goal_contracts FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = ANY(witnesses));
CREATE POLICY "gc_insert_own" ON public.goal_contracts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "gc_update_own" ON public.goal_contracts FOR UPDATE
  USING (auth.uid() = owner_id);
CREATE POLICY "gc_delete_own" ON public.goal_contracts FOR DELETE
  USING (auth.uid() = owner_id);

CREATE TRIGGER trg_goal_contracts_updated_at
  BEFORE UPDATE ON public.goal_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('coach_write_tools', false, 'Permet au coach IA de créer todos/journal/decisions'),
  ('goal_contracts', false, 'Active la fonctionnalité Goal Contracts sociaux'),
  ('goal_decompose_ai', true, 'Active la décomposition IA dans NewGoal')
ON CONFLICT (key) DO NOTHING;