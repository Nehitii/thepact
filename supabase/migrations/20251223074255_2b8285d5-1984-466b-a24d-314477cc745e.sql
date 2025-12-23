-- Add already_funded column to profiles for tracking money already set aside for the project
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS already_funded numeric DEFAULT 0;