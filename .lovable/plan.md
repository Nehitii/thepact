
# Pixel-Perfect NEXUS OS v3.3 -- Bottom Sections Rebuild

## Context

The uploaded image reveals the bottom portion of the reference design that was never implemented. The current `/home` uses small 2-column NeuralPanel widgets with section labels ("System Overview", "Operations", "Analytics", "Records"), which bear no resemblance to the reference. The reference instead shows three large, full-width panels with distinctive visual treatments.

---

## What Gets Removed

The current section-based layout with small widget panels must be replaced entirely:

- **Remove** the `SectionLabel` component and all `<section>` blocks from `Home.tsx`
- **Remove** the 2-column grids containing `ProgressOverviewModule`, `PactTimeline`, `FocusGoalsModule`, `HabitsModule`, `ProgressByDifficultyModule`, `CostTrackingModule`, `AchievementsWidget`, and "The Call" button
- These component **files** are kept (used elsewhere) but are **no longer rendered on Home**

---

## What Gets Built

### Panel 1: Mission Randomizer (Full Panel Redesign)

**File: `src/components/home/hero/MissionRandomizer.tsx`** -- Major rewrite of the idle state

The reference shows a large panel with:

- **Header bar**: Orange "MISSION RANDOMIZER" title with a gear/target icon on the left, and a "STANDBY" badge (outlined, top-right)
- **Corner brackets**: Thin cyan lines at 4 corners of the panel (decorative `::before`/`::after` L-shapes)
- **Main area** split into two columns:
  - **Left (~75%)**: Large dark inner panel with centered crosshair icon and text "INITIALISER LE SCAN DE MISSION" (placeholder when no scan is running)
  - **Right (~25%)**: Stacked vertically:
    - A large cyan "SCAN" button (full width of this column)
    - A "STATISTIQUES" sub-panel showing "GENEREES: 0" and "ACCEPTEES: 0" with thin divider lines
    - A "FILTRE DIFF." section with a 3x2 grid of difficulty filter buttons (EASY in green, MED in yellow, HARD in orange/amber, EXT in red, IMP in pink/magenta, and a "reset" button)
- Panel background: Dark (`rgba(6,11,22,0.95)`), thin border

The spinning/confirm/deadline states remain functionally the same but get visual alignment with the new panel style.

### Panel 2: Monitoring Global (New Component)

**New file: `src/components/home/MonitoringGlobalPanel.tsx`**

This replaces `ProgressOverviewModule` and `PactTimeline` with a single full-width panel:

- **Header**: `// MONITORING GLOBAL -- CYCLE ACTUEL` label with corner brackets
- **Three circular gauges** in a horizontal row, evenly spaced:
  - **OBJECTIFS** (Goals): Cyan ring, percentage in center (e.g., "72%"), label "GOALS" inside ring, "OBJECTIFS" below, count "18/25 completes" below that
  - **ETAPES** (Steps): Yellow/amber ring, same layout, "STEPS" label
  - **HABITUDES** (Habits): Green ring, same layout, "HABITS" label
  - Each ring has a dark track behind it and a colored progress arc
- **Timeline section** below the gauges:
  - Left label: "TIMELINE DU CYCLE"
  - Right label: "JOUR 20/30 -- PHASE AVANCEE" in cyan
  - A full-width progress bar (cyan fill on dark track)
  - Below the bar: Month markers (J.01, J.10, J.15, J.20, J.25, J.30) with a triangle marker at current position
- Data from: `dashboardData` (goals, steps, habits counts) and `pact` (start/end dates for timeline)

### Panel 3: L'Echelle Ananta -- Progression par Difficulte (New Component)

**New file: `src/components/home/DifficultyScalePanel.tsx`**

This replaces `ProgressByDifficultyModule` with a full-width panel:

- **Header**: `// L'ECHELLE ANANTA -- PROGRESSION PAR DIFFICULTE` with corner brackets
- **Six cards** in a horizontal row (equal width, responsive wrap on mobile):
  - **EASY**: Green border-top accent, "EASY" label in green, large number (e.g., "47"), "missions" below
  - **MEDIUM**: Yellow border-top accent, same layout
  - **HARD**: Orange border-top accent, same layout
  - **EXTREME**: Red border-top accent, same layout
  - **IMPOSSIBLE**: Pink/magenta border-top accent, same layout
  - **ANANTA** (custom): Cyan/magenta border-top accent, large number, subtitle "legendaire" in accent color
- Each card: Dark background, subtle border, colored top bar (3-4px height), number uses large `font-mono` bold text
- Card background has a very subtle gradient tint matching the difficulty color

---

## Home.tsx Layout Changes

**File: `src/pages/Home.tsx`** -- Rewrite the content sections

New structure after the Hero:

```text
<NeuralBar />
<div max-w-5xl>
  <HeroSection />             (SmartProjectHeader + QuickActionsBar only)
  <MissionRandomizer />        (full panel, moved out of HeroSection)
  <MonitoringGlobalPanel />    (new -- replaces ProgressOverview + Timeline)
  <DifficultyScalePanel />     (new -- replaces ProgressByDifficulty)
  <GettingStartedCard />       (onboarding only)
  <LockedModulesTeaser />      (if locked modules)
</div>
```

- Remove all `<section>` blocks and `SectionLabel`
- Remove imports for `ProgressOverviewModule`, `PactTimeline`, `FocusGoalsModule`, `HabitsModule`, `ProgressByDifficultyModule`, `CostTrackingModule`, `AchievementsWidget`
- MissionRandomizer moves out of `HeroSection` and renders directly in Home (it's a large standalone panel now, not part of the hero stack)

**File: `src/components/home/hero/HeroSection.tsx`** -- Remove MissionRandomizer

HeroSection now only contains `SmartProjectHeader` and `QuickActionsBar`. The MissionRandomizer is rendered independently in Home.tsx.

---

## Corner Brackets Pattern

All three panels use a shared corner bracket decoration. Create a reusable utility:

**New file: `src/components/home/CornerBrackets.tsx`**

A component that renders four small L-shaped brackets at the corners of its parent using absolute positioning. Each bracket is two thin lines (1px, ~12px long) in cyan. Applied via wrapping or as a child element.

---

## Technical Summary

### New Files (3)
- `src/components/home/MonitoringGlobalPanel.tsx` -- circular gauges + timeline
- `src/components/home/DifficultyScalePanel.tsx` -- 6 colored difficulty cards
- `src/components/home/CornerBrackets.tsx` -- reusable corner bracket decoration

### Major Rewrites (2)
- `src/components/home/hero/MissionRandomizer.tsx` -- full panel with scan area, stats, filters
- `src/pages/Home.tsx` -- replace section grid with 3 full-width panels

### Modified (1)
- `src/components/home/hero/HeroSection.tsx` -- remove MissionRandomizer from hero stack

### No Longer Rendered on Home (files kept)
- `ProgressOverviewModule` -- replaced by MonitoringGlobalPanel
- `PactTimeline` -- replaced by MonitoringGlobalPanel timeline section
- `FocusGoalsModule` -- not in reference
- `HabitsModule` -- habits data now in MonitoringGlobalPanel gauge
- `ProgressByDifficultyModule` -- replaced by DifficultyScalePanel
- `CostTrackingModule` -- not in reference
- `AchievementsWidget` -- not in reference

### Unchanged
- `NeuralBar.tsx`, `NeuralPanel.tsx`, `SmartProjectHeader.tsx`, `QuickActionsBar.tsx`
- All hooks, data logic, database schema
- `ActiveMissionCard`, `DeadlineSelector` (used by MissionRandomizer states)
