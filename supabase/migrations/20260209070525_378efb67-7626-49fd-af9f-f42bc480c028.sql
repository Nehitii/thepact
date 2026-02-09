-- =============================================
-- PHASE 2: HEALTH MODULE CORE ENHANCEMENTS
-- =============================================

-- 1. Add mood tracking columns to health_data
ALTER TABLE public.health_data 
ADD COLUMN IF NOT EXISTS mood_level INTEGER,
ADD COLUMN IF NOT EXISTS mood_journal TEXT;

-- Add constraint for mood_level range (1-5)
ALTER TABLE public.health_data 
ADD CONSTRAINT health_data_mood_level_check CHECK (mood_level IS NULL OR (mood_level >= 1 AND mood_level <= 5));

-- 2. Add energy curve tracking columns
ALTER TABLE public.health_data 
ADD COLUMN IF NOT EXISTS energy_morning INTEGER,
ADD COLUMN IF NOT EXISTS energy_afternoon INTEGER,
ADD COLUMN IF NOT EXISTS energy_evening INTEGER;

-- Add constraints for energy levels (1-5)
ALTER TABLE public.health_data 
ADD CONSTRAINT health_data_energy_morning_check CHECK (energy_morning IS NULL OR (energy_morning >= 1 AND energy_morning <= 5)),
ADD CONSTRAINT health_data_energy_afternoon_check CHECK (energy_afternoon IS NULL OR (energy_afternoon >= 1 AND energy_afternoon <= 5)),
ADD CONSTRAINT health_data_energy_evening_check CHECK (energy_evening IS NULL OR (energy_evening >= 1 AND energy_evening <= 5));

-- 3. Create health_streaks table for tracking consecutive check-ins
CREATE TABLE IF NOT EXISTS public.health_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_checkin_date DATE,
  total_checkins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT health_streaks_user_id_unique UNIQUE (user_id)
);

-- Enable RLS on health_streaks
ALTER TABLE public.health_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for health_streaks
CREATE POLICY "Users can view their own health streaks"
ON public.health_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health streaks"
ON public.health_streaks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health streaks"
ON public.health_streaks FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Create health_challenges table for weekly challenges
CREATE TABLE IF NOT EXISTS public.health_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_type TEXT NOT NULL, -- 'sleep', 'stress', 'hydration', 'activity', 'mood'
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  target_days INTEGER NOT NULL DEFAULT 7, -- How many days to achieve the target
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  bond_reward INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on health_challenges
ALTER TABLE public.health_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for health_challenges
CREATE POLICY "Users can view their own health challenges"
ON public.health_challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health challenges"
ON public.health_challenges FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health challenges"
ON public.health_challenges FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health challenges"
ON public.health_challenges FOR DELETE
USING (auth.uid() = user_id);

-- 5. Create trigger for updated_at on health_streaks
CREATE TRIGGER update_health_streaks_updated_at
BEFORE UPDATE ON public.health_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create trigger for updated_at on health_challenges
CREATE TRIGGER update_health_challenges_updated_at
BEFORE UPDATE ON public.health_challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create health achievements in achievement_definitions
INSERT INTO public.achievement_definitions (key, name, category, description, flavor_text, rarity, icon_key, conditions, is_hidden)
VALUES 
  ('health_first_checkin', 'Wellness Initiate', 'health', 'Complete your first health check-in', 'Every journey begins with a single step.', 'common', 'heart', '{"type": "health_checkins", "count": 1}', false),
  ('health_week_streak', 'Perfect Week', 'health', 'Complete health check-ins for 7 consecutive days', 'Consistency is the key to transformation.', 'uncommon', 'calendar-check', '{"type": "health_streak", "days": 7}', false),
  ('health_month_streak', 'Wellness Warrior', 'health', 'Complete health check-ins for 30 consecutive days', 'A month of dedication. Your body thanks you.', 'epic', 'shield', '{"type": "health_streak", "days": 30}', false),
  ('health_hydration_hero', 'Hydration Hero', 'health', 'Hit your water goal for 30 days', 'Stay hydrated, stay sharp.', 'rare', 'droplet', '{"type": "health_hydration_streak", "days": 30}', false),
  ('health_sleep_champion', 'Sleep Champion', 'health', 'Average 8+ hours of sleep for 30 days', 'Rest is the foundation of achievement.', 'epic', 'moon', '{"type": "health_sleep_average", "hours": 8, "days": 30}', false),
  ('health_stress_master', 'Stress Master', 'health', 'Maintain low stress levels for 14 days', 'Inner peace is the ultimate victory.', 'rare', 'brain', '{"type": "health_low_stress", "days": 14}', false),
  ('health_centurion', 'Wellness Centurion', 'health', 'Complete 100 total health check-ins', 'A hundred steps toward your best self.', 'legendary', 'trophy', '{"type": "health_checkins", "count": 100}', false)
ON CONFLICT (key) DO NOTHING;