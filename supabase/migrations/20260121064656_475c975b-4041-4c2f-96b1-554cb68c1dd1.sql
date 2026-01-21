-- ================================
-- HEALTH MODULE DATABASE SCHEMA
-- ================================

-- Health data entries (daily snapshots)
CREATE TABLE public.health_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Sleep data
  sleep_hours NUMERIC(4,2),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  wake_energy INTEGER CHECK (wake_energy >= 1 AND wake_energy <= 5),
  
  -- Activity data
  activity_level INTEGER CHECK (activity_level >= 1 AND activity_level <= 5),
  movement_minutes INTEGER,
  
  -- Stress & Mental load
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  mental_load INTEGER CHECK (mental_load >= 1 AND mental_load <= 5),
  
  -- Hydration & Nutrition (simple/optional)
  hydration_glasses INTEGER,
  meal_balance INTEGER CHECK (meal_balance >= 1 AND meal_balance <= 5),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint per user per day
  UNIQUE(user_id, entry_date)
);

-- Enable RLS
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own health data"
ON public.health_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health data"
ON public.health_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health data"
ON public.health_data FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health data"
ON public.health_data FOR DELETE
USING (auth.uid() = user_id);

-- Health settings (user preferences)
CREATE TABLE public.health_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- BMI data (optional, user-provided)
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  
  -- Feature toggles
  show_bmi BOOLEAN NOT NULL DEFAULT false,
  show_sleep BOOLEAN NOT NULL DEFAULT true,
  show_activity BOOLEAN NOT NULL DEFAULT true,
  show_stress BOOLEAN NOT NULL DEFAULT true,
  show_hydration BOOLEAN NOT NULL DEFAULT true,
  show_nutrition BOOLEAN NOT NULL DEFAULT false,
  
  -- Goals (soft targets, not rigid)
  sleep_goal_hours NUMERIC(4,2) DEFAULT 8,
  hydration_goal_glasses INTEGER DEFAULT 8,
  activity_goal_minutes INTEGER DEFAULT 30,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own health settings"
ON public.health_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health settings"
ON public.health_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health settings"
ON public.health_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health settings"
ON public.health_settings FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on health_data
CREATE TRIGGER update_health_data_updated_at
BEFORE UPDATE ON public.health_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on health_settings
CREATE TRIGGER update_health_settings_updated_at
BEFORE UPDATE ON public.health_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Health module into shop_modules if it doesn't exist
INSERT INTO public.shop_modules (key, name, description, price_bonds, rarity, icon_key, is_active, is_coming_soon, display_order)
VALUES (
  'track-health',
  'Track Health',
  'Personal health awareness and balance module. Track sleep, activity, stress, hydration and more. Focus on habits, balance, and consistency - not medical metrics.',
  2500,
  'rare',
  'heart',
  true,
  false,
  5
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  is_coming_soon = EXCLUDED.is_coming_soon;