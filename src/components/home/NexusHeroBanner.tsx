import { useMemo } from "react";
import { CornerBrackets } from "./CornerBrackets";
import { PactVisual } from "@/components/PactVisual";
import { RankCore } from "./RankCore";

const FONT_MAP: Record<string, string> = {
  orbitron: "'Orbitron', sans-serif",
  rajdhani: "'Rajdhani', sans-serif",
  "share-tech-mono": "'Share Tech Mono', monospace",
  "space-grotesk": "'Space Grotesk', sans-serif",
  inter: "'Inter', sans-serif",
};

const EFFECT_STYLES: Record<string, React.CSSProperties> = {
  none: {},
  "cyan-glow": { textShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
  "fire-glow": { textShadow: "0 0 8px rgba(255,106,0,0.7), 0 0 30px rgba(255,60,0,0.25)" },
  "purple-glow": { textShadow: "0 0 8px rgba(168,85,247,0.7), 0 0 30px rgba(168,85,247,0.25)" },
  "gold-glow": { textShadow: "0 0 8px rgba(255,200,0,0.7), 0 0 30px rgba(255,200,0,0.25)" },
  glitch: { animation: "glitchReveal 1.6s ease-out forwards" },
};

interface NexusHeroBannerProps {
  progression: number;
  level: number;
  totalMissions: number;
  activeDays: number;
  pactName?: string;
  pactMantra?: string;
  pactSymbol?: string;
  titleFont?: string | null;
  titleEffect?: string | null;
  /** Rang, integre dans un coin du bandeau plutot que dans un panneau
   *  separe : il repetait le niveau deja affiche dans les statistiques,
   *  et son nom trois fois dans ses propres 355px. */
  rankName?: string;
  nextRankName?: string | null;
  rankProgress?: number;
  rankXP?: number;
  rankXPTarget?: number;
}

export function NexusHeroBanner({
  progression,
  level,
  totalMissions,
  activeDays,
  pactName,
  pactMantra,
  pactSymbol = "flame",
  titleFont = "orbitron",
  titleEffect = "none",
  rankName,
  nextRankName,
  rankProgress = 0,
  rankXP = 0,
  rankXPTarget = 0,
}: NexusHeroBannerProps) {
  const stats = useMemo(() => [
    { value: `${Math.round(progression)}%`, label: "PROGRESSION", color: "hsl(var(--ds-accent-primary))", glow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
    { value: `LVL ${level}`, label: "RANG", color: "hsl(var(--ds-accent-primary))", glow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
    { value: String(totalMissions), label: "MISSIONS", color: "hsl(var(--ds-accent-primary))", glow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
    { value: String(activeDays), label: "JOURS ACTIFS", color: "#ff8c00", glow: "0 0 8px rgba(255,140,0,0.7), 0 0 30px rgba(255,140,0,0.25)" },
  ], [progression, level, totalMissions, activeDays]);

  const fontFamily = FONT_MAP[titleFont || "orbitron"] || FONT_MAP.orbitron;
  const effectStyle = EFFECT_STYLES[titleEffect || "none"] || {};

  // La Singularite tire ses trois parametres des donnees reelles du pacte.
  // Sans cela, ce ne serait qu'un economiseur d'ecran.
  const singularity = useMemo(() => {
    // Respiration : plus la serie est longue, plus le rythme ralentit et
    // s'approfondit. 5s au premier jour, 13s au plafond — un organisme au
    // repos, pas un gyrophare. Le palier de 400 jours evite qu'une serie
    // exceptionnelle fige le c\oeur.
    const breath = 5 + Math.min(activeDays, 400) / 50;
    // Luminosite : a 0% le c\oeur couve, a 100% il rayonne. Le plancher de
    // 0.45 garantit qu'un pacte qui demarre reste visible.
    const lum = 0.45 + Math.min(Math.max(progression, 0), 100) / 100 * 0.55;
    return {
      "--sing-breath": `${breath.toFixed(1)}s`,
      "--sing-lum": lum.toFixed(3),
      "--sing-progress": `${Math.min(Math.max(progression, 0), 100)}%`,
    } as React.CSSProperties;
  }, [activeDays, progression]);

  return (
    <div
      className="singularity-stage"
      style={{
        ...singularity,
        background: "var(--nexus-bg)",
        border: "1px solid var(--nexus-border)",
        borderRadius: 4,
        boxShadow: "var(--nexus-shadow)",
        padding: "48px 40px",
        textAlign: "center",
      }}
    >
      <CornerBrackets />

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top" />

      {/* NOYAU DE RANG — variante retenue apres maquette. Il occupait
          355px en panneau separe, puis quatre lignes trop maigres dans ce
          coin. Il devient un satellite du c(oe)ur : meme construction,
          plus petite echelle. Masque sous 1024px, ou la place est prise. */}
      {rankName && (
        <div className="absolute top-5 right-6 z-20 hidden lg:block">
          <RankCore
            level={level}
            rankName={rankName}
            nextRankName={nextRankName}
            progress={rankProgress}
            currentXP={rankXP}
            targetXP={rankXPTarget}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center">
        {/* Le c\oeur. L'anneau d'accretion EST la jauge de progression :
            elle n'est plus un chiffre pose a cote d'un dessin. Le symbole
            du pacte se tient au centre, dans la lumiere du noyau. */}
        <div className="singularity-core mb-6">
          <div className="singularity-influx" />
          <div className="singularity-flare" />
          <div className="singularity-corona" />
          <div className="singularity-nucleus" />
          <div className="singularity-ring" />
          <div className="relative" style={{ zIndex: 4 }}>
            <PactVisual symbol={pactSymbol} size="sm" progress={progression} />
          </div>
        </div>

        {/* Pact Title */}
        <h1
          style={{
            fontFamily,
            fontSize: "clamp(28px, 5vw, 58px)",
            fontWeight: 900,
            letterSpacing: 6,
            textTransform: "uppercase" as const,
            color: "var(--nexus-heading)",
            lineHeight: 1.1,
            ...effectStyle,
          }}
        >
          {pactName || "NEXUS OS"}
        </h1>

        {/* Pact Mantra */}
        <p
          style={{
            fontWeight: 300,
            fontSize: 13,
            letterSpacing: 4,
            color: "var(--nexus-text-dim)",
            textTransform: "uppercase" as const,
            marginTop: 10,
            maxWidth: 500,
          }}
        >
          {pactMantra || "Neural Execution & Unified Experience System"}
        </p>

        {/* Stats row */}
        <div className="flex justify-center flex-wrap" style={{ gap: 48, marginTop: 32 }}>
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 24,
                  color: s.color,
                  textShadow: s.glow,
                }}
              >
                {s.value}
              </span>
              <span
                style={{
                  fontSize: "max(11px, 0.6875rem)",
                  letterSpacing: 3,
                  color: "var(--nexus-text-dim)",
                  textTransform: "uppercase" as const,
                  marginTop: 4,
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes logoPulse {
          0%,100%{box-shadow:0 0 14px rgba(0,212,255,0.8),0 0 50px rgba(0,212,255,0.2)}
          50%{box-shadow:0 0 24px rgba(0,212,255,1),0 0 80px rgba(0,212,255,0.4)}
        }
        @keyframes glitchReveal {
          0%{opacity:0;clip-path:inset(0 100% 0 0)}
          60%{clip-path:inset(0 0 0 0)}
          65%{clip-path:inset(3px 0 0 0);transform:skewX(-1deg)}
          70%{clip-path:inset(0 0 0 0);transform:skewX(0)}
          75%{clip-path:inset(6px 0 2px 0)}
          80%{clip-path:inset(0 0 0 0)}
          100%{opacity:1}
        }
      `}</style>
    </div>
  );
}
