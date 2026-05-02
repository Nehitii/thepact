
# Pacte OS — Visual & UX Consistency Audit

Based on a deep crawl of design tokens (`design-tokens.css`, `index.css` 3024 lines), all `src/components/ui/*` primitives, the 6 active “design dialects” (Prism, Nexus, Aura, HUD, Journal, DS, TCG), and ~130 page/feature components.

The product is **rich and visually ambitious**, but it is currently 6 design systems wearing one logo. The audit below quantifies the friction and proposes a 3-sprint convergence plan toward the canonical **DS (Pacte OS)** kit already started in `src/components/ds/`.

---

## 1. Findings — Visual Frictions Inventory

### 1.1 Design system fragmentation (CRITICAL)
Six parallel “dialects” coexist, each with its own panel, badge, divider, tooltip and background:

| Dialect | Scope | Files | Status |
|---|---|---|---|
| **DS** (`ds-*`) | Canonical, partially adopted | 8 primitives | Source of truth |
| **Prism** (`Prism*`) | Analytics module | 23 components | Duplicate of DS |
| **Nexus** (`nexus-*`) | Home + sidebar | tokens + 4 panels | Duplicate of DS |
| **Aura** (`Aura*`) | Finance | 3 components | Duplicate of DS |
| **HUD** (`hud-*`, `HUDFrame`) | Health | 1 frame + tokens | Duplicate of DS |
| **Journal** (`journal-*`) | Chronolog | own tokens | Duplicate of DS |
| **TCG** (`tcg-*`) | Goal cards | utilities | Specialized, keep |

Result: same visual intent (a panel with corner brackets) is implemented 5 different ways, each with slightly different shadow, padding, radius and hover state.

### 1.2 Border-radius — 8 values in active use
```
rounded-full   379   rounded-2xl    81
rounded-xl     325   rounded-none   40
rounded-lg     248   rounded-3xl    13
rounded-sm     116   rounded-md     88
```
DS tokens define **only 4 radii** (`xs 2 / sm 4 / md 6 / lg 10`). Tailwind `rounded-xl` (12px) is the most-used utility yet **is not a DS token**. Inputs use `rounded-xl`, Buttons use `rounded-sm`, Cards use `rounded-md`, Dialogs use `rounded-lg`, KPIs/avatars use `rounded-2xl` — every primitive has a different curvature.

### 1.3 Box-shadows — 60+ unique custom values
A non-exhaustive count of `shadow-[…]` tokens shows ~60 distinct hand-tuned glows (`0_0_8px`, `0_0_12px`, `0_0_15px`, `0_0_20px`, `0_0_24px`, `0_0_30px`, etc.) using **5 different ways to express the same primary cyan**: `rgba(91,180,255,…)`, `hsl(var(--primary)/…)`, `rgba(var(--primary),…)`, `hsl(var(--ds-accent-primary)/…)`, `hsla(200,100%,…)`. No semantic glow scale exists.

### 1.4 Typography hierarchy is broken
- **25 different text sizes** in active use, including arbitrary pixel hops `text-[7px] / [8px] / [9px] / [10px] / [11px] / [12px] / [13px] / [15px] / [17px] / [22px] / [26px] / [100px] / [120px] / [140px]`.
- Headings: `Card.Title` is 20px gradient cyan, `ModuleHeader` is `clamp(24,5vw,48)`, `DialogTitle` is `text-lg` plain — all are H-level but visually unrelated.
- Fonts: `font-mono` (633), `font-orbitron` (394), `font-rajdhani` (321) — Rajdhani is the body default, yet `font-rajdhani` is explicitly applied 321 times because some component overrides reset it.
- The DS 4-role scale (`ds-text-display / metric / label / body`) exists but is barely used outside the new `ds/` folder.

### 1.5 Buttons and inputs speak different languages
- **Button** (`button.tsx`): always Orbitron uppercase, neon glow with shimmer sweep, `rounded-sm`, default size 40px, custom variants (`hud`, `hud-primary`, `hud-success`, `hud-critical`) live alongside shadcn variants — 9 variants total, no semantic guidance on when to use which.
- **Input** (`input.tsx`): 44px tall, **`rounded-xl`** (12px — doesn't match button), heavy backdrop-blur, hard-coded `hsl(210 80% 8% / 0.9)` (bypasses tokens).
- Mismatch: a form with a Button next to an Input shows a 4px-corner pill against a 12px-corner field. Visually disconnected.

### 1.6 Spacing rhythm has no scale
Top spacing utilities by frequency: `gap-2 (548), gap-1 (294), gap-3 (283), p-4 (194), p-1 (158), p-2 (139)`. The DS tokens define `pad-tight/cozy/loose` (12/16/20px) but the codebase ignores them. Pages alternate freely between `p-3`, `p-4`, `p-6`, `space-y-2/3/4`, with no pattern by hierarchy.

### 1.7 Empty / loading / error states are 5 systems
- `CyberEmpty` (28 uses) — animated dots, glitch terminal style
- `EmptyState` (8 uses) — calm centered icon
- `PrismEmptyCTA` (3 uses) — Analytics-only
- Hand-rolled `<div>Aucun…</div>` and `<div>Vide…</div>` (27 uses combined)
- Loaders: `CyberLoader`, raw `animate-spin` borders, `Skeleton` (1-line shadcn default with `rounded-md bg-muted`), `DSSkeleton`, `PrismSkeleton`, `GoalsSkeleton`

A user moving from Goals → Analytics → Health sees three completely different "loading" visuals.

### 1.8 Iconography
- ✅ **lucide-react is exclusive** (286 files import it, zero competing libraries).
- ⚠️ **Stroke width is inconsistent**: explicit values found include `0.5, 1, 1.25, 1.5, 2 (default), 2.5, 3`. A nav using `1.5` next to a tab using `2` next to a metric using `2.5` reads as different icon families.
- ⚠️ **Sizes**: button slot is locked to `size-4` (16px), but free-floating icons use `w-3, w-4, w-5, w-6, w-8, w-10, w-12` ad-hoc.

### 1.9 Feedback — toast usage is inconsistent
267 toast calls: `toast()` 121, `toast.error` 80, `toast.success` 64, `toast.info` 2, `toast.warning` 0. The bare `toast()` calls bypass the semantic variant — mutations that succeeded and ones that failed look identical to the user in 45% of cases.

### 1.10 Animations / micro-interactions
Transition durations in use: `300 (86), 200 (81), 500 (34), 100 (27), 150 (11), 700 (10), 75 (3)` — 7 different speeds for similar interactions. Hover, focus, active, and state-change animations have no published timing scale.

### 1.11 Card composition
`<Card>` exists with two variants (`default`, `clean`), but the codebase mostly **ignores it** in favor of ad-hoc `<div className="rounded-xl bg-… border …">` blocks (the search shows DSPanel, PrismPanel, NexusPanel, AuraWidget, HUDFrame, raw divs all coexisting). The shadcn `Card` is effectively dead code in many modules.

### 1.12 Module headers
`ModuleHeader` is the standard (per memory), but Analytics (Prism), Health (HUDFrame), Finance (Aura) and Journal (custom) all roll their own header. Result: **the page title looks different on every module** — different orb, different system label format, different badge shape.

---

## 2. Prioritized Action Plan

Three sprints (~1 week each). Each sprint is independently shippable and visually testable. No new feature work, only consolidation.

### Sprint 1 — Tokens & Primitives (foundation, high impact, low risk)

1. **Extend DS tokens** in `design-tokens.css`:
   - Add `--ds-radius-pill: 9999px` and **deprecate `rounded-xl/2xl/3xl`** by mapping them in `tailwind.config.ts` to existing DS radii (`xl → md`, `2xl → lg`, `3xl → lg`).
   - Add semantic glow scale: `--ds-glow-sm/md/lg/focus` referencing `--ds-accent-primary` only.
   - Add motion scale: `--ds-motion-fast 120ms / base 200ms / slow 320ms`, easing tokens.
2. **Refactor primitives** to consume DS tokens exclusively:
   - `button.tsx` → radius `var(--ds-radius-sm)`, default size 40px, glow `--ds-glow-sm`, collapse `hud*` variants into `variant="primary|success|critical|special"` mapped to DS accents.
   - `input.tsx` → radius `var(--ds-radius-sm)` (matches button), height 40px, surface `hsl(var(--ds-surface-2)/0.6)`, focus ring uses `--ds-glow-focus`.
   - `card.tsx` → strip `before/after` gradient overlays; delegate to `<DSPanel tier="secondary">`. Mark `Card` as deprecated alias.
   - `dialog.tsx` → radius `var(--ds-radius-md)`, surface `hsl(var(--ds-surface-2)/0.95)`, header uses `ds-text-label`, title uses `ds-text-display` scaled to 20px.
   - `skeleton.tsx` → use DS sweep animation (`ds-skeleton-sweep` already defined), surface `hsl(var(--ds-surface-2))`.
3. **Lock icon defaults**: create `src/components/ui/icon.tsx` thin wrapper enforcing `strokeWidth={1.75}` and 4-step size scale (`xs 12 / sm 14 / md 16 / lg 20`). Lint rule (or ESLint custom) suggesting it for new code.
4. **Toast policy**: replace bare `toast(...)` with `toast.success / .error / .info` by mechanical codemod; add ESLint rule banning `toast()` direct call.

### Sprint 2 — Module dialect convergence (medium risk, big visual payoff)

5. **Adopt `<DSPanel>` everywhere**, retiring duplicates:
   - `PrismPanel` → re-export of `DSPanel` with `accent="primary"`.
   - `NexusPanel` → re-export with `accent="primary" tier="primary"`.
   - `AuraWidget` → re-export with `accent="success"`.
   - `HUDFrame` → re-export with `accent="primary" flicker`.
   - Delete the duplicate token blocks (`--nexus-*`, `--aura-*`, `--journal-*`, most of `--hud-*`) keeping only the 8 DS surface/accent tokens. ~40% reduction in `index.css` (currently 3024 lines).
6. **Unify ModuleHeader**: enforce `<ModuleHeader>` on Analytics, Health, Finance, Journal, Goals, Wishlist, Todo, Calendar — same orb, same system label format, same badge shape across all 12 modules.
7. **Unify empty/loading**:
   - One `<EmptyState>` (calm) and one `<LoadingState>` (DS spinner + DS skeleton) — both built on DS tokens.
   - Retire `CyberEmpty`, `CyberLoader`, `PrismEmptyCTA`, `PrismSkeleton`, `GoalsSkeleton`, `DSSkeleton` (re-exports for now, deletion in Sprint 3).
   - Codemod hand-rolled `<div>Aucun...</div>` blocks to `<EmptyState>`.

### Sprint 3 — Typography & rhythm (polish)

8. **Apply the DS 4-role typography scale** (`ds-text-display/metric/label/body`) everywhere:
   - All page H1 → `ds-text-display`
   - All KPI numbers → `ds-text-metric`
   - All HUD chips, panel headers, IDs → `ds-text-label`
   - All paragraphs → `ds-text-body`
   - Ban arbitrary `text-[Npx]` outside the scale (ESLint rule).
9. **Spacing rhythm**: introduce `ds-stack-tight/cozy/loose` (12/16/20) and `ds-pad-tight/cozy/loose` utility classes; codemod the most common ad-hoc combinations (`p-4 space-y-3` → `ds-pad-cozy ds-stack-tight`).
10. **Motion**: replace `duration-{75,100,150,500,700}` with three tokens (`fast/base/slow`) using a Tailwind plugin; keep 200/300 as the visible defaults.

### Final acceptance checklist (after Sprint 3)
- One panel API, one card radius, one input radius, one button radius — all driven by `--ds-radius-*`.
- One typographic scale, one font weight per role.
- One empty state, one loader, one skeleton.
- One glow scale, one motion scale.
- `index.css` < 1500 lines (~50% reduction).
- All 12 modules pass a side-by-side screenshot diff: same header, same panel chrome, same KPI typography.

---

## Technical Notes

- The `tcg-*` utilities for Goal cards are intentionally specialized (premium card feel) and stay; they will be re-themed to consume DS tokens (`--ds-accent-*`, `--ds-radius-md`) so they fit the family.
- The difficulty/achievement-rarity color tokens (`--difficulty-*`, `--achievement-*`) are explicitly preserved per existing memory ("CRITICAL: Preserve Original Difficulty Colors").
- The light theme exists but is severely under-tested (most module dialects only define dark). Convergence to DS automatically fixes this since DS has explicit `.light` mirror.
- No backend / Supabase changes required — this is purely a front-end / CSS / primitive-refactor effort.
- Risk mitigation: each retired dialect keeps a thin re-export shim for one sprint so feature components can migrate gradually without breaking.

---

## Sprint 2 — Status: ✅ Shipped

**Convergence achieved without breaking any module identity:**

1. **CSS token convergence** — `.prism-panel` now consumes `--ds-radius-sm`, `--ds-motion-base`, `--ds-ease-out`, `--ds-glow-md` (hover). Aura keeps its signature 20px radius (intentional brand differentiator). HUD/Health surfaces unchanged for now (heavy custom shadow API; deferred to Sprint 3 codemod).
2. **State primitives created**:
   - `DSEmptyState` (`src/components/ds/DSEmptyState.tsx`) — variants `radar | scope | wave | icon`, accent-aware via `--ds-current-accent`. Replaces `PrismEmptyCTA` / `EmptyState` / `CyberEmpty` for new code.
   - `DSLoadingState` (`src/components/ds/DSLoadingState.tsx`) — single canonical spinner with `compact` mode, `role="status"` + `aria-live="polite"`. Replaces `CyberLoader` / ad-hoc spinners.
3. **Dialect shim re-exports** added to `src/components/ds/index.ts`: `PrismPanel`, `PrismEmptyCTA`, `AuraWidget`, `HUDFrame`, `ModuleHeader` are now importable from the canonical barrel `@/components/ds`. Existing direct imports keep working unchanged. **All new code MUST import from `@/components/ds`**.
4. **Memory updated** — `mem://design/pacte-os-design-system` reflects the new contract.

**Deferred to Sprint 3** (per execution choice "shims first, delete later"):
- Migrating ~46 import sites away from `@/components/analytics/PrismPanel` etc. to `@/components/ds`.
- Retiring `--nexus-*`, `--aura-*`, `--journal-*` token blocks.
- Typography scale rollout (`ds-text-display/metric/label/body`).
- Codemod for hand-rolled empty states.
