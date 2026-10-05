import { useMemo, useState } from "react";

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
  /** Volume d'etapes du palier. C'est lui qui fait le radar : compter les
   *  objectifs termines ment — MEDIUM affiche 0/5 alors que 21 de ses 27
   *  etapes sont faites. */
  totalSteps?: number;
  completedSteps?: number;
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

const CLE_VUE = "vowpact.monitoring.vue";
type Vue = "radar" | "diagnostic";

/**
 * Monitoring — deux vues d'une meme lecture.
 *
 * RADAR : une signature en toile d'araignee sur un axe par difficulte,
 * mesuree en ETAPES et non en objectifs termines. La difference n'est
 * pas cosmetique : compter les objectifs finis fait passer MEDIUM pour
 * 0 % alors que 21 de ses 27 etapes sont validees. La forme du polygone
 * dit d'un coup ou l'effort porte et ou il manque.
 *
 * DIAGNOSTIC : le meme etat en vidage systeme, ligne a ligne, avec les
 * ecarts chiffres. Ce que le radar montre, le diagnostic l'enonce.
 *
 * La vue choisie est gardee en localStorage : c'est une preference de
 * lecture, elle n'a pas a etre reprise a chaque visite.
 */
export function MonitoringPanel({
  data,
  difficultyProgress,
  projectStartDate,
  projectEndDate,
  customDifficultyName,
  customDifficultyColor,
}: MonitoringPanelProps) {
  const [vue, setVue] = useState<Vue>(() => {
    if (typeof window === "undefined") return "radar";
    return (localStorage.getItem(CLE_VUE) as Vue) || "radar";
  });

  const changerVue = (v: Vue) => {
    setVue(v);
    try { localStorage.setItem(CLE_VUE, v); } catch { /* mode prive */ }
  };

  const frise = useMemo(() => {
    if (!projectStartDate || !projectEndDate) return null;
    const debut = new Date(projectStartDate).getTime();
    const fin = new Date(projectEndDate).getTime();
    if (!(fin > debut)) return null;
    const total = Math.round((fin - debut) / 86400000);
    const ecoule = Math.max(0, Math.min(total, Math.round((Date.now() - debut) / 86400000)));
    return { total, ecoule, pct: (ecoule / total) * 100 };
  }, [projectStartDate, projectEndDate]);

  const axes = useMemo(
    () =>
      ORDRE.map((d) => difficultyProgress.find((p) => p.difficulty === d))
        .filter((p): p is DifficultyProgress => !!p && (p.totalSteps ?? 0) > 0)
        .map((p) => {
          const etapes = p.totalSteps ?? 0;
          const faites = p.completedSteps ?? 0;
          return {
            cle: p.difficulty,
            nom: p.difficulty === "custom" ? (customDifficultyName || NOMS.custom) : NOMS[p.difficulty],
            couleur: p.difficulty === "custom" ? (customDifficultyColor || COULEURS.custom) : COULEURS[p.difficulty],
            pct: etapes > 0 ? Math.round((faites / etapes) * 100) : 0,
            faites, etapes,
            objectifs: `${p.completed}/${p.total}`,
          };
        }),
    [difficultyProgress, customDifficultyName, customDifficultyColor],
  );

  const pctObjectifs = data.totalGoals > 0 ? (data.goalsCompleted / data.totalGoals) * 100 : 0;
  const pctEtapes = data.totalSteps > 0 ? (data.totalStepsCompleted / data.totalSteps) * 100 : 0;
  const pctHabitudes = data.totalHabitChecks > 0 ? (data.completedHabitChecks / data.totalHabitChecks) * 100 : 0;
  const ecart = frise ? pctObjectifs - frise.pct : null;

  /* Le palier qui porte le plus de volume restant : c'est la ou se joue
     la suite, et rien dans l'ancien panneau ne le disait. */
  const critique = useMemo(() => {
    if (!axes.length) return null;
    return axes.reduce((a, b) => (b.etapes - b.faites > a.etapes - a.faites ? b : a));
  }, [axes]);
  const volumeTotal = axes.reduce((s, a) => s + a.etapes, 0);

  return (
    <div
      className="relative overflow-hidden h-full flex flex-col"
      style={{
        background: "var(--nexus-bg)",
        border: "1px solid var(--nexus-border)",
        borderRadius: 4,
        boxShadow: "var(--nexus-shadow)",
        padding: "16px 18px",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top" />

      <div className="flex items-center gap-3 mb-3">
        <span
          className="ds-t-label font-mono uppercase shrink-0"
          style={{ letterSpacing: 3, color: "var(--nexus-text-dim)" }}
        >
          // Monitoring
        </span>
        <span className="flex-1 h-px" style={{ background: "linear-gradient(90deg, var(--nexus-separator), transparent)" }} />

        {/* Bascule de vue */}
        <span className="mon-switch shrink-0">
          {(["radar", "diagnostic"] as Vue[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => changerVue(v)}
              aria-pressed={vue === v}
              className="mon-switch-btn"
              data-actif={vue === v}
            >
              {v === "radar" ? "Radar" : "Diag"}
            </button>
          ))}
        </span>
      </div>

      {vue === "radar" ? (
        <RadarView axes={axes} frise={frise} critique={critique} volumeTotal={volumeTotal} />
      ) : (
        <DiagnosticView
          axes={axes}
          frise={frise}
          pctObjectifs={pctObjectifs}
          pctEtapes={pctEtapes}
          pctHabitudes={pctHabitudes}
          ecart={ecart}
          critique={critique}
          volumeTotal={volumeTotal}
          data={data}
        />
      )}
    </div>
  );
}

/* ── Vue radar ─────────────────────────────────────────────────── */
function RadarView({ axes, frise, critique, volumeTotal }: {
  axes: ReturnType<typeof Object> & any[];
  frise: { total: number; ecoule: number; pct: number } | null;
  critique: any;
  volumeTotal: number;
}) {
  const C = 150, R = 96, n = axes.length;
  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const;
  };
  const chemin = (r: (i: number) => number) =>
    axes.map((_, i) => pt(i, r(i)).map((v) => v.toFixed(1)).join(",")).join(" ");

  if (!n) {
    return (
      <p className="ds-t-label font-mono flex-1 grid place-items-center" style={{ color: "var(--nexus-text-dimmer)" }}>
        Aucune étape enregistrée.
      </p>
    );
  }

  return (
    <>
      <div className="flex-1 grid place-items-center min-h-0">
        <svg viewBox="0 0 300 300" className="mon-radar w-full h-full" style={{ maxHeight: 330 }} role="img"
             aria-label={`Avancement par difficulté : ${axes.map((a) => `${a.nom} ${a.pct}%`).join(", ")}`}>
          <defs>
            <linearGradient id="mon-sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((k) => (
            <polygon key={k} className="mon-grid" points={chemin(() => R * k)} />
          ))}
          {axes.map((_, i) => {
            const p = pt(i, R);
            return <line key={i} className="mon-axe" x1={C} y1={C} x2={p[0]} y2={p[1]} />;
          })}

          <g className="mon-sweep">
            <path d={`M${C} ${C} L${C + R + 22} ${C} A${R + 22} ${R + 22} 0 0 0 ${(C + Math.cos(-Math.PI / 3) * (R + 22)).toFixed(1)} ${(C + Math.sin(-Math.PI / 3) * (R + 22)).toFixed(1)} Z`}
                  fill="url(#mon-sweep)" />
          </g>

          <polygon className="mon-poly" points={chemin((i) => R * Math.max(0.03, axes[i].pct / 100))} />

          {axes.map((a, i) => {
            const p = pt(i, R * Math.max(0.03, a.pct / 100));
            return <circle key={a.cle} className="mon-pt" cx={p[0]} cy={p[1]} r={3} style={{ ["--c" as string]: a.couleur }} />;
          })}

          {/* Etiquettes : nom du palier et POURCENTAGE, demande explicite. */}
          {axes.map((a, i) => {
            const p = pt(i, R + 30);
            const ancre = Math.abs(p[0] - C) < 6 ? "middle" : p[0] > C ? "start" : "end";
            return (
              <g key={a.cle}>
                <text className="mon-lab" x={p[0]} y={p[1] - 4} fill={a.couleur} textAnchor={ancre}
                      style={{ filter: `drop-shadow(0 0 6px ${a.couleur})` }}>
                  {a.nom}
                </text>
                <text className="mon-pct" x={p[0]} y={p[1] + 9} fill={a.couleur} textAnchor={ancre}>
                  {a.pct}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {critique && (
        <p className="mon-note">
          <b>{critique.nom}</b> porte {Math.round((critique.etapes / Math.max(1, volumeTotal)) * 100)} % du volume
          et n'est avancé qu'à {critique.pct} %.
          {frise && ` Jour ${frise.ecoule} / ${frise.total}.`}
        </p>
      )}
    </>
  );
}

/* ── Vue diagnostic ────────────────────────────────────────────── */
function DiagnosticView({ axes, frise, pctObjectifs, pctEtapes, pctHabitudes, ecart, critique, volumeTotal, data }: any) {
  const rang = (p: number) => (p >= 70 ? "" : p >= 30 ? "warn" : "crit");
  const L = ({ t, v, c }: { t: string; v: string; c?: string }) => (
    <div className={`mon-dl ${c || ""}`}>
      <em>{t}</em>
      <span className="mon-pts" />
      <b>{v}</b>
    </div>
  );

  return (
    <div className="mon-crt flex-1 min-h-0">
      <div className="mon-diag">
        <p className="mon-dhead">&gt; ANALYSE DU CYCLE</p>
        {frise && <L t="TEMPS ÉCOULÉ" v={`${frise.pct.toFixed(1)} %`} />}
        <L t="OBJECTIFS FAITS" v={`${pctObjectifs.toFixed(1)} %`} c={rang(pctObjectifs)} />
        <L t="ÉTAPES VALIDÉES" v={`${pctEtapes.toFixed(1)} %`} c={rang(pctEtapes)} />
        <L t="HABITUDES" v={`${pctHabitudes.toFixed(1)} %`} c={rang(pctHabitudes)} />
        {ecart !== null && (
          <L t="ÉCART / TEMPS" v={`${ecart >= 0 ? "+" : "−"} ${Math.abs(ecart).toFixed(1)} pts`}
             c={ecart >= 0 ? "" : "crit"} />
        )}

        <div className="mon-dsep" />
        <p className="mon-dhead">&gt; CHARGE PAR PALIER</p>
        {axes.map((a: any) => (
          <L key={a.cle} t={a.nom} v={`${a.faites}/${a.etapes} · ${a.pct} %`} c={rang(a.pct)} />
        ))}

        <div className="mon-dsep" />
        <p className="mon-dhead">&gt; VOLUME</p>
        <L t="ÉTAPES TOTALES" v={`${data.totalStepsCompleted} / ${data.totalSteps}`} />
        {critique && (
          <L t={`${critique.nom} · ${Math.round((critique.etapes / Math.max(1, volumeTotal)) * 100)} % DU VOLUME`}
             v={`${critique.pct} %`} c="crit" />
        )}
        <p className="mon-dhead mt-2">&gt; FIN DE RAPPORT<span className="mon-curseur" /></p>
      </div>
    </div>
  );
}
