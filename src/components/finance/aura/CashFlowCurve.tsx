import { useMemo, useId } from 'react';

interface CashFlowCurveProps {
  values: number[]; // daily cumulative cash flow, last 30 days
  height?: number;
  className?: string;
}

/**
 * Smooth Bezier curve for cash flow visualization.
 * Animated stroke draw on mount.
 */
export function CashFlowCurve({ values, height = 80, className = '' }: CashFlowCurveProps) {
  const id = useId();
  const gradId = `aura-curve-${id}`;
  const fillId = `aura-fill-${id}`;

  const { path, area } = useMemo(() => {
    if (!values || values.length < 2) return { path: '', area: '' };
    const w = 800;
    const h = height;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = w / (values.length - 1);

    const pts = values.map((v, i) => ({
      x: i * step,
      y: h - 8 - ((v - min) / range) * (h - 16),
    }));

    // Catmull-Rom-ish smoothing → cubic bezier
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const t = 0.5;
      const cp1x = p1.x + ((p2.x - p0.x) / 6) * t;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * t;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * t;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * t;
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    const areaPath = `${d} L ${w} ${h} L 0 ${h} Z`;
    return { path: d, area: areaPath };
  }, [values, height]);

  if (!path) return null;

  return (
    <svg
      viewBox={`0 0 800 ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--aura-electric))" />
          <stop offset="100%" stopColor="hsl(var(--aura-mint))" />
        </linearGradient>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--aura-electric) / 0.25)" />
          <stop offset="100%" stopColor="hsl(var(--aura-electric) / 0)" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="motion-safe:animate-[aura-curve-draw_1.4s_ease-out]"
        style={{ strokeDasharray: 2000, strokeDashoffset: 0 }}
      />
    </svg>
  );
}
