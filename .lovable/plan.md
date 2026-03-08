

## Fix: Dynamic Countdown Panel Color Modes

The panel currently hardcodes red (`#ff1744`) everywhere regardless of time remaining. The phase logic already exists (lines 42-45) but colors don't follow it.

### Three Modes

Based on `remainingPct` (already computed):

| Mode | Condition | Primary Color | Label | Icon |
|------|-----------|--------------|-------|------|
| **Green (Stable)** | >75% remaining | `#00e676` (green) | STABLE | Shield/check |
| **Amber (Attention)** | 25-75% remaining | `#ffab00` (amber) | ATTENTION | Clock |
| **Red (Critique)** | <25% remaining | `#ff1744` (red) | CRITIQUE | Warning triangle |

### Changes (single file: `CountdownPanel.tsx`)

1. **Create a color config object** derived from `remainingPct` inside the `useMemo`:
   - `primary`, `primaryRgb`, `glowAlpha`, `icon` (shield vs clock vs triangle)
   - Disable `alertPulse` and `blink` animations in green/amber modes (or slow them down)

2. **Replace all hardcoded `#ff1744` / `rgba(255,23,68,...)` references** with the dynamic color values (~15 occurrences across inline styles)

3. **Adjust left panel**:
   - Green: shield icon, no pulse, label "NOMINAL"
   - Amber: clock icon, slow pulse, label "ATTENTION"  
   - Red: warning triangle, fast pulse + blink, label "ALERTE CRITIQUE"

4. **Progress bar gradient** adapts: green→green, green→amber, orange→red

5. **Corner brackets** color follows the mode

No structural/layout changes — purely swapping color values and icon based on the existing phase logic.

