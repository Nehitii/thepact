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
import { cn } from "@/socle/outils/utils";
import { FlameIcon, HeartIcon, TargetIcon, SparklesIcon, PhoenixIcon, CompassIcon, CitadelIcon, VortexIcon, ShieldIcon } from "@/domaines/objectifs/composants/IconesPacte";
import { Ember, StarFlash } from "@/domaines/objectifs/composants/EtincellesPacte";

// ─── types ────────────────────────────────────────────────────────────────────

interface PactVisualProps {
  symbol?: string;
  progress?: number;
  /**
   * L ELAN, de 0 a 1 — a quel rythme le logo bat.
   *
   * Les anneaux du vortex tournaient a 8, 5 et 3 secondes, toujours,
   * quoi qu il arrive dans le pacte. Un logo qui ondule sans rien
   * dire est un economiseur d ecran pose sur un tableau de bord.
   *
   * A un, il bat a sa cadence d origine ; a zero, il tourne trois
   * fois plus lentement — presque immobile. Ce n est pas une jauge :
   * on ne lit pas un nombre dans une vitesse. C est un ETAT, qu on
   * sent avant de le lire — et `titre` donne le nombre a qui regarde.
   */
  elan?: number;
  /** Ce que le logo raconte, en toutes lettres. */
  titre?: string;
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

/* LES TROIS ANNEAUX BATTENT AU RYTHME DU PACTE.

   Ils tournaient a 8, 5 et 3 secondes, toujours. Les durees passent
   par `--pv-cadence` : au plein elan rien ne change, a l arret le
   vortex tourne trois fois plus lentement. Ce que l on voit alors
   n est pas un chiffre — c est un pacte qui ralentit. */

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

// ─── PactVisual ───────────────────────────────────────────────────────────────

let _styleInjected = false;

export function PactVisual({ symbol = "flame", progress = 0, size = "lg", className, elan, titre }: PactVisualProps) {
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

  /* La cadence multiplie les durees d animation : 1 au plein elan,
     3 a l arret. Une propriete personnalisee plutot qu un calcul par
     anneau — la feuille de style la lit ou elle en a besoin, et les
     symboles qui ne s en servent pas ne changent pas. */
  const cadence = elan == null ? 1 : 1 + (1 - Math.min(1, Math.max(0, elan))) * 2;

  return (
    <div
      className={cn("relative inline-block overflow-visible", className)}
      style={{ padding: s.p, ["--pv-cadence" as string]: String(cadence) }}
      {...(titre ? { role: "img", "aria-label": titre, title: titre } : {})}
    >
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
      <div className="relative" style={{ filter: `drop-shadow(0 0 14px ${color}66) drop-shadow(0 0 28px ${color}44)` }}>
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

      {/* ── ember particles (flame) ── */}
      {hasEmbers && [0, 1, 2, 3, 4].map((i) => <Ember key={i} color={color} index={i} />)}
    </div>
  );
}
