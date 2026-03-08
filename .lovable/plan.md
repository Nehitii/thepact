

# Light Mode Audit & Fix Plan

## Core Problem

The application was built "dark-first" with hundreds of **hardcoded dark colors** throughout — both in Tailwind classes and inline styles. In light mode, these create dark panels on light backgrounds, invisible text, and broken contrast everywhere.

## Scope of Issues

### Category 1: Hardcoded dark backgrounds (highest impact)
**~13 Home dashboard components** use inline `rgba(6,11,22,0.92)` backgrounds via both `style={}` and Tailwind arbitrary values. These are the backbone of the entire Home page:
- `NeuralPanel.tsx`, `NexusHeroBanner.tsx`, `RankPanel.tsx`, `CountdownPanel.tsx`, `QuickAccessPanel.tsx`, `QuickActionsBar.tsx`, `MonitoringGlobalPanel.tsx`, `DifficultyScalePanel.tsx`, `GettingStartedCard.tsx`, `LockedModulesTeaser.tsx`, `SmartProjectHeader.tsx`, `ActiveMissionCard.tsx`, `MissionRandomizer.tsx`

### Category 2: Hardcoded `bg-[#00050B]` page backgrounds
**7 pages**: `Admin.tsx`, `AdminMoneyManager.tsx`, `AdminModuleManager.tsx`, `AdminCosmeticsManager.tsx`, `AdminPromoManager.tsx`, `Legal.tsx`, `TheCall.tsx`

### Category 3: Hardcoded dark component backgrounds
- `AppSidebar.tsx`: `border-white/10`, `hover:bg-white/5`, `text-slate-400/500` — invisible in light mode
- `NotificationHub.tsx`: `bg-[#0a1525]/98`
- `ProfileBoundedProfile.tsx`: `bg-[#0a0a0f]`, gradient `from-[#050508]`
- `ProfileAccountSettings.tsx`, `PactIdentityCard.tsx`, `CustomDifficultyCard.tsx`, `ProjectTimelineCard.tsx`: All use `bg-[#010608]` inputs
- `GridViewGoalCard.tsx`, `SuperGoalGridCard.tsx`: `bg-[#09090b]`
- `CategoryGroup.tsx` (Finance): `from-[#0d1220] to-[#080c14]`
- `Inbox.tsx`: `bg-[#0a0f18]`, `bg-[#0f141e]`

### Category 4: Hardcoded text colors
- `Legal.tsx`: All text uses `text-[#6b9ec4]`, `text-[#8ACBFF]`, `text-[#a8c8e8]`, `text-[#c8e0f4]` — designed for dark backgrounds only
- `NeuralPanel.tsx`: `text-[rgba(160,210,255,0.65)]` — invisible on light bg
- `NewGoal.tsx`, `StepDetail.tsx`: `border-white/10` borders invisible in light mode

### Category 5: Sidebar theme incompatibility
`AppSidebar.tsx` uses `text-slate-400`, `hover:text-slate-100`, `hover:bg-white/5`, `via-white/10` — all designed for dark backgrounds.

---

## Implementation Strategy

Rather than making every component dual-themed with `dark:` prefixes (which would touch 500+ lines across 40+ files), the approach is:

### A. Create CSS custom properties for panel surfaces
Add light-mode-aware surface variables in `index.css` `:root` and `.dark` that replace the hardcoded `rgba(6,11,22,...)` values:

```css
:root {
  --panel-bg: 210 40% 97%;
  --panel-border: 200 50% 80%;
  --panel-shadow: 0 2px 12px hsla(210 20% 50% / 0.08);
  --panel-text-secondary: 210 30% 45%;
  --panel-text-tertiary: 210 20% 60%;
}
.dark {
  --panel-bg: 210 80% 5%;
  --panel-border: 200 60% 20%;
  --panel-shadow: 0 8px 48px rgba(0,0,0,0.9);
  --panel-text-secondary: 205 60% 70%;
  --panel-text-tertiary: 205 40% 50%;
}
```

### B. Create a reusable `.hud-surface` utility class
A single class that applies the correct bg/border/shadow for both themes, replacing `bg-[rgba(6,11,22,0.92)] backdrop-blur-xl border border-[rgba(0,180,255,0.08)]`.

### C. Update components in priority order

**Phase 1 — Foundation** (CSS variables + utility classes in `index.css`, tailwind config):
- Add panel surface variables for light/dark
- Add `.hud-surface` class

**Phase 2 — Home Dashboard** (13 components):
- Replace all inline dark backgrounds with theme-aware classes
- Replace hardcoded text colors with CSS variable references

**Phase 3 — Sidebar** (`AppSidebar.tsx`):
- Replace `text-slate-*`, `border-white/*`, `hover:bg-white/*` with theme-aware tokens (`text-muted-foreground`, `border-border`, `hover:bg-muted`)

**Phase 4 — Pages** (Admin, Legal, Inbox, TheCall, NewGoal, StepDetail):
- Replace `bg-[#00050B]` with `bg-background`
- Replace hardcoded text hex values with semantic tokens

**Phase 5 — Components** (Profile settings, Goals cards, Finance, Notifications):
- Replace `bg-[#010608]` inputs with `bg-input` or theme-aware alternatives
- Replace `bg-[#09090b]` card backgrounds with `bg-card`
- Replace `bg-[#0a0a0f]` with `bg-background`

**Phase 6 — Fine-tuning**:
- Verify `border-white/10` → `border-border` everywhere
- Verify `text-white` on conditional states still works (active tabs, etc.)
- Adjust glow/shadow intensities for light mode (subtler)

---

## Technical Details

**Estimated file changes**: ~40 files
- `index.css`: Add ~30 lines of light-mode panel variables
- 13 Home components: Replace bg/border/text
- 7 Admin/page files: Replace `bg-[#00050B]`  
- `AppSidebar.tsx`: Theme-aware nav styling
- 6 Profile components: Theme-aware inputs
- 5 other components: Card/modal backgrounds

**Risk**: Medium. The dark mode uses hardcoded values intentionally for pixel-perfect fidelity. The strategy preserves those exact values in `.dark {}` while providing proper light-mode alternatives. No visual change in dark mode.

**Constraint**: Per project memory, dark mode must NOT be touched. All changes use `:root` (light) overrides or `dark:` conditional classes that fall back to existing values.

