ALTER TABLE public.cosmetic_frames
  ADD COLUMN show_border BOOLEAN DEFAULT TRUE,
  ADD COLUMN avatar_border_color TEXT DEFAULT '#5bb4ff';