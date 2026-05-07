
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  theme TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  leaderboard_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons_read_all" ON public.seasons FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT (now()::date),
  kind TEXT NOT NULL,           -- e.g. 'complete_steps' | 'log_habit' | 'journal_entry' | 'focus_minutes'
  title TEXT NOT NULL,
  description TEXT,
  target INT NOT NULL DEFAULT 1,
  progress INT NOT NULL DEFAULT 0,
  reward_bonds INT NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active', -- active | completed | claimed | expired
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON public.daily_quests(user_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_quests_user_date_kind ON public.daily_quests(user_id, date, kind);

ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dq_read_own" ON public.daily_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dq_insert_own" ON public.daily_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dq_update_own" ON public.daily_quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dq_delete_own" ON public.daily_quests FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_daily_quests_updated_at
  BEFORE UPDATE ON public.daily_quests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic claim
CREATE OR REPLACE FUNCTION public.claim_quest(_quest_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_q public.daily_quests;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Auth required'; END IF;
  SELECT * INTO v_q FROM public.daily_quests WHERE id = _quest_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quest not found'; END IF;
  IF v_q.user_id <> v_uid THEN RAISE EXCEPTION 'Not owner'; END IF;
  IF v_q.status = 'claimed' THEN RAISE EXCEPTION 'Already claimed'; END IF;
  IF v_q.progress < v_q.target THEN RAISE EXCEPTION 'Quest not completed'; END IF;

  INSERT INTO public.bond_balance (user_id, balance, total_earned)
  VALUES (v_uid, v_q.reward_bonds, v_q.reward_bonds)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = public.bond_balance.balance + v_q.reward_bonds,
      total_earned = public.bond_balance.total_earned + v_q.reward_bonds,
      updated_at = now();

  UPDATE public.daily_quests SET status = 'claimed', updated_at = now() WHERE id = _quest_id;
  RETURN jsonb_build_object('ok', true, 'reward', v_q.reward_bonds);
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_quest(uuid) TO authenticated;

-- Seed current season (Q2 2026 / "Awakening")
INSERT INTO public.seasons (slug, name, theme, starts_at, ends_at)
VALUES ('s1-awakening', 'Saison 1 — Awakening', 'awakening',
        date_trunc('quarter', now()), date_trunc('quarter', now()) + interval '3 months')
ON CONFLICT (slug) DO NOTHING;
