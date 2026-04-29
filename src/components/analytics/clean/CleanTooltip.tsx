import { TooltipProps } from "recharts";

interface Props extends TooltipProps<number, string> {
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number, name: string) => string;
}

export function CleanTooltip({ active, payload, label, labelFormatter, valueFormatter }: Props) {
  if (!active || !payload || payload.length === 0) return null;
  const formattedLabel =
    labelFormatter && typeof label === "string" ? labelFormatter(label) : String(label ?? "");
  return (
    <div className="rounded-lg border border-border bg-popover/95 backdrop-blur-md shadow-lg px-3 py-2 text-xs min-w-[140px]">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
        {formattedLabel}
      </div>
      <div className="flex flex-col gap-1">
        {payload.map((p, i) => {
          const raw = typeof p.value === "number" ? p.value : Number(p.value ?? 0);
          const display = valueFormatter
            ? valueFormatter(Math.abs(raw), String(p.name ?? p.dataKey ?? ""))
            : String(Math.abs(raw));
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ background: (p.color as string) || "hsl(var(--primary))" }}
              />
              <span className="text-muted-foreground capitalize">
                {String(p.name ?? p.dataKey ?? "")}
              </span>
              <span className="ml-auto font-semibold tabular-nums text-foreground">
                {display}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}