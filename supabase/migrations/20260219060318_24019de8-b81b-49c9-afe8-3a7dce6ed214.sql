
-- PHASE 1 + 2: All DB changes (without realtime since already enabled)

-- Fix profiles RLS for community visibility
CREATE POLICY "Authenticated users can view community profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Add goal_name denormalized column to community_posts
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS goal_name TEXT;

-- Add denormalized reaction counts to community_posts
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS support_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS respect_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inspired_count INTEGER NOT NULL DEFAULT 0;

-- Add denormalized reaction counts to victory_reels
ALTER TABLE public.victory_reels
  ADD COLUMN IF NOT EXISTS support_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS respect_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inspired_count INTEGER NOT NULL DEFAULT 0;

-- Atomic view count increment RPC
CREATE OR REPLACE FUNCTION public.increment_reel_view(p_reel_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE victory_reels
  SET view_count = view_count + 1
  WHERE id = p_reel_id AND is_public = true;
$$;

-- Trigger to update reaction counts
CREATE OR REPLACE FUNCTION public.update_post_reaction_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    CASE NEW.reaction_type
      WHEN 'support' THEN UPDATE community_posts SET support_count = support_count + 1 WHERE id = NEW.post_id;
      WHEN 'respect' THEN UPDATE community_posts SET respect_count = respect_count + 1 WHERE id = NEW.post_id;
      WHEN 'inspired' THEN UPDATE community_posts SET inspired_count = inspired_count + 1 WHERE id = NEW.post_id;
      ELSE NULL;
    END CASE;
  END IF;
  IF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    CASE OLD.reaction_type
      WHEN 'support' THEN UPDATE community_posts SET support_count = GREATEST(support_count - 1, 0) WHERE id = OLD.post_id;
      WHEN 'respect' THEN UPDATE community_posts SET respect_count = GREATEST(respect_count - 1, 0) WHERE id = OLD.post_id;
      WHEN 'inspired' THEN UPDATE community_posts SET inspired_count = GREATEST(inspired_count - 1, 0) WHERE id = OLD.post_id;
      ELSE NULL;
    END CASE;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.reel_id IS NOT NULL THEN
    CASE NEW.reaction_type
      WHEN 'support' THEN UPDATE victory_reels SET support_count = support_count + 1 WHERE id = NEW.reel_id;
      WHEN 'respect' THEN UPDATE victory_reels SET respect_count = respect_count + 1 WHERE id = NEW.reel_id;
      WHEN 'inspired' THEN UPDATE victory_reels SET inspired_count = inspired_count + 1 WHERE id = NEW.reel_id;
      ELSE NULL;
    END CASE;
  END IF;
  IF TG_OP = 'DELETE' AND OLD.reel_id IS NOT NULL THEN
    CASE OLD.reaction_type
      WHEN 'support' THEN UPDATE victory_reels SET support_count = GREATEST(support_count - 1, 0) WHERE id = OLD.reel_id;
      WHEN 'respect' THEN UPDATE victory_reels SET respect_count = GREATEST(respect_count - 1, 0) WHERE id = OLD.reel_id;
      WHEN 'inspired' THEN UPDATE victory_reels SET inspired_count = GREATEST(inspired_count - 1, 0) WHERE id = OLD.reel_id;
      ELSE NULL;
    END CASE;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reaction_counts
  AFTER INSERT OR DELETE ON public.community_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_reaction_counts();

-- Community reports table
CREATE TABLE public.community_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reel_id UUID REFERENCES public.victory_reels(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.community_replies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report content"
  ON public.community_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON public.community_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage reports"
  ON public.community_reports FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Rate limiting trigger
CREATE OR REPLACE FUNCTION public.enforce_post_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM community_posts
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 hour';
  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 10 posts per hour';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_post_rate_limit
  BEFORE INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_post_rate_limit();
