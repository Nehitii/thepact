-- Wishlist module: strategic purchase planning (separate from shop_wishlist)

-- 1) Table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid NULL,
  name text NOT NULL,
  category text NULL,
  estimated_cost numeric NOT NULL DEFAULT 0,
  item_type text NOT NULL DEFAULT 'optional', -- 'required' | 'optional'
  acquired boolean NOT NULL DEFAULT false,
  acquired_at timestamptz NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Foreign key to goals (optional link)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wishlist_items_goal_id_fkey'
  ) THEN
    ALTER TABLE public.wishlist_items
      ADD CONSTRAINT wishlist_items_goal_id_fkey
      FOREIGN KEY (goal_id)
      REFERENCES public.goals(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Trigger for updated_at
DROP TRIGGER IF EXISTS update_wishlist_items_updated_at ON public.wishlist_items;
CREATE TRIGGER update_wishlist_items_updated_at
BEFORE UPDATE ON public.wishlist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) RLS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can view their own wishlist items"
ON public.wishlist_items
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can create their own wishlist items"
ON public.wishlist_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can update their own wishlist items"
ON public.wishlist_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can delete their own wishlist items"
ON public.wishlist_items
FOR DELETE
USING (auth.uid() = user_id);

-- 5) Indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_goal_id ON public.wishlist_items(goal_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_item_type ON public.wishlist_items(item_type);

-- 6) Ensure Wishlist module exists in shop_modules (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.shop_modules WHERE key = 'wishlist') THEN
    INSERT INTO public.shop_modules (key, name, description, price_bonds, price_eur, rarity, is_coming_soon, display_order, is_active)
    VALUES ('wishlist', 'Wishlist', 'Strategic purchase planning for your pact: required vs optional items', 2200, 19.99, 'epic', false, 6, true);
  END IF;
END $$;
