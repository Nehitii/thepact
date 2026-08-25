import { useMemo } from "react";
import { CornerBrackets } from "./CornerBrackets";
import { PactVisual } from "@/components/PactVisual";
import { RankCore } from "./RankCore";

const FONT_MAP: Record<string, string> = {
  orbitron: "'Orbitron', sans-serif",
  rajdhani: "'Rajdhani', sans-serif",
  "share-tech-mono": "'JetBrains Mono', ui-monospace, monospace",
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

/** Ce que compte le pourcentage de progression. */
export type MesureProgression = "goals" | "steps";

/** La cle de retenue, partagee avec la page qui la lit. */
export const CLE_MESURE = "vowpact.hub.mesureProgression";

interface NexusHeroBannerProps {
  progression: number;
  /** Objectifs atteints, ou etapes franchies. */
  mesure?: MesureProgression;
  /** Bascule d une mesure a l autre. Absent : la valeur n est pas cliquable. */
  onChangerMesure?: () => void;
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
  /** Combien d objectifs sont reellement en cours. Le logo bat avec. */
  enCours?: number;
}

export function NexusHeroBanner({
  progression,
  mesure = "goals",
  onChangerMesure,
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
  enCours = 0,
}: NexusHeroBannerProps) {
  const stats = useMemo(() => [
    /* Le libelle dit CE QUI est compte : un pourcentage nu ne se lit
       pas, et deux mesures differentes affichees pareil se confondent
       d une session a l autre. */
    {
      value: `${Math.round(progression)}%`,
      label: mesure === "steps" ? "ÉTAPES FRANCHIES" : "OBJECTIFS ATTEINTS",
      color: "hsl(var(--ds-accent-primary))",
      glow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)",
      bascule: onChangerMesure,
      titre: mesure === "steps"
        ? "Compter les objectifs atteints à la place"
        : "Compter les étapes franchies à la place",
    },
    { value: `LVL ${level}`, label: "RANG", color: "hsl(var(--ds-accent-primary))", glow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
    { value: String(totalMissions), label: "MISSIONS", color: "hsl(var(--ds-accent-primary))", glow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
    { value: String(activeDays), label: "JOURS ACTIFS", color: "#ff8c00", glow: "0 0 8px rgba(255,140,0,0.7), 0 0 30px rgba(255,140,0,0.25)" },
  ], [progression, mesure, onChangerMesure, level, totalMissions, activeDays]);

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
            {/* LE LOGO DIT CE QUI EST EN COURS.

                Il ondulait a vide — trois anneaux a 8, 5 et 3 secondes,
                quoi qu il arrive. Or rien sur ce hub ne montrait la
                charge VIVE du pacte : la progression dit le chemin fait,
                le rang dit l experience, les missions le total, les jours
                actifs l anciennete. Aucun ne dit ce qui est ouvert.

                Cinq chantiers ouverts font le plein elan : au-dela le
                logo ne tournerait pas plus vite pour rien dire de plus.
                Zero, et il ralentit jusqu a presque s arreter — un pacte
                au repos, ce qui est en soi une information. */}
            <PactVisual
              symbol={pactSymbol}
              size="sm"
              progress={progression}
              elan={Math.min(1, enCours / 5)}
              titre={
                enCours > 0
                  ? `${enCours} ${enCours > 1 ? "objectifs en cours" : "objectif en cours"}`
                  : "Aucun objectif en cours"
              }
            />
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
          {stats.map((s) => {
            /* Celle qui se bascule est un vrai bouton : elle repond au
               clavier, s annonce comme cliquable, et dit ou elle mene.
               Un <div onClick> ne fait aucun des trois. */
            const Cadre = s.bascule ? "button" : "div";
            return (
            <Cadre
              key={s.label}
              {...(s.bascule
                ? { type: "button" as const, onClick: s.bascule, title: s.titre, "aria-label": s.titre }
                : {})}
              className={
                "flex flex-col items-center" +
                (s.bascule
                  ? " cursor-pointer rounded-sm px-2 -mx-2 transition-colors hover:bg-primary/[0.07] focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary/60"
                  : "")
              }
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
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
            </Cadre>
            );
          })}
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
