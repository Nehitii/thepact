import { useMemo, useState } from "react";

interface TagNode {
  label: string;
  count: number;
  color: string;
}

interface TagConstellationProps {
  tags: TagNode[];
  size?: number;
}

export function TagConstellation({ tags, size = 280 }: TagConstellationProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const center = size / 2;
  const maxCount = Math.max(...(tags.length ? tags.map((t) => t.count) : [1]), 1);

  const nodes = useMemo(() => {
    if (tags.length === 0) return [];
    const radius = size / 2 - 40;
    return tags.map((t, i) => {
      const angle = (i / tags.length) * Math.PI * 2 - Math.PI / 2;
      const r = radius * (0.55 + 0.45 * (1 - t.count / maxCount));
      return {
        ...t,
        x: center + Math.cos(angle) * r,
        y: center + Math.sin(angle) * r,
        size: 6 + (t.count / maxCount) * 14,
      };
    });
  }, [tags, center, size, maxCount]);

  if (tags.length === 0) return <TagConstellationEmpty />;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {nodes.map((n, i) => (
          <line
            key={`l-${i}`}
            x1={center} y1={center} x2={n.x} y2={n.y}
            stroke={n.color}
            strokeOpacity={hovered === i ? 0.6 : 0.12}
            strokeWidth={0.5}
            strokeDasharray="2 3"
          />
        ))}
        <circle cx={center} cy={center} r={3} fill="hsl(var(--prism-cyan))" opacity={0.7} />
        {nodes.map((n, i) => (
          <g
            key={n.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          >
            <circle cx={n.x} cy={n.y} r={n.size + 4} fill={n.color} opacity={hovered === i ? 0.25 : 0.1} />
            <circle cx={n.x} cy={n.y} r={n.size} fill={n.color} opacity={0.85}
              style={{ filter: `drop-shadow(0 0 6px ${n.color})` }} />
            <text x={n.x} y={n.y + n.size + 12} textAnchor="middle" className="font-mono"
              fontSize={9} fill="currentColor" opacity={hovered === i ? 1 : 0.6}>
              {n.label}
            </text>
            <text x={n.x} y={n.y + 3} textAnchor="middle" className="font-mono font-bold tabular-nums"
              fontSize={Math.max(8, n.size * 0.6)} fill="hsl(var(--prism-bg))">
              {n.count}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function TagConstellationEmpty() {
  const cx = 90, cy = 60;
  const ghosts = [
    { x: cx, y: cy - 30 },
    { x: cx - 32, y: cy + 18 },
    { x: cx + 32, y: cy + 18 },
  ];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <svg width="180" height="120" viewBox="0 0 180 120" className="opacity-70">
        {ghosts.map((g, i) =>
          ghosts.slice(i + 1).map((g2, j) => (
            <line key={`${i}-${j}`} x1={g.x} y1={g.y} x2={g2.x} y2={g2.y}
              stroke="hsl(var(--muted-foreground) / 0.25)" strokeWidth="0.5" strokeDasharray="2 3" />
          ))
        )}
        {ghosts.map((g, i) => (
          <circle key={i} cx={g.x} cy={g.y} r="6" fill="hsl(var(--muted-foreground) / 0.18)"
            stroke="hsl(var(--muted-foreground) / 0.35)" strokeWidth="1" />
        ))}
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
        NO TAGS DETECTED
      </span>
    </div>
  );
}
