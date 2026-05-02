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

/* ─── Sprint 2 — Dialect re-export shims ─────────────────────────
 * Module dialects (Prism / Aura / HUD) keep their distinctive
 * personalities and rich APIs, but new code should import them from
 * the canonical DS barrel so the migration to a single API surface
 * can complete in Sprint 3. Existing imports keep working unchanged.
 * ───────────────────────────────────────────────────────────── */
export { PrismPanel } from "@/components/analytics/PrismPanel";
export type { PrismPanelStatus, PrismPanelTier } from "@/components/analytics/PrismPanel";
export { PrismEmptyCTA } from "@/components/analytics/PrismEmptyCTA";
export { AuraWidget } from "@/components/finance/aura/AuraWidget";
export { HUDFrame } from "@/components/health/HUDFrame";
export { ModuleHeader } from "@/components/layout/ModuleHeader";
export type { ModuleHeaderBadge } from "@/components/layout/ModuleHeader";