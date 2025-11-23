-- Add is_focus field to goals table
ALTER TABLE public.goals
ADD COLUMN is_focus boolean DEFAULT false;

-- Create index for better performance when filtering focus goals
CREATE INDEX idx_goals_is_focus ON public.goals(is_focus) WHERE is_focus = true;