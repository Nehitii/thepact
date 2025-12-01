-- Add check-in fields to pacts table
ALTER TABLE public.pacts
ADD COLUMN IF NOT EXISTS checkin_total_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS checkin_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_checkin_date date DEFAULT NULL;