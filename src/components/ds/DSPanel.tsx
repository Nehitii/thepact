import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DSCornerBrackets } from "./DSCornerBrackets";

export type DSPanelTier = "primary" | "secondary" | "muted";
export type DSAccent = "primary" | "success" | "warning" | "critical" | "special";

const ACCENT_VAR: Record<DSAccent, string> = {
  primary:  "var(--ds-accent-primary)",
  success:  "var(--ds-accent-success)",
  warning:  "var(--ds-accent-warning)",
  critical: "var(--ds-accent-critical)",
  special:  "var(--ds-accent-special)",
};

interface DSPanelProps {
  children: ReactNode;
  tier?: DSPanelTier;
  accent?: DSAccent;
  className?: string;
  /** Subtle CRT flicker (8s loop). Use sparingly — max 1-2 per viewport. */
  flicker?: boolean;
  /** Disable corner brackets even on primary/secondary tiers. */
  hideBrackets?: boolean;
  /** Render a vertical accent rail on the left edge (uses `accent` color). */
  accentRail?: boolean;
  /** Optional title rendered as Orbitron HUD label */
  title?: string;
  /** Optional ID rendered as mono prefix (e.g., "OVR.01") */
  id?: string;
  /** Optional unit suffix in header */
  unit?: string;
  /** Slot rendered to the right of the title */
  headerAction?: ReactNode;
  /** Optional footer slot */
  footer?: ReactNode;
}

/**
 * Pacte OS — Canonical Panel.
 * Generalization of PrismPanel/NexusPanel/AuraWidget into a 3-tier system.
 *
 * - tier="primary"   → signature visualization, corner brackets 16px, inner glow
 * - tier="secondary" → standard chart/card, corner brackets 10px (default)
 * - tier="muted"     → metadata, no brackets, reduced padding
 */
export function DSPanel({
  children,
  tier = "secondary",
  accent = "primary",
  className,
  flicker = false,
  hideBrackets = false,
  accentRail = false,
  title,
  id,
  unit,
  headerAction,
  footer,
}: DSPanelProps) {
  const tierClass =
    tier === "primary" ? "ds-panel--primary p-5" : tier === "muted" ? "ds-panel--muted p-3" : "ds-panel--secondary p-4";

  const showBrackets = !hideBrackets && tier !== "muted";

  return (
    <div
      className={cn("ds-panel", tierClass, flicker && "ds-flicker", className)}
      style={{
        ["--ds-current-accent" as any]: ACCENT_VAR[accent],
      }}
    >
      {accentRail && <span className="ds-accent-rail" aria-hidden="true" />}

      {showBrackets && (
        <DSCornerBrackets color={`hsl(${ACCENT_VAR[accent]} / 0.55)`} size={tier === "primary" ? 16 : 10} />
      )}

      {(title || headerAction) && (
        <header className="relative flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {id && (
              <span className="font-mono text-[9px] tabular-nums text-ds-text-muted/60">[{id}]</span>
            )}
            {title && (
              <h3 className="ds-text-label text-ds-text-primary/90 truncate">
                {title}
              </h3>
            )}
            {unit && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-ds-text-muted/60 flex-shrink-0">
                · {unit}
              </span>
            )}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </header>
      )}

      <div className="relative">{children}</div>

      {footer && (
        <footer className="relative mt-3 pt-3 border-t border-[hsl(var(--ds-border-subtle)/0.1)]">
          {footer}
        </footer>
      )}
    </div>
  );
}