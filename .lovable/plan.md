

# Fix: Locked Goals Flickering & Blur Leak

## Root Cause

Two issues combine to cause the screen-wide flickering:

1. **`UIVerseGoalCard.tsx` line 157** — The `GoalLockOverlay` is placed **outside** the `overflow-hidden` container. It sits as a direct child of `motion.div`, which has no overflow clipping. The `backdrop-blur-md` effect therefore leaks beyond the card boundaries and eventually affects the entire page.

2. **`GoalLockOverlay.tsx`** — The `z-[50]` is excessively high, and `animate-pulse` triggers continuous opacity repaints on a `backdrop-blur` layer. The browser's compositor struggles with the repeated blur recalculations, causing the visible flicker. Over time, the blur compositing breaks containment entirely.

`GridViewGoalCard.tsx` has the overlay correctly inside `overflow-hidden` (line 153), but still suffers from the `animate-pulse` + `backdrop-blur` repaint storm.

## Fix

### 1. `GoalLockOverlay.tsx`
- Add `isolate` (CSS `isolation: isolate`) to the root div — forces a new stacking context, preventing blur leak
- Add `contain-paint` (`contain: paint`) — tells the browser this element's rendering is self-contained
- Lower z-index from `z-[50]` to `z-30` (still above card content but not competing with modals)
- Move `animate-pulse` off the backdrop-blur layer — keep it only on the icon/text inner div (already the case, but ensure the blur layer itself has no animation)
- Replace `backdrop-blur-md` with a solid semi-transparent background (`bg-black/60`) as a fallback that doesn't cause compositor issues, OR keep blur but add `will-change-[backdrop-filter]` to hint the browser

### 2. `UIVerseGoalCard.tsx` line 157
- Move `{goal.is_locked && <GoalLockOverlay />}` **inside** the `overflow-hidden` container div (after line 159), matching the pattern already used in `GridViewGoalCard.tsx`

### Files
| File | Change |
|------|--------|
| `src/components/goals/GoalLockOverlay.tsx` | Add `isolate`, `contain-paint`, lower z-index, stabilize blur compositing |
| `src/components/goals/UIVerseGoalCard.tsx` | Move overlay inside overflow-hidden container |

No database changes. No new files.

