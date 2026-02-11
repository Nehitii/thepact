
-- Add new columns to journal_entries
ALTER TABLE public.journal_entries 
  ADD COLUMN IF NOT EXISTS energy_level integer,
  ADD COLUMN IF NOT EXISTS valence_level integer,
  ADD COLUMN IF NOT EXISTS linked_goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Add constraints
ALTER TABLE public.journal_entries 
  ADD CONSTRAINT journal_energy_level_range CHECK (energy_level IS NULL OR (energy_level >= 1 AND energy_level <= 10)),
  ADD CONSTRAINT journal_valence_level_range CHECK (valence_level IS NULL OR (valence_level >= 1 AND valence_level <= 10));

-- Create index for favorites and tags
CREATE INDEX IF NOT EXISTS idx_journal_entries_is_favorite ON public.journal_entries(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON public.journal_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_journal_entries_linked_goal ON public.journal_entries(linked_goal_id) WHERE linked_goal_id IS NOT NULL;
