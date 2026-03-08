
-- Add is_locked column to goals
ALTER TABLE public.goals ADD COLUMN is_locked boolean NOT NULL DEFAULT false;

-- Add goal_unlock_code to profiles (hashed PIN code for unlocking goals)
ALTER TABLE public.profiles ADD COLUMN goal_unlock_code text;
