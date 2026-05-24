---
name: Page layout foundations (Phase 1)
description: Mandatory page-level wrappers DSPageShell/DSBackground/DSPageHeader/DSPageLoader and the 5 allowed widths
type: design
---
Phase 1 design foundations — every protected page MUST use these:

- **`<DSPageShell>`** (from `@/components/ds`) wraps every page. Handles `min-h-screen`, container max-width, padding, a11y skip-link. Never reproduce these inline.
- **Background** goes in the `background` slot via `<DSBackground variant="cyber|cyber-grid|aura|bio|corners|none" />`. Do not place `<CyberBackground/>`, `<AuraBackground/>` etc. directly in the page body.
- **Header** via `<DSPageHeader variant="hud" | "sober">`. Do not write inline `<header>` markup. Legacy `ModuleHeader` is now a thin deprecated wrapper around DSPageHeader hud variant.
- **Full-screen loader** via `<DSPageLoader />` (use `variant="verbose"` for boot-style screens). Do not write ad-hoc spinner divs.
- **Allowed widths only**: `sm` (max-w-2xl, rituals/focus), `md` (max-w-3xl, settings/forms), `lg` (max-w-5xl, home), `xl` (max-w-6xl, data-heavy, default), `full` (no max). Anything outside this palette is an anti-pattern.
- Phase 5 will extract CSS utilities from `index.css` (journal-scanline, journal-grid-bg, etc.) — for now DSBackground wraps legacy components.
