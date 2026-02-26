

# Health Module: Visual & UX Enhancement

## Current Issues Identified

1. **Header is left-aligned** -- title, action buttons (CSV, Breathing, Check-in, Settings) are spread across a `justify-between` flex row, feeling disconnected
2. **Excessive vertical scrolling** -- 8 full-width sections stacked linearly: Score Hero, BMI, 5 Metric Cards (3-col grid), Weekly Chart, Energy Curve, AI Insights, History+Challenges (2-col). On a 1080p screen, requires ~3 full scrolls
3. **Low panel visibility** -- HUDFrame panels use very low-contrast borders (`borderColor + "40"` = 25% opacity), making them nearly invisible against the dark background
4. **Animations are minimal** -- only basic `y: 20` fade-ins and a single slow scan line; no entrance personality
5. **Too much information displayed at once** -- metric cards show title, description, raw value, weekly average, progress bar, and tick marks simultaneously. The disclaimer text is repeated 3 times on-page

## Plan

### 1. Center the Header & Consolidate Actions into a Command Bar

Restructure the header section in `Health.tsx`:
- **Center the title** block (icon + "HEALTH & BALANCE" + subtitle) using `text-center` and `flex-col items-center`
- **Create a "Command Bar"** below the title: a single HUDFrame strip containing all 4 actions (Export CSV, Breathing, Daily Check-in, Settings) as icon-only buttons with tooltips, plus the Streak badge. This reduces header height by ~40% and looks like a HUD toolbar
- Remove the separate scattered button layout

### 2. Reduce Scrolling: Tabbed Section System

Replace the linear stack of 8 sections with a **tabbed layout** using 3 tabs:

- **"OVERVIEW" tab** (default): Health Score card + Metric Cards grid + BMI (if enabled). This is the primary dashboard view -- everything at a glance
- **"ANALYTICS" tab**: Weekly Chart + Energy Curve + History Chart. All the chart/trend visualizations grouped together
- **"INTEL" tab**: AI Insights + Weekly Challenges. Action-oriented content

This reduces the visible content by ~65% per view and eliminates scrolling for most screen sizes. Use the existing Radix `Tabs` component with HUD-styled tab triggers (chamfered, `font-mono`, phosphor cyan active state).

### 3. Enhance HUDFrame Visibility

In `HUDFrame.tsx`:
- Increase border opacity from `40` (25%) to `80` (50%) in the `boxShadow` inset
- Add an outer glow: `0 0 30px ${borderColor}15` for subtle ambient edge lighting
- Add a faint top-edge highlight line: a 1px gradient border on the top edge (`linear-gradient(90deg, transparent, ${borderColor}60, transparent)`) to catch the eye
- Make corner bracket lines slightly thicker (2px to 3px) and brighter

### 4. Enhance Animations

**Staggered entrance**: In `Health.tsx`, wrap the metric cards grid in a `staggerChildren: 0.08` container so cards build in sequence rather than all appearing at once.

**HUD assemble on tab switch**: When switching tabs, the new content uses the existing `hud-assemble` animation (clip-path reveal from left) instead of a basic fade.

**Score card ring glow pulse**: Add a subtle repeating glow pulse on the inner score ring (`filter: drop-shadow`) that breathes every 3 seconds.

**Metric card hover**: Replace the current `whileHover: y: -4` with a border glow intensification -- the HUDFrame border brightens from 50% to 100% opacity on hover, creating a "selected terminal" effect.

### 5. Simplify Metric Cards for Readability

In `HealthMetricCard.tsx`:
- Remove the `description` text line (the title is self-explanatory: "Sleep", "Activity", etc.)
- Remove the `RAW: X` telemetry readout (it duplicates the main value)
- Keep only: icon, title, main value, and the progress bar with weekly average
- This cuts card height by ~30%

### 6. Remove Redundant Disclaimer

The disclaimer ("This module provides personal wellness awareness only...") currently appears:
- In HealthScoreCard (factors section)
- In HealthBMIIndicator (as a full box)
- In the page footer

**Action**: Keep it only in the page footer. Remove from HealthScoreCard and HealthBMIIndicator.

### 7. Add Cyberpunk Details

- **Flickering data points**: When metric card values are "0" or "---" (no data), apply `animate-hud-flicker` to make them visually "unstable" like an unsynced signal
- **Scan line on tab switch**: Trigger a single scan line sweep across the entire content area when switching tabs
- **Corner decorations on page**: Add small decorative "crosshair" SVG marks at the four corners of the main content area (purely cosmetic, pointer-events-none)
- **Hexagonal grid subtle overlay**: Replace the current square grid background with a hexagonal pattern for a more futuristic feel

---

## Technical Implementation

### Files Modified
- `src/pages/Health.tsx` -- header centering, tab system, stagger animations, crosshair decorations
- `src/components/health/HUDFrame.tsx` -- increased border visibility, top highlight, brighter corners
- `src/components/health/HealthMetricCard.tsx` -- simplified layout (remove description + RAW)
- `src/components/health/HealthScoreCard.tsx` -- remove disclaimer, add ring glow pulse
- `src/components/health/HealthBMIIndicator.tsx` -- remove disclaimer box

### Files NOT Modified
- All hooks (useHealth, useHealthStreak, etc.) -- no logic changes
- Database schema -- no changes
- i18n files -- no new keys needed (reusing existing)
- HealthDailyCheckin, HealthSettingsModal, HealthBreathingExercise -- modal components stay as-is

