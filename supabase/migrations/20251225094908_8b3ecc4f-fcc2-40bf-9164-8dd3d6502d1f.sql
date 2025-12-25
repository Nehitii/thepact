-- Create priority enum for todo tasks
CREATE TYPE public.todo_priority AS ENUM ('low', 'medium', 'high');

-- Create status enum for todo tasks
CREATE TYPE public.todo_status AS ENUM ('active', 'completed', 'postponed');

-- Create todo_tasks table
CREATE TABLE public.todo_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  priority todo_priority NOT NULL DEFAULT 'medium',
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  status todo_status NOT NULL DEFAULT 'active',
  postpone_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create todo_stats table for user statistics
CREATE TABLE public.todo_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  score INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completion_date DATE,
  tasks_completed_month INTEGER NOT NULL DEFAULT 0,
  tasks_completed_year INTEGER NOT NULL DEFAULT 0,
  current_month INTEGER NOT NULL DEFAULT EXTRACT(MONTH FROM now()),
  current_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create todo_history table for completed task history
CREATE TABLE public.todo_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_name TEXT NOT NULL,
  priority todo_priority NOT NULL,
  was_urgent BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  postpone_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS on all tables
ALTER TABLE public.todo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for todo_tasks
CREATE POLICY "Users can view their own tasks"
ON public.todo_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
ON public.todo_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.todo_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.todo_tasks FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for todo_stats
CREATE POLICY "Users can view their own stats"
ON public.todo_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
ON public.todo_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
ON public.todo_stats FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for todo_history
CREATE POLICY "Users can view their own history"
ON public.todo_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
ON public.todo_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
ON public.todo_history FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at on todo_tasks
CREATE TRIGGER update_todo_tasks_updated_at
BEFORE UPDATE ON public.todo_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on todo_stats
CREATE TRIGGER update_todo_stats_updated_at
BEFORE UPDATE ON public.todo_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the To-Do List module into shop_modules
INSERT INTO public.shop_modules (key, name, description, price_bonds, rarity, icon_key, is_active, is_coming_soon, display_order)
VALUES (
  'todo_list',
  'To-Do List',
  'A premium execution-focused To-Do List with behavior insights and soft progression. Limit overload, track streaks, and gain clarity.',
  500,
  'rare',
  'CheckSquare',
  true,
  false,
  5
);