-- Add new profile fields for Bounded Profile
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthday date,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS personal_quote text,
ADD COLUMN IF NOT EXISTS displayed_badges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avatar_frame text DEFAULT 'default';

-- Add project end date to pacts
ALTER TABLE public.pacts 
ADD COLUMN IF NOT EXISTS project_end_date date;