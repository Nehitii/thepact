-- Add Super Goal support to goals table
-- child_goal_ids: Array of goal IDs that make up this super goal (for manual mode)
-- super_goal_rule: JSON config for auto-build mode (difficulty filters, tags, status filters)
-- is_dynamic_super: If true, child goals are computed from rule in real-time

ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS child_goal_ids uuid[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS super_goal_rule jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_dynamic_super boolean DEFAULT false;

-- Add an index for efficient lookup of super goals
CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON public.goals(goal_type);

-- Create a function to validate super goal child references (prevent self-reference and circular nesting)
CREATE OR REPLACE FUNCTION public.validate_super_goal_children()
RETURNS TRIGGER AS $$
DECLARE
  child_id uuid;
  child_children uuid[];
BEGIN
  -- Only validate if this is a super goal with child_goal_ids
  IF NEW.goal_type = 'super' AND NEW.child_goal_ids IS NOT NULL THEN
    -- Check for self-reference
    IF NEW.id = ANY(NEW.child_goal_ids) THEN
      RAISE EXCEPTION 'A super goal cannot contain itself';
    END IF;
    
    -- Check for circular nesting (child goals that are also super goals containing this goal)
    FOREACH child_id IN ARRAY NEW.child_goal_ids
    LOOP
      SELECT child_goal_ids INTO child_children
      FROM public.goals
      WHERE id = child_id AND goal_type = 'super';
      
      IF child_children IS NOT NULL AND NEW.id = ANY(child_children) THEN
        RAISE EXCEPTION 'Circular nesting detected: child goal % contains this super goal', child_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for super goal validation
DROP TRIGGER IF EXISTS validate_super_goal_trigger ON public.goals;
CREATE TRIGGER validate_super_goal_trigger
  BEFORE INSERT OR UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_super_goal_children();

-- Add comment for documentation
COMMENT ON COLUMN public.goals.child_goal_ids IS 'Array of goal IDs for Super Goals (manual mode)';
COMMENT ON COLUMN public.goals.super_goal_rule IS 'JSON rule config for dynamic Super Goals (auto-build mode)';
COMMENT ON COLUMN public.goals.is_dynamic_super IS 'If true, child goals are computed from rule in real-time';