-- Add privacy + display preferences to profiles (additive, safe defaults)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS reduce_motion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS particles_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS particles_intensity numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS community_profile_discoverable boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_activity_status boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_goals_progress boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_achievements boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS community_updates_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS achievement_celebrations_enabled boolean NOT NULL DEFAULT true;

-- Clamp/normalize profile display settings without CHECK constraints
CREATE OR REPLACE FUNCTION public.normalize_profile_display_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Theme preference normalization
  IF NEW.theme_preference IS NULL THEN
    NEW.theme_preference := 'system';
  END IF;

  IF NEW.theme_preference NOT IN ('system', 'light', 'dark') THEN
    NEW.theme_preference := 'system';
  END IF;

  -- Particles intensity clamp
  IF NEW.particles_intensity IS NULL THEN
    NEW.particles_intensity := 1.0;
  END IF;

  IF NEW.particles_intensity < 0 THEN
    NEW.particles_intensity := 0;
  ELSIF NEW.particles_intensity > 1 THEN
    NEW.particles_intensity := 1;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_profiles_normalize_display_settings'
  ) THEN
    CREATE TRIGGER trg_profiles_normalize_display_settings
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.normalize_profile_display_settings();
  END IF;
END;
$$;