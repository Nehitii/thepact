
-- Add url column to wishlist_items for URL import feature
ALTER TABLE public.wishlist_items ADD COLUMN url TEXT DEFAULT NULL;

-- Add source_type to track where the item came from (manual vs goal_sync)
ALTER TABLE public.wishlist_items ADD COLUMN source_type TEXT NOT NULL DEFAULT 'manual';

-- Add source_goal_cost_id to link back to the original goal_cost_item for sync
ALTER TABLE public.wishlist_items ADD COLUMN source_goal_cost_id UUID DEFAULT NULL;

-- Add index for faster goal sync lookups
CREATE INDEX idx_wishlist_items_source ON public.wishlist_items(source_goal_cost_id) WHERE source_goal_cost_id IS NOT NULL;
