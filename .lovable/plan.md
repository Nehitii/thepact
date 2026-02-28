

# /Home Page: Complete Cyberpunk Premium Redesign

## Part 1 -- The Audit

### A. Clutter & Cognitive Overload

1. **Hero Section is a vertical monster**: PactVisual + pact name + mantra + SmartProjectHeader (collapsible Nexus AI panel) + Rank Panel (with scanlines, grid overlay, corner accents, glow lines, diamond ticks) + QuickActionsBar + MissionRandomizer. That is **6 stacked blocks** before any module grid content even appears.

2. **Rank Panel is over-decorated**: Corner triangles, scanlines, grid texture, ambient glow, top glow line, bottom glow line, diamond icon -- all competing for attention inside a single 200px panel. The `clip-path: polygon(...)` chamfered shape adds visual noise.

3. **QuickActionsBar is a dense terminal block**: Scanlines, "tension line," separator with pulsing dots, `0x1A`/`0x2B` system codes, `INIT_SEQ` labels, hatched "danger zone" patterns for locked modules. This is a 4-button navigation widget wearing the UI complexity of a full page.

4. **DashboardWidgetShell applies ~12 decorative layers per widget**: Dot-grid texture, ambient hover glow, 4 corner brackets, tech chip dots (top-right), module ID tag (bottom-left), separator line, accent vertical bar on expansion. With 6-8 visible modules, this means **70-90 decorative DOM elements** rendering simultaneously.

5. **ActionModuleCard has its own 6-color theme system**: Each card renders glow, gradient, inner border, icon glow, icon drop-shadow, and 4 corner brackets. These overlap with the DashboardWidgetShell decorations since ActionModuleCards are rendered *inside* ModuleCards.

6. **Every component defines its own visual language**: HeroSection uses `clip-path` parallelograms, QuickActionsBar uses terminal/scanline aesthetic, DashboardWidgetShell uses dot-grid + corner brackets, ActionModuleCard uses glow + gradient cards. No unified panel system.

7. **Redundant backgrounds**: The page itself renders 3 radial gradients, a 4rem grid overlay, a noise texture, and a gradient veil. Then CyberBackground (if present) adds more. Individual widgets add their own textures on top.

### B. Layout Problems

8. **`flex-wrap gap-6` grid is unpredictable**: ModuleGrid uses flexbox with `w-[calc(50%-0.75rem)]` widths. This creates jagged rows when modules have different heights (min-height 280px shell, but content varies wildly).

9. **max-w-6xl (1152px) is too wide**: Content feels spread thin on large screens, especially half-width modules that end up ~550px wide with sparse content inside.

10. **No visual grouping**: All modules sit at the same hierarchy level. Progress Overview, Focus Goals, Habits, Timeline, Cost Tracking, Achievements, and 4-6 action modules all compete equally.

---

## Part 2 -- The Concept: "NEXUS OS" Premium Dashboard

### Vision
A dark, restrained command center inspired by your reference file's `NEXUS OS` aesthetic: deep void blacks (`#020407` to `#060b16`), a single-accent color system (cyan as primary, amber as warning only), extreme negative space, and information revealed progressively through interaction rather than displayed all at once.

### Color Palette (strict)
```text
Background Void:    #020407 (near-black with blue undertone)
Panel Surface:      rgba(6, 11, 22, 0.92) with backdrop-blur
Border Default:     rgba(0, 180, 255, 0.10)
Border Active:      rgba(0, 210, 255, 0.30)
Accent Primary:     #00d4ff (cyan) -- used SPARINGLY
Accent Warning:     #ff8c00 (amber) -- deadline/urgency only
Accent Success:     #00ff88 (green) -- completion states only
Text Primary:       #ddeeff (icy white-blue)
Text Secondary:     rgba(160, 210, 255, 0.45)
Text Muted:         rgba(160, 210, 255, 0.25)
```

### Typography Rules
- **Orbitron**: Page title only, very sparingly for section labels (always `text-[10px]` or `text-[11px]` with heavy tracking)
- **Exo 2 or Rajdhani**: All body text, labels, subtitles
- **Share Tech Mono / font-mono**: Numbers, data points, percentages, XP values, tags -- always monospace for data

### Layout: 3-Zone Vertical Stack
```text
+--------------------------------------------------+
|              ZONE 1: IDENTITY BAR                 |
|  PactVisual(sm) | Name | Mantra | Rank+XP inline |
+--------------------------------------------------+
|              ZONE 2: COMMAND STRIP                |
|  [New Goal] [Tasks] [Journal] [Health] | Mission  |
+--------------------------------------------------+
|              ZONE 3: DATA GRID                    |
|  CSS Grid, 12-col, uniform card height            |
|  +----------+ +----------+ +----------+           |
|  | Progress | | Timeline | | Focus    |           |
|  +----------+ +----------+ +----------+           |
|  +----------+ +----------+ +----------+           |
|  | Difficulty| | Habits   | | Achieve  |           |
|  +----------+ +----------+ +----------+           |
+--------------------------------------------------+
```

### Panel Design: "Neural Panel" (replaces both DashboardWidgetShell and ActionModuleCard)

One universal panel component with these properties:
- `rounded-sm` (4px) -- sharp, not bubbly
- Background: `rgba(6, 11, 22, 0.92)` with `backdrop-blur-xl`
- Border: `1px solid rgba(0, 180, 255, 0.10)`, brightens to `0.30` on hover
- NO corner brackets, NO dot-grid textures, NO module ID tags
- Single subtle `box-shadow: 0 8px 48px rgba(0,0,0,0.9)` for depth
- Header: simple icon + label in one line, right-aligned action
- Body: generous padding (24px), content breathes

---

## Part 3 -- The Action Plan

### Step 1: Create the Unified Panel Component

**New file: `src/components/home/NeuralPanel.tsx`**

Replace both `DashboardWidgetShell` and `ActionModuleCard` with a single, minimal panel:
- Props: `title`, `icon`, `accentColor` (optional, defaults to cyan), `children`, `headerAction`, `onClick` (for action-type panels)
- Visual: Dark glass panel, 1px border, NO decorative layers
- Hover: border brightens from 10% to 30% opacity, faint top-edge highlight appears
- All data fonts use `font-mono` / `tabular-nums`
- Remove the 280px min-height constraint -- let content determine height

### Step 2: Flatten the Hero into an "Identity Bar"

**File: `src/components/home/hero/HeroSection.tsx`** (major rewrite)

Collapse the 6-block vertical stack into a compact horizontal identity bar:
- **Left**: PactVisual at `size="sm"` (48px), vertically centered
- **Center**: Pact name (text-xl, not text-6xl), mantra below in muted text
- **Right**: Current rank name + level badge + XP as a single-line monospace readout (e.g., `RANK: INITIATE // LVL 3 // 450/1200 XP`)
- A thin XP progress bar runs along the bottom edge of the entire bar (2px height, full width, no labels/ticks/orbs)
- **Remove**: The massive Rank Panel with all its decorations, the SmartProjectHeader/Pact Nexus (move to a collapsible section below), all scan-line overlays

The Pact Nexus AI panel becomes a **collapsible "System Status" strip** below the identity bar -- a single line showing the status dot + "Systems Optimal" text, clicking it expands the insights. This removes it from always consuming vertical space.

### Step 3: Redesign the Command Strip

**File: `src/components/home/QuickActionsBar.tsx`** (major rewrite)

Replace the heavy terminal block with a clean horizontal strip:
- A simple flex row of icon + label buttons: `[+ New Goal]` `[Tasks]` `[Journal]` `[Health]`
- Each button: transparent bg, thin border on hover, icon + uppercase 10px label
- Locked modules: Show as dimmed with a small lock icon, no danger zone hatching
- Remove: Scanlines, tension lines, system codes (`0x1A`), `INIT_SEQ`, pulsing separator dots
- The MissionRandomizer button integrates into this strip as a final item or sits directly below as a compact card

### Step 4: Simplify MissionRandomizer

**File: `src/components/home/hero/MissionRandomizer.tsx`**

The idle state is currently a full card with glow effects and a large dice icon. Simplify:
- **Idle**: A compact NeuralPanel with dice icon, "MISSION ROULETTE" label, and a "SPIN" button -- all in one row, not a centered column layout
- **Spinning**: Keep the slot reel but remove the scanlines overlay and the CRT RGB shift effect
- **Confirm**: Keep the amber target-locked state but remove the rotating spotlight, the 4 HUD corners, the grid background, and the radar scan line

### Step 5: Replace DashboardWidgetShell Usage

**Files: All module components** (ProgressOverviewModule, PactTimeline, FocusGoalsModule, HabitsModule, ProgressByDifficultyModule, CostTrackingModule, AchievementsWidget)

Switch all modules from `DashboardWidgetShell` to `NeuralPanel`. This immediately removes ~70 decorative DOM elements across the page. Adapt content:
- ProgressOverviewModule: Keep the concentric rings SVG, remove the inline status counts (defer to expanded view)
- PactTimeline: Simplify to a single progress bar + "X days left" readout
- FocusGoalsModule: Keep goal list, remove priority number badges (they add noise for 2-3 items)
- ProgressByDifficultyModule: Keep as-is, it's already clean
- CostTrackingModule: Keep as-is
- HabitsModule: Keep as-is

### Step 6: Implement CSS Grid Layout

**File: `src/components/home/ModuleGrid.tsx`**

Replace `flex-wrap` with a proper CSS Grid:
- `grid-template-columns: repeat(12, 1fr)` with `gap: 16px` (tighter than current 24px)
- Full modules: `grid-column: span 12`
- Half modules: `grid-column: span 6` (4 on mobile)
- Quarter modules: `grid-column: span 4` (6 on mobile)
- This creates perfectly aligned rows with no height mismatch issues

### Step 7: Reduce Page-Level Ambience

**File: `src/pages/Home.tsx`**

Replace the 5-layer background system with:
- A single very subtle radial gradient at top-center (`rgba(0, 80, 180, 0.05)`)
- The faint grid overlay at 2% opacity (keep but simplify to 60px spacing)
- Remove: The 3 animated pulse/float orbs, the noise texture, the gradient veil
- Reduce max-width from `max-w-6xl` to `max-w-5xl` (1024px) for tighter, more premium feel
- Reduce `space-y-10` to `space-y-6` to tighten vertical rhythm

### Step 8: Action Module Cards Simplification

**Files: `src/pages/Home.tsx`** (helper components at bottom)

Replace `ActionModuleCard` usage with `NeuralPanel` in `onClick` mode:
- Each action module becomes a clickable NeuralPanel with: icon + title + subtle right-arrow
- Remove: 6-color theme system, glow effects, gradient backgrounds, inner borders, 4 corner brackets per card
- The accent color is communicated through the icon color only (e.g., orange for The Call, amber for Finance)

### Step 9: Scanline & Texture Cleanup

**File: `src/index.css`** or inline styles

Remove all per-component scanline overlays. Add a single, page-level scanline effect:
- A `::after` pseudo-element on the page container
- `repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)`
- This provides the CRT feel once, globally, without 10+ copies stacking

### Step 10: Typography & Data Formatting Pass

**All modified files**

Apply consistent formatting:
- All numeric values: `font-mono tabular-nums` class
- All section labels: `text-[10px] font-orbitron uppercase tracking-[0.2em]` in `text-secondary` color
- All body text: `font-rajdhani` or default sans
- Maximum 2 font sizes per panel (label + value)
- Remove all `drop-shadow` on text -- use color opacity for hierarchy instead

---

## Technical Summary

### New Files
- `src/components/home/NeuralPanel.tsx` -- unified panel component

### Major Rewrites
- `src/components/home/hero/HeroSection.tsx` -- collapsed identity bar
- `src/components/home/QuickActionsBar.tsx` -- simplified command strip
- `src/components/home/ModuleGrid.tsx` -- CSS Grid replacement
- `src/pages/Home.tsx` -- reduced ambience, tighter layout

### Moderate Changes
- `src/components/home/hero/MissionRandomizer.tsx` -- simplified states
- All 7 widget modules -- switch from DashboardWidgetShell to NeuralPanel

### Files Retired (code removed, not deleted)
- `src/components/home/DashboardWidgetShell.tsx` -- replaced by NeuralPanel
- `src/components/home/ActionModuleCard.tsx` -- replaced by NeuralPanel onClick variant

### Unchanged
- All hooks, data logic, database schema
- ModuleManager, ModuleCard (edit mode overlay stays)
- GettingStartedCard, LockedModulesTeaser (minor style alignment only)
- CurrentRankBadge, XPProgressBar -- simplified inline rather than as standalone blocks

