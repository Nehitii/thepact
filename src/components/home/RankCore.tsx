interface RankCoreProps {
  level: number;
  rankName: string;
  /** Rang suivant, ou null au palier maximal. */
  nextRankName?: string | null;
  /** Avancement dans le rang courant, en pourcentage. */
  progress: number;
  currentXP: number;
  targetXP: number;
}

/**
 * Noyau de rang.
 *
 * Remplace le panneau de 355px qui repetait le nom du rang trois fois
 * et le niveau deja present dans les statistiques du hub, puis la ligne
 * discrete qui lui avait succede dans le coin du bandeau — trop maigre
 * pour ce qu'elle porte.
 *
 * Construit dans la grammaire de la Singularite : lueur qui respire,
 * graduations radiales, arc d'avancement en conic-gradient. L'XP est un
 * arc et non une barre, pour que la page montre toutes ses progressions
 * de la meme facon — du c(oe)ur d'etoile jusqu'aux quetes du jour.
 */
export function RankCore({
  level,
  rankName,
  nextRankName,
  progress,
  currentXP,
  targetXP,
}: RankCoreProps) {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="rank-core" style={{ ["--rank-pct" as string]: `${pct}%` }}>
        <div className="rank-core-glow" aria-hidden="true" />
        <div className="rank-core-ticks" aria-hidden="true" />
        <div className="rank-core-arc" aria-hidden="true" />
        <div className="rank-core-center">
          <b>{level}</b>
          <i
            className="ds-t-label font-mono not-italic"
            style={{ letterSpacing: 3, color: "var(--nexus-text-dimmer)" }}
          >
            NIVEAU
          </i>
        </div>
      </div>

      <span
        className="font-orbitron uppercase truncate max-w-[10rem] text-center"
        style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          letterSpacing: 2,
          color: "hsl(var(--primary))",
          textShadow: "0 0 14px hsl(var(--primary) / 0.55)",
        }}
      >
        {rankName}
      </span>

      <span
        className="flex flex-col items-center gap-0.5 pt-1.5 w-full"
        style={{ borderTop: "1px solid hsl(var(--primary) / 0.14)" }}
      >
        <span
          className="ds-t-label font-mono"
          style={{ letterSpacing: 1.4, color: "var(--nexus-text-dim)", fontVariantNumeric: "tabular-nums" }}
        >
          {currentXP.toLocaleString("fr-FR")}
          {targetXP > 0 && ` / ${targetXP.toLocaleString("fr-FR")}`} XP
        </span>
        <span
          className="ds-t-label font-mono truncate max-w-[10rem]"
          style={{ letterSpacing: 1.4, color: "var(--nexus-text-dimmer)" }}
        >
          {nextRankName ? `PROCHAIN · ${nextRankName}` : "RANG MAXIMAL"}
        </span>
      </span>
    </div>
  );
}
