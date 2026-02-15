ALTER TABLE public.goal_cost_items
  ADD COLUMN step_id UUID REFERENCES public.steps(id) ON DELETE SET NULL,
  ADD COLUMN category TEXT;