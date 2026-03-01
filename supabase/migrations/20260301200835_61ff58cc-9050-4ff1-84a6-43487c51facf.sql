
-- Add font and text effect customization columns to pacts table
ALTER TABLE public.pacts
ADD COLUMN title_font text DEFAULT 'orbitron',
ADD COLUMN title_effect text DEFAULT 'none';
