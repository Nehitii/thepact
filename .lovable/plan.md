

# Health Module: Biometric HUD Redesign

## Audit Summary

### Current State
The Health module comprises **12 components** + 1 page orchestrator (`Health.tsx`). It uses a soft "emerald/teal" palette with standard `rounded-2xl` containers, basic `framer-motion` fades (`y: 20`), and Recharts for data visualization. The design system already has a Sci-Fi HUD foundation (Orbitron fonts, `--glow-cyan` variables, `cyber-scan` keyframes) but the Health module does **not** leverage any of it -- it uses its own emerald gradient aesthetic that feels disconnected from the rest of the app.

### Components to Redesign
| Component | Current State | Redesign Priority |
|-----------|--------------|-------------------|
| `Health.tsx` (page layout) | Standard flex/grid, emerald ambient blobs | Full HUD layout overhaul |
| `HealthScoreCard.tsx` | Simple SVG circle progress ring | Segmented Radar Disk |
| `HealthMetricCard.tsx` | Rounded cards with basic hover scale | Chamfered HUD panels with scan lines |
| `HealthDailyCheckin.tsx` | Standard dialog with sliders | System Init Sequence |
| `HealthEnergyCurve.tsx` | Basic Recharts LineChart | Vital Sign Monitor with pulse dot |
| `HealthWeeklyChart.tsx` | Bar chart with emerald colors | HUD bar chart with cyan/amber palette |
| `HealthBMIIndicator.tsx` | Gradient bar with dot marker | Tactical gauge |
| `HealthStreakBadge.tsx` | Fire icon with tier colors | Retains structure, palette shift |
| `HealthInsightsPanel.tsx` | Simple card list | Terminal-style output |
| `HealthHistoryChart.tsx` | Recharts multi-line chart | Palette shift + HUD frame |
| `HealthChallengesPanel.tsx` | Card list | HUD frame + palette shift |
| `HealthBreathingExercise.tsx` | Breathing circles in dialog | Minor palette shift |
| `HealthMoodSelector.tsx` | Emoji buttons | Palette shift on borders |

---

## Phase 1: Global Design System Extensions

### 1.1 New CSS Variables (in `src/index.css`)

Add Health HUD-specific variables to both `:root` and `.dark`:

```text
/* Health Biometric HUD */
--hud-health-bg: 210 100% 2%;
--hud-phosphor: 187 100% 50%;      /* #00F2FF */
--hud-amber: 43 100% 50%;           /* #FFB800 */
--hud-health-surface: 210 60% 6%;
--hud-health-border: 187 80% 30%;
```

### 1.2 New Tailwind Keyframes & Animations (in `tailwind.config.ts`)

```text
keyframes:
  "hud-scan": sweeps a thin horizontal line top-to-bottom over 6s
  "hud-flicker": brief opacity jitter (1 -> 0.92 -> 1) over 0.15s
  "hud-assemble": clip-path reveal from left (0% width -> 100%) over 0.6s
  "pulse-dot": scale 1 -> 1.8 -> 1 with opacity over 1.5s

animations:
  "hud-scan": "hud-scan 6s linear infinite"
  "hud-flicker": "hud-flicker 0.15s ease-in-out"
  "hud-assemble": "hud-assemble 0.6s ease-out forwards"
  "pulse-dot": "pulse-dot 1.5s ease-in-out infinite"
```

### 1.3 The `HUDFrame` Reusable Component

Create `src/components/health/HUDFrame.tsx` -- a wrapper that provides:
- A `backdrop-blur-md` semi-transparent background (`bg-[hsl(210,60%,6%)]/80`)
- Four absolute-positioned corner brackets (L-shaped SVG or border tricks) in phosphor cyan
- An optional scan line overlay (`::after` pseudo-element with `animate-hud-scan`)
- A 45-degree chamfer on top-left and bottom-right corners via CSS `clip-path: polygon(...)`
- Props: `children`, `className`, `scanLine?: boolean`, `glowColor?: string`

### 1.4 Palette Shift Utility

All emerald/teal references across the Health module will be replaced:
- `emerald-500` -> phosphor cyan `[#00F2FF]` or `cyan-400`
- `teal-500` -> `cyan-500`
- Warning/stress colors -> `[#FFB800]` amber accent
- Background blobs -> dark void gradients with cyan radial glows

---

## Phase 2: Page Layout (`Health.tsx`)

### 2.1 Ambient Background Overhaul
Replace the emerald blobs and soft grid with:
- A very dark base (`bg-[#020617]`)
- A subtle animated grid overlay using phosphor cyan lines at 10% opacity
- A radial gradient glow at page center in cyan at 5% opacity
- An optional slow `animate-hud-scan` line across the entire page

### 2.2 Header Redesign
- Replace the emerald gradient icon container with a `HUDFrame` mini-panel
- Title: keep `font-orbitron`, change gradient to `from-[#00F2FF] to-cyan-300`
- Action buttons: replace `border-emerald-500/30` with `border-[#00F2FF]/30` and matching hover states

### 2.3 Layout Structure
Keep the existing grid structure but wrap major sections in `HUDFrame` where appropriate.

---

## Phase 3: Component-Specific Redesigns

### 3.1 `HealthScoreCard` -- Segmented Radar Disk

**Current**: Single SVG circle with stroke-dashoffset animation.

**New design**:
- Replace the single progress ring with a **multi-ring orbital display**
- **Center**: Large score number in `font-orbitron` with phosphor cyan color
- **Inner ring** (r=60): Overall health score arc
- **Middle ring** (r=72): Sleep factor arc in blue
- **Outer ring** (r=84): Activity factor arc in cyan, Stress factor arc (inverted) in amber
- Each ring uses `stroke-dasharray` segments with gaps between them
- Add a slow `rotate` animation on the outer ring (360deg over 30s)
- Wrap the entire card in `HUDFrame`
- Replace emerald color references with phosphor cyan

### 3.2 `HealthMetricCard` -- Chamfered HUD Panels

**Current**: `rounded-2xl` cards with basic `whileHover: scale(1.02)`.

**New design**:
- Wrap each card in `HUDFrame` (which provides the chamfered clip-path and corner brackets)
- Replace `colorVariants` to use the new palette:
  - blue stays blue
  - green -> `[#00F2FF]` (phosphor cyan)
  - purple -> `[#FFB800]` (amber) for stress
  - cyan -> cyan (unchanged)
  - orange -> orange (unchanged)
- Add a scan line overlay that triggers once on mount (via `HUDFrame scanLine`)
- Replace `whileHover: scale(1.02)` with a subtle border glow intensification
- Display the raw telemetry value (`todayValue`) as a small `font-mono` readout below the title (e.g., "RAW: 4") alongside the processed `/5` display to increase the technical feel
- Progress bar: replace `rounded-full` with flat-ended bar (`rounded-none`) and add tick marks at 20/40/60/80/100%

### 3.3 `HealthDailyCheckin` -- System Initialization Sequence

**Current**: Standard `Dialog` with step-by-step sliders.

**New design**:
- Dialog border: `border-[#00F2FF]/30` instead of `border-emerald-500/20`
- Step indicator: replace the dot progress with a horizontal **system boot sequence** bar showing `STEP 01/07 :: SLEEP TELEMETRY` in `font-mono` uppercase
- Labels: add a typewriter entrance animation (characters appear one by one over 0.3s) using a simple framer-motion `staggerChildren` on individual `<span>` letters for the step title only
- Slider: add cyan track color and a glowing thumb
- Quality buttons: replace `rounded-lg` with chamfered shape, use `border-[#00F2FF]/40` for selected state
- Final submit button: glowing cyan with `animate-neon-pulse`

### 3.4 `HealthEnergyCurve` -- Vital Sign Monitor

**Current**: Basic Recharts `LineChart` with amber stroke.

**New design**:
- Wrap in `HUDFrame`
- Change line stroke to phosphor cyan `#00F2FF`
- Add a custom animated dot component (`activeDot`) that uses `animate-pulse-dot` to simulate a traveling pulse
- Add a faint horizontal reference line at y=3 (labeled "BASELINE" in `font-mono`)
- Grid lines: use `stroke="#00F2FF"` at 5% opacity
- Background: add a very faint ECG-style grid pattern

### 3.5 `HealthWeeklyChart` -- HUD Bar Chart

- Wrap in `HUDFrame`
- Replace emerald accent with cyan
- Bar colors: blue, cyan, amber (for stress)
- Legend: use `font-mono` labels
- Today indicator: replace the small dot with a downward-pointing cyan triangle

### 3.6 `HealthBMIIndicator` -- Tactical Gauge

- Wrap in `HUDFrame`
- Replace the rounded gradient bar with a flat segmented gauge
- Position indicator: replace the thin line with a diamond marker
- Labels in `font-mono`

### 3.7 `HealthInsightsPanel` -- Terminal Output

- Wrap in `HUDFrame`
- Prefix each insight with `> ` in `font-mono` to simulate terminal output
- Generate button: glowing cyan outline
- Loading state: replace spinner with blinking cursor `_` animation

### 3.8 Other Components (Palette Shift Only)

- `HealthHistoryChart`: wrap in `HUDFrame`, replace emerald with cyan
- `HealthChallengesPanel`: wrap in `HUDFrame`, replace amber glow
- `HealthBreathingExercise`: replace teal gradients with cyan
- `HealthStreakBadge`: keep tier system, replace emerald tier color with cyan
- `HealthMoodSelector`: replace emerald border on "good" mood with cyan
- `HealthDataExport`: minor button color shift

---

## Phase 4: Typography Enforcement

The global CSS already enforces `font-orbitron` on headings and labels. For the Health module specifically:
- All **numerical values** (scores, counts, hours): `font-orbitron`
- All **secondary labels** (descriptions, units, "RAW:", "BASELINE"): `font-mono` with `uppercase tracking-wider text-[10px]`
- This is done per-component in the JSX `className` -- no global override needed

---

## Implementation Order

1. **Tailwind config + CSS variables** -- foundation (no visual breakage)
2. **`HUDFrame` component** -- reusable wrapper
3. **`Health.tsx` page layout** -- background + header palette shift
4. **`HealthScoreCard`** -- most visually impactful, centerpiece
5. **`HealthMetricCard`** -- 5 instances, high visibility
6. **`HealthDailyCheckin`** -- system init sequence UX
7. **`HealthEnergyCurve`** -- vital sign monitor
8. **`HealthWeeklyChart`** -- bar chart palette shift
9. **Remaining components** -- `HealthBMIIndicator`, `HealthInsightsPanel`, `HealthHistoryChart`, `HealthChallengesPanel`, `HealthBreathingExercise`, `HealthStreakBadge`, `HealthMoodSelector`, `HealthDataExport`

---

## Files Created
- `src/components/health/HUDFrame.tsx`

## Files Modified
- `tailwind.config.ts` (new keyframes + animations)
- `src/index.css` (new CSS variables)
- `src/pages/Health.tsx`
- `src/components/health/HealthScoreCard.tsx`
- `src/components/health/HealthMetricCard.tsx`
- `src/components/health/HealthDailyCheckin.tsx`
- `src/components/health/HealthEnergyCurve.tsx`
- `src/components/health/HealthWeeklyChart.tsx`
- `src/components/health/HealthBMIIndicator.tsx`
- `src/components/health/HealthInsightsPanel.tsx`
- `src/components/health/HealthHistoryChart.tsx`
- `src/components/health/HealthChallengesPanel.tsx`
- `src/components/health/HealthBreathingExercise.tsx`
- `src/components/health/HealthStreakBadge.tsx`
- `src/components/health/HealthMoodSelector.tsx`
- `src/components/health/HealthDataExport.tsx`
- `src/components/health/index.ts` (add HUDFrame export)

## What Does NOT Change
- Hook logic (`useHealth.ts`, `useHealthStreak.ts`, `useHealthChallenges.ts`, `useHealthReminders.ts`)
- Database schema and RLS policies
- i18n keys and translations
- Data flow and API calls
- `HealthSettingsModal` (settings form -- functional, not visual showcase)

