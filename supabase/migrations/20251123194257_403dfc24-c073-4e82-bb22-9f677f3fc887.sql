-- Add project_start_date column to pacts table
ALTER TABLE public.pacts 
ADD COLUMN project_start_date date;