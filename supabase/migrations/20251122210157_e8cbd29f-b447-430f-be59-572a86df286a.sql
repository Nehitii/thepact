-- Add new enum values for goal_status
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'not_started' AND enumtypid = 'goal_status'::regtype) THEN
    ALTER TYPE goal_status ADD VALUE 'not_started';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'in_progress' AND enumtypid = 'goal_status'::regtype) THEN
    ALTER TYPE goal_status ADD VALUE 'in_progress';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'validated' AND enumtypid = 'goal_status'::regtype) THEN
    ALTER TYPE goal_status ADD VALUE 'validated';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'fully_completed' AND enumtypid = 'goal_status'::regtype) THEN
    ALTER TYPE goal_status ADD VALUE 'fully_completed';
  END IF;
END $$;

-- Add new columns to goals table
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS completion_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS image_url text;