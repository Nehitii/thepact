-- Add reminder columns to todo_tasks table for "En attente" task type
ALTER TABLE public.todo_tasks 
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_frequency text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_last_sent timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS location text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS appointment_time time DEFAULT NULL;

-- Add the same columns to todo_history for tracking
ALTER TABLE public.todo_history 
ADD COLUMN IF NOT EXISTS reminder_frequency text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS location text DEFAULT NULL;

-- Migrate existing task types:
-- 'appointment' -> 'rendezvous' (Rendez-vous)
-- 'flexible' stays 'flexible'
-- 'deadline' stays 'deadline'
UPDATE public.todo_tasks SET task_type = 'rendezvous' WHERE task_type = 'appointment';
UPDATE public.todo_history SET task_type = 'rendezvous' WHERE task_type = 'appointment';

-- Comment on columns for documentation
COMMENT ON COLUMN public.todo_tasks.reminder_enabled IS 'Whether reminders are enabled for "waiting" type tasks';
COMMENT ON COLUMN public.todo_tasks.reminder_frequency IS 'Frequency: weekly, monthly, bimonthly, semiannual, yearly';
COMMENT ON COLUMN public.todo_tasks.location IS 'Optional location for rendezvous type tasks';
COMMENT ON COLUMN public.todo_tasks.appointment_time IS 'Time for rendezvous appointments';