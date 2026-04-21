import type { TooltipProps } from "recharts";
import type { DSAccent } from "./DSPanel";

const ACCENT_VAR: Record<DSAccent, string> = {
  primary:  "var(--ds-accent-primary)",
  success:  "var(--ds-accent-success)",
  warning:  "var(--ds-accent-warning)",
  critical: "var(--ds-accent-critical)",
  special:  "var(--ds-accent-special)",
};

interface DSTooltipProps extends TooltipProps<number, string> {
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number, name: string) => string;
  unit?: string;
  /** Map data series key → DSAccent. Defaults all to primary. */
  seriesAccent?: Record<string, DSAccent>;
}

/**
 * Pacte OS — Recharts-compatible tooltip.
 * surface-3 background + corner brackets + mono datapoint label.
 */
export function DSTooltip({ active, payload, label, labelFormatter, valueFormatter, unit, seriesAccent = {} }: DSTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const formattedLabel =
    labelFormatter && typeof label === "string" ? labelFormatter(label) : String(label ?? "");

  return (
    <div
      className="relative font-mono text-[11px] backdrop-blur-md"
      style={{
        background: "hsl(var(--ds-surface-3) / 0.9)",
        border: "1px solid hsl(var(--ds-accent-primary) / 0.35)",
        borderRadius: 3,
        minWidth: 110,
        padding: "6px 9px",
        boxShadow: "0 4px 18px -6px hsl(var(--ds-accent-primary) / 0.4)",
      }}
    >
      <span className="ds-corner-bracket tl" style={{ width: 5, height: 5 }} />
      <span className="ds-corner-bracket br" style={{ width: 5, height: 5 }} />

      <div className="text-[8.5px] uppercase tracking-[0.22em] text-ds-text-muted/70 mb-1.5">
        [ {formattedLabel || "DATAPOINT"} ]
      </div>

      <div className="flex flex-col gap-1">
        {payload.map((p, i) => {
          const accent = seriesAccent[String(p.dataKey ?? "")] ?? "primary";
          const colorVar = ACCENT_VAR[accent];
          const rawValue = typeof p.value === "number" ? Math.abs(p.value) : Number(p.value ?? 0);
          const display = valueFormatter
            ? valueFormatter(rawValue, String(p.name ?? p.dataKey ?? ""))
            : `${rawValue}${unit ? ` ${unit}` : ""}`;
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-2 w-[2px] rounded-full flex-shrink-0"
                style={{
                  background: `hsl(${colorVar})`,
                  boxShadow: `0 0 5px hsl(${colorVar} / 0.7)`,
                }}
              />
              <span className="text-[9px] uppercase tracking-wider text-ds-text-muted/80">
                {String(p.name ?? p.dataKey ?? "")}
              </span>
              <span className="ml-auto tabular-nums font-bold" style={{ color: `hsl(${colorVar})` }}>
                {display}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}