-- Add frame alignment columns for admin adjustment tool
ALTER TABLE public.cosmetic_frames 
ADD COLUMN IF NOT EXISTS frame_scale numeric DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS frame_offset_x numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS frame_offset_y numeric DEFAULT 0;