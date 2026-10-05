import type { DSAccent } from "./DSPanel";

const ACCENT_VAR: Record<DSAccent, string> = {
  primary:  "var(--ds-accent-primary)",
  success:  "var(--ds-accent-success)",
  warning:  "var(--ds-accent-warning)",
  critical: "var(--ds-accent-critical)",
  special:  "var(--ds-accent-special)",
};

interface DSSparklineProps {
  values: number[];
  accent?: DSAccent;
  width?: number;
  height?: number;
}

/**
 * Pacte OS — Mini SVG sparkline.
 * Pure SVG (no recharts). Endpoint glow + gradient fill.
 */
export function DSSparkline({ values, accent = "primary", width = 64, height = 18 }: DSSparklineProps) {
  const color = ACCENT_VAR[accent];

  if (!values || values.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: `hsl(${color})`,
            boxShadow: `0 0 6px hsl(${color} / 0.7)`,
            animation: "ds-pulse-dot 1.8s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 3) - 1.5;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${width} ${height} L0 ${height} Z`;
  const last = points[points.length - 1];
  const gradId = `ds-spark-${accent}-${values.length}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={`hsl(${color})`} stopOpacity="0.35" />
          <stop offset="100%" stopColor={`hsl(${color})`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={`hsl(${color})`} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="1.6" fill={`hsl(${color})`} style={{ filter: `drop-shadow(0 0 3px hsl(${color}))` }} />
    </svg>
  );
}