-- Community Posts table for the Community Feed
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL DEFAULT 'reflection' CHECK (post_type IN ('reflection', 'progress', 'obstacle', 'mindset', 'help_request', 'encouragement')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view public posts
CREATE POLICY "Anyone can view public posts" 
ON public.community_posts 
FOR SELECT 
USING (is_public = true);

-- Users can view their own posts
CREATE POLICY "Users can view own posts" 
ON public.community_posts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own posts
CREATE POLICY "Users can create posts" 
ON public.community_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" 
ON public.community_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" 
ON public.community_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Community Reactions table (Support/Respect instead of likes)
CREATE TABLE public.community_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reel_id UUID, -- Will reference victory_reels once created
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('support', 'respect', 'inspired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id, reaction_type),
  CONSTRAINT chk_post_or_reel CHECK (
    (post_id IS NOT NULL AND reel_id IS NULL) OR
    (post_id IS NULL AND reel_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view reactions" 
ON public.community_reactions 
FOR SELECT 
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add reactions" 
ON public.community_reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions" 
ON public.community_reactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Victory Reels table for completed goal video celebrations
CREATE TABLE public.victory_reels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 15 AND duration_seconds <= 60),
  is_public BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.victory_reels ENABLE ROW LEVEL SECURITY;

-- Anyone can view public reels
CREATE POLICY "Anyone can view public reels" 
ON public.victory_reels 
FOR SELECT 
USING (is_public = true);

-- Users can view their own reels
CREATE POLICY "Users can view own reels" 
ON public.victory_reels 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own reels
CREATE POLICY "Users can create reels" 
ON public.victory_reels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reels
CREATE POLICY "Users can update own reels" 
ON public.victory_reels 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own reels
CREATE POLICY "Users can delete own reels" 
ON public.victory_reels 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key for reel reactions
ALTER TABLE public.community_reactions 
ADD CONSTRAINT fk_reel_id 
FOREIGN KEY (reel_id) REFERENCES public.victory_reels(id) ON DELETE CASCADE;

-- Add unique constraint for reel reactions
ALTER TABLE public.community_reactions 
ADD CONSTRAINT unique_user_reel_reaction 
UNIQUE (user_id, reel_id, reaction_type);

-- Community Replies table
CREATE TABLE public.community_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can view replies
CREATE POLICY "Anyone can view replies" 
ON public.community_replies 
FOR SELECT 
USING (true);

-- Users can create their own replies
CREATE POLICY "Users can create replies" 
ON public.community_replies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own replies
CREATE POLICY "Users can update own replies" 
ON public.community_replies 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own replies
CREATE POLICY "Users can delete own replies" 
ON public.community_replies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for victory reel videos
INSERT INTO storage.buckets (id, name, public) VALUES ('victory-reels', 'victory-reels', false);

-- Storage policies for victory reels
CREATE POLICY "Users can upload own victory reels" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'victory-reels' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view public victory reels" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'victory-reels');

CREATE POLICY "Users can update own victory reels" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'victory-reels' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own victory reels" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'victory-reels' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes for performance
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_goal_id ON public.community_posts(goal_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_reactions_post_id ON public.community_reactions(post_id);
CREATE INDEX idx_community_reactions_reel_id ON public.community_reactions(reel_id);
CREATE INDEX idx_victory_reels_user_id ON public.victory_reels(user_id);
CREATE INDEX idx_victory_reels_created_at ON public.victory_reels(created_at DESC);
CREATE INDEX idx_community_replies_post_id ON public.community_replies(post_id);

-- Enable realtime for community engagement
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.victory_reels;

-- Trigger for updated_at
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_victory_reels_updated_at
BEFORE UPDATE ON public.victory_reels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_replies_updated_at
BEFORE UPDATE ON public.community_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();