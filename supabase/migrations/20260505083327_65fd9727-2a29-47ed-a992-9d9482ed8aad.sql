
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversations
CREATE TABLE public.coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_coach_conv_user ON public.coach_conversations(user_id, last_message_at DESC);
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own conv select" ON public.coach_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own conv insert" ON public.coach_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own conv update" ON public.coach_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own conv delete" ON public.coach_conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages
CREATE TABLE public.coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system','user','assistant','tool')),
  content TEXT NOT NULL DEFAULT '',
  tool_calls JSONB,
  tool_call_id TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_coach_msg_conv ON public.coach_messages(conversation_id, created_at);
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own msg select" ON public.coach_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own msg insert" ON public.coach_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own msg update" ON public.coach_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own msg delete" ON public.coach_messages FOR DELETE USING (auth.uid() = user_id);

-- Embeddings (memory)
CREATE TABLE public.coach_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('journal','review','goal','decision','message','custom')),
  source_id UUID,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_coach_emb_user ON public.coach_embeddings(user_id, source_type);
CREATE INDEX idx_coach_emb_vec ON public.coach_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
ALTER TABLE public.coach_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own emb select" ON public.coach_embeddings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own emb insert" ON public.coach_embeddings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own emb update" ON public.coach_embeddings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own emb delete" ON public.coach_embeddings FOR DELETE USING (auth.uid() = user_id);

-- updated_at trigger reuse
CREATE TRIGGER trg_coach_conv_updated
BEFORE UPDATE ON public.coach_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Semantic search RPC
CREATE OR REPLACE FUNCTION public.match_coach_memory(
  _query vector(1536),
  _match_count INT DEFAULT 8,
  _min_similarity FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, source_type, source_id, content, metadata,
         1 - (embedding <=> _query) AS similarity
  FROM public.coach_embeddings
  WHERE user_id = auth.uid()
    AND embedding IS NOT NULL
    AND 1 - (embedding <=> _query) >= _min_similarity
  ORDER BY embedding <=> _query
  LIMIT _match_count;
$$;
