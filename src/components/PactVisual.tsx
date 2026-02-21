/**
 * PactVisual — logo animé du Pact
 *
 * Chaque symbole a sa propre personnalité cinétique :
 *  • flame    → vacillement + braises qui montent
 *  • heart    → double battement (lub-dub)
 *  • target   → rotation lente + ping radar
 *  • sparkles → respiration + éclats staggerés
 */

import { useId } from "react";
import { cn } from "@/lib/utils";

// ─── types ────────────────────────────────────────────────────────────────────

interface PactVisualProps {
  symbol?: string;
  progress?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// ─── size map ─────────────────────────────────────────────────────────────────

const SIZE = {
  sm: { wrap: "h-16 w-16", icon: 32, p: 16 },
  md: { wrap: "h-24 w-24", icon: 48, p: 20 },
  lg: { wrap: "h-32 w-32", icon: 64, p: 28 },
};

// ─── inline keyframes ─────────────────────────────────────────────────────────
// Injected once via a <style> tag so Tailwind doesn't need to know about them.

const KEYFRAMES = `
  @keyframes pv-flame-waver {
    0%   { transform: skewX(0deg)  scaleY(1)    translateY(0);    }
    20%  { transform: skewX(-4deg) scaleY(1.05) translateY(-3px); }
    40%  { transform: skewX(5deg)  scaleY(0.97) translateY(1px);  }
    60%  { transform: skewX(-3deg) scaleY(1.07) translateY(-4px); }
    80%  { transform: skewX(4deg)  scaleY(1.02) translateY(0);    }
    100% { transform: skewX(0deg)  scaleY(1)    translateY(0);    }
  }
  @keyframes pv-flame-glow {
    0%,100% { opacity:.7; filter: drop-shadow(0 0 8px #ff6a00) drop-shadow(0 0 20px #ff3d0066); }
    50%     { opacity:1;  filter: drop-shadow(0 0 16px #ff8c00) drop-shadow(0 0 35px #ff450099); }
  }
  @keyframes pv-ember {
    0%   { transform: translateY(0)    translateX(0)          scale(1);   opacity:.95; }
    100% { transform: translateY(-70px) translateX(var(--pv-dx)) scale(.2); opacity:0;  }
  }
  @keyframes pv-heartbeat {
    0%   { transform: scale(1);    }
    14%  { transform: scale(1.22); }
    28%  { transform: scale(1);    }
    42%  { transform: scale(1.14); }
    56%  { transform: scale(1);    }
    100% { transform: scale(1);    }
  }
  @keyframes pv-heart-glow {
    0%,44%,100% { filter: drop-shadow(0 0 6px #ff2066) drop-shadow(0 0 14px #ff206644); }
    14%         { filter: drop-shadow(0 0 18px #ff2066) drop-shadow(0 0 36px #ff2066aa); }
    42%         { filter: drop-shadow(0 0 12px #ff2066) drop-shadow(0 0 24px #ff206677); }
  }
  @keyframes pv-radar {
    0%   { transform: scale(.5); opacity:.85; }
    100% { transform: scale(2.4); opacity:0;  }
  }
  @keyframes pv-target-spin {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
  @keyframes pv-sparkle-breathe {
    0%,100% { transform: scale(1)    rotate(0deg);  filter: drop-shadow(0 0 8px #a855f7) brightness(1);   }
    50%     { transform: scale(1.1)  rotate(15deg); filter: drop-shadow(0 0 20px #a855f7) brightness(1.5); }
  }
  @keyframes pv-star-flash {
    0%,100% { opacity:0; transform: scale(0) rotate(0deg);   }
    40%,60% { opacity:1; transform: scale(1) rotate(180deg); }
  }
  @keyframes pv-orb-pulse {
    0%,100% { opacity:.18; }
    50%     { opacity:.40; }
  }
  @keyframes pv-ring-in {
    from { stroke-dashoffset: 283; }
  }
`;

// ─── inline SVG icons (gradient-capable) ─────────────────────────────────────

function FlameIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-fg`} x1="12" y1="22" x2="12" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cc1100" />
          <stop offset="35%" stopColor="#ff6a00" />
          <stop offset="70%" stopColor="#ffcc00" />
          <stop offset="100%" stopColor="#fff8c0" />
        </linearGradient>
      </defs>
      {/* outer flame body */}
      <path
        d="M12 2C12 2 6.5 8.5 6.5 13.5a5.5 5.5 0 0011 0C17.5 10 15 8 15 8s.6 3.5-2.5 4.5C10.5 13 9 11.5 9 10 9 7 12 2 12 2z"
        fill={`url(#${id}-fg)`}
      />
      {/* inner hot core */}
      <path d="M12 13.5c0 0-1.2.6-1.2 2.2a1.2 1.2 0 002.4 0c0-1.6-1.2-2.2-1.2-2.2z" fill="#fff8c0" opacity="0.9" />
    </svg>
  );
}

function HeartIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-hg`} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff80b0" />
          <stop offset="100%" stopColor="#cc0044" />
        </linearGradient>
      </defs>
      <path
        d="M12 21C12 21 2.5 14 2.5 8.5a4.5 4.5 0 019-0.9 4.5 4.5 0 019 .9C20.5 14 12 21 12 21z"
        fill={`url(#${id}-hg)`}
      />
      {/* gloss highlight */}
      <ellipse cx="9" cy="9" rx="1.8" ry="2.2" fill="white" opacity="0.2" transform="rotate(-25 9 9)" />
    </svg>
  );
}

function TargetIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${id}-tg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00ff99" />
          <stop offset="100%" stopColor="#007744" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="#00ff88" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="5.5" stroke="#00ff88" strokeWidth="1.5" fill="none" opacity=".6" />
      <circle cx="12" cy="12" r="2.5" fill={`url(#${id}-tg)`} />
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="12"
          y1="2"
          x2="12"
          y2="5.5"
          stroke="#00ff88"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

function SparklesIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-sg`} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      {/* Main star */}
      <path d="M12 2l1.8 5.4H20l-4.9 3.6 1.9 5.5L12 13l-5 3.5 1.9-5.5L4 7.4h6.2z" fill={`url(#${id}-sg)`} />
      {/* Small star TL */}
      <path d="M19.5 2l.7 2.2H22.5l-2 1.5.8 2.3L19.5 6.7 17.7 8l.8-2.3-2-1.5h2.3z" fill="#e879f9" opacity=".7" />
      {/* Small star BR */}
      <path d="M4.5 14l.7 2.2H7.7l-2 1.5.8 2.3L4.5 18.7l-1.8 1.3.8-2.3-2-1.5h2.3z" fill="#c084fc" opacity=".6" />
    </svg>
  );
}

// ─── symbol registry ──────────────────────────────────────────────────────────

const REGISTRY: Record<
  string,
  {
    Icon: (p: { id: string; size: number }) => JSX.Element;
    color: string;
    outerGlow: string;
    iconAnimation: string;
    iconTransformOrigin?: string;
    hasEmbers?: boolean;
    hasRadar?: boolean;
    hasStarFlashes?: boolean;
  }
> = {
  flame: {
    Icon: FlameIcon,
    color: "#ff6a00",
    outerGlow: "radial-gradient(circle, rgba(255,106,0,0.35) 0%, rgba(255,50,0,0.1) 55%, transparent 70%)",
    iconAnimation: "pv-flame-waver 2.6s ease-in-out infinite, pv-flame-glow 2.6s ease-in-out infinite",
    iconTransformOrigin: "bottom center",
    hasEmbers: true,
  },
  heart: {
    Icon: HeartIcon,
    color: "#ff2066",
    outerGlow: "radial-gradient(circle, rgba(255,32,102,0.3) 0%, rgba(200,0,60,0.08) 55%, transparent 70%)",
    iconAnimation: "pv-heartbeat 1.15s ease-in-out infinite, pv-heart-glow 1.15s ease-in-out infinite",
    iconTransformOrigin: "center",
  },
  target: {
    Icon: TargetIcon,
    color: "#00ff88",
    outerGlow: "radial-gradient(circle, rgba(0,255,136,0.22) 0%, rgba(0,180,80,0.06) 55%, transparent 70%)",
    iconAnimation: "pv-target-spin 10s linear infinite",
    iconTransformOrigin: "center",
    hasRadar: true,
  },
  sparkles: {
    Icon: SparklesIcon,
    color: "#a855f7",
    outerGlow: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(109,40,217,0.08) 55%, transparent 70%)",
    iconAnimation: "pv-sparkle-breathe 3.2s ease-in-out infinite",
    iconTransformOrigin: "center",
    hasStarFlashes: true,
  },
};

// ─── sub-components ───────────────────────────────────────────────────────────

function Ember({ color, index }: { color: string; index: number }) {
  const dx = (((index % 5) - 2) * 14).toFixed(0);
  const delay = (index * 0.4).toFixed(1);
  const dur = (1.3 + (index % 3) * 0.4).toFixed(1);
  return (
    <span
      aria-hidden
      style={
        {
          position: "absolute",
          bottom: "18%",
          left: `${42 + (index % 4) * 5}%`,
          width: 3 + (index % 2),
          height: 3 + (index % 2),
          borderRadius: "50%",
          background: index % 2 === 0 ? "#ff8c00" : "#ffdd00",
          ["--pv-dx" as string]: `${dx}px`,
          animation: `pv-ember ${dur}s ease-out ${delay}s infinite`,
          pointerEvents: "none",
        } as React.CSSProperties
      }
    />
  );
}

function RadarPing({ color, index }: { color: string; index: number }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        border: `1.5px solid ${color}`,
        animation: `pv-radar 2.2s ease-out ${index * 1.1}s infinite`,
        pointerEvents: "none",
      }}
    />
  );
}

function StarFlash({ color, index }: { color: string; index: number }) {
  const positions: React.CSSProperties[] = [
    { top: "2%", left: "8%" },
    { top: "12%", right: "6%" },
    { bottom: "8%", left: "4%" },
    { top: "55%", right: "2%" },
  ];
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        ...positions[index % 4],
        fontSize: 10,
        color,
        lineHeight: 1,
        animation: `pv-star-flash 3s ease-in-out ${index * 0.75}s infinite`,
        pointerEvents: "none",
      }}
    >
      ✦
    </span>
  );
}

// ─── PactVisual ───────────────────────────────────────────────────────────────

let _styleInjected = false;

export function PactVisual({ symbol = "flame", progress = 0, size = "lg", className }: PactVisualProps) {
  const uid = useId().replace(/:/g, "");

  // Inject keyframes once
  if (typeof document !== "undefined" && !_styleInjected) {
    const el = document.createElement("style");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    _styleInjected = true;
  }

  const cfg = REGISTRY[symbol] ?? REGISTRY.flame;
  const { Icon, color, outerGlow, iconAnimation, iconTransformOrigin, hasEmbers, hasRadar, hasStarFlashes } = cfg;

  const s = SIZE[size];
  const r = 45;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - Math.min(100, Math.max(0, progress)) / 100);

  return (
    <div className={cn("relative inline-block overflow-visible", className)} style={{ padding: s.p }}>
      {/* ── outer aura ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-full"
        style={{
          background: outerGlow,
          filter: "blur(24px)",
          animation: "pv-orb-pulse 3s ease-in-out infinite",
        }}
      />

      {/* ── radar pings (target) ── */}
      {hasRadar && [0, 1].map((i) => <RadarPing key={i} color={color} index={i} />)}

      {/* ── star flashes (sparkles) ── */}
      {hasStarFlashes && [0, 1, 2, 3].map((i) => <StarFlash key={i} color={color} index={i} />)}

      {/* ── progress ring + icon ── */}
      <div className="relative" style={{ filter: `drop-shadow(0 0 14px ${color}66)` }}>
        <svg className={s.wrap} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
          {/* track */}
          <circle cx="50" cy="50" r={r} fill="none" stroke={`${color}1a`} strokeWidth="3" />
          {/* progress */}
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 1s ease",
              animation: "pv-ring-in 1s ease",
            }}
          />
        </svg>

        {/* center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* blur ghost */}
            <div className="absolute -inset-1 blur-md opacity-60" aria-hidden>
              <Icon id={`${uid}-blur`} size={s.icon} />
            </div>
            {/* animated icon */}
            <div
              style={{
                animation: iconAnimation,
                transformOrigin: iconTransformOrigin ?? "center",
              }}
            >
              <Icon id={`${uid}-main`} size={s.icon} />
            </div>
          </div>
        </div>
      </div>

      {/* ── ember particles (flame) ── */}
      {hasEmbers && [0, 1, 2, 3, 4].map((i) => <Ember key={i} color={color} index={i} />)}
    </div>
  );
}
