
-- Pomodoro sessions table
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  break_minutes INTEGER NOT NULL DEFAULT 5,
  completed BOOLEAN NOT NULL DEFAULT false,
  linked_todo_id UUID NULL,
  linked_goal_id UUID NULL,
  linked_step_id UUID NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON public.pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON public.pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.pomodoro_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.pomodoro_sessions FOR DELETE USING (auth.uid() = user_id);

-- Public leaderboard function (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_public_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  points INTEGER,
  goals_completed INTEGER,
  rank_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(pa.points, 0) AS points,
    COALESCE(at.goals_completed_total, 0) AS goals_completed,
    (
      SELECT r.name FROM ranks r 
      WHERE r.user_id = p.id AND r.min_points <= COALESCE(pa.points, 0)
      ORDER BY r.min_points DESC LIMIT 1
    ) AS rank_name
  FROM profiles p
  LEFT JOIN pacts pa ON pa.user_id = p.id
  LEFT JOIN achievement_tracking at ON at.user_id = p.id
  WHERE p.community_profile_discoverable = true
  ORDER BY COALESCE(pa.points, 0) DESC
  LIMIT p_limit;
$$;
