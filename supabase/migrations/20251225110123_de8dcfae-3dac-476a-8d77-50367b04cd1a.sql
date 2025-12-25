-- Add reward_claimed column to notifications table
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS reward_claimed boolean NOT NULL DEFAULT false;

-- Add reward_cosmetic_id column for cosmetic rewards  
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS reward_cosmetic_id uuid NULL;

-- Add reward_cosmetic_type column for cosmetic type
ALTER TABLE public.notifications  
ADD COLUMN IF NOT EXISTS reward_cosmetic_type text NULL;