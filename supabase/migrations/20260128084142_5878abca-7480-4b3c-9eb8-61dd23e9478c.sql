-- Create goal_tags junction table for multi-tag support
CREATE TABLE public.goal_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (goal_id, tag)
);

-- Enable Row Level Security
ALTER TABLE public.goal_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that allow users to manage their own goal tags
-- Uses the same pattern as goals table - check ownership through pacts

CREATE POLICY "Users can view their own goal tags"
ON public.goal_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM goals
    JOIN pacts ON pacts.id = goals.pact_id
    WHERE goals.id = goal_tags.goal_id AND pacts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own goal tags"
ON public.goal_tags
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM goals
    JOIN pacts ON pacts.id = goals.pact_id
    WHERE goals.id = goal_tags.goal_id AND pacts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own goal tags"
ON public.goal_tags
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM goals
    JOIN pacts ON pacts.id = goals.pact_id
    WHERE goals.id = goal_tags.goal_id AND pacts.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_goal_tags_goal_id ON public.goal_tags(goal_id);
CREATE INDEX idx_goal_tags_tag ON public.goal_tags(tag);