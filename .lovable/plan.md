

# Pixel-Perfect NEXUS OS v3.3 -- Top Section Implementation

## Overview

The current home page is missing the 5 major structural components visible in the reference design. The page currently shows: NeuralBar (basic pact name + rank), SmartProjectHeader (Pact Nexus collapsible), QuickActionsBar (single "New Goal" button), MissionRandomizer (already redesigned), MonitoringGlobalPanel, and DifficultyScalePanel.

The reference design instead shows a completely different top section before the Mission Randomizer. Here's what needs to be built:

---

## Component 1: NeuralBar Rewrite

**File: `src/components/home/NeuralBar.tsx`** -- Major rewrite

Current: Shows pact name + rank name + LVL + XP in a simple bar.

Reference shows:
- **Left**: "SYS" label in small caps, then a thin cyan XP progress bar (~80px wide inline), then pact name + pact ID code in muted text
- **Center**: Large cyan mono clock showing `HH:MM:SS` with date below ("SAM 28 FEV 2026")
- **Right**: Bond currency display (icon + amount), then a "CUSTOMIZE" button with a settings/gear icon
- Below the bar: 2px XP progress line (keep existing)

Implementation:
- Three-column flex layout (left, center, right)
- Live clock using `useState` + `setInterval` (update every second)
- Date formatted with `date-fns` using French locale
- "CUSTOMIZE" button navigates to `/profile` (or opens settings)
- Bond display reads from existing currency context or shows placeholder

## Component 2: NexusHeroBanner (New)

**New file: `src/components/home/NexusHeroBanner.tsx`**

The large hero panel with corner brackets:
- Hexagonal icon at top center: Cyan hexagon with "N" letter inside (pure CSS/SVG hexagon)
- "NEXUS**OS**" title: Very large Orbitron font (~50-60px), "NEXUS" in white, "OS" in cyan
- Subtitle: "NEURAL EXECUTION & UNIFIED EXPERIENCE SYSTEM" in tiny tracking-wide muted text
- 4 stat counters in a horizontal row:
  - **67% / PROGRESSION**: Global progress percentage from `dashboardData`
  - **LVL 42 / RANG**: Level number from `rankData`
  - **127 / MISSIONS**: Total goals count
  - **23 / JOURS ACTIFS**: Days since pact creation
- Each stat: Large cyan Orbitron number on top, tiny muted uppercase label below
- Panel uses the standard NeuralPanel styling (dark bg, corner brackets, border)

Data sources: `dashboardData.goalsCompleted/totalGoals` for progression, `rankData` for level, `allGoals.length` for missions, `pact.created_at` for active days.

## Component 3: RankPanel (New)

**New file: `src/components/home/RankPanel.tsx`**

Left panel (~58% width) in a 2-column row:
- **Top-left**: Hexagonal badge (CSS clip-path hexagon, ~60px) with level number centered, cyan border, dark fill
- **Right of badge**: Tier info ("TIER 10 -- CLASSE 5") in tiny muted text, then rank name in very large bold text. Last 2 characters of rank name have a cyan gradient color
- **Below**: "RANG ACTUEL" label + full rank subtitle (e.g., "Spectre -- Classe Neurale 5")
- **XP Section**:
  - Current XP in large amber/orange mono font (e.g., "6 800") with small "XP" suffix
  - Right-aligned: remaining XP in cyan (e.g., "- 3 200 XP") with "RESTANT" label below
  - Full-width segmented XP progress bar: Multiple cyan blocks filling proportionally, percentage label, range markers "0" to "10 000 XP"
- **Bottom box**: "PROCHAIN RANG" label, next rank name in amber (e.g., "PHANTOM - LVL 43"), right-aligned XP requirement
- Standard panel styling with corner brackets

Data sources: `rankData.currentRank`, `rankData.nextRank`, `rankData.currentXP`, `rankData.progressInCurrentRank`, `rankData.xpToNextRank`.

## Component 4: QuickAccessPanel (New)

**New file: `src/components/home/QuickAccessPanel.tsx`**

Right panel (~42% width), replacing current `QuickActionsBar`:
- Header: "// ACCES RAPIDE" in tiny muted Orbitron text
- 2x2 grid of action buttons:
  - **NEW GOAL**: Crosshair icon + label, always active, navigates to `/goals/new`
  - **NEW TASK**: Star icon + label, locked if todo module not owned
  - **JOURNAL**: Document icon + label, locked if journal not owned
  - **HEALTH**: Heart icon + label, locked if health not owned
- Below grid: Full-width "TO-DO LIST" button with checkbox icon
- Each button: Dark panel bg, thin border, icon centered above label, 4px border-radius
- Locked buttons: Dimmed opacity, lock icon overlay, click navigates to shop
- Small corner accent triangles on the panel corners (olive/dark yellow colored, like in reference)

Data: `ownedModules` prop for lock state.

## Component 5: CountdownPanel (New)

**New file: `src/components/home/CountdownPanel.tsx`**

Full-width red/danger-themed countdown timer:
- **Left**: Warning triangle icon with "ALERTE CRITIQUE" label (or phase-based label)
- **Center**: Large countdown `DD:HH:MM:SS` in huge red/orange mono font with labels below (JOURS, HEURES, MINUTES, SECONDES)
- **Below timer**: Status text ("PHASE EN COURS -- PHASE TOURNANTE -- COMPTE A REBOURS ACTIF")
- **Progress bar**: Full-width gradient bar (green to red based on progress), with tick marks (DEBUT, 25%, 50%, 75%, FIN)
- **Right section**: "OPERATION ASCENSION" box with objective label, days remaining, criticality badge ("CRITIQUE" in red), and progress count (e.g., "10 / 25")
- Background: Dark with red-tinted gradient, red/amber borders
- Color scheme changes based on time remaining: green (>75%), amber (25-75%), red (<25%)

Data: `pact.project_start_date`, `pact.project_end_date` for countdown calculation, `dashboardData.goalsCompleted/totalGoals` for progress count.

---

## Home.tsx Layout Changes

**File: `src/pages/Home.tsx`** -- Rewrite content structure

New layout order:
```
NeuralBar (sticky top)
max-w-5xl container:
  NexusHeroBanner (full-width hero)
  [RankPanel (col-span-7) | QuickAccessPanel (col-span-5)] (side-by-side)
  CountdownPanel (full-width)
  MissionRandomizer (already exists, keep as-is)
  MonitoringGlobalPanel (already exists, keep as-is)
  DifficultyScalePanel (already exists, keep as-is)
  GettingStartedCard (onboarding)
  LockedModulesTeaser (if needed)
```

Remove from Home.tsx:
- `HeroSection` component (contains SmartProjectHeader + old QuickActionsBar -- neither is in the reference)
- `QuickActionsBar` import (replaced by QuickAccessPanel)
- `SmartProjectHeader` usage (the Pact Nexus AI panel is not in this reference design)

The `HeroSection` and `SmartProjectHeader` files are kept in the codebase (may be used elsewhere later) but no longer rendered on Home.

## HeroSection.tsx Modification

**File: `src/components/home/hero/HeroSection.tsx`** -- No changes needed (just stop importing it in Home.tsx)

---

## Technical Summary

### New Files (4)
- `src/components/home/NexusHeroBanner.tsx`
- `src/components/home/RankPanel.tsx`
- `src/components/home/QuickAccessPanel.tsx`
- `src/components/home/CountdownPanel.tsx`

### Major Rewrites (1)
- `src/components/home/NeuralBar.tsx` -- 3-column layout with clock, SYS indicator, bonds display

### Modified (1)
- `src/pages/Home.tsx` -- New layout structure, remove HeroSection, add new components

### No Longer Rendered on Home (kept in codebase)
- `HeroSection` (SmartProjectHeader + QuickActionsBar wrapper)
- `SmartProjectHeader` (Pact Nexus AI collapsible)
- `QuickActionsBar` (single "New Goal" button)

### Unchanged
- `MissionRandomizer` (already redesigned in previous step)
- `MonitoringGlobalPanel` (already built)
- `DifficultyScalePanel` (already built)
- All hooks, data logic, database schema
