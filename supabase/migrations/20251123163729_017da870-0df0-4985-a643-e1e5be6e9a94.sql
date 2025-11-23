-- Add custom_difficulty_color field to profiles table
ALTER TABLE public.profiles
ADD COLUMN custom_difficulty_color text DEFAULT '#a855f7';