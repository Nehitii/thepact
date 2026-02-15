
# Goals Area Audit -- Improvements, Corrections and Optimizations

## 1. BUGS AND CORRECTIONS

### 1.1 GoalDetail: Sequential DB calls instead of batch operations
**File:** `GoalDetail.tsx`, lines 476-501
**Issue:** When saving edited steps, individual `supabase` calls are made in a `for` loop -- one DELETE, one UPDATE or INSERT per step. For a goal with 15 steps, this can mean 15+ sequential network calls.
**Fix:** Batch deletes into a single `.delete().in("id", [...])` call, and batch inserts into a single `.insert([...])`. Updates can be grouped via `Promise.all`.

### 1.2 GoalDetail: `validated_steps` counter can desync
**File:** `GoalDetail.tsx`, lines 318-332
**Issue:** When toggling a step, `validated_steps` is manually incremented/decremented (`goal.validated_steps + 1`). If the local state is stale (e.g., another tab modified data), this creates a mismatch. The database trigger `update_goal_status_on_progress` also updates status based on `validated_steps`, so feeding it a wrong value compounds the error.
**Fix:** After toggling, re-count completed steps from the `steps` array rather than relying on `goal.validated_steps +/- 1`. Alternatively, use the same `recalculateGoalProgress` pattern that `StepDetail.tsx` already uses.

### 1.3 GoalDetail: Duplicate `getStatusLabel` / `getStatusColor` / `getDifficultyLabel`
**File:** `GoalDetail.tsx`, lines 577-616
**Issue:** These functions are redefined locally, duplicating the centralized versions in `goalConstants.ts`. The `Goals.tsx` listing page already uses the centralized versions.
**Fix:** Remove local definitions and import from `goalConstants.ts`.

### 1.4 GoalDetail: `mapToValidTag` duplicated
**File:** `GoalDetail.tsx`, lines 278-294
**Issue:** This exact function already exists in `goalConstants.ts` (exported as `mapToValidTag`).
**Fix:** Import it from `@/lib/goalConstants` instead of redefining it locally.

### 1.5 Goals.tsx: `localGoals` stale data pattern
**File:** `Goals.tsx`, lines 132-138
**Issue:** `localGoals` is set from `goals` but only when `goals.length > 0`, meaning if a user deletes all goals, `localGoals` retains the old data. The `displayGoals` fallback logic (`localGoals.length > 0 ? localGoals : goals`) means the deleted goals would still appear until a hard refresh.
**Fix:** Sync `localGoals` unconditionally from `goals`, or remove the pattern entirely and use React Query's `queryClient.setQueryData` for optimistic updates on `toggleFocus`.

### 1.6 Goals.tsx: Pagination doesn't reset on tab change
**File:** `Goals.tsx`
**Issue:** When switching from the "Active" tab (e.g., page 3) to "Completed" tab, the page number for "Active" is preserved but may be out of range when returning if goals were completed in the interim.
**Fix:** Clamp page numbers when rendering, or reset all pages on tab change.

### 1.7 StepDetail: No React Query invalidation
**File:** `StepDetail.tsx`, lines 66-93
**Issue:** After saving step changes, `StepDetail` recalculates goal progress via direct DB call but does not invalidate React Query caches (`["goals", ...]`). When navigating back to GoalDetail, stale data is shown until the stale timer expires.
**Fix:** Import `useQueryClient` and call `queryClient.invalidateQueries({ queryKey: ["goals"] })` after saving.

---

## 2. PERFORMANCE OPTIMIZATIONS

### 2.1 GoalDetail: Direct Supabase fetch instead of React Query
**File:** `GoalDetail.tsx`, lines 200-237
**Issue:** Goal and steps are loaded via a raw `useEffect` + `supabase.from()` call, bypassing React Query entirely. This means no caching, no background refetching, and data from the listing page (already fetched via `useGoals`) is discarded and re-fetched.
**Fix:** Create a `useGoalDetail(goalId)` hook using `useQuery` that leverages the existing cache and provides proper loading/error states.

### 2.2 GoalDetail: Profile fetched independently
**File:** `GoalDetail.tsx`, lines 203-210
**Issue:** Custom difficulty settings are fetched via a separate raw Supabase call, even though `useProfile(user?.id)` exists and is used elsewhere.
**Fix:** Replace the manual profile fetch with `useProfile(user?.id)` and derive `customDifficultyName/Color/Active` from it.

### 2.3 Goals.tsx: Unnecessary re-renders from inline components
**File:** `Goals.tsx`, lines 280-391
**Issue:** `DifficultyBadge` and `ProgressBar` are defined as inline components inside the render function. Every re-render of `Goals` creates new component references, causing React to unmount/remount these.
**Fix:** Extract `DifficultyBadge` and `ProgressBar` into standalone memoized components outside the `Goals` function.

### 2.4 Goals.tsx: Helper functions recreated every render
**File:** `Goals.tsx`, lines 44-98
**Issue:** `getAuraClass`, `getBorderWidth`, `withAlphaColor` are pure utility functions defined inside the module but `sortGoals`, `filterGoalsBySearch`, `normalizeString` are defined inside the component, causing re-creation on every render.
**Fix:** Wrap `sortGoals` and `filterGoalsBySearch` in `useMemo` or `useCallback`, or move them outside the component since they only depend on their arguments.

---

## 3. UX IMPROVEMENTS

### 3.1 No feedback when goal creation/edit is in progress
**Issue:** Both `NewGoal.tsx` and the edit form in `GoalDetail.tsx` lack a loading/disabled state on the save button during submission (NewGoal has `loading` state but the edit form does not).
**Fix:** Add a `saving` state to the edit form and disable the "Save Changes" button while the operation is running.

### 3.2 Edit form doesn't show "Super Goal" in the Goal Type display
**File:** `GoalDetail.tsx`, lines 1229-1265
**Issue:** The read-only Goal Type section only shows "Normal Goal" and "Habit Goal" cards, but not "Super Goal". If editing a super goal, neither card appears selected.
**Fix:** Add a third "Super Goal" card with a Crown icon.

### 3.3 No confirmation when leaving the edit form with unsaved changes
**Issue:** If a user modifies fields in the edit overlay and clicks "Back to Goal" or hits Escape, changes are silently discarded.
**Fix:** Add an unsaved-changes guard (compare current form state vs. initial state) that prompts before closing.

### 3.4 Goal detail tags display uses raw `goal.type` instead of junction table tags
**File:** `GoalDetail.tsx`, line 736-738
**Issue:** The badge shows `goal.type` (the legacy single enum field) instead of the multi-tag data from the junction table which is already loaded via `useGoalTags`.
**Fix:** Render `goalTagsData` badges instead of the single `goal.type` badge.

### 3.5 Search only works on current tab data
**Issue:** The search filter applies to all goals before tab splitting, which is correct. However, there is no visual indicator of how many results matched per tab when searching.
**Fix:** Add the filtered count to the tab labels when a search is active (e.g., "Active (3/12)").

---

## 4. CODE QUALITY

### 4.1 GoalDetail.tsx is 1499 lines
**Issue:** The file handles data fetching, step toggling, habit tracking, goal editing (full form), super goal management, cost items display, and rendering. This makes it very difficult to maintain.
**Recommended split:**
- `GoalDetailView.tsx` -- the read-only display (hero, steps list, cost items, notes)
- `GoalEditOverlay.tsx` -- the full-page edit form (lines 1086-1457)
- `useGoalDetail.ts` -- data fetching hook
- Keep `GoalDetail_handlers.ts` as-is for mutation logic

### 4.2 `Goal` interface duplicated
**Issue:** `GoalDetail.tsx` defines its own `Goal` interface (lines 83-107) that differs slightly from `useGoals.ts`'s exported `Goal` type. This creates type drift.
**Fix:** Use a single shared `Goal` type from `useGoals.ts` or a dedicated `types/goals.ts` file.

### 4.3 `any` types in mutations
**Files:** `GoalDetail.tsx` line 427, `StepDetail.tsx` line 70, `NewGoal.tsx` line 204
**Issue:** `updates` and insert payloads are typed as `any`, bypassing TypeScript safety.
**Fix:** Use the generated Supabase types from `integrations/supabase/types.ts` for proper typing.

---

## 5. SUMMARY -- PRIORITY RANKING

| Priority | Item | Impact |
|----------|------|--------|
| High | 1.2 -- validated_steps desync | Data integrity |
| High | 1.5 -- localGoals stale after delete-all | UI shows ghost data |
| High | 2.1 -- Raw fetch instead of React Query | Cache miss, double fetching |
| Medium | 1.1 -- Sequential DB calls in edit save | Slow save for many steps |
| Medium | 1.7 -- StepDetail no cache invalidation | Stale data on navigation |
| Medium | 2.2 -- Duplicate profile fetch | Unnecessary network call |
| Medium | 3.1 -- No loading state on edit save | Double-submit risk |
| Medium | 3.2 -- Super Goal type missing in edit form | Confusing UI |
| Medium | 3.4 -- Tags display uses legacy field | Shows wrong data |
| Low | 1.3, 1.4 -- Duplicated helpers | Code maintainability |
| Low | 2.3, 2.4 -- Inline components/functions | Minor perf improvement |
| Low | 3.3 -- Unsaved changes guard | UX polish |
| Low | 4.1 -- File size (1499 lines) | Maintainability |
| Low | 4.2, 4.3 -- Type safety | Developer experience |

## Technical Implementation Notes

All fixes follow existing patterns:
- React Query hooks: follow `useGoals.ts` pattern
- Centralized constants: import from `@/lib/goalConstants`
- Supabase wrapper: use `@/lib/supabase`
- Component extraction: follow `EditStepsList.tsx` pattern with barrel exports in `@/components/goals/index.ts`
