-- Add description, notes, and completion_date to steps table
ALTER TABLE steps 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_steps_completion_date ON steps(completion_date);

-- Create a table to track step status change history
CREATE TABLE IF NOT EXISTS step_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  old_status step_status,
  new_status step_status NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on step_status_history
ALTER TABLE step_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for step_status_history
CREATE POLICY "Users can view their own step history"
ON step_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM steps
    JOIN goals ON goals.id = steps.goal_id
    JOIN pacts ON pacts.id = goals.pact_id
    WHERE steps.id = step_status_history.step_id
    AND pacts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own step history"
ON step_status_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM steps
    JOIN goals ON goals.id = steps.goal_id
    JOIN pacts ON pacts.id = goals.pact_id
    WHERE steps.id = step_status_history.step_id
    AND pacts.user_id = auth.uid()
  )
);

-- Add trigger to log status changes
CREATE OR REPLACE FUNCTION log_step_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO step_status_history (step_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER step_status_change_trigger
AFTER UPDATE ON steps
FOR EACH ROW
EXECUTE FUNCTION log_step_status_change();