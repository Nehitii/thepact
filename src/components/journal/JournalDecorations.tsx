import { motion } from "framer-motion";

// Animated HUD corner bracket
export function HUDCorner({
  pos = "tl",
  size = 28,
  color = "#00ffe0",
  animated = false,
}: {
  pos?: "tl" | "tr" | "bl" | "br";
  size?: number;
  color?: string;
  animated?: boolean;
}) {
  const borders: Record<string, React.CSSProperties> = {
    tl: { borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}`, top: 0, left: 0 },
    tr: { borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}`, top: 0, right: 0 },
    bl: { borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}`, bottom: 0, left: 0 },
    br: { borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}`, bottom: 0, right: 0 },
  };
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        opacity: animated ? undefined : 0.5,
        animation: animated ? "hud-blink 4s ease-in-out infinite" : undefined,
        ...borders[pos],
      }}
    />
  );
}

// Rotating ring decoration
export function RotatingRing({
  size = 80,
  color = "#00ffe0",
  duration = 12,
  reverse = false,
  dasharray = "4 8",
  opacity = 0.4,
}: {
  size?: number;
  color?: string;
  duration?: number;
  reverse?: boolean;
  dasharray?: string;
  opacity?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        pointerEvents: "none",
        opacity,
      }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 2}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        strokeDasharray={dasharray}
        style={{
          animation: `${reverse ? "journal-rotate-slow-r" : "journal-rotate-slow"} ${duration}s linear infinite`,
          transformOrigin: `${size / 2}px ${size / 2}px`,
        }}
      />
    </svg>
  );
}

// Sci-fi divider with tick marks
export function SciFiDivider({
  color = "#00ffe0",
  label,
}: {
  color?: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-0 relative">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}30, ${color}60)` }} />
      <div className="flex gap-[3px] items-center px-2">
        {[0.2, 0.5, 1, 0.5, 0.2].map((o, i) => (
          <div
            key={i}
            style={{
              width: "1px",
              height: i === 2 ? "16px" : i === 1 || i === 3 ? "10px" : "6px",
              background: color,
              opacity: o,
            }}
          />
        ))}
      </div>
      <div
        className="relative px-3.5 py-1"
        style={{ border: `1px solid ${color}30`, borderRadius: "2px", background: `${color}06` }}
      >
        <HUDCorner pos="tl" size={6} color={color} />
        <HUDCorner pos="tr" size={6} color={color} />
        <HUDCorner pos="bl" size={6} color={color} />
        <HUDCorner pos="br" size={6} color={color} />
        <span
          className="block"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color,
            letterSpacing: "0.18em",
          }}
        >
          {label}
        </span>
      </div>
      <div className="flex gap-[3px] items-center px-2">
        {[0.2, 0.5, 1, 0.5, 0.2].map((o, i) => (
          <div
            key={i}
            style={{
              width: "1px",
              height: i === 2 ? "16px" : i === 1 || i === 3 ? "10px" : "6px",
              background: color,
              opacity: o,
            }}
          />
        ))}
      </div>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}60, ${color}30, transparent)` }} />
    </div>
  );
}

// Hexagonal status badge
export function HexBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="44" height="50" viewBox="0 0 44 50" style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}>
        <polygon
          points="22,2 42,13 42,37 22,48 2,37 2,13"
          fill={`${color}10`}
          stroke={color}
          strokeWidth="0.8"
        />
        <text
          x="22"
          y="30"
          textAnchor="middle"
          fill={color}
          fontSize="14"
          fontFamily="'JetBrains Mono',monospace"
          fontWeight="600"
        >
          {value}
        </text>
      </svg>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "8px",
          color,
          letterSpacing: "0.12em",
          opacity: 0.7,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// HUD status line (valence/energy bars)
export function HUDStatusLine({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 w-full">
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.1em",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div className="flex-1 h-[2px] rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-full rounded-sm"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          color,
          letterSpacing: "0.06em",
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
}
