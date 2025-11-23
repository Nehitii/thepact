-- Create ranks table
CREATE TABLE public.ranks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ranks_min_points_check CHECK (min_points >= 0)
);

-- Enable Row Level Security
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;

-- Create policies for ranks
CREATE POLICY "Users can view their own ranks" 
ON public.ranks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ranks" 
ON public.ranks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ranks" 
ON public.ranks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ranks" 
ON public.ranks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ranks_updated_at
BEFORE UPDATE ON public.ranks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_ranks_user_id ON public.ranks(user_id);
CREATE INDEX idx_ranks_min_points ON public.ranks(min_points);