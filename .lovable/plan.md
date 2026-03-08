

## Stats Audit Report

After thoroughly inspecting all stats components across the app (Home, Goals, Analytics, Health, Focus, Rank), here is the status:

### Working Correctly
- **Home Hero Banner**: Progression %, Level, Missions count, Active Days -- all correctly computed
- **Rank Panel**: XP (854), Level (3), progress bar, next rank -- all dynamically calculated from goals
- **Monitoring Global**: Goals 28%, Steps 59%, Habits 0% -- correct with 10/36 goals, 108/184 steps, 0/180 habits
- **Countdown Panel**: Live countdown, days remaining, progress bar -- all functional
- **Difficulty Scale Panel**: Correct counts per difficulty (Easy 01, Medium 05, Hard 08, etc.)
- **Bar View Progress Bars**: Fixed and visible, shine effect properly contained
- **Goals Tabs**: Counts correct (All 37, Active 27, Completed 10)
- **Analytics Stats Cards**: Goals Completed (10), Steps Done (108), Total Cost, Remaining, Burn Rate, Active goals -- all correct

### Bug Found: Total XP = 0 in Analytics

**Problem**: The Analytics page shows "TOTAL XP: 0" while the Home Rank Panel correctly shows 854 XP.

**Root Cause**: In `useAnalytics.ts` line 131, XP is read from `pacts.points` (a static DB column that defaults to 0 and is never updated). Meanwhile, `useRankXP.ts` dynamically calculates XP by summing `potential_score` from completed/in-progress goals.

**Fix**: Replace the static `pactData?.points` read with the same dynamic calculation used by `useRankXP`:
1. Fetch goals with `potential_score, status, total_steps, validated_steps` in the existing goals query
2. Calculate `totalXP` using the same logic: full score for completed goals + 50% partial credit for in-progress goals based on step completion
3. Remove the `points` select from the pact query (it's unused elsewhere)

### No Other Issues Found
All other stat displays (Health Score, Focus Stats, Cost Tracking, Habits, Community Leaderboard) are structurally sound and use correct data sources. The console warnings about `backgroundColor` animation with `transparent` are cosmetic Framer Motion warnings, not stat-related bugs.

---

**Single file to edit**: `src/hooks/useAnalytics.ts` (lines ~124-131 and the goals query to include score fields)

