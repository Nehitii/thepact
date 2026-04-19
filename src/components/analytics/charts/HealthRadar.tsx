import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface HealthRadarProps {
  data: { axis: string; value: number; full: number }[];
}

export function HealthRadar({ data }: HealthRadarProps) {
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
          contentStyle={{
            background: "hsl(var(--prism-panel-bg) / 0.95)",
            border: "1px solid hsl(var(--prism-cyan) / 0.3)",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "monospace",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
