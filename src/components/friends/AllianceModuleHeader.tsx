import type { ReactNode } from "react";

interface Chip {
  label: string;
  value: number | string;
  accent?: "primary" | "success" | "critical" | "warning" | "special";
}

interface AllianceModuleHeaderProps {
  systemLabel?: string;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  chips?: Chip[];
  /** Slot rendered on the right of the system tag row (e.g. density toggle) */
  toolbar?: ReactNode;
}

const ACCENT_VAR: Record<NonNullable<Chip["accent"]>, string> = {
  primary: "var(--ds-accent-primary)",
  success: "var(--ds-accent-success)",
  critical: "var(--ds-accent-critical)",
  warning: "var(--ds-accent-warning)",
  special: "var(--ds-accent-special)",
};

/**
 * Premium tactical header — minimal, generous spacing, single hairline.
 * Title is the hero. System tag + chips are secondary, muted.
 */
export function AllianceModuleHeader({
  systemLabel = "ALLIANCE_GRID // SYS.ACTIVE",
  title,
  titleAccent,
  subtitle,
  chips = [],
  toolbar,
}: AllianceModuleHeaderProps) {
  return (
    <header className="relative pt-8 pb-6 px-1 isolate">
      {/* Alliance Identity backdrop — subtle radial wash tinted by user accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-12 h-56 -z-10 opacity-[0.55]"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 18% 30%, hsl(var(--primary) / 0.18) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 90% 10%, hsl(var(--ds-accent-primary) / 0.10) 0%, transparent 65%)",
          maskImage: "linear-gradient(180deg, black 0%, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, black 0%, black 60%, transparent 100%)",
        }}
      />

      {/* Top: system tag, very muted */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="h-1 w-1 rounded-full shrink-0"
          style={{
            background: "hsl(var(--ds-accent-primary))",
            boxShadow: "0 0 4px hsl(var(--ds-accent-primary) / 0.6)",
          }}
          aria-hidden="true"
        />
        <span className="ds-text-label text-[9px] tracking-[0.3em] opacity-75 truncate flex-1">
          {systemLabel}
        </span>
        {toolbar && <div className="flex items-center gap-2 shrink-0">{toolbar}</div>}
      </div>

      {/* Hero title + chips on the right, single line */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <h1 className="ds-text-display flex items-baseline">
          <span>{title}</span>
          {titleAccent && (
            <span className="font-black" style={{ color: "hsl(var(--ds-accent-primary))" }}>
              {titleAccent}
            </span>
          )}
        </h1>

        {chips.length > 0 && (
          <div className="flex items-center gap-4 pb-1">
            {chips.map((c, i) => {
              const colorVar = ACCENT_VAR[c.accent ?? "primary"];
              return (
                <div key={i} className="flex flex-col items-end">
                  <span
                    className="font-orbitron text-base tabular-nums leading-none"
                    style={{ color: `hsl(${colorVar})` }}
                  >
                    {String(c.value).padStart(2, "0")}
                  </span>
                  <span className="ds-text-label text-[8px] tracking-[0.24em] mt-1">
                    {c.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="ds-text-label text-[10px] tracking-[0.2em] mt-3">
          {subtitle}
        </p>
      )}

      {/* Bottom hairline — neutral, not cyan */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none bg-[hsl(var(--ds-border-default)/0.25)]"
        aria-hidden="true"
      />
    </header>
  );
}