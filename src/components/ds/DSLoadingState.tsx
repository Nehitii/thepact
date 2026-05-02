import { cn } from "@/lib/utils";
import type { DSAccent } from "./DSPanel";

const ACCENT_VAR: Record<DSAccent, string> = {
  primary:  "var(--ds-accent-primary)",
  success:  "var(--ds-accent-success)",
  warning:  "var(--ds-accent-warning)",
  critical: "var(--ds-accent-critical)",
  special:  "var(--ds-accent-special)",
};

interface DSLoadingStateProps {
  /** Optional caption below the spinner (mono uppercase). */
  message?: string;
  accent?: DSAccent;
  className?: string;
  /** Compact 32px variant for inline rows. */
  compact?: boolean;
}

/**
 * Pacte OS — Canonical loading state.
 * Single visual replacing CyberLoader / PrismShimmer / ad-hoc spinners.
 * Inherits accent via --ds-current-accent when nested in a DSPanel.
 */
export function DSLoadingState({
  message = "ACQUIRING SIGNAL",
  accent = "primary",
  className,
  compact = false,
}: DSLoadingStateProps) {
  const size = compact ? 24 : 40;
  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-center justify-center gap-3",
        className,
      )}
      style={{ ["--ds-current-accent" as any]: ACCENT_VAR[accent] }}
      role="status"
      aria-live="polite"
    >
      <div
        className="relative rounded-full motion-reduce:animate-none"
        style={{
          width: size,
          height: size,
          border: "1px solid hsl(var(--ds-current-accent, var(--ds-accent-primary)) / 0.18)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full motion-reduce:hidden"
          style={{
            background:
              "conic-gradient(from 0deg, hsl(var(--ds-current-accent, var(--ds-accent-primary)) / 0.55), transparent 35%)",
            animation: "ds-ring-rotate 1.2s linear infinite",
            mask: "radial-gradient(circle, transparent 55%, #000 56%)",
            WebkitMask: "radial-gradient(circle, transparent 55%, #000 56%)",
          }}
        />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 4,
            height: 4,
            background: "hsl(var(--ds-current-accent, var(--ds-accent-primary)))",
            boxShadow: "var(--ds-glow-sm)",
            animation: "ds-pulse-dot 1.6s ease-in-out infinite",
          }}
        />
      </div>
      {!compact && message && <span className="ds-text-label">{message}</span>}
      <span className="sr-only">{message}</span>
    </div>
  );
}