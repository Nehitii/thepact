
# Focus Page — Toolbar Consolidation Plan

## Current State
- **Top area**: Goal/Task linker (visible when idle)
- **Middle**: Timer ring
- **Bottom area**: Config (collapsible), Spotify player, Stats/History toggle buttons, and their panels

**Goal**: Move all secondary controls (Stats, History, Config, Spotify) into a compact toolbar row alongside the Goal/Task selector. Nothing below the timer.

---

## Proposed Layout

```text
┌──────────────────────────────────────────────────┐
│ FOCUS MODE Header                                │
├──────────────────────────────────────────────────┤
│ ┌─ Toolbar Row ─────────────────────────────────┐│
│ │ [Goal ▼] [Task ▼]  │  ⚙ Config │ 🎵 │ 📊 │ 📜││
│ └────────────────────────────────────────────────│
│                                                  │
│           ╭─────────────────────────╮            │
│           │      TIMER RING         │            │
│           │                         │            │
│           ╰─────────────────────────╯            │
│                                                  │
│   ┌── Expandable Panel (below timer) ──────────┐│
│   │ Shows: Config / Spotify / Stats / History  ││
│   │ (only one active at a time via tabs/icons) ││
│   └─────────────────────────────────────────────││
└──────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. New Component: `FocusToolbar.tsx`
- Single row containing:
  - **Goal/Task Selects** (inline, compact `h-8`)
  - **Icon buttons** for Config (⚙), Spotify (🎵), Stats (📊), History (📜)
  - Each icon toggles its panel — only one panel open at a time (radio behavior)
- Hidden entirely when `timer.isRunning` to keep focus clean

### 2. Refactor `Focus.tsx`
- Remove separate `FocusGoalLinker`, Spotify, Config, Stats/History toggle buttons from their current positions
- Add `<FocusToolbar />` below header
- Single `<AnimatePresence>` block below toolbar to render the active panel (Config | Spotify | Stats | History)
- During session: only Timer + linked item name visible

### 3. Panel Container
- Reuse existing panel components (`FocusStats`, `FocusHistory`, `SpotifyPlayer`)
- Add a Config panel component (extracted from current `Collapsible`)
- Animate panel swap with `motion.div` (fade + slide)

---

## Files Changed

| File | Action |
|------|--------|
| `src/components/focus/FocusToolbar.tsx` | **Create** — Consolidated toolbar with selects + icon toggles |
| `src/components/focus/FocusConfigPanel.tsx` | **Create** — Extracted config duration sliders |
| `src/components/focus/index.ts` | Update exports |
| `src/pages/Focus.tsx` | Refactor to use new toolbar + single panel area |

---

## UX Details
- **Icon buttons**: 28×28px, monochrome icons, active state = `bg-primary/20 text-primary`
- **Only one panel open**: clicking an icon closes others (radio toggle)
- **During session**: Toolbar hidden, only timer and linked item name visible
- **Spotify mini mode**: If Spotify panel is open and session starts, keep a minimal player floating (optional v2)
