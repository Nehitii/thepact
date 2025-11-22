-- Add 'custom' to goal_difficulty enum
ALTER TYPE goal_difficulty ADD VALUE IF NOT EXISTS 'custom';

-- Add custom difficulty fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_difficulty_name TEXT,
ADD COLUMN IF NOT EXISTS custom_difficulty_active BOOLEAN DEFAULT false;