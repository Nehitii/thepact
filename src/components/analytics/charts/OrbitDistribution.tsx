import { useMemo } from "react";

interface OrbitItem {
  label: string;
  count: number;
  color: string;
}

interface OrbitDistributionProps {
  items: OrbitItem[];
  size?: number;
}

export function OrbitDistribution({ items, size = 280 }: OrbitDistributionProps) {
  const center = size / 2;
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  // Each item gets one ring
  const orbits = useMemo(() => {
    return items.map((item, idx) => {
      const radius = 30 + idx * ((size / 2 - 40) / Math.max(items.length, 1));
      const dotCount = Math.min(item.count, 16);
      const dots = Array.from({ length: dotCount }, (_, i) => {
        const angle = (i / dotCount) * Math.PI * 2;
        return {
          x: center + Math.cos(angle) * radius,
          y: center + Math.sin(angle) * radius,
        };
      });
      return {
        ...item,
        radius,
        dots,
        // Larger glow proportional to count
        intensity: 0.4 + (item.count / maxCount) * 0.6,
        spinDur: 60 + idx * 12,
      };
    });
  }, [items, center, size, maxCount]);

  if (items.length === 0) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Center core */}
        <circle
          cx={center}
          cy={center}
          r={6}
          fill="hsl(var(--prism-cyan))"
          opacity={0.85}
        />
        <circle
          cx={center}
          cy={center}
          r={14}
          fill="none"
          stroke="hsl(var(--prism-cyan) / 0.4)"
          strokeWidth={0.5}
        />

        {orbits.map((o, idx) => (
          <g key={o.label}>
            {/* Orbit ring */}
            <circle
              cx={center}
              cy={center}
              r={o.radius}
              fill="none"
              stroke={o.color}
              strokeOpacity={0.18}
              strokeWidth={0.5}
              strokeDasharray="2 4"
            />
            {/* Rotating dots group */}
            <g
              style={{
                transformOrigin: `${center}px ${center}px`,
                animation: `prism-orbit-spin ${o.spinDur}s linear infinite`,
                animationDirection: idx % 2 === 0 ? "normal" : "reverse",
              }}
              className="motion-reduce:[animation:none]"
            >
              {o.dots.map((d, i) => (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={2.2}
                  fill={o.color}
                  opacity={o.intensity}
                  style={{ filter: `drop-shadow(0 0 4px ${o.color})` }}
                />
              ))}
            </g>
          </g>
        ))}
      </svg>

      {/* Legend overlay */}
      <div className="absolute right-0 top-0 flex flex-col gap-1.5 max-w-[140px]">
        {orbits.map((o) => (
          <div key={o.label} className="flex items-center gap-2 font-mono text-[10px]">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: o.color, boxShadow: `0 0 6px ${o.color}` }}
            />
            <span className="text-foreground/80 truncate">{o.label}</span>
            <span className="text-muted-foreground/60 tabular-nums ml-auto">{o.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
