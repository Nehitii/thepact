import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PrismTooltip } from "../PrismTooltip";

interface HealthRadarProps {
  data: { axis: string; value: number; full: number }[];
}

export function HealthRadar({ data }: HealthRadarProps) {
  if (!data || data.length === 0) return <HealthRadarEmpty />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="hsl(var(--prism-cyan) / 0.18)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tick={{ fontSize: 8, fontFamily: "monospace", fill: "hsl(var(--muted-foreground) / 0.5)" }}
          stroke="hsl(var(--prism-cyan) / 0.1)"
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="hsl(var(--prism-cyan))"
          fill="hsl(var(--prism-cyan))"
          fillOpacity={0.25}
          strokeWidth={1.5}
        />
        <Tooltip
          content={
            <PrismTooltip valueFormatter={(v) => `${v.toFixed(1)} / 5`} />
          }
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function HealthRadarEmpty() {
  // Hexagon outline
  const cx = 90, cy = 60, r = 42;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <svg width="180" height="120" viewBox="0 0 180 120" className="opacity-60">
        <polygon
          points={pts}
          fill="none"
          stroke="hsl(var(--prism-cyan) / 0.35)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <polygon
          points={pts}
          fill="hsl(var(--prism-cyan) / 0.04)"
          stroke="none"
        />
        <circle cx={cx} cy={cy} r="2" fill="hsl(var(--prism-cyan))" opacity="0.6" />
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
        BIOMETRICS OFFLINE
      </span>
    </div>
  );
}
