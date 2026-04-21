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