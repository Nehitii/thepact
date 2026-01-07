-- Add category and task_type columns to todo_tasks table
ALTER TABLE public.todo_tasks 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'flexible';

-- Add category column to todo_history for tracking completed tasks
ALTER TABLE public.todo_history 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'flexible';

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_todo_tasks_category ON public.todo_tasks(category);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_task_type ON public.todo_tasks(task_type);