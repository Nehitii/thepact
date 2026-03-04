

# /Goals Section -- Full Audit & Enhancement Plan

---

## Part A: Bugs & Issues Found

### Bug 1: GoalDetail.tsx is a 1531-line monolith
The file contains view rendering, edit overlay, step toggling, habit tracking, super goal management, cost items display, and save logic all in one component. This makes it fragile, hard to maintain, and prone to state synchronization bugs.

### Bug 2: Dual state management in GoalDetail
React Query (`useGoalDetail`) fetches goal data, then it's copied into local `useState` via `useEffect`. This creates a stale-state risk: mutations update local state but the cache can overwrite it on refetch. The edit overlay also duplicates most fields into separate `edit*` states.

### Bug 3: StepDetail doesn't invalidate React Query caches
`StepDetail.tsx` saves step changes and recalculates goal progress directly, but never calls `queryClient.invalidateQueries`. When the user navigates back to GoalDetail, the cached data is stale until the 15s staleTime expires.

### Bug 4: Missing "paused" status in goal lifecycle
`STATUS_CONFIG` defines a "paused" status, but there's no UI anywhere to pause/resume a goal. The `update_goal_status_on_progress` trigger doesn't handle paused goals either -- if a paused goal gets steps validated, it silently becomes "in_progress".

### Bug 5: Super Goal difficulty is editable but meaningless
In the edit overlay, super goals show a difficulty selector, but super goals don't have their own steps -- their progress comes from children. The difficulty badge is displayed but serves no purpose.

### Bug 6: `handleFullyComplete` ignores current status
The "Complete" button is always visible, even if the goal is already completed. Clicking it on a completed goal re-fires achievement tracking and rewrites the completion date.

---

## Part B: Performance Optimizations

### Optimization 1: Split GoalDetail into composable sub-components
Extract from GoalDetail.tsx:
- `GoalHeroCard` -- image, title, badges, progress bar, action buttons
- `GoalStepsList` -- step items with checkboxes
- `GoalHabitTracker` -- daily check-in grid
- `GoalDetailsPanel` -- notes, cost items
- `GoalEditOverlay` -- full edit form (already ~400 lines)

This reduces the render surface of each piece and enables React.memo on stable sections.

### Optimization 2: Eliminate local state duplication
Replace the `useState` + `useEffect` sync pattern with direct consumption of React Query data for read-only display. Only use local state inside the edit overlay when it's open.

### Optimization 3: StepDetail cache invalidation
Add `queryClient.invalidateQueries(["goal-detail", step.goal_id])` and `queryClient.invalidateQueries(["goals"])` after saving in StepDetail.

---

## Part C: New Features

### Feature 1: Goal Status Lifecycle (Pause / Resume / Archive)
Add a dropdown or button group on GoalDetail to transition goals between states:
- **Pause**: Sets status to "paused", freezes the goal without losing progress
- **Resume**: Returns to "in_progress" or "not_started" based on validated_steps
- **Archive**: New status "archived" for goals the user abandoned without deleting

Requires: Add "archived" to STATUS_CONFIG and the database trigger.

### Feature 2: Goal Deadline & Countdown
Add an optional `deadline` date field to goals. Display a countdown timer on the goal card (all 3 views) showing days remaining. Color-code: green (>7 days), amber (1-7 days), red (overdue). This creates urgency and gamification pressure.

Requires: Database migration to add `deadline` column to goals table.

### Feature 3: Goal Duplication
"Duplicate Goal" button on GoalDetail that copies the goal (name, tags, difficulty, steps structure, cost items) into a new goal with status "not_started". Useful for recurring projects or templating.

No database changes needed.

### Feature 4: Bulk Actions on /goals listing
Add a selection mode on the goals listing page: checkboxes on each card, with a floating action bar for:
- Bulk delete
- Bulk change difficulty
- Bulk add/remove tags
- Bulk pause/resume

### Feature 5: Goal Progress Sparkline on Cards
Add a tiny sparkline (last 7 step completions over time) to Bar and Grid view cards, giving a visual sense of momentum. Data source: `step_status_history` table (already exists).

---

## Execution Order

| Phase | Work | Files |
|-------|------|-------|
| 1 | Fix Bug 3 (StepDetail cache invalidation) | `StepDetail.tsx` |
| 2 | Fix Bug 6 (disable Complete button if already completed) | `GoalDetail.tsx` |
| 3 | Split GoalDetail into 5 sub-components | New files in `src/components/goals/detail/` |
| 4 | Add Goal Deadline field + countdown display | DB migration + cards + GoalDetail + NewGoal |
| 5 | Add Pause/Resume/Archive status lifecycle | DB migration (trigger update) + GoalDetail + GoalsList |
| 6 | Add Goal Duplication feature | GoalDetail + NewGoal |
| 7 | Add Bulk Actions to /goals listing | Goals.tsx + GoalsList + new BulkActionBar component |
| 8 | Add Progress Sparkline to cards | BarViewGoalCard + GridViewGoalCard + new hook |

