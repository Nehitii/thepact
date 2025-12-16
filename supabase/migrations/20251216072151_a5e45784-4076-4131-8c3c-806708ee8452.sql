-- Cosmetic Frames Table
CREATE TABLE public.cosmetic_frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  preview_url TEXT,
  border_color TEXT NOT NULL DEFAULT '#5bb4ff',
  glow_color TEXT NOT NULL DEFAULT 'rgba(91,180,255,0.5)',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cosmetic Banners Table
CREATE TABLE public.cosmetic_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  preview_url TEXT,
  banner_url TEXT,
  gradient_start TEXT DEFAULT '#0a0a12',
  gradient_end TEXT DEFAULT '#1a1a2e',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cosmetic Titles Table
CREATE TABLE public.cosmetic_titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_text TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  glow_color TEXT DEFAULT 'rgba(91,180,255,0.5)',
  text_color TEXT DEFAULT '#5bb4ff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Cosmetics Ownership Table
CREATE TABLE public.user_cosmetics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cosmetic_type TEXT NOT NULL,
  cosmetic_id UUID NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cosmetic_type, cosmetic_id)
);

-- Add active cosmetic columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_frame_id UUID,
ADD COLUMN IF NOT EXISTS active_banner_id UUID,
ADD COLUMN IF NOT EXISTS active_title_id UUID;

-- Enable RLS on all cosmetic tables
ALTER TABLE public.cosmetic_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetic_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetic_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;

-- Cosmetic frames: anyone can view active frames
CREATE POLICY "Anyone can view active frames"
ON public.cosmetic_frames FOR SELECT
USING (is_active = true);

-- Cosmetic frames: admins can do everything
CREATE POLICY "Admins can manage frames"
ON public.cosmetic_frames FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Cosmetic banners: anyone can view active banners
CREATE POLICY "Anyone can view active banners"
ON public.cosmetic_banners FOR SELECT
USING (is_active = true);

-- Cosmetic banners: admins can do everything
CREATE POLICY "Admins can manage banners"
ON public.cosmetic_banners FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Cosmetic titles: anyone can view active titles
CREATE POLICY "Anyone can view active titles"
ON public.cosmetic_titles FOR SELECT
USING (is_active = true);

-- Cosmetic titles: admins can do everything
CREATE POLICY "Admins can manage titles"
ON public.cosmetic_titles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- User cosmetics: users can view their own
CREATE POLICY "Users can view their own cosmetics"
ON public.user_cosmetics FOR SELECT
USING (auth.uid() = user_id);

-- User cosmetics: users can insert their own (for purchases)
CREATE POLICY "Users can insert their own cosmetics"
ON public.user_cosmetics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default cosmetics
INSERT INTO public.cosmetic_frames (name, rarity, border_color, glow_color, is_default, price) VALUES
('Default', 'common', '#5bb4ff', 'rgba(91,180,255,0.3)', true, 0),
('Fire', 'rare', '#f97316', 'rgba(249,115,22,0.5)', false, 500),
('Ice', 'rare', '#22d3ee', 'rgba(34,211,238,0.5)', false, 500),
('Royal', 'epic', '#eab308', 'rgba(234,179,8,0.5)', false, 1000),
('Void', 'legendary', '#a855f7', 'rgba(168,85,247,0.6)', false, 2000),
('Blood', 'epic', '#ef4444', 'rgba(239,68,68,0.5)', false, 1000);

INSERT INTO public.cosmetic_banners (name, rarity, gradient_start, gradient_end, is_default, price) VALUES
('Default', 'common', '#0a0a12', '#1a1a2e', true, 0),
('Ember', 'rare', '#1a0a0a', '#2e1a1a', false, 500),
('Ocean', 'rare', '#0a1a2e', '#1a2e3e', false, 500),
('Royal Gold', 'epic', '#1a1a0a', '#2e2e1a', false, 1000),
('Void Purple', 'legendary', '#1a0a2e', '#2e1a3e', false, 2000);

INSERT INTO public.cosmetic_titles (title_text, rarity, glow_color, text_color, is_default, price) VALUES
('Pact Member', 'common', 'rgba(91,180,255,0.3)', '#5bb4ff', true, 0),
('Rising Star', 'rare', 'rgba(234,179,8,0.4)', '#eab308', false, 300),
('Goal Crusher', 'rare', 'rgba(34,211,238,0.4)', '#22d3ee', false, 300),
('Legend', 'epic', 'rgba(168,85,247,0.5)', '#a855f7', false, 800),
('Unstoppable', 'legendary', 'rgba(249,115,22,0.5)', '#f97316', false, 1500);

-- Grant default cosmetics to all existing users
INSERT INTO public.user_cosmetics (user_id, cosmetic_type, cosmetic_id)
SELECT p.id, 'frame', f.id
FROM public.profiles p
CROSS JOIN public.cosmetic_frames f
WHERE f.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.user_cosmetics (user_id, cosmetic_type, cosmetic_id)
SELECT p.id, 'banner', b.id
FROM public.profiles p
CROSS JOIN public.cosmetic_banners b
WHERE b.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.user_cosmetics (user_id, cosmetic_type, cosmetic_id)
SELECT p.id, 'title', t.id
FROM public.profiles p
CROSS JOIN public.cosmetic_titles t
WHERE t.is_default = true
ON CONFLICT DO NOTHING;