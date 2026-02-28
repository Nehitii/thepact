

# Apply NEXUS OS v3-2 Reference Design to /Home

## What Changes

The current `/home` already has the "NEXUS OS" color system and NeuralPanel components from the previous redesign. However, it still diverges from the reference file in several key ways. This plan aligns it precisely with the v3-2 reference.

---

## Phase 1: Neural Bar (Sticky Top Status Bar)

**New component: `src/components/home/NeuralBar.tsx`**

The reference has a sticky 48px top bar that acts as a persistent status strip across the page. Currently, the Identity Bar (pact name + rank) sits inside the hero stack and scrolls away.

- Create a sticky bar (`position: sticky; top: 0; z-index: 100`) with height 48px
- Background: `rgba(2,4,10,0.97)` with `backdrop-blur(20px)`, bottom border `var(--border-bright)`
- Left side: Pact name in `font-orbitron` (small, 11px, uppercase, tracking-widest)
- Right side: Rank badge + XP readout in `font-mono` (e.g., `INITIATE // LVL 3 // 450 XP`)
- Animated scanline at the bottom: a 1px cyan gradient that sweeps left-to-right on a 4s loop (matching the reference's `@keyframes scanline`)
- This replaces the Identity Bar currently inside HeroSection

**File: `src/components/home/hero/HeroSection.tsx`**
- Remove Zone 1 (Identity Bar) entirely -- it moves to NeuralBar
- HeroSection now only contains: SmartProjectHeader, QuickActionsBar, MissionRandomizer

**File: `src/pages/Home.tsx`**
- Render `<NeuralBar>` above the main content area, outside the `max-w-5xl` container so it spans full width

---

## Phase 2: Panel System Upgrade -- Match Reference Exactly

**File: `src/components/home/NeuralPanel.tsx`**

The current NeuralPanel is close but needs refinement to match the reference's panel style:

- Add `inset 0 1px 0 rgba(0,212,255,0.06)` to the box-shadow (inner top highlight, from the reference's `--panel-shadow`)
- Change border-radius from `rounded-sm` (4px) to exactly `4px` via inline style for consistency with `--radius: 4px` in the reference
- Add a very faint top-edge gradient line (`h-px bg-gradient-to-r from-transparent via-cyan/15 to-transparent`) as a **permanent** element, not just on hover (the reference panels all have this)
- Header label size stays at 10px Orbitron but ensure tracking is `0.15em` (reference uses tighter tracking than current `0.2em`)

---

## Phase 3: SmartProjectHeader -- Tighten to Reference Style

**File: `src/components/home/hero/SmartProjectHeader.tsx`**

The Pact Nexus component uses `rounded-xl` and `border-primary/20` which doesn't match the strict 4px radius and thin border of the reference. Align it:

- Change `rounded-xl` to `rounded-[4px]`
- Change `border-primary/20` to `border-[rgba(0,180,255,0.12)]`
- Change `bg-black/40` to `bg-[rgba(6,11,22,0.92)]`
- Remove the internal scanline overlay (the page already has a global one)
- The brain icon container: simplify from `rounded-full border border-primary/30 bg-black/50` to a simpler inline icon without the glowing circle wrapper

---

## Phase 4: QuickActionsBar -- Reference "Command Buttons" Style

**File: `src/components/home/QuickActionsBar.tsx`**

Currently minimal, but the reference uses distinct bordered button groups. Update:

- Each button gets a consistent style: `bg-[rgba(6,11,22,0.92)]` panel background, `1px solid rgba(0,180,255,0.12)` border, `4px` radius
- On hover: border brightens to `rgba(0,210,255,0.4)`, subtle cyan glow appears
- The "New Goal" button gets a special treatment: `border-color: var(--cyan)` with a faint cyan box-shadow to make it the primary action
- Wrap all buttons in a single panel-like container (thin border strip) rather than individual floating buttons

---

## Phase 5: MissionRandomizer -- Clean Up to Match Reference

**File: `src/components/home/hero/MissionRandomizer.tsx`**

The MissionRandomizer's idle state uses `rounded-xl`, heavy gradients, and large padding that clash with the strict 4px-radius panel system.

- **Idle state**: Change `rounded-xl` to `rounded-[4px]`, use `bg-[rgba(6,11,22,0.92)]` instead of `bg-black/60`, use `border-[rgba(0,180,255,0.12)]` instead of `border-white/10`
- Remove the large pulsing glow behind the dice icon -- replace with a simple inline icon
- Change layout from centered column to a horizontal row: `[Dice icon] [Mission Roulette label] [SPIN button]`
- **Spinning state**: Change `rounded-xl` to `rounded-[4px]`, remove the CRT RGB scanline overlay
- **Confirm state**: Change `rounded-xl` to `rounded-[4px]`, remove the 4 HUD corners, remove the rotating spotlight, remove the radar scan line. Keep the amber color scheme but simplify to just the amber border + content
- **ActiveMissionCard**: Change `rounded-2xl` to `rounded-[4px]`, use the standard panel background

---

## Phase 6: Module Content Widgets -- Typography & Spacing Refinement

**Files: All widget modules**

Apply the reference's strict typography rules across all widgets:

- All `font-orbitron` labels: ensure `tracking-[0.15em]` (not 0.2em)
- All numeric values: ensure `font-mono tabular-nums` with `letter-spacing: -0.02em` (tighter for numbers)
- Section subtitle text: use `Exo 2` (the reference's body font) which maps to `font-sans` in the project
- Progress bars: standardize height to `3px` (the reference uses thinner bars than the current `h-1.5` / `h-2`)
- Inner sub-cards (like status breakdowns in ProgressOverview): use `bg-[rgba(6,11,22,0.6)]` instead of `bg-[rgba(0,180,255,0.03)]` for deeper nesting contrast (matching the reference's nested panel style)

---

## Phase 7: Background & Ambient -- Match Reference Exactly

**File: `src/pages/Home.tsx`**

The reference uses a very specific background setup:

- Body background: `#020407` (currently `bg-background` which should map to this already)
- Two subtle radial gradients:
  1. `radial-gradient(ellipse 100% 60% at 50% -5%, rgba(0,80,180,0.07), transparent 65%)` -- top center blue glow
  2. `radial-gradient(ellipse 50% 40% at 85% 70%, rgba(139,0,255,0.03), transparent 50%)` -- bottom right purple whisper
- Global scanline: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.022) 2px, rgba(0,0,0,0.022) 4px)` at z-index 9999, fixed position
- Remove the current grid overlay (the reference doesn't have one)
- Remove the single radial gradient blob -- replace with the two-gradient system above

---

## Phase 8: GettingStartedCard & LockedModulesTeaser -- Align

**File: `src/components/home/GettingStartedCard.tsx`**

- Change `rounded-lg` to `rounded-[4px]` throughout
- Change `border-2 border-accent/30` to `1px solid rgba(0,180,255,0.12)`
- Remove the nested inner border (`absolute inset-[2px]`)
- Use `bg-[rgba(6,11,22,0.92)]` instead of `bg-card/20`
- Step items: change `rounded-lg` to `rounded-[4px]`

**File: `src/components/home/LockedModulesTeaser.tsx`**

- Same border/radius/background alignment
- Change circular icon holders from `rounded-full` to `rounded-[4px]` (square with slight radius, matching the reference's sharp aesthetic)

---

## Phase 9: ModuleManager Edit Mode Bar -- Align

**File: `src/components/home/ModuleManager.tsx`**

- The floating edit toolbar uses `rounded-2xl` -- change to `rounded-[4px]`
- Change `border-2 border-primary/40` to `1px solid rgba(0,210,255,0.4)`
- Background: `bg-[rgba(2,4,10,0.97)]` with `backdrop-blur(20px)`
- The "Customize" trigger button: change `rounded-lg` to `rounded-[4px]`

---

## Phase 10: Tighten Layout Spacing

**File: `src/pages/Home.tsx`**

- Change `space-y-6` to `space-y-4` (tighter vertical rhythm matching the reference's denser layout)
- Change padding from `p-4 md:p-6` to `p-4 md:p-5` (slightly tighter)
- Keep `max-w-5xl` (1024px) as-is -- matches reference's container width

**File: `src/components/home/ModuleGrid.tsx`**

- Change `gap-4` to `gap-3` (12px, matching the reference's tighter grid)

---

## Technical Summary

### New Files
- `src/components/home/NeuralBar.tsx` -- sticky top status bar with pact name + rank

### Major Changes
- `src/pages/Home.tsx` -- NeuralBar integration, background system, spacing
- `src/components/home/hero/HeroSection.tsx` -- remove Identity Bar (moved to NeuralBar)
- `src/components/home/hero/MissionRandomizer.tsx` -- simplify all 3 states
- `src/components/home/hero/ActiveMissionCard.tsx` -- radius + panel style alignment

### Moderate Changes
- `src/components/home/NeuralPanel.tsx` -- inner shadow, permanent top highlight, tracking
- `src/components/home/hero/SmartProjectHeader.tsx` -- radius + border alignment
- `src/components/home/QuickActionsBar.tsx` -- panel container style
- `src/components/home/GettingStartedCard.tsx` -- full style alignment
- `src/components/home/LockedModulesTeaser.tsx` -- style alignment
- `src/components/home/ModuleManager.tsx` -- radius + border alignment
- `src/components/home/ModuleGrid.tsx` -- tighter gap

### Minor Typography Pass
- All widget modules (ProgressOverview, FocusGoals, Habits, Timeline, CostTracking, ProgressByDifficulty, AchievementsWidget) -- tracking, bar height, nested card background adjustments

### Unchanged
- All hooks, data logic, database schema
- PactVisual component (already clean)
- ModuleCard drag-and-drop logic

