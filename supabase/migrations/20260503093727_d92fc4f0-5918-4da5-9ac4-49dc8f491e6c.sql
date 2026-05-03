
CREATE TABLE public.life_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Circle',
  color TEXT NOT NULL DEFAULT '#5BB4FF',
  weight INTEGER NOT NULL DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.life_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "life_areas select own" ON public.life_areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "life_areas insert own" ON public.life_areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "life_areas update own" ON public.life_areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "life_areas delete own" ON public.life_areas FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_life_areas_user ON public.life_areas(user_id);
CREATE TRIGGER update_life_areas_updated_at BEFORE UPDATE ON public.life_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  statement TEXT,
  rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_values select own" ON public.user_values FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_values insert own" ON public.user_values FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_values update own" ON public.user_values FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_values delete own" ON public.user_values FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_user_values_user ON public.user_values(user_id);
CREATE TRIGGER update_user_values_updated_at BEFORE UPDATE ON public.user_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.goals ADD COLUMN life_area_id UUID REFERENCES public.life_areas(id) ON DELETE SET NULL;
ALTER TABLE public.bank_transactions ADD COLUMN life_area_id UUID REFERENCES public.life_areas(id) ON DELETE SET NULL;
ALTER TABLE public.habit_logs ADD COLUMN life_area_id UUID REFERENCES public.life_areas(id) ON DELETE SET NULL;

CREATE INDEX idx_goals_life_area ON public.goals(life_area_id);
CREATE INDEX idx_bank_transactions_life_area ON public.bank_transactions(life_area_id);
CREATE INDEX idx_habit_logs_life_area ON public.habit_logs(life_area_id);
