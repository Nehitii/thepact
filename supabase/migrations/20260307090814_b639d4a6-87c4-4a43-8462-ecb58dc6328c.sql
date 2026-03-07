
-- Goal Templates table
CREATE TABLE public.goal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  difficulty text NOT NULL DEFAULT 'medium',
  tags text[] NOT NULL DEFAULT '{}',
  steps jsonb NOT NULL DEFAULT '[]',
  estimated_cost numeric DEFAULT 0,
  goal_type text NOT NULL DEFAULT 'normal',
  habit_duration_days integer,
  category text DEFAULT 'general',
  is_featured boolean DEFAULT false,
  use_count integer DEFAULT 0,
  created_by uuid,
  source_goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.goal_templates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view templates
CREATE POLICY "Anyone can view templates" ON public.goal_templates
  FOR SELECT TO authenticated USING (true);

-- Users can create templates from their goals
CREATE POLICY "Users can create their own templates" ON public.goal_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Admins can manage all templates
CREATE POLICY "Admins can manage templates" ON public.goal_templates
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Weekly Reviews table
CREATE TABLE public.weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  goals_progressed integer DEFAULT 0,
  steps_completed integer DEFAULT 0,
  health_avg_score numeric,
  finance_net numeric,
  journal_entries_count integer DEFAULT 0,
  todo_completed integer DEFAULT 0,
  ai_insights text,
  reflection_note text,
  week_rating integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews" ON public.weekly_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reviews" ON public.weekly_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.weekly_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Habit Logs table
CREATE TABLE public.habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  completed boolean DEFAULT false,
  streak_count integer DEFAULT 0,
  bond_reward integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, goal_id, log_date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habit logs" ON public.habit_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own habit logs" ON public.habit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habit logs" ON public.habit_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habit logs" ON public.habit_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for habit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_logs;
