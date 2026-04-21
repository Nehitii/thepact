import { cn } from "@/lib/utils";

export type DSBadgeVariant = "live" | "stale" | "offline" | "locked" | "new" | "standby";

interface DSBadgeProps {
  variant?: DSBadgeVariant;
  label?: string;
  className?: string;
}

const VARIANT: Record<DSBadgeVariant, { color: string; defaultLabel: string; pulse: boolean }> = {
  live:    { color: "var(--ds-accent-success)",  defaultLabel: "LIVE",    pulse: true  },
  stale:   { color: "var(--ds-accent-warning)",  defaultLabel: "STALE",   pulse: false },
  offline: { color: "var(--ds-accent-critical)", defaultLabel: "OFFLINE", pulse: false },
  locked:  { color: "var(--ds-text-muted)",      defaultLabel: "LOCKED",  pulse: false },
  new:     { color: "var(--ds-accent-primary)",  defaultLabel: "NEW",     pulse: true  },
  standby: { color: "var(--ds-accent-primary)",  defaultLabel: "STANDBY", pulse: false },
};

/**
 * Pacte OS — System status Badge.
 * Compact mono label with semantic color + optional pulse dot.
 */
export function DSBadge({ variant = "live", label, className }: DSBadgeProps) {
  const v = VARIANT[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] font-mono text-[8px] uppercase tracking-[0.18em] border",
        className,
      )}
      style={{
        color: `hsl(${v.color})`,
        background: `hsl(${v.color} / 0.06)`,
        borderColor: `hsl(${v.color} / 0.35)`,
      }}
    >
      <span
        className="h-1 w-1 rounded-full"
        style={{
          background: `hsl(${v.color})`,
          boxShadow: `0 0 6px hsl(${v.color} / 0.8)`,
          animation: v.pulse ? "ds-pulse-dot 1.6s ease-in-out infinite" : undefined,
        }}
      />
      {label ?? v.defaultLabel}
    </span>
  );
}