
-- ============= REVIEWS =============
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily','weekly','monthly','quarterly','annual')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  mood SMALLINT CHECK (mood BETWEEN 1 AND 5),
  alignment_score SMALLINT CHECK (alignment_score BETWEEN 0 AND 100),
  life_area_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  highlights TEXT,
  lowlights TEXT,
  next_focus TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_user_type_period ON public.reviews(user_id, type, period_start DESC);
CREATE INDEX idx_reviews_user_completed ON public.reviews(user_id, completed_at DESC) WHERE status = 'completed';

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_own" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= DECISIONS =============
CREATE TABLE public.decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  context TEXT,
  hypothesis TEXT,
  decision_text TEXT NOT NULL,
  expected_outcome TEXT,
  actual_outcome TEXT,
  lesson TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','archived')),
  confidence SMALLINT CHECK (confidence BETWEEN 1 AND 5),
  reversibility TEXT CHECK (reversibility IN ('reversible','hard_to_reverse','irreversible')),
  life_area_id UUID REFERENCES public.life_areas(id) ON DELETE SET NULL,
  related_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  related_review_id UUID REFERENCES public.reviews(id) ON DELETE SET NULL,
  decided_at DATE NOT NULL DEFAULT CURRENT_DATE,
  review_at DATE,
  reviewed_at TIMESTAMPTZ,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_decisions_user_status ON public.decisions(user_id, status, decided_at DESC);
CREATE INDEX idx_decisions_user_review_at ON public.decisions(user_id, review_at) WHERE status = 'pending' AND review_at IS NOT NULL;

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decisions_select_own" ON public.decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "decisions_insert_own" ON public.decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "decisions_update_own" ON public.decisions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "decisions_delete_own" ON public.decisions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_decisions_updated_at
  BEFORE UPDATE ON public.decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
