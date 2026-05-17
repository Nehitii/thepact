ALTER TABLE public.coach_messages
ADD COLUMN IF NOT EXISTS metadata jsonb;

COMMENT ON COLUMN public.coach_messages.metadata IS
  'Structured side-data for assistant messages: { citations: [{source_type, source_id, title, snippet, similarity}], actions: [{tool, status, result}] }';