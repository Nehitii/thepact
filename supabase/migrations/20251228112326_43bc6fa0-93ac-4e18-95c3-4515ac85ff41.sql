-- Create table for itemized cost items per goal
CREATE TABLE public.goal_cost_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.goal_cost_items ENABLE ROW LEVEL SECURITY;

-- Create policies: users can manage cost items for their own goals
CREATE POLICY "Users can view their own goal cost items"
ON public.goal_cost_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM goals
    JOIN pacts ON pacts.id = goals.pact_id
    WHERE goals.id = goal_cost_items.goal_id
    AND pacts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own goal cost items"
ON public.goal_cost_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM goals
    JOIN pacts ON pacts.id = goals.pact_id
    WHERE goals.id = goal_cost_items.goal_id
    AND pacts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own goal cost items"
ON public.goal_cost_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM goals
    JOIN pacts ON pacts.id = goals.pact_id
    WHERE goals.id = goal_cost_items.goal_id
    AND pacts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own goal cost items"
ON public.goal_cost_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM goals
    JOIN pacts ON pacts.id = goals.pact_id
    WHERE goals.id = goal_cost_items.goal_id
    AND pacts.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_goal_cost_items_updated_at
  BEFORE UPDATE ON public.goal_cost_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();