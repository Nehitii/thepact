-- Create wishlist table
CREATE TABLE public.shop_wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('cosmetic', 'module', 'bundle')),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_wishlist ENABLE ROW LEVEL SECURITY;

-- RLS policies for wishlist
CREATE POLICY "Users can view their own wishlist" 
ON public.shop_wishlist FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist" 
ON public.shop_wishlist FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist" 
ON public.shop_wishlist FOR DELETE 
USING (auth.uid() = user_id);

-- Create shop bundles table
CREATE TABLE public.shop_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_bonds INTEGER NOT NULL DEFAULT 0,
  original_price_bonds INTEGER,
  discount_percentage INTEGER DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  rarity TEXT NOT NULL DEFAULT 'common',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read for shop bundles)
ALTER TABLE public.shop_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bundles" 
ON public.shop_bundles FOR SELECT 
USING (is_active = true);

-- Create daily deals table
CREATE TABLE public.shop_daily_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('cosmetic_frame', 'cosmetic_banner', 'cosmetic_title', 'module', 'bundle')),
  discount_percentage INTEGER NOT NULL DEFAULT 20,
  deal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read for daily deals)
ALTER TABLE public.shop_daily_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active daily deals" 
ON public.shop_daily_deals FOR SELECT 
USING (is_active = true AND deal_date = CURRENT_DATE);

-- Create index for fast lookup
CREATE UNIQUE INDEX idx_daily_deals_date ON public.shop_daily_deals(deal_date, item_id) WHERE is_active = true;

-- Add unique constraint to prevent duplicate wishlist items
CREATE UNIQUE INDEX idx_wishlist_unique ON public.shop_wishlist(user_id, item_id, item_type);