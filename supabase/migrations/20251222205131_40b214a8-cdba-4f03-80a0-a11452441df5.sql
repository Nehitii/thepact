-- Add new columns to ranks table for visual card customization
ALTER TABLE public.ranks 
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS background_url text,
ADD COLUMN IF NOT EXISTS background_opacity numeric DEFAULT 0.3,
ADD COLUMN IF NOT EXISTS frame_color text DEFAULT '#5bb4ff',
ADD COLUMN IF NOT EXISTS glow_color text DEFAULT 'rgba(91,180,255,0.5)',
ADD COLUMN IF NOT EXISTS quote text,
ADD COLUMN IF NOT EXISTS max_points integer DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN public.ranks.logo_url IS 'URL for rank logo/pictogram image';
COMMENT ON COLUMN public.ranks.background_url IS 'URL for subtle background image';
COMMENT ON COLUMN public.ranks.background_opacity IS 'Opacity of background image (0-1)';
COMMENT ON COLUMN public.ranks.frame_color IS 'Border color for the rank card';
COMMENT ON COLUMN public.ranks.glow_color IS 'Glow color for the rank card';
COMMENT ON COLUMN public.ranks.quote IS 'Descriptive phrase or mantra for the rank';
COMMENT ON COLUMN public.ranks.max_points IS 'Maximum XP threshold for this rank (0 = no max, uses next rank min)';