/**
 * PactVisual — logo animé du Pact
 *
 * Symboles :
 *  • flame    → vacillement + braises
 *  • heart    → double battement (lub-dub)
 *  • target   → rotation lente + ping radar
 *  • sparkles → respiration + éclats staggerés
 *  • phoenix  → ailes + braises descendantes
 *  • compass  → aiguille oscillante + anneau rotatif
 *  • citadel  → pulse vert + scan + clignotement
 *  • vortex   → anneaux concentriques multi-vitesse
 *  • shield   → bouclier + éclair + ondes de choc
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

  /* — PHOENIX — */
  @keyframes ph-wing { 0%,100%{transform:scaleX(1) translateY(0)} 50%{transform:scaleX(1.06) translateY(-2px)} }
  @keyframes ph-body { 0%,100%{filter:drop-shadow(0 0 6px #ff6a00) drop-shadow(0 0 18px #ff330055)}
                        50%{filter:drop-shadow(0 0 14px #ffaa00) drop-shadow(0 0 36px #ff660099)} }
  @keyframes ph-ember { 0%{transform:translate(0,0) scale(1);opacity:.9}
                        100%{transform:translate(var(--ex),var(--ey)) scale(0);opacity:0} }
  @keyframes ph-tail { 0%,100%{stroke-dashoffset:0} 50%{stroke-dashoffset:-20} }

  /* — COMPASS — */
  @keyframes co-needle { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
  @keyframes co-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes co-glow { 0%,100%{filter:drop-shadow(0 0 4px #00d4ff)} 50%{filter:drop-shadow(0 0 12px #00eeff)} }

  /* — CITADEL — */
  @keyframes ci-pulse { 0%,100%{filter:drop-shadow(0 0 5px #00ffaa) drop-shadow(0 0 16px #00884433)}
                        50%{filter:drop-shadow(0 0 12px #44ffcc) drop-shadow(0 0 30px #00ff8866)} }
  @keyframes ci-scan { 0%{transform:translateY(-26px);opacity:0}
                       10%,90%{opacity:.7} 100%{transform:translateY(26px);opacity:0} }
  @keyframes ci-blink { 0%,90%,100%{opacity:1} 93%,97%{opacity:.2} }

  /* — VORTEX — */
  @keyframes vo-cw { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes vo-ccw { from{transform:rotate(0)} to{transform:rotate(-360deg)} }
  @keyframes vo-core { 0%,100%{r:4px;filter:drop-shadow(0 0 5px #a855f7)}
                        50%{r:5.5px;filter:drop-shadow(0 0 14px #c084fc)} }

  /* — SHIELD — */
  @keyframes sh-charge { 0%,100%{filter:drop-shadow(0 0 4px #38bdf8) drop-shadow(0 0 12px #0ea5e933)}
                         50%{filter:drop-shadow(0 0 10px #7dd3fc) drop-shadow(0 0 28px #38bdf866)} }
  @keyframes sh-bolt { 0%,85%,100%{opacity:1} 87%,92%{opacity:0} }
  @keyframes sh-ring { 0%{transform:scale(.7);opacity:.8} 100%{transform:scale(1.6);opacity:0} }
`;

// ─── inline SVG icons ─────────────────────────────────────────────────────────

function FlameIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`${id}-fg`} x1="12" y1="22" x2="12" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cc1100" />
          <stop offset="35%" stopColor="#ff6a00" />
          <stop offset="70%" stopColor="#ffcc00" />
          <stop offset="100%" stopColor="#fff8c0" />
        </linearGradient>
      </defs>
      <path d="M12 2C12 2 6.5 8.5 6.5 13.5a5.5 5.5 0 0011 0C17.5 10 15 8 15 8s.6 3.5-2.5 4.5C10.5 13 9 11.5 9 10 9 7 12 2 12 2z" fill={`url(#${id}-fg)`} />
      <path d="M12 13.5c0 0-1.2.6-1.2 2.2a1.2 1.2 0 002.4 0c0-1.6-1.2-2.2-1.2-2.2z" fill="#fff8c0" opacity="0.9" />
    </svg>
  );
}

function HeartIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`${id}-hg`} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff80b0" />
          <stop offset="100%" stopColor="#cc0044" />
        </linearGradient>
      </defs>
      <path d="M12 21C12 21 2.5 14 2.5 8.5a4.5 4.5 0 019-0.9 4.5 4.5 0 019 .9C20.5 14 12 21 12 21z" fill={`url(#${id}-hg)`} />
      <ellipse cx="9" cy="9" rx="1.8" ry="2.2" fill="white" opacity="0.2" transform="rotate(-25 9 9)" />
    </svg>
  );
}

function TargetIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
        <line key={deg} x1="12" y1="2" x2="12" y2="5.5" stroke="#00ff88" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${deg} 12 12)`} />
      ))}
    </svg>
  );
}

function SparklesIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`${id}-sg`} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path d="M12 2l1.8 5.4H20l-4.9 3.6 1.9 5.5L12 13l-5 3.5 1.9-5.5L4 7.4h6.2z" fill={`url(#${id}-sg)`} />
      <path d="M19.5 2l.7 2.2H22.5l-2 1.5.8 2.3L19.5 6.7 17.7 8l.8-2.3-2-1.5h2.3z" fill="#e879f9" opacity=".7" />
      <path d="M4.5 14l.7 2.2H7.7l-2 1.5.8 2.3L4.5 18.7l-1.8 1.3.8-2.3-2-1.5h2.3z" fill="#c084fc" opacity=".6" />
    </svg>
  );
}

function PhoenixIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" overflow="visible">
      <defs>
        <linearGradient id={`${id}-body`} x1="24" y1="42" x2="24" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cc2200" />
          <stop offset="40%" stopColor="#ff6600" />
          <stop offset="75%" stopColor="#ffcc00" />
          <stop offset="100%" stopColor="#fff5cc" />
        </linearGradient>
        <linearGradient id={`${id}-wing`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff9900" />
          <stop offset="100%" stopColor="#ff3300" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d="M24 24 C18 20, 8 22, 4 18 C8 28, 16 30, 24 28Z" fill={`url(#${id}-wing)`} style={{ transformOrigin: "24px 24px", animation: "ph-wing 2.4s ease-in-out infinite" }} />
      <path d="M24 24 C30 20, 40 22, 44 18 C40 28, 32 30, 24 28Z" fill={`url(#${id}-wing)`} style={{ transformOrigin: "24px 24px", animation: "ph-wing 2.4s ease-in-out 0.1s infinite" }} />
      <path d="M24 8 C21 14, 19 20, 20 28 C22 32, 26 32, 28 28 C29 20, 27 14, 24 8Z" fill={`url(#${id}-body)`} style={{ animation: "ph-body 2s ease-in-out infinite" }} />
      <path d="M22 28 C20 34, 16 38, 14 44" stroke="#ff6600" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="12 4" style={{ animation: "ph-tail 2s ease-in-out infinite" }} />
      <path d="M24 29 C24 35, 24 40, 24 45" stroke="#ff9900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M26 28 C28 34, 32 38, 34 44" stroke="#ffcc00" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="12 4" style={{ animation: "ph-tail 2s ease-in-out 0.3s infinite" }} />
      <circle cx="24" cy="13" r="1.5" fill="#fff5cc" />
      <circle cx="24" cy="13" r="0.7" fill="#ff3300" />
      {([[-5,-6],[6,-4],[-3,4],[7,-2],[2,6]] as [number,number][]).map(([ex,ey], i) => (
        <circle key={i} cx="24" cy="28" r="1.2" fill={i % 2 === 0 ? "#ff8800" : "#ffcc44"}
          style={{ "--ex": `${ex}px`, "--ey": `${ey * 4}px`, animation: `ph-ember ${1.2 + i * 0.3}s ease-out ${i * 0.25}s infinite` } as React.CSSProperties} />
      ))}
    </svg>
  );
}

function CompassIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ animation: "co-glow 2.5s ease-in-out infinite" }}>
      <defs>
        <linearGradient id={`${id}-north`} x1="24" y1="6" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00eeff" />
          <stop offset="100%" stopColor="#0066aa" />
        </linearGradient>
        <linearGradient id={`${id}-south`} x1="24" y1="24" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334455" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="#00d4ff" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="24" cy="24" r="21" stroke="#00d4ff" strokeWidth="0.5" fill="none" strokeDasharray="3 9" style={{ transformOrigin: "24px 24px", animation: "co-ring 20s linear infinite" }} />
      <circle cx="24" cy="24" r="17" stroke="#00aacc" strokeWidth="0.5" fill="rgba(0,20,35,0.6)" opacity="0.8" />
      {Array.from({ length: 36 }, (_, i) => (
        <line key={i} x1="24" y1="8" x2="24" y2={i % 9 === 0 ? 12 : 10} stroke="#00d4ff" strokeWidth={i % 9 === 0 ? 1.5 : 0.5} opacity={i % 9 === 0 ? 0.9 : 0.3} transform={`rotate(${i * 10} 24 24)`} />
      ))}
      {[{ l: "N", x: 24, y: 17, col: "#00eeff" }, { l: "S", x: 24, y: 35, col: "#446677" }, { l: "E", x: 35, y: 25, col: "#446677" }, { l: "W", x: 13, y: 25, col: "#446677" }].map(({ l, x, y, col }) => (
        <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={col} fontSize="5" fontFamily="monospace" fontWeight="bold">{l}</text>
      ))}
      <polygon points="24,8 21.5,24 24,22 26.5,24" fill={`url(#${id}-north)`} style={{ transformOrigin: "24px 24px", animation: "co-needle 3s ease-in-out infinite" }} />
      <polygon points="24,40 21.5,24 24,26 26.5,24" fill={`url(#${id}-south)`} style={{ transformOrigin: "24px 24px", animation: "co-needle 3s ease-in-out infinite" }} />
      <circle cx="24" cy="24" r="3" fill="#001a2e" stroke="#00d4ff" strokeWidth="1" />
      <circle cx="24" cy="24" r="1.2" fill="#00d4ff" />
    </svg>
  );
}

function CitadelIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ animation: "ci-pulse 2.5s ease-in-out infinite" }}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="24" y1="48" x2="24" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#002b1a" />
          <stop offset="100%" stopColor="#00442a" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="8" y="4" width="32" height="44" />
        </clipPath>
      </defs>
      <rect x="10" y="18" width="28" height="28" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />
      <rect x="10" y="10" width="6" height="10" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />
      <rect x="21" y="6" width="6" height="13" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />
      <rect x="32" y="10" width="6" height="10" fill={`url(#${id}-wall)`} stroke="#00ff88" strokeWidth="1" />
      <path d="M20 46 L20 34 Q24 30 28 34 L28 46Z" fill="#001a10" stroke="#00cc66" strokeWidth="0.8" />
      <rect x="21.5" y="22" width="5" height="6" rx="0.5" fill="#00ff88" style={{ animation: "ci-blink 4s ease-in-out infinite" }} />
      <rect x="21.5" y="22" width="5" height="6" rx="0.5" fill="none" stroke="#00ff44" strokeWidth="0.5" />
      {[15, 29].map((x, i) => (
        <rect key={i} x={x} y="28" width="4" height="5" rx="0.5" fill="#003320" stroke="#00aa55" strokeWidth="0.5" style={{ animation: `ci-blink ${3 + i}s ease-in-out ${i * 1.5}s infinite` }} />
      ))}
      <line x1="10" y1="0" x2="38" y2="0" stroke="#00ff88" strokeWidth="1.5" opacity="0.6" clipPath={`url(#${id}-clip)`} style={{ animation: "ci-scan 2.5s ease-in-out infinite" }} />
      <line x1="24" y1="6" x2="24" y2="2" stroke="#00ff88" strokeWidth="1" />
      <path d="M24 2 L30 3.5 L24 5Z" fill="#00ff88" opacity="0.8" />
    </svg>
  );
}

function VortexIcon({ id, size }: { id: string; size: number }) {
  const rings = [
    { r: 20, dash: "8 6", speed: "8s", w: 1.5, col: "#7c3aed", dir: "cw" },
    { r: 14, dash: "5 8", speed: "5s", w: 2, col: "#a855f7", dir: "ccw" },
    { r: 8, dash: "3 5", speed: "3s", w: 2.5, col: "#c084fc", dir: "cw" },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdf4ff" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#3b0764" />
        </radialGradient>
      </defs>
      {rings.map(({ r, dash, speed, w, col, dir }, i) => (
        <circle key={i} cx="24" cy="24" r={r} stroke={col} strokeWidth={w} fill="none" strokeDasharray={dash} strokeLinecap="round"
          style={{ transformOrigin: "24px 24px", animation: `vo-${dir} ${speed} linear infinite`, opacity: 0.75 + i * 0.08 }} />
      ))}
      {[0, 90, 180, 270].map((deg, i) => (
        <circle key={i} cx="24" cy="4" r="2" fill="#a855f7" transform={`rotate(${deg} 24 24)`} opacity="0.9" />
      ))}
      <circle cx="24" cy="24" r="4" fill={`url(#${id}-core)`} style={{ animation: "vo-core 2s ease-in-out infinite" }} />
      <circle cx="24" cy="24" r="1.5" fill="white" opacity="0.95" />
    </svg>
  );
}

function ShieldIcon({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" overflow="visible">
      <defs>
        <linearGradient id={`${id}-sh`} x1="24" y1="4" x2="24" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="50%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0c1a4f" />
        </linearGradient>
        <linearGradient id={`${id}-bolt`} x1="22" y1="14" x2="26" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="50%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      {[16, 21].map((r, i) => (
        <circle key={i} cx="24" cy="24" r={r} stroke="#38bdf8" strokeWidth="1" fill="none"
          style={{ animation: `sh-ring ${1.8 + i * 0.6}s ease-out ${i * 0.9}s infinite` }} />
      ))}
      <path d="M24 4 L40 11 L40 26 Q40 38 24 46 Q8 38 8 26 L8 11 Z" fill={`url(#${id}-sh)`} stroke="#38bdf8" strokeWidth="1.2"
        style={{ animation: "sh-charge 2.5s ease-in-out infinite" }} />
      <path d="M24 6 L38 12 L38 20 Q24 14 12 20 L12 12 Z" fill="white" opacity="0.06" />
      <path d="M16 20 L32 20" stroke="#38bdf8" strokeWidth="0.5" opacity="0.3" />
      <path d="M14 26 L34 26" stroke="#38bdf8" strokeWidth="0.5" opacity="0.2" />
      <path d="M26 14 L20 25 L24 25 L22 34 L28 23 L24 23 Z" fill={`url(#${id}-bolt)`} style={{ animation: "sh-bolt 3s ease-in-out infinite" }} />
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
  phoenix: {
    Icon: PhoenixIcon,
    color: "#ff6600",
    outerGlow: "radial-gradient(circle, rgba(255,102,0,0.3) 0%, rgba(255,50,0,0.08) 55%, transparent 70%)",
    iconAnimation: "none",
    iconTransformOrigin: "center",
  },
  compass: {
    Icon: CompassIcon,
    color: "#00d4ff",
    outerGlow: "radial-gradient(circle, rgba(0,212,255,0.3) 0%, rgba(0,150,200,0.08) 55%, transparent 70%)",
    iconAnimation: "none",
    iconTransformOrigin: "center",
  },
  citadel: {
    Icon: CitadelIcon,
    color: "#00ff88",
    outerGlow: "radial-gradient(circle, rgba(0,255,136,0.25) 0%, rgba(0,180,80,0.06) 55%, transparent 70%)",
    iconAnimation: "none",
    iconTransformOrigin: "center",
  },
  vortex: {
    Icon: VortexIcon,
    color: "#a855f7",
    outerGlow: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(100,40,200,0.08) 55%, transparent 70%)",
    iconAnimation: "none",
    iconTransformOrigin: "center",
  },
  shield: {
    Icon: ShieldIcon,
    color: "#38bdf8",
    outerGlow: "radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(30,140,200,0.08) 55%, transparent 70%)",
    iconAnimation: "none",
    iconTransformOrigin: "center",
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
