/**
 * Pacte OS — Canonical Design System UI Kit
 *
 * Tier mapping conventions:
 *  - DSPanel tier="primary"   → signature visualizations (1-2 per page max)
 *  - DSPanel tier="secondary" → standard data cards (default)
 *  - DSPanel tier="muted"     → metadata, footers, legends
 *
 * Accent semantics (DSAccent):
 *  - primary  → cyan, neutral live data, navigation focus
 *  - success  → lime, completion, gains, progress
 *  - warning  → amber, attention, deadlines
 *  - critical → magenta, errors, losses, destructive
 *  - special  → violet, premium / focus mode / AI features
 */

/* ─── Phase 1 — Page foundations ─────────────────────────────── */
export { DSPageShell } from "./DSPageShell";
export type { DSPageWidth } from "./DSPageShell";
export { DSBackground } from "./DSBackground";
export type { DSBackgroundVariant } from "./DSBackground";
export { DSPageLoader } from "./DSPageLoader";

export { DSPanel } from "./DSPanel";
export type { DSPanelTier, DSAccent } from "./DSPanel";
export { DSBadge } from "./DSBadge";
export type { DSBadgeVariant } from "./DSBadge";
export { DSSkeleton } from "./DSSkeleton";
export { DSSparkline } from "./DSSparkline";
export { DSDivider } from "./DSDivider";
export { DSDataNoise } from "./DSDataNoise";
export { DSTooltip } from "./DSTooltip";
export { DSCornerBrackets } from "./DSCornerBrackets";

/* ─── Sprint 2 — Canonical state primitives ─────────────────── */
export { DSEmptyState } from "./DSEmptyState";
export { DSLoadingState } from "./DSLoadingState";

/* DSPageHeader et ModuleHeader ont ete supprimes le 28/08/2026 : le
 * second etait @deprecated et rendu nulle part, et il etait le SEUL a
 * rendre le premier. GoalsHeader dit le remplacer, Home dit s en passer
 * volontairement. Le paquet construit ne contenait deja aucune de leurs
 * lignes — l elagueur les avait vues avant nous.
 *
 * ─── Module dialects — assumed by design ─────────────────────
 * Canonical DSPanel is the default for new code. Module-specific
 * Prism sub-components for Analytics) coexist legitimately — they
 * encode module identity that DSPanel doesn't aim to absorb.
 * ───────────────────────────────────────────────────────────── */