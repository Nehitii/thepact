

# Codebase Optimization Plan

## Issues Identified

### 1. Dual Supabase Client Import (61 files affected)
`src/lib/supabase.ts` re-exports the auto-generated client. 61 files import from `@/lib/supabase` instead of `@/integrations/supabase/client`. While functionally identical, this creates confusion and an unnecessary indirection layer. Some files like `useFinance.ts` already import correctly.

### 2. GoalDetail.tsx is a 1733-line monolith
This file contains view logic, edit form, handlers, state management, and multiple sub-views (habit, super goal, normal goal) all in one component. It has 15+ `useState` calls and tightly coupled concerns.

### 3. Sidebar duplicate profile query
`AppSidebar.tsx` creates its own inline `useQuery` for profile data (`sidebar-profile` key) instead of reusing the `useProfile` hook. This means two separate queries for profile data with different cache keys.

### 4. Redundant data in ProtectedRoute
`useTwoFactor()` is called on every protected route render, potentially triggering queries even when 2FA isn't enabled.

### 5. Navigation in render (Home.tsx)
`navigate("/onboarding")` is called directly during render (line 141), which is a React anti-pattern.

### 6. Missing React.memo on heavy list items
Goal cards, step items, and sidebar nav items re-render on every parent state change.

### 7. AppLayout re-renders cascade
Every route change re-mounts `AppLayout` because it's inside each route element rather than wrapping routes.

---

## Implementation Plan

### Phase 1: Supabase Client Consolidation
- Update all 61 files to import from `@/integrations/supabase/client` directly
- Remove the `supabase` export from `src/lib/supabase.ts` (keep `createPact` utility)
- Eliminates the indirection layer and aligns with the project's stated standard

### Phase 2: GoalDetail Decomposition
Split `GoalDetail.tsx` (1733 lines) into focused sub-components:
- `GoalDetailHero.tsx` -- header card with image, badges, progress bar, actions
- `GoalDetailSteps.tsx` -- step list with toggle logic
- `GoalDetailHabit.tsx` -- habit check grid + heatmap
- `GoalDetailCosts.tsx` -- cost items display
- `GoalDetailEditOverlay.tsx` -- the full-page edit form (~400 lines)
- `useGoalDetailActions.ts` -- custom hook for all mutation logic (toggle step, pause, archive, duplicate, delete, complete)

This reduces the main file to ~200 lines of composition.

### Phase 3: Sidebar Profile Query Deduplication
- Expand `useProfile` hook to also fetch `display_name` and `avatar_url`
- Replace the inline `useQuery` in `AppSidebar.tsx` with `useProfile(user?.id)`
- Single cache key, single network request for profile data app-wide

### Phase 4: Render-time Navigation Fix
- Wrap `navigate("/onboarding")` in Home.tsx inside a `useEffect` to avoid calling navigation during render
- This prevents potential React warnings and state update issues

### Phase 5: Layout Route Optimization
- Restructure `App.tsx` to use nested route layout pattern: `<Route element={<AppLayout />}>` wrapping all protected routes
- This prevents `AppLayout` (sidebar + command palette) from unmounting/remounting on every navigation
- Preserves sidebar scroll position, dropdown states, and reduces DOM churn

### Phase 6: Component Memoization
- Wrap `GoalsList` items, sidebar nav items with `React.memo`
- Memoize heavy callbacks with `useCallback` where missing
- Add `useMemo` for computed values passed as props (prevents child re-renders)

---

## Technical Details

```text
Current Architecture:
  Route A → ProtectedRoute → AppLayout → Page
  Route B → ProtectedRoute → AppLayout → Page
  (AppLayout remounts on each navigation)

Optimized Architecture:
  ProtectedRoute
    └─ AppLayout (mounted once)
        ├─ Route A → Page
        ├─ Route B → Page
        └─ Route C → Page
  (AppLayout stays mounted, only page content swaps)
```

**File count estimates:**
- Phase 1: ~61 files (mechanical find/replace)
- Phase 2: 6 new files, 1 refactored file
- Phase 3: 2 files modified
- Phase 4: 1 file modified
- Phase 5: 1 file modified (App.tsx)
- Phase 6: 3-5 files modified

**Risk:** Low. All changes are structural refactors with no behavior changes. Phase 5 (layout routes) is the most impactful but follows standard React Router patterns.

