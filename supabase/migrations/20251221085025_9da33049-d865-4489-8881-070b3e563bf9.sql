-- Create bond_balance table for user currency
CREATE TABLE public.bond_balance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  total_spent integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create bond_transactions table for tracking all bond changes
CREATE TABLE public.bond_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL, -- 'purchase', 'spend', 'earn', 'refund'
  description text,
  reference_id uuid, -- Optional: links to item purchased, pack bought, etc.
  reference_type text, -- 'pack', 'cosmetic', 'module', 'offer'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create bond_packs table for purchasable bond packs
CREATE TABLE public.bond_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  bond_amount integer NOT NULL,
  price_eur numeric(10,2) NOT NULL,
  bonus_percentage integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create shop_modules table for purchasable modules
CREATE TABLE public.shop_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE, -- 'finance', 'the-call', 'journal', 'todo-list', 'track-health'
  name text NOT NULL,
  description text,
  price_bonds integer NOT NULL DEFAULT 0,
  price_eur numeric(10,2),
  rarity text NOT NULL DEFAULT 'common',
  icon_key text,
  is_active boolean NOT NULL DEFAULT true,
  is_coming_soon boolean NOT NULL DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_module_purchases table for tracking module ownership
CREATE TABLE public.user_module_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.shop_modules(id),
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Create special_offers table for admin-managed promotions
CREATE TABLE public.special_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  price_bonds integer,
  price_eur numeric(10,2),
  original_price_bonds integer,
  original_price_eur numeric(10,2),
  items jsonb, -- Array of item references: [{type: 'cosmetic', id: 'xxx'}, {type: 'module', id: 'xxx'}]
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.bond_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for bond_balance
CREATE POLICY "Users can view their own balance" ON public.bond_balance
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own balance" ON public.bond_balance
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own balance" ON public.bond_balance
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for bond_transactions
CREATE POLICY "Users can view their own transactions" ON public.bond_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.bond_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for bond_packs (public read, admin write)
CREATE POLICY "Anyone can view active packs" ON public.bond_packs
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage packs" ON public.bond_packs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for shop_modules (public read, admin write)
CREATE POLICY "Anyone can view active modules" ON public.shop_modules
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage modules" ON public.shop_modules
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for user_module_purchases
CREATE POLICY "Users can view their own purchases" ON public.user_module_purchases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own purchases" ON public.user_module_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for special_offers (public read, admin write)
CREATE POLICY "Anyone can view active offers" ON public.special_offers
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage offers" ON public.special_offers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add updated_at triggers
CREATE TRIGGER update_bond_balance_updated_at
  BEFORE UPDATE ON public.bond_balance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bond_packs_updated_at
  BEFORE UPDATE ON public.bond_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_modules_updated_at
  BEFORE UPDATE ON public.shop_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_special_offers_updated_at
  BEFORE UPDATE ON public.special_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default bond packs
INSERT INTO public.bond_packs (name, bond_amount, price_eur, bonus_percentage, display_order) VALUES
  ('Discovery Pack', 500, 4.99, 0, 1),
  ('Starter Pack', 1200, 9.99, 20, 2),
  ('Value Pack', 2500, 19.99, 25, 3),
  ('Premium Pack', 5500, 39.99, 38, 4);

-- Insert default shop modules
INSERT INTO public.shop_modules (key, name, description, price_bonds, price_eur, rarity, is_coming_soon, display_order) VALUES
  ('finance', 'Track Finance', 'Master your financial awareness with projections and recurring tracking', 2200, 19.99, 'epic', false, 1),
  ('the-call', 'The Call', 'Deep focus sessions with ambient guidance', 2200, 19.99, 'epic', false, 2),
  ('journal', 'Journal', 'Reflect and document your journey', 2200, 19.99, 'rare', true, 3),
  ('todo-list', 'To Do List', 'Daily task management system', 2200, 19.99, 'rare', true, 4),
  ('track-health', 'Track Health', 'Monitor your wellness metrics', 2200, 19.99, 'epic', true, 5);