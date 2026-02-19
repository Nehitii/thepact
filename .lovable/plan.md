

# Plan: Clean Up SmartProjectHeader — Remove Fake Time Calculations

## What Changes

Remove the two fake time-based metrics (the arbitrary "15 min per step" estimates and the misleading "efficiency this week" calculation) and replace them with meaningful, data-backed sub-metrics.

## Detailed Changes

### File: `src/components/home/hero/SmartProjectHeader.tsx`

**1. Delete the time estimation block (lines 49-56)**
Remove the `estimatedMinutes`, `estimatedHours`, and `estimatedTimeText` variables entirely.

**2. Delete the fake efficiency block (lines 58-62)**
Remove `completionRate` and `efficiencyDelta` variables.

**3. Update Priority 2 (Focus goal with steps, lines 88-100)**
Replace `focusTimeText` (lines 83-86) and its usage in `subMetrics` with a real progress fraction:
- Before: `subMetrics: [focusTimeText, 'Priority Target']`
- After: `subMetrics: [`${primaryFocus.validated_steps || 0}/${primaryFocus.total_steps || 0} steps done`, 'Priority Target']`

**4. Update Priority 3 (In-progress goals, lines 117-128)**
Replace `estimatedTimeText` in `subMetrics` with the count of in-progress goals only (already present as second metric), and a completion fraction:
- Before: `subMetrics: [estimatedTimeText, '3 active goals']`
- After: `subMetrics: [`${inProgressGoals.length} active goal${inProgressGoals.length > 1 ? 's' : ''}`, `${totalStepsRemaining} steps left`]`

**5. Update Priority 4 (All caught up, lines 131-142)**
Replace the fake weekly efficiency with a real completion count:
- Before: `subMetrics: ['Efficiency: +23% this week', ...]` (headline) + `subMetrics: ['5 completed', 'On track']`
- After: `headline: 'All goals completed!'` and `subMetrics: [`${completedGoals.length} goal${completedGoals.length > 1 ? 's' : ''} done`, 'Keep momentum']`

## Summary of Removals

| Removed | Why |
|---|---|
| `estimatedMinutes`, `estimatedHours`, `estimatedTimeText` | Arbitrary 15min/step constant with no data basis |
| `focusEstimate`, `focusTimeText` | Same arbitrary constant applied to focus goal |
| `completionRate`, `efficiencyDelta` | Misleading "this week" label on an all-time ratio minus 50 |

## What Stays Unchanged

- The 6-level priority cascade logic (critical/high/medium/low/empty/default)
- All visual theming (colors, glows, borders, pulse)
- The Framer Motion entrance animation
- Habit goal exclusion filter
- The component's props interface and usage in HeroSection

## Technical Details

Only one file is modified: `src/components/home/hero/SmartProjectHeader.tsx`. No new dependencies, no database changes, no hook modifications. The `Goal` interface fields used (`validated_steps`, `total_steps`, `status`, `goal_type`, `name`) remain the same.
