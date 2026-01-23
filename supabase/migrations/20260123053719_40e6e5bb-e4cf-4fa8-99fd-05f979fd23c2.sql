-- Add sound preferences to profiles (presentation-layer only)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sound_master_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_volume numeric NOT NULL DEFAULT 0.35,
  ADD COLUMN IF NOT EXISTS sound_ui_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_success_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_progress_enabled boolean NOT NULL DEFAULT true;

-- Clamp volume to sensible range via trigger (avoid CHECK constraints with immutability issues)
CREATE OR REPLACE FUNCTION public.clamp_profile_sound_volume()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sound_volume IS NULL THEN
    NEW.sound_volume := 0.35;
  END IF;

  IF NEW.sound_volume < 0 THEN
    NEW.sound_volume := 0;
  ELSIF NEW.sound_volume > 1 THEN
    NEW.sound_volume := 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_clamp_profile_sound_volume ON public.profiles;
CREATE TRIGGER trg_clamp_profile_sound_volume
BEFORE INSERT OR UPDATE OF sound_volume ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.clamp_profile_sound_volume();

-- Ensure updated_at is bumped if you already use a timestamp trigger elsewhere.
-- (No-op here; we won't add new updated_at triggers since the project may already manage this.)