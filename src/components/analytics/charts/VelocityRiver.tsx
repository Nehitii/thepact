import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { PrismTooltip } from "../PrismTooltip";

interface VelocityRiverProps {
  data: { month: string; created: number; completed: number }[];
  formatMonth: (m: string) => string;
}

export function VelocityRiver({ data, formatMonth }: VelocityRiverProps) {
  if (!data || data.length === 0) return <VelocityRiverEmpty />;

  const mirrored = data.map((d) => ({
    month: d.month,
    created: d.created,
    completed: -d.completed,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={mirrored} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="riverCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--prism-cyan))" stopOpacity={0.6} />
            <stop offset="100%" stopColor="hsl(var(--prism-cyan))" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="riverCompleted" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="hsl(var(--prism-lime))" stopOpacity={0.6} />
            <stop offset="100%" stopColor="hsl(var(--prism-lime))" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--prism-cyan) / 0.08)" />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
          stroke="hsl(var(--prism-cyan) / 0.2)"
        />
        <YAxis
          tickFormatter={(v) => Math.abs(v).toString()}
          tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
          stroke="hsl(var(--prism-cyan) / 0.2)"
        />
        <ReferenceLine y={0} stroke="hsl(var(--prism-cyan) / 0.4)" strokeWidth={1} />
        <Tooltip
          content={
            <PrismTooltip
              labelFormatter={formatMonth}
              valueFormatter={(v) => `${v} goals`}
            />
          }
        />
        <Area type="monotone" dataKey="created" stroke="hsl(var(--prism-cyan))" strokeWidth={1.5} fill="url(#riverCreated)" />
        <Area type="monotone" dataKey="completed" stroke="hsl(var(--prism-lime))" strokeWidth={1.5} fill="url(#riverCompleted)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function VelocityRiverEmpty() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <svg width="180" height="60" viewBox="0 0 180 60" className="opacity-60">
        <line
          x1="0" y1="30" x2="180" y2="30"
          stroke="hsl(var(--prism-cyan) / 0.4)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <line x1="0" y1="30" x2="180" y2="30" stroke="hsl(var(--prism-cyan))" strokeWidth="0.5" opacity="0.3" />
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
        FLOW INACTIVE
      </span>
    </div>
  );
}
