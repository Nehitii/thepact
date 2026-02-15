
-- Remove duplicates (keep oldest per source_goal_cost_id)
DELETE FROM wishlist_items a
USING wishlist_items b
WHERE a.source_goal_cost_id IS NOT NULL
  AND a.source_goal_cost_id = b.source_goal_cost_id
  AND a.user_id = b.user_id
  AND a.created_at > b.created_at;

-- Unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_unique_cost_source
ON wishlist_items (user_id, source_goal_cost_id)
WHERE source_goal_cost_id IS NOT NULL;
