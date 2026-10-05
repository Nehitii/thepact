import { cn } from "@/lib/utils";
import type { DSAccent } from "./DSPanel";

const ACCENT_VAR: Record<DSAccent, string> = {
  primary:  "var(--ds-accent-primary)",
  success:  "var(--ds-accent-success)",
  warning:  "var(--ds-accent-warning)",
  critical: "var(--ds-accent-critical)",
  special:  "var(--ds-accent-special)",
};

interface DSDividerProps {
  orientation?: "horizontal" | "vertical";
  accent?: DSAccent;
  /** Render 3 luminous nodes along the divider with desync pulses. */
  withNodes?: boolean;
  className?: string;
}

/**
 * Pacte OS — Luminous Divider.
 * Gradient fade transparent → accent → transparent, with optional pulse nodes.
 */
export function DSDivider({ orientation = "horizontal", accent = "primary", withNodes = false, className }: DSDividerProps) {
  const color = ACCENT_VAR[accent];
  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn("relative pointer-events-none", isVertical ? "w-px h-full" : "h-px w-full", className)}
      style={{
        background: isVertical
          ? `linear-gradient(to bottom, transparent, hsl(${color} / 0.4), transparent)`
          : `linear-gradient(to right, transparent, hsl(${color} / 0.4), transparent)`,
      }}
    >
      {withNodes && (
        <>
          {[0.2, 0.5, 0.8].map((pos, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                left: isVertical ? "50%" : `${pos * 100}%`,
                top:  isVertical ? `${pos * 100}%` : "50%",
                background: `hsl(${color})`,
                boxShadow: `0 0 6px hsl(${color} / 0.8)`,
                animation: `ds-pulse-dot ${1.6 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}