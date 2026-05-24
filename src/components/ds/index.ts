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
export { DSPageHeader } from "./DSPageHeader";
export type { DSPageHeaderBadge } from "./DSPageHeader";

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

/* ─── Module dialects — assumed by design ─────────────────────
 * Canonical DSPanel is the default for new code. Module-specific
 * dialects (HUDFrame for Health, AuraWidget for Finance metric cards,
 * Prism sub-components for Analytics) coexist legitimately — they
 * encode module identity that DSPanel doesn't aim to absorb.
 * ───────────────────────────────────────────────────────────── */
export { PrismEmptyCTA } from "@/components/analytics/PrismEmptyCTA";
export { AuraWidget } from "@/components/finance/aura/AuraWidget";
export { HUDFrame } from "@/components/health/HUDFrame";
export { ModuleHeader } from "@/components/layout/ModuleHeader";
export type { ModuleHeaderBadge } from "@/components/layout/ModuleHeader";