
# Fix Wishlist Duplicates, Step-Based Acquisition & "Already Financed"

## Issues Found

### 1. Duplicate Wishlist Items on Refresh
The `useSaveCostItems` hook uses a **delete-and-reinsert** pattern: every time cost items are saved, all existing items are deleted and new ones inserted with **fresh UUIDs**. Meanwhile, `useWishlistGoalSync` tracks synced wishlist items via `source_goal_cost_id`. After a save, the old cost item IDs no longer exist, so the sync sees them as "new" and creates duplicates on every page load.

**Fix**: Change `useWishlistGoalSync` to use a **unique constraint approach** -- before inserting, check if a wishlist item with the same `name + goal_id + source_type='goal_sync'` already exists. Also add a database unique index on `(user_id, source_goal_cost_id)` WHERE `source_goal_cost_id IS NOT NULL` to prevent duplicates at the DB level. Update the sync to reconcile by name+goal rather than only by cost ID.

### 2. Cache Invalidation Mismatch
In `GoalDetail.tsx`, the auto-acquisition code invalidates `["pact-wishlist"]` but the actual query key is `["pact-wishlist", userId]`. This means the wishlist page doesn't refresh after step completion.

**Fix**: Pass the correct query key with userId.

### 3. "Already Financed" Display
Add a computed value in the GoalDetail details section showing the sum of cost items whose linked steps are completed. This gives users a clear picture of what's been "funded" per goal.

---

## Implementation

### Step 1: Database -- Unique Index (Migration)

Add a unique partial index to prevent duplicate wishlist items for the same cost item:
```text
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_unique_cost_source
ON wishlist_items (user_id, source_goal_cost_id)
WHERE source_goal_cost_id IS NOT NULL;
```

Also clean up any existing duplicates first (keep the oldest).

### Step 2: Fix `useWishlistGoalSync.ts`

- When the sync finds a cost item without a matching `source_goal_cost_id` in the wishlist, also check by `name + goal_id + source_type='goal_sync'` before inserting.
- Update existing wishlist items' `source_goal_cost_id` to the new cost item ID when matched by name+goal (handles the ID rotation from delete-and-reinsert).
- Use `upsert` with the unique index as conflict target where possible.

### Step 3: Fix Cache Invalidation in `GoalDetail.tsx`

Change line 276 from:
```text
queryClient.invalidateQueries({ queryKey: ["pact-wishlist"] });
```
To:
```text
queryClient.invalidateQueries({ queryKey: ["pact-wishlist"] }); // partial match invalidates all pact-wishlist queries
```
Actually, React Query's `invalidateQueries` with a partial key `["pact-wishlist"]` should match `["pact-wishlist", userId]` by default. Let me verify -- the issue might be something else. We'll ensure it uses partial matching correctly.

### Step 4: Add "Already Financed" to GoalDetail

In the Details/Cost Items section (around line 799), add a new summary row:
- Compute: sum of `price` for cost items whose `step_id` matches a completed step
- Display as "Already Financed: X / Total: Y" with a progress-like visual

### Step 5: Sync Wishlist `step_id` Column

Update `useWishlistGoalSync` to also pass the `step_id` from cost items to wishlist items, and set `acquired` based on whether the linked step is completed, not just the whole goal.

---

## Technical Details

**Files to modify:**
- `supabase/migrations/` -- new migration: deduplicate existing rows + add unique partial index
- `src/hooks/useWishlistGoalSync.ts` -- fix duplicate logic, reconcile by name+goal fallback, sync step-based acquisition
- `src/pages/GoalDetail.tsx` -- add "Already Financed" display, fix cache key
- `src/i18n/locales/en.json` -- add "alreadyFinanced" label
- `src/i18n/locales/fr.json` -- add French translation

**Migration SQL:**
```text
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
```

**"Already Financed" computation (GoalDetail.tsx):**
```text
const alreadyFinanced = useMemo(() => {
  return costItems
    .filter(ci => ci.step_id && steps.find(s => s.id === ci.step_id && s.status === "completed"))
    .reduce((sum, ci) => sum + ci.price, 0);
}, [costItems, steps]);
```

**Sync fix approach (useWishlistGoalSync.ts):**
- Build a secondary lookup map: `Map<string, PactWishlistItem>` keyed by `normalizedName|goalId`
- When no match by `source_goal_cost_id`, fall back to name+goal match
- If found by fallback, update the wishlist item's `source_goal_cost_id` to the new cost item ID
- For step-based acquisition: check each cost item's `step_id` against the steps data, mark acquired if step is completed
