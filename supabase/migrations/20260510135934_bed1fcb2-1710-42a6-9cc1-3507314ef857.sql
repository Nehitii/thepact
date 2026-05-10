
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS prerequisite_habit_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_goals_prerequisite_habit ON public.goals(prerequisite_habit_id);
