import { Rows3, List } from "lucide-react";
import type { AllianceDensity } from "@/hooks/useAllianceDensity";

interface Props {
  density: AllianceDensity;
  onToggle: () => void;
}

/**
 * Small inline HUD toggle for list density. Comfortable ↔ Compact.
 * Designed to live in the AllianceModuleHeader toolbar slot.
 */
export function AllianceDensityToggle({ density, onToggle }: Props) {
  const isCompact = density === "compact";
  const Icon = isCompact ? List : Rows3;
  const label = isCompact ? "COMPACT" : "COMFORT";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isCompact}
      aria-label={`Switch to ${isCompact ? "comfortable" : "compact"} density`}
      title={`Density: ${label}`}
      className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border border-[hsl(var(--ds-border-default)/0.25)] bg-[hsl(var(--ds-surface-2)/0.4)] hover:bg-[hsl(var(--ds-surface-2)/0.7)] hover:border-[hsl(var(--ds-accent-primary)/0.4)] transition-colors"
    >
      <Icon className="h-3 w-3 text-[hsl(var(--ds-text-muted))] group-hover:text-[hsl(var(--ds-accent-primary))] transition-colors" />
      <span className="ds-text-label text-[8px] tracking-[0.28em] text-[hsl(var(--ds-text-muted))] group-hover:text-[hsl(var(--ds-text-primary))]">
        {label}
      </span>
    </button>
  );
}