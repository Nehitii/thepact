-- Fix search_path security issue for the function
CREATE OR REPLACE FUNCTION update_goal_status_on_progress()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;