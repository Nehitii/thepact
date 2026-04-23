import { useTranslation } from "react-i18next";

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
 * Compact tactical module header for Alliance Grid (Friends/Guild).
 * No rotating rings, no hexagons — pure HUD layout, hairline cyan bottom.
 */
export function AllianceModuleHeader({
  systemLabel = "ALLIANCE_GRID // SYS.ACTIVE",
  title,
  titleAccent,
  subtitle,
  chips = [],
}: AllianceModuleHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="relative py-4 px-1 sm:px-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: system label */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: "hsl(var(--ds-accent-primary))",
              boxShadow: "0 0 6px hsl(var(--ds-accent-primary) / 0.7)",
              animation: "ds-pulse-dot 1.6s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--ds-text-muted))] truncate">
            [{systemLabel}]
          </span>
        </div>

        {/* Center: title */}
        <h1 className="font-orbitron text-lg sm:text-xl font-black tracking-[0.18em] uppercase text-[hsl(var(--ds-text-primary))] flex items-baseline">
          <span>{title}</span>
          {titleAccent && (
            <span style={{ color: "hsl(var(--ds-accent-primary))" }}>{titleAccent}</span>
          )}
        </h1>

        {/* Right: chips */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {chips.map((c, i) => {
            const colorVar = ACCENT_VAR[c.accent ?? "primary"];
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-[2px] border tabular-nums"
                style={{
                  color: `hsl(${colorVar})`,
                  borderColor: `hsl(${colorVar} / 0.45)`,
                  background: `hsl(${colorVar} / 0.08)`,
                }}
              >
                <span className="opacity-70">{c.label}</span>
                <span className="font-bold">{c.value}</span>
              </span>
            );
          })}
        </div>
      </div>

      {subtitle && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ds-text-muted)/0.7)]">
          {subtitle}
        </p>
      )}

      {/* Bottom hairline */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, transparent, hsl(var(--ds-accent-primary) / 0.45), transparent)",
        }}
        aria-hidden="true"
      />
    </header>
  );
}