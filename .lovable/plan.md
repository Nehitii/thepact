

# Super Goal View Adaptation

## Problem
The `SuperGoalCard` is a single component that ignores the current display mode (Grid / Bar / Bookmark). It renders as a large, wide card in every view, breaking visual consistency with the regular goal cards around it.

## Solution
Create three Super Goal card variants -- one per view -- that mirror the layout, dimensions, and style of their regular counterparts, while adding distinct "Super Goal" visual markers (crown icon, gold/amber accents, child-goal count instead of step count).

---

## Visual Identity: What Makes a Super Goal Distinct

Across all three views, Super Goals will share these consistent differentiators:
- **Crown icon** (Lucide `Crown`) replaces the Target/Zap icon
- **Gold/amber accent border** with a subtle shimmer, layered on top of the difficulty color
- **"SUPER" badge** -- small, gold, always visible
- **Child goals count** ("3/5 goals") instead of "steps" or "days"
- **Progress** = percentage of child goals completed

---

## Component Architecture

```text
src/components/goals/super/
  SuperGoalCard.tsx         --> becomes a router: picks the right variant
  SuperGoalGridCard.tsx     --> NEW: mirrors GridViewGoalCard
  SuperGoalBarCard.tsx      --> NEW: mirrors BarViewGoalCard  
  SuperGoalBookmarkCard.tsx --> NEW: mirrors UIVerseGoalCard
```

### 1. SuperGoalGridCard (mirrors GridViewGoalCard)
- Same dimensions (max-w-340, aspect 4/5), same glass panel layout
- Image area shows a radial gradient with the Crown icon (no image for super goals)
- Gold "SUPER" badge in the top-left alongside the difficulty pill
- Bottom glass panel: goal name, "X/Y goals completed", progress bar
- Difficulty-based accent color preserved, with an additional gold border glow

### 2. SuperGoalBarCard (mirrors BarViewGoalCard)
- Same horizontal layout (max-w-680, 120px height), same 3D tilt grid
- Uses `styled-components` (matching the existing BarViewGoalCard pattern)
- Left: Crown icon in a framed container (replaces goal image)
- Right: goal name, "SUPER" tag next to difficulty, child count, progress bar
- Gold-tinted border on hover instead of pure accent color

### 3. SuperGoalBookmarkCard (mirrors UIVerseGoalCard)
- Same dimensions (210x280), same cutout/skew decorations
- Top section: gradient background with large Crown icon
- "SUPER" badge alongside the difficulty badge
- Bottom: goal name, child count progress, same gamer-style progress bar
- Additional gold outer glow in the box-shadow

---

## Routing Logic (GoalsList.tsx)

The `renderGoalCard` function in `GoalsList.tsx` will be updated to pick the correct Super Goal variant based on `displayMode`:

```text
if goal_type === "super":
  displayMode === "grid"     --> SuperGoalGridCard
  displayMode === "bookmark" --> SuperGoalBookmarkCard
  displayMode === "bar"      --> SuperGoalBarCard
```

The existing `SuperGoalCard.tsx` will become a thin wrapper that delegates to the correct variant, or the routing logic moves entirely into `GoalsList.tsx`.

---

## Props (shared interface)

All three variants receive the same props (matching the current `SuperGoalCard` interface):
- `id`, `name`, `childCount`, `completedCount`
- `isDynamic`, `rule`, `difficulty`
- `customDifficultyName`, `customDifficultyColor`
- `onClick`

No new data fetching or database changes are needed.

---

## Technical Details

- **SuperGoalGridCard**: Pure Tailwind + `cn()`, CSS variables for accent colors (same pattern as `GridViewGoalCard`)
- **SuperGoalBarCard**: `styled-components` with the same 3D tilt tracker grid (same pattern as `BarViewGoalCard`)
- **SuperGoalBookmarkCard**: Inline styles + Tailwind (same pattern as `UIVerseGoalCard`)
- The `index.ts` barrel export will be updated to export the new components
- Dynamic rule label ("Auto: Focus, Active") preserved in all three variants as a subtle footer line

## Files to Create
- `src/components/goals/super/SuperGoalGridCard.tsx`
- `src/components/goals/super/SuperGoalBarCard.tsx`
- `src/components/goals/super/SuperGoalBookmarkCard.tsx`

## Files to Edit
- `src/components/goals/super/SuperGoalCard.tsx` -- simplify or keep as fallback
- `src/components/goals/super/index.ts` -- export new components
- `src/components/goals/GoalsList.tsx` -- route to correct variant based on `displayMode`
