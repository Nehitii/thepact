-- Add goal_type column to goals table
ALTER TABLE public.goals 
ADD COLUMN goal_type text NOT NULL DEFAULT 'normal';

-- Add habit_duration_days for habit goals
ALTER TABLE public.goals 
ADD COLUMN habit_duration_days integer DEFAULT NULL;

-- Add habit_checks array for tracking habit completion per day
ALTER TABLE public.goals 
ADD COLUMN habit_checks boolean[] DEFAULT NULL;

-- Add constraint to ensure valid goal_type values
ALTER TABLE public.goals 
ADD CONSTRAINT goals_goal_type_check CHECK (goal_type IN ('normal', 'habit'));