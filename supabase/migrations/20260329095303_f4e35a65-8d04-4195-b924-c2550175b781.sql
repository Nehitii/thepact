
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#3b82f6',
  category TEXT DEFAULT 'general',
  recurrence_rule JSONB,
  recurrence_parent_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  recurrence_exception BOOLEAN DEFAULT false,
  reminders JSONB DEFAULT '[]'::jsonb,
  is_busy BOOLEAN DEFAULT true,
  linked_goal_id UUID,
  linked_todo_id UUID,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own events" ON public.calendar_events
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
