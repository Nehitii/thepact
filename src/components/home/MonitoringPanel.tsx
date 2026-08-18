import { useMemo } from "react";

interface MonitoringData {
  goalsCompleted: number;
  totalGoals: number;
  totalStepsCompleted: number;
  totalSteps: number;
  completedHabitChecks: number;
  totalHabitChecks: number;
}

interface DifficultyProgress {
  difficulty: string;
  completed: number;
  total: number;
  percentage: number;
}

interface MonitoringPanelProps {
  data: MonitoringData;
  difficultyProgress: DifficultyProgress[];
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  customDifficultyName?: string;
  customDifficultyColor?: string;
}

const ORDRE = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
const COULEURS: Record<string, string> = {
  easy: "#00ff88", medium: "#00d4ff", hard: "#ff8c00",
  extreme: "#ff3366", impossible: "#cc00ff", custom: "#ff00aa",
};
const NOMS: Record<string, string> = {
  easy: "EASY", medium: "MEDIUM", hard: "HARD",
  extreme: "EXTREME", impossible: "IMPOSSIBLE", custom: "ANANTA",
};

/** Jauge annulaire. Meme construction que l'anneau d'accretion du hub :
 *  conic-gradient arrete au pourcentage reel, masque en couronne. */
function Jauge({ valeur, total, libelle, couleur }: {
  valeur: number; total: number; libelle: string; couleur: string;
}) {
  const pct = total > 0 ? Math.round((valeur / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span
        className="quest-ring shrink-0"
        style={{
          ["--q-c" as string]: couleur,
          ["--q-pct" as string]: `${pct}%`,
          width: "2.9rem",
          height: "2.9rem",
        }}
      >
        <span
          className="font-mono"
          style={{ fontSize: "max(11px, 0.6875rem)", color: couleur, fontVariantNumeric: "tabular-nums" }}
        >
          {pct}%
        </span>
      </span>
      <span className="flex flex-col leading-tight min-w-0">
        <span
          className="ds-t-label font-orbitron uppercase truncate"
          style={{ letterSpacing: 2, color: "var(--nexus-text-label)" }}
        >
          {libelle}
        </span>
        <span
          className="ds-t-label font-mono"
          style={{ color: "var(--nexus-text-dimmer)", fontVariantNumeric: "tabular-nums" }}
        >
          {valeur} / {total}
        </span>
      </span>
    </div>
  );
}

/**
 * Monitoring — carte unique.
 *
 * Fusionne "Monitoring Global" (714px) et "L'Echelle Ananta" (442px),
 * soit 1156px pour deux coupes des MEMES 38 objectifs : l'une par type
 * (objectifs, etapes, habitudes), l'autre par difficulte. Deux panneaux
 * separes obligeaient a faire le rapprochement de tete.
 *
 * Ici les trois jauges donnent l'avancement, la rangee de difficultes
 * donne sa repartition, et la frise donne le temps. Une seule carte,
 * trois lectures, qui se completent au lieu de se repeter.
 */
export function MonitoringPanel({
  data,
  difficultyProgress,
  projectStartDate,
  projectEndDate,
  customDifficultyName,
  customDifficultyColor,
}: MonitoringPanelProps) {
  const frise = useMemo(() => {
    if (!projectStartDate || !projectEndDate) return null;
    const debut = new Date(projectStartDate).getTime();
    const fin = new Date(projectEndDate).getTime();
    if (!(fin > debut)) return null;
    const total = Math.round((fin - debut) / 86400000);
    const ecoule = Math.max(0, Math.min(total, Math.round((Date.now() - debut) / 86400000)));
    const pct = Math.round((ecoule / total) * 100);
    const phase =
      pct < 25 ? "PHASE INITIALE" : pct < 50 ? "PHASE DE CROISIÈRE"
      : pct < 75 ? "PHASE AVANCÉE" : "PHASE FINALE";
    return { total, ecoule, pct, phase };
  }, [projectStartDate, projectEndDate]);

  const difficultes = useMemo(
    () =>
      ORDRE.map((d) => difficultyProgress.find((p) => p.difficulty === d))
        .filter((p): p is DifficultyProgress => !!p && p.total > 0),
    [difficultyProgress],
  );

  return (
    <div
      /* h-full + colonne repartie : place cote a cote avec le compte a
         rebours, ce panneau doit remplir la meme hauteur, et son contenu
         se distribuer plutot que de s.entasser en haut. */
      className="relative overflow-hidden h-full flex flex-col"
      style={{
        background: "var(--nexus-bg)",
        border: "1px solid var(--nexus-border)",
        borderRadius: 4,
        boxShadow: "var(--nexus-shadow)",
        padding: "18px 20px",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top" />

      <div className="flex items-center gap-3 mb-4">
        <span
          className="ds-t-label font-mono uppercase shrink-0"
          style={{ letterSpacing: 3, color: "var(--nexus-text-dim)" }}
        >
          // Monitoring
        </span>
        <span className="flex-1 h-px" style={{ background: "linear-gradient(90deg, var(--nexus-separator), transparent)" }} />
        {frise && (
          <span
            className="ds-t-label font-mono shrink-0"
            style={{ letterSpacing: 1.5, color: "hsl(var(--primary))" }}
          >
            JOUR {frise.ecoule} / {frise.total} — {frise.phase}
          </span>
        )}
      </div>

      {/* Avancement, par type d objet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 flex-1 content-center">
        <Jauge valeur={data.goalsCompleted} total={data.totalGoals} libelle="Objectifs" couleur="#00d4ff" />
        <Jauge valeur={data.totalStepsCompleted} total={data.totalSteps} libelle="Étapes" couleur="#ffab00" />
        <Jauge valeur={data.completedHabitChecks} total={data.totalHabitChecks} libelle="Habitudes" couleur="#00ff88" />
      </div>

      {/* Repartition, par difficulte. Une rangee de barres verticales
          plutot que six cartes : c'est une distribution, elle se lit
          d'un coup ou pas du tout. */}
      {difficultes.length > 0 && (
        <div className="flex items-end gap-1.5 mb-5" style={{ height: 58 }}>
          {difficultes.map((d) => {
            const couleur = d.difficulty === "custom" ? (customDifficultyColor || COULEURS.custom) : COULEURS[d.difficulty];
            const nom = d.difficulty === "custom" ? (customDifficultyName || NOMS.custom) : NOMS[d.difficulty];
            const max = Math.max(...difficultes.map((x) => x.total));
            const hauteur = Math.max(12, (d.total / max) * 100);
            const remplie = d.total > 0 ? (d.completed / d.total) * 100 : 0;
            return (
              <div
                key={d.difficulty}
                className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
                title={`${nom} — ${d.completed} / ${d.total}`}
              >
                <span
                  className="ds-t-label font-mono"
                  style={{ color: couleur, fontVariantNumeric: "tabular-nums" }}
                >
                  {d.completed}/{d.total}
                </span>
                <span
                  className="w-full relative overflow-hidden"
                  style={{
                    height: `${hauteur}%`,
                    minHeight: 10,
                    background: `color-mix(in srgb, ${couleur} 14%, transparent)`,
                    borderTop: `1px solid color-mix(in srgb, ${couleur} 45%, transparent)`,
                    borderRadius: 1,
                  }}
                >
                  <span
                    className="absolute inset-x-0 bottom-0"
                    style={{
                      height: `${remplie}%`,
                      background: `linear-gradient(180deg, ${couleur}, color-mix(in srgb, ${couleur} 45%, transparent))`,
                      boxShadow: `0 0 8px color-mix(in srgb, ${couleur} 55%, transparent)`,
                      transition: "height 900ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </span>
                <span
                  className="ds-t-label font-mono truncate w-full text-center"
                  style={{ letterSpacing: 0.5, color: "var(--nexus-text-dimmer)" }}
                >
                  {nom}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* La frise du cycle */}
      {frise && (
        <div>
          <div
            className="relative overflow-hidden"
            style={{ height: 5, background: "hsl(var(--primary) / 0.1)", borderRadius: 2 }}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${frise.pct}%`,
                background: "linear-gradient(90deg, hsl(var(--primary) / 0.35), hsl(var(--primary)))",
                boxShadow: "0 0 10px hsl(var(--primary) / 0.6)",
                borderRadius: 2,
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {[`J.1`, `J.${Math.round(frise.total * 0.5)}`, `▶ J.${frise.ecoule}`, `J.${frise.total}`].map((m, i) => (
              <span
                key={m}
                className="ds-t-label font-mono"
                style={{ letterSpacing: 1, color: i === 2 ? "hsl(var(--primary))" : "var(--nexus-marker-dim)" }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
