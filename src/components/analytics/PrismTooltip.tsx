import { TooltipProps } from "recharts";

interface PrismTooltipProps extends TooltipProps<number, string> {
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number, name: string) => string;
  unit?: string;
}

const SERIES_COLOR: Record<string, string> = {
  created: "var(--prism-cyan)",
  completed: "var(--prism-lime)",
  income: "var(--prism-lime)",
  expenses: "var(--prism-magenta)",
  savings: "var(--prism-cyan)",
  score: "var(--prism-cyan)",
  minutes: "var(--prism-violet)",
  total: "var(--prism-cyan)",
  avgDays: "var(--prism-cyan)",
};

export function PrismTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  unit,
}: PrismTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const formattedLabel =
    labelFormatter && typeof label === "string" ? labelFormatter(label) : String(label ?? "");

  return (
    <div
      className="relative font-mono text-[11px] backdrop-blur-md"
      style={{
        background: "hsl(var(--prism-panel-bg) / 0.9)",
        border: "1px solid hsl(var(--prism-cyan) / 0.35)",
        borderRadius: 3,
        minWidth: 110,
        padding: "6px 9px",
        boxShadow: "0 4px 18px -6px hsl(var(--prism-cyan) / 0.4)",
      }}
    >
      <span className="prism-corner-bracket tl" style={{ width: 5, height: 5 }} />
      <span className="prism-corner-bracket br" style={{ width: 5, height: 5 }} />

      <div className="text-[8.5px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-1.5">
        [ {formattedLabel || "DATAPOINT"} ]
      </div>

      <div className="flex flex-col gap-1">
        {payload.map((p, i) => {
          const colorVar = SERIES_COLOR[String(p.dataKey ?? "")] || "var(--prism-cyan)";
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
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80">
                {String(p.name ?? p.dataKey ?? "")}
              </span>
              <span
                className="ml-auto tabular-nums font-bold"
                style={{ color: `hsl(${colorVar})` }}
              >
                {display}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
