-- Update existing goals to have proper status based on progress
UPDATE goals
SET status = CASE
  WHEN validated_steps = 0 THEN 'not_started'::goal_status
  WHEN validated_steps < total_steps THEN 'in_progress'::goal_status
  WHEN validated_steps = total_steps THEN 'fully_completed'::goal_status
  ELSE status
END
WHERE status IN ('active', 'completed');

-- Create function to automatically update goal status based on step completion
CREATE OR REPLACE FUNCTION update_goal_status_on_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update status based on validated steps
  IF NEW.validated_steps = 0 AND NEW.total_steps > 0 THEN
    NEW.status = 'not_started';
  ELSIF NEW.validated_steps > 0 AND NEW.validated_steps < NEW.total_steps THEN
    NEW.status = 'in_progress';
  ELSIF NEW.validated_steps >= NEW.total_steps AND NEW.total_steps > 0 THEN
    NEW.status = 'fully_completed';
    -- Set completion date if not already set
    IF NEW.completion_date IS NULL THEN
      NEW.completion_date = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status updates
DROP TRIGGER IF EXISTS auto_update_goal_status ON goals;
CREATE TRIGGER auto_update_goal_status
  BEFORE INSERT OR UPDATE OF validated_steps, total_steps
  ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_status_on_progress();