-- Create journal_entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT NOT NULL DEFAULT 'reflective',
  life_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own journal entries" 
ON public.journal_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries" 
ON public.journal_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" 
ON public.journal_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" 
ON public.journal_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON public.journal_entries(created_at DESC);