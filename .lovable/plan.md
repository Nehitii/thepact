

# Pixel-Perfect NEXUS OS v3.3 Implementation

## Step 1: Destructive Cleanup -- Remove Drag & Drop + Module Grid System

### Files to delete (imports removed, code dead):
- `src/components/home/ModuleGrid.tsx` -- DnD grid container
- `src/components/home/ModuleCard.tsx` -- DnD sortable wrapper
- `src/components/home/ModuleManager.tsx` -- edit mode toolbar
- `src/components/home/DashboardWidgetShell.tsx` -- old widget shell (unused but still present)
- `src/components/home/ActionModuleCard.tsx` -- old action card (unused but still present)
- `src/components/home/HudActionButton.tsx` -- unused
- `src/components/home/NextMilestoneCard.tsx` -- unused
- `src/components/home/TodaysFocusMessage.tsx` -- unused
- `src/components/home/hero/NoiseOverlay.tsx` -- unused
- `src/components/home/hero/CurrentRankBadge.tsx` -- moved to NeuralBar
- `src/components/home/hero/XPProgressBar.tsx` -- moved to NeuralBar

### Hook cleanup:
- `src/hooks/useModuleLayout.ts` -- delete entirely (manages drag-and-drop state, module order, edit mode, size cycling -- none of this is needed)

### Dependency removal:
- Remove `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` from `package.json` (only used in ModuleGrid and ModuleCard)

---

## Step 2: Rebuild Home.tsx -- Static Card Layout

**File: `src/pages/Home.tsx`** -- Complete rewrite

The new structure is a simple vertical stack with no drag/drop, no edit mode, no module config. Just hardcoded sections in the exact order from the reference:

```text
<NeuralBar />                     (sticky top)
<div max-w-5xl>
  <SmartProjectHeader />          (Pact Nexus collapsible)
  <QuickActionsBar />             (New Goal button only)
  <MissionRandomizer />           (or ActiveMissionCard)
  
  -- SECTION: "SYSTEM OVERVIEW" label --
  <div grid cols-2 gap-3>
    <ProgressOverviewModule />    (col-span-1)
    <PactTimeline />              (col-span-1)
  </div>
  
  -- SECTION: "OPERATIONS" label --
  <div grid cols-2 gap-3>
    <FocusGoalsModule />          (col-span-1)
    <HabitsModule />              (col-span-1)
  </div>
  
  -- SECTION: "ANALYTICS" label --
  <div grid cols-2 gap-3>
    <ProgressByDifficultyModule />(col-span-1)
    <CostTrackingModule />        (col-span-1)
  </div>
  
  -- SECTION: "RECORDS" label --
  <div grid cols-2 gap-3>
    <AchievementsWidget />        (col-span-1)
    <TheCallCard />               (col-span-1, if owned)
  </div>
  
  <GettingStartedCard />          (onboarding only)
  <LockedModulesTeaser />         (if locked modules)
</div>
```

Remove all of the following from Home.tsx:
- `useModuleLayout` hook and all its destructured values (`isEditMode`, `enterEditMode`, `exitEditMode`, `toggleModule`, `cycleModuleSize`, `toggleDisplayMode`, `getDisplayMode`, `reorderModules`, `validateLayout`, `resetToDefault`, `getAllModules`)
- `ModuleGrid`, `ModuleCard`, `ModuleManager` imports and usage
- `sortedModules`, `visibleModules` computations
- `renderModule` switch-case function
- The edit mode banner
- The entire module grid rendering block
- `containerVariants` / `itemVariants` framer-motion stagger (replace with simpler fade-in)

### Section Labels
Each section group gets a small label above it matching the reference style:
```tsx
<div className="flex items-center gap-3 mb-3">
  <span className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.3)]">
    System Overview
  </span>
  <div className="flex-1 h-px bg-[rgba(0,180,255,0.06)]" />
</div>
```

### Simplified Data Flow
Instead of the `renderModule` switch and display mode toggle system, each widget is rendered directly with its props. The `displayMode` / `onToggleDisplayMode` pattern stays in the widgets (NeuralPanel already supports it), but the orchestration through `useModuleLayout` is removed.

---

## Step 3: Adjust NeuralPanel for Pixel-Perfect Match

**File: `src/components/home/NeuralPanel.tsx`** -- Minor tweaks

- Ensure border-radius is exactly `4px` (already done via inline style)
- Ensure box-shadow includes the `inset 0 1px 0 rgba(0,212,255,0.06)` component (already done)
- Adjust body padding from `px-5 py-4` to `px-5 py-3` for slightly tighter spacing matching reference
- Ensure the top-edge gradient line is always rendered (already done)
- No other changes needed -- NeuralPanel is already aligned

---

## Step 4: Background & Ambient -- Final Pass

**File: `src/pages/Home.tsx`** -- Background section stays identical:
- Two-gradient background system (already implemented)
- Global scanline overlay (already implemented)
- `max-w-5xl` container (already implemented)
- Change `space-y-4` between sections to use explicit section groups with `space-y-6` between groups and `gap-3` within grids

---

## Step 5: Responsive Grid

The 2-column grid layout uses:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
```
- On mobile: full width single column
- On desktop: strict 2-column with 12px gap
- Each widget inside fills its grid cell height

---

## Technical Summary

### Files Deleted (13 files)
- `src/components/home/ModuleGrid.tsx`
- `src/components/home/ModuleCard.tsx`
- `src/components/home/ModuleManager.tsx`
- `src/components/home/DashboardWidgetShell.tsx`
- `src/components/home/ActionModuleCard.tsx`
- `src/components/home/HudActionButton.tsx`
- `src/components/home/NextMilestoneCard.tsx`
- `src/components/home/TodaysFocusMessage.tsx`
- `src/components/home/hero/NoiseOverlay.tsx`
- `src/components/home/hero/CurrentRankBadge.tsx`
- `src/components/home/hero/XPProgressBar.tsx`
- `src/hooks/useModuleLayout.ts`
- `src/components/home/hero/motion-variants.ts` (if unused elsewhere)

### Dependencies Removed
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

### Files Modified (2)
- `src/pages/Home.tsx` -- major rewrite: static layout, no DnD, no module config
- `src/components/home/hero/index.ts` -- remove exports for deleted files

### Files Unchanged
- `src/components/home/NeuralBar.tsx`
- `src/components/home/NeuralPanel.tsx`
- `src/components/home/QuickActionsBar.tsx`
- `src/components/home/hero/HeroSection.tsx`
- `src/components/home/hero/SmartProjectHeader.tsx`
- `src/components/home/hero/MissionRandomizer.tsx`
- `src/components/home/hero/ActiveMissionCard.tsx`
- `src/components/home/hero/DeadlineSelector.tsx`
- `src/components/home/hero/InsightCard.tsx`
- All 7 widget modules (ProgressOverview, FocusGoals, Habits, ProgressByDifficulty, CostTracking, PactTimeline, AchievementsWidget)
- `src/components/home/GettingStartedCard.tsx`
- `src/components/home/LockedModulesTeaser.tsx`
- All hooks except `useModuleLayout`
