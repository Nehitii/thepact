
# Pact Settings -- Expert Audit & Improvement Plan

## Current Architecture

The Pact Settings page (`/profile/pact-settings`) is a single, long vertical scroll of 5 cards plus a Danger Zone, all rendered at once inside `ProfilePactSettings`:

1. **Pact Overview** (read-only stats)
2. **Pact Identity** (name, mantra, symbol, color + save button)
3. **Project Timeline** (start/end dates + its own save button)
4. **Custom Difficulty** (name, color, toggle + its own save button)
5. **Ranks** (full CRUD list + editor modal)
6. **Reset Pact** (danger zone with confirmation dialog)

---

## Bugs Found

### BUG 1: Inconsistent Supabase client imports
- `PactSettings.tsx` imports from `@/lib/supabase`
- `ProjectTimelineCard.tsx` imports from `@/lib/supabase`
- `CustomDifficultyCard.tsx` imports from `@/lib/supabase`
- `RanksCard.tsx` imports from `@/lib/supabase`
- `usePactMutation.ts` imports from `@/lib/supabase`
- `useResetPact.ts` imports from `@/integrations/supabase/client`

This inconsistency could cause two separate client instances with different auth sessions in edge cases. All should use `@/integrations/supabase/client`.

### BUG 2: State lifted to page but not synced after save
`PactSettings.tsx` loads pact data into local `useState` on mount. After saving Timeline or Custom Difficulty, the database is updated but the React Query cache for `["pact"]` is **not** invalidated. If the user navigates away and back, they see fresh data -- but other components reading from the cache (Home dashboard, sidebar) still show stale data until the `staleTime` expires.

- `ProjectTimelineCard` does a raw `supabase.update()` without invalidating any query cache.
- `CustomDifficultyCard` does a raw `supabase.update()` on `profiles` without invalidating any query cache.
- Only `PactIdentityCard` (via `usePactMutation`) properly invalidates the `["pact"]` cache.

### BUG 3: `confirm()` used for rank deletion
`RanksCard.tsx` line 59 uses `window.confirm()` for rank deletion -- a native browser dialog that breaks the app's visual language and can't be styled or translated. Every other destructive action uses `AlertDialog`.

### BUG 4: Timeline saves without checking pactId first
If `pactId` is null (user hasn't completed onboarding), `ProjectTimelineCard` shows a toast error, but `CustomDifficultyCard` doesn't check for a missing userId and could silently fail.

### BUG 5: Ranks editor closes before confirming save success
In `RankEditor.tsx`, `handleSave` calls `onSave(editedRank)` then immediately calls `onClose()` in the `try` block. If the save fails inside `onSave` (which shows a toast), the editor still closes, making the user think it succeeded.

---

## UX Issues

### UX 1: Three separate save buttons -- cognitive overload
Identity, Timeline, and Custom Difficulty each have their own "Save" button. Users can edit all three sections but forget to save one. There's no "unsaved changes" indicator or warning when navigating away.

### UX 2: No visual hierarchy or navigation
All 6 sections are stacked vertically with equal visual weight. On a complex page like this, users scroll up and down searching for what they want. There's no table of contents, no section anchors, and no collapsible sections.

### UX 3: Ranks section is extremely dense
The Ranks card contains a scrollable list, a current-rank display with progress bar, a max-XP reference, an "Add" button, and opens a full modal editor with 3 tabs. This is an entire sub-page crammed into a card.

### UX 4: No loading state on initial page load
`PactSettings.tsx` loads data via `useEffect` + raw Supabase calls but shows no loading spinner while `pactId` is null. The cards render with empty defaults, then flash to real data.

---

## Proposed Improvements

### 1. Unify Supabase imports
Replace all `@/lib/supabase` imports in Pact Settings files with `@/integrations/supabase/client`.

**Files:** `PactSettings.tsx`, `ProjectTimelineCard.tsx`, `CustomDifficultyCard.tsx`, `RanksCard.tsx`, `usePactMutation.ts`

### 2. Add cache invalidation to Timeline and Custom Difficulty saves
After a successful `supabase.update()`, call `queryClient.invalidateQueries()` for the relevant query keys (`["pact"]` for timeline, `["profile"]` for custom difficulty) so the rest of the app stays in sync.

### 3. Replace `window.confirm()` with `AlertDialog` in RanksCard
Use the same `AlertDialog` pattern from the Reset Pact section for rank deletion.

### 4. Fix RankEditor close-on-error
Move `onClose()` to only execute after a confirmed successful save (inside the `onSave` callback's resolution, not in a `try` block).

### 5. Add a loading state to PactSettings page
Show a `Loader2` spinner while the initial data is being fetched, matching the pattern used in `Profile.tsx`.

### 6. Add an "unsaved changes" dot indicator
Add a small visual indicator (colored dot) next to each section's save button when the user has made changes that haven't been saved yet. This is lightweight and doesn't require restructuring.

### 7. Consolidate save buttons (optional, lower priority)
Consider merging Identity + Timeline into a single "Pact Identity & Timeline" card with one save button, since they both write to the `pacts` table. This reduces the number of independent save actions from 3 to 2.

---

## Technical Details

### Files to modify:
| File | Changes |
|------|---------|
| `src/pages/profile/PactSettings.tsx` | Add loading state, fix Supabase import |
| `src/components/profile/ProjectTimelineCard.tsx` | Add cache invalidation, fix import |
| `src/components/profile/CustomDifficultyCard.tsx` | Add cache invalidation, fix import |
| `src/components/profile/RanksCard.tsx` | Replace `confirm()` with AlertDialog, fix import |
| `src/components/ranks/RankEditor.tsx` | Fix close-on-error behavior |
| `src/hooks/usePactMutation.ts` | Fix Supabase import |

### Estimated effort: ~45 minutes total
- Bug fixes (1-5): ~25 minutes
- UX improvements (5-6): ~15 minutes
- Optional consolidation (7): ~5 minutes
