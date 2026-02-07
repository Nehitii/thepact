-- Create active_missions table for persistent mission focus system
CREATE TABLE public.active_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.steps(id) ON DELETE SET NULL,
  step_title TEXT NOT NULL,
  deadline_type TEXT NOT NULL CHECK (deadline_type IN ('24h', '48h', '72h', '1week', '1month')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Only one active mission per user at a time
  CONSTRAINT one_active_mission_per_user UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.active_missions ENABLE ROW LEVEL SECURITY;

-- Users can view their own active mission
CREATE POLICY "Users can view their own active mission"
ON public.active_missions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own active mission
CREATE POLICY "Users can insert their own active mission"
ON public.active_missions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own active mission
CREATE POLICY "Users can update their own active mission"
ON public.active_missions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete (abandon) their own active mission
CREATE POLICY "Users can delete their own active mission"
ON public.active_missions
FOR DELETE
USING (auth.uid() = user_id);