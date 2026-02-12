
-- Add position column for manual drag-and-drop reordering
ALTER TABLE public.todo_tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Set initial positions based on current order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY is_urgent DESC, created_at DESC) as rn
  FROM public.todo_tasks
  WHERE status = 'active'
)
UPDATE public.todo_tasks SET position = ranked.rn FROM ranked WHERE todo_tasks.id = ranked.id;
