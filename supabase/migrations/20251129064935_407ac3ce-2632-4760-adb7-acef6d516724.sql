-- Create achievement definitions table
CREATE TABLE public.achievement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  flavor_text text,
  rarity text NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  icon_key text NOT NULL,
  is_hidden boolean DEFAULT false,
  conditions jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  progress numeric DEFAULT 0,
  seen boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- Create achievement tracking counters table
CREATE TABLE public.achievement_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  consecutive_login_days integer DEFAULT 0,
  last_login_date date,
  logins_at_same_hour_streak integer DEFAULT 0,
  usual_login_hour integer,
  midnight_logins_count integer DEFAULT 0,
  total_goals_created integer DEFAULT 0,
  easy_goals_created integer DEFAULT 0,
  medium_goals_created integer DEFAULT 0,
  hard_goals_created integer DEFAULT 0,
  extreme_goals_created integer DEFAULT 0,
  impossible_goals_created integer DEFAULT 0,
  custom_goals_created integer DEFAULT 0,
  easy_goals_completed integer DEFAULT 0,
  medium_goals_completed integer DEFAULT 0,
  hard_goals_completed integer DEFAULT 0,
  extreme_goals_completed integer DEFAULT 0,
  impossible_goals_completed integer DEFAULT 0,
  custom_goals_completed integer DEFAULT 0,
  goals_completed_total integer DEFAULT 0,
  steps_completed_total integer DEFAULT 0,
  months_without_negative_balance integer DEFAULT 0,
  consecutive_income_growth_months integer DEFAULT 0,
  has_pact boolean DEFAULT false,
  has_edited_pact boolean DEFAULT false,
  current_rank_tier integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_definitions (public read)
CREATE POLICY "Anyone can view achievement definitions"
  ON public.achievement_definitions
  FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.user_achievements
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for achievement_tracking
CREATE POLICY "Users can view their own tracking"
  ON public.achievement_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracking"
  ON public.achievement_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracking"
  ON public.achievement_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_achievement_tracking_updated_at
  BEFORE UPDATE ON public.achievement_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert achievement definitions
INSERT INTO public.achievement_definitions (key, name, category, description, flavor_text, rarity, icon_key, is_hidden, conditions) VALUES
-- Connection Rituals
('dawn_walker', 'Dawn Walker', 'Connection', 'Log in for 5 consecutive days', 'The first light marks the faithful', 'common', 'sunrise', false, '{"type": "consecutive_login_days", "value": 5}'::jsonb),
('keeper_of_the_flame', 'Keeper of the Flame', 'Connection', 'Log in for 30 consecutive days', 'Consistency burns brighter than brilliance', 'rare', 'flame', false, '{"type": "consecutive_login_days", "value": 30}'::jsonb),
('time_weaver', 'Time Weaver', 'Connection', 'Log in at the same hour for 15 days', 'You bend time to your will', 'uncommon', 'clock', false, '{"type": "logins_at_same_hour_streak", "value": 15}'::jsonb),
('stalker_of_the_shadow', 'Stalker of the Shadow', 'Connection', 'Log in at midnight 7 times', 'The night knows your name', 'rare', 'moon', false, '{"type": "midnight_logins_count", "value": 7}'::jsonb),

-- Goal Creation
('the_first_brick', 'The First Brick', 'GoalsCreation', 'Create your first goal', 'Every journey begins with intention', 'common', 'target', false, '{"type": "total_goals_created", "value": 1}'::jsonb),
('architect_of_intent', 'Architect of Intent', 'GoalsCreation', 'Create 50 goals', 'You shape reality through planning', 'epic', 'compass', false, '{"type": "total_goals_created", "value": 50}'::jsonb),
('prism_of_difficulties', 'Prism of Difficulties', 'GoalsCreation', 'Create goals of every difficulty', 'You embrace all paths', 'rare', 'zap', false, '{"type": "all_difficulties_created", "value": true}'::jsonb),

-- Difficulty Mastery
('gentle_breeze', 'Gentle Breeze', 'Difficulty', 'Complete 100 Easy goals', 'Small steps build mountains', 'common', 'wind', false, '{"type": "easy_goals_completed", "value": 100}'::jsonb),
('iron_rhythm', 'Iron Rhythm', 'Difficulty', 'Complete 50 Medium goals', 'Discipline is your foundation', 'uncommon', 'shield', false, '{"type": "medium_goals_completed", "value": 50}'::jsonb),
('fracture_line', 'Fracture Line', 'Difficulty', 'Complete 25 Hard goals', 'You break through barriers', 'rare', 'zap-off', false, '{"type": "hard_goals_completed", "value": 25}'::jsonb),
('blood_of_resolve', 'Blood of Resolve', 'Difficulty', 'Complete an Extreme goal in 48 hours', 'Pain forges strength', 'epic', 'flame', false, '{"type": "extreme_goal_48h", "value": true}'::jsonb),
('the_fractured_crown', 'The Fractured Crown', 'Difficulty', 'Complete an Impossible goal', 'You defy the laws of limitation', 'legendary', 'crown', false, '{"type": "impossible_goals_completed", "value": 1}'::jsonb),
('the_unnamed_rise', 'The Unnamed Rise', 'Difficulty', 'Complete a Custom Difficulty goal', 'You define your own standards', 'epic', 'sparkles', false, '{"type": "custom_goals_completed", "value": 1}'::jsonb),

-- Time Achievements
('cut_through_time', 'Cut Through Time', 'Time', 'Complete an Impossible goal in under 30 days', 'Time bends to the unstoppable', 'legendary', 'clock', false, '{"type": "impossible_goal_30d", "value": true}'::jsonb),
('warping_path', 'Warping Path', 'Time', 'Complete an Extreme goal in under 72 hours', 'You compress impossibility', 'epic', 'zap', false, '{"type": "extreme_goal_72h", "value": true}'::jsonb),
('echo_breaker', 'Echo Breaker', 'Time', 'Complete a goal within 3 minutes of creation', 'Thought becomes reality instantly', 'rare', 'lightning-bolt', true, '{"type": "goal_completed_3min", "value": true}'::jsonb),

-- Pact Achievements
('the_sealed_pact', 'The Sealed Pact', 'Pact', 'Define your Pact for the first time', 'The oath is written in eternity', 'uncommon', 'scroll-text', false, '{"type": "has_pact", "value": true}'::jsonb),
('keeper_of_the_oath', 'Keeper of the Oath', 'Pact', 'Edit your Pact mantra or symbol', 'Evolution is not betrayal', 'rare', 'pen-tool', false, '{"type": "has_edited_pact", "value": true}'::jsonb),
('fate_unbound', 'Fate Unbound', 'Pact', 'Reach a new rank', 'You ascend beyond measure', 'uncommon', 'trending-up', false, '{"type": "rank_up", "value": true}'::jsonb),

-- Series / Progression
('cycle_master', 'Cycle Master', 'Series', 'Complete 30 goals in one year', 'You master the rhythm of time', 'epic', 'calendar', false, '{"type": "goals_completed_total", "value": 30}'::jsonb),
('the_endless_line', 'The Endless Line', 'Series', 'Complete 1000 steps in total', 'Each step is a monument', 'legendary', 'footprints', false, '{"type": "steps_completed_total", "value": 1000}'::jsonb),

-- Hidden / Mystic
('whisper_of_the_pact', 'Whisper of the Pact', 'Hidden', 'Log in at 04:44 or 03:33 three times', 'The numbers speak to those who listen', 'mythic', 'eye', true, '{"type": "mystic_hours_login", "value": 3}'::jsonb),
('the_checkmate_day', 'The Checkmate Day', 'Hidden', 'Complete exactly 8 steps in one day', 'Perfect balance achieves victory', 'rare', 'grid-3x3', true, '{"type": "eight_steps_one_day", "value": true}'::jsonb),
('the_silent_completion', 'The Silent Completion', 'Hidden', 'Complete a goal without opening its detail page', 'True mastery needs no observation', 'epic', 'eye-off', true, '{"type": "silent_goal_completion", "value": true}'::jsonb);