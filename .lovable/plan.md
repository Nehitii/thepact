

# Wishlist Module — Full Audit & Enhancement Plan

---

## AUDIT RESULTS

### Architecture (Solid)
- **Hook layer** (`usePactWishlist.ts`): Clean CRUD with React Query. Well-typed.
- **Goal sync** (`useWishlistGoalSync.ts`): Robust with fallback matching (name+goal_id), handles ID rotation, step-based acquisition. Good.
- **Scraper** (`scrape-product/index.ts`): Handles og:tags, JSON-LD, price extraction. Functional.
- **Duplicate detection** (`DuplicateMergeDialog`): Works on name+goalId. Clean merge logic.

### Bugs & Issues Found
1. **Wishlist.tsx L474** — "Active Items" stat is wrong: `derived.list.length + (items.filter(i => !i.acquired).length - derived.list.length)` = always all active items count, ignoring filters. Should just show `items.filter(i => !i.acquired).length`.
2. **WishlistItemCard** — `ExtendedWishlistItem` type casts `url`, `source_type`, `image_url` as optional even though `PactWishlistItem` already has them. Dead type extension.
3. **No delete confirmation** — `handleDelete` fires immediately with no "are you sure?" dialog. Dangerous for synced items.
4. **No goal linking on create** — The "New Item" modal has no goal selector (only the edit modal does). Inconsistent.
5. **No priority/ordering** — Items have no manual reorder or priority field.
6. **Grid is 4-col with h-64 image zones** — Cards are very tall. At 4 columns on 1182px viewport, each card is ~270px wide with a 256px image. Content gets cramped.
7. **AcquisitionArchive** — `(item as any).image_url` cast indicates the type is not properly propagated.
8. **No empty state for archive** — When all items are active, archive section returns null (correct), but when items exist but all are filtered out, no feedback.
9. **Hardcoded French comments** in WishlistItemCard ("Dégradé doux", "Zone image spectaculaire") — inconsistent with English UI.

### Missing Features
- No drag-and-drop reordering
- No bulk actions (select multiple → delete/mark acquired)
- No category management (free text, no suggestions/presets)
- No price history or price tracking
- No "budget" concept (how much can I spend this month?)
- No sorting by category or goal
- No image upload (only URL-based images)
- No share/export wishlist
- No notification when a scraped product price changes

---

## ENHANCEMENT PLAN

### Phase 1 — Bug Fixes & Polish (no DB changes)

| # | Fix | File |
|---|-----|------|
| 1.1 | Fix "Active Items" stat to show unfiltered active count | `Wishlist.tsx` L474 |
| 1.2 | Remove dead `ExtendedWishlistItem` type, use `PactWishlistItem` directly | `WishlistItemCard.tsx` |
| 1.3 | Add delete confirmation dialog (AlertDialog with item name) | `Wishlist.tsx` |
| 1.4 | Add goal selector to "New Item" modal (same as edit modal) | `Wishlist.tsx` |
| 1.5 | Fix `(item as any).image_url` casts in AcquisitionArchive | `AcquisitionArchive.tsx` |
| 1.6 | Clean French comments → English | `WishlistItemCard.tsx` |

### Phase 2 — UX Enhancements (no DB changes)

| # | Feature | Details |
|---|---------|---------|
| 2.1 | **Category presets** | Dropdown with common categories (Tech, Clothing, Equipment, Books, Home, Other) + custom input. Replaces free text. |
| 2.2 | **Sort by category/goal** | Add "Category A→Z" and "Goal" options to sort selector |
| 2.3 | **Filter by goal** | Add a goal filter dropdown next to the type filter |
| 2.4 | **Card layout toggle** | Grid (current) vs Compact List view (table-like rows, better for many items) |
| 2.5 | **Bulk select mode** | Checkbox on each card, floating action bar: "Mark Acquired (3)" / "Delete (3)" |
| 2.6 | **Responsive grid fix** | 1 col mobile, 2 col tablet, 3 col desktop (drop 4-col, cards too narrow) |

### Phase 3 — New Features (DB changes required)

| # | Feature | Details |
|---|---------|---------|
| 3.1 | **Priority field** | Add `priority integer default 0` to `wishlist_items`. Sort option "Priority". Drag handle or up/down buttons on cards. |
| 3.2 | **Budget tracker** | Add `wishlist_budget` table (`user_id`, `month date`, `budget numeric`). Show "Budget remaining" stat at top. Alert when total exceeds budget. |
| 3.3 | **Price watch** | Add `original_price numeric` and `price_updated_at timestamptz` to `wishlist_items`. When re-scraping a URL, compare prices. Show price delta badge (↑ +5€ / ↓ -10€) on cards. |
| 3.4 | **Notes timeline** | Replace single `notes` text with a `wishlist_item_notes` table (id, item_id, content, created_at). Show as mini-timeline on card detail. |

### Phase 4 — Power Features

| # | Feature | Details |
|---|---------|---------|
| 4.1 | **Re-scrape button** | Per-item "Refresh price" button that re-calls scrape-product and updates price/image. Uses Phase 3.3 delta tracking. |
| 4.2 | **Wishlist sharing** | Generate a read-only public link (`/wishlist/share/:token`). For gifting or accountability. New `wishlist_share_tokens` table. |
| 4.3 | **Monthly spending report** | "This month you acquired X items for Y total" card in AcquisitionArchive, filtered by `acquired_at` month. |
| 4.4 | **Smart suggestions** | When adding an item, suggest similar items already in the list (fuzzy match) before the full duplicate check. |

---

## Recommended Implementation Order

**Batch 1** (immediate): Phase 1 (all bug fixes) + Phase 2.5 (bulk select) + Phase 2.6 (responsive grid)
**Batch 2**: Phase 2.1-2.4 (UX) + Phase 3.1 (priority)
**Batch 3**: Phase 3.2 (budget) + Phase 3.3 (price watch) + Phase 4.1 (re-scrape)
**Batch 4**: Phase 4.2-4.4 (sharing, reports, suggestions)

---

## Database Migration (Phase 3)

```sql
-- 3.1 Priority
ALTER TABLE wishlist_items ADD COLUMN priority integer NOT NULL DEFAULT 0;

-- 3.2 Budget tracker
CREATE TABLE wishlist_budget (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month date NOT NULL,
  budget numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);
ALTER TABLE wishlist_budget ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own budget" ON wishlist_budget FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3.3 Price watch
ALTER TABLE wishlist_items ADD COLUMN original_price numeric DEFAULT NULL;
ALTER TABLE wishlist_items ADD COLUMN price_updated_at timestamptz DEFAULT NULL;
```

## Files to Create
- `src/components/wishlist/WishlistListView.tsx` — Compact list view
- `src/components/wishlist/WishlistBulkBar.tsx` — Floating bulk action bar
- `src/components/wishlist/BudgetTracker.tsx` — Monthly budget widget
- `src/components/wishlist/DeleteConfirmDialog.tsx` — Delete confirmation

## Files to Modify
- `src/pages/Wishlist.tsx` — Bug fixes, goal selector on create, bulk mode, view toggle, category presets, goal filter
- `src/components/wishlist/WishlistItemCard.tsx` — Type cleanup, checkbox mode, priority display, price delta badge
- `src/components/wishlist/AcquisitionArchive.tsx` — Type fix, monthly report
- `src/hooks/usePactWishlist.ts` — Add priority to types and queries

