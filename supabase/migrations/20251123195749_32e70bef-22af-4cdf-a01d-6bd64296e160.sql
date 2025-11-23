-- Add new profile fields for account, health, and finance settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'eur',
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS height numeric;

-- Add check constraints for valid values
ALTER TABLE public.profiles
ADD CONSTRAINT valid_language CHECK (language IN ('en', 'fr')),
ADD CONSTRAINT valid_currency CHECK (currency IN ('eur', 'usd'));

COMMENT ON COLUMN public.profiles.language IS 'User interface language: en (English) or fr (Français)';
COMMENT ON COLUMN public.profiles.currency IS 'Preferred currency: eur (€) or usd ($)';
COMMENT ON COLUMN public.profiles.age IS 'User age for health tracking';
COMMENT ON COLUMN public.profiles.weight IS 'User weight for health tracking';
COMMENT ON COLUMN public.profiles.height IS 'User height for health tracking';