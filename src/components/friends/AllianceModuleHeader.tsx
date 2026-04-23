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
}: AllianceModuleHeaderProps) {
  return (
    <header className="relative pt-8 pb-6 px-1">
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
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--ds-text-muted)/0.55)] truncate">
          {systemLabel}
        </span>
      </div>

      {/* Hero title + chips on the right, single line */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <h1 className="font-orbitron text-3xl sm:text-4xl font-light tracking-[0.16em] uppercase text-[hsl(var(--ds-text-primary))] leading-none flex items-baseline">
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
                  <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-[hsl(var(--ds-text-muted)/0.6)] mt-1">
                    {c.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ds-text-muted)/0.6)]">
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