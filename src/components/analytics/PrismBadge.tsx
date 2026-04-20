import { cn } from "@/lib/utils";

type Variant = "live" | "stale" | "empty" | "offline";

interface PrismBadgeProps {
  variant?: Variant;
  label?: string;
  className?: string;
}

const VARIANT: Record<Variant, { color: string; defaultLabel: string; pulse: boolean }> = {
  live:    { color: "var(--prism-lime)",    defaultLabel: "LIVE",    pulse: true },
  stale:   { color: "var(--prism-amber)",   defaultLabel: "STALE",   pulse: false },
  offline: { color: "var(--prism-magenta)", defaultLabel: "OFFLINE", pulse: false },
  empty:   { color: "var(--prism-cyan)",    defaultLabel: "STANDBY", pulse: false },
};

export function PrismBadge({ variant = "live", label, className }: PrismBadgeProps) {
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
          animation: v.pulse ? "prism-badge-pulse 1.6s ease-in-out infinite" : undefined,
        }}
      />
      {label ?? v.defaultLabel}
    </span>
  );
}
