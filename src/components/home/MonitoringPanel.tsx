import { useId, useMemo, useState } from "react";
import { PREF } from "@/lib/preferencesAffichage";
import { useThemeSombre } from "@/hooks/useThemeSombre";
import { selonTheme } from "@/lib/encrePapier";

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

type Vue = "radar" | "diagnostic";

/* Ce que `axes` produit. Il etait passe en `any[]` aux deux vues, ce
   qui laissait passer nimporte quel nom de champ sans un mot. */
interface Palier {
  cle: string;
  nom: string;
  couleur: string;
  pct: number;
  faites: number;
  etapes: number;
  objectifs: string;
}

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
    return (localStorage.getItem(PREF.MONITORING_VUE) as Vue) || "radar";
  });

  const changerVue = (v: Vue) => {
    setVue(v);
    try { localStorage.setItem(PREF.MONITORING_VUE, v); } catch { /* mode prive */ }
  };

  const frise = useMemo(() => {
    if (!projectStartDate || !projectEndDate) return null;
    const debut = new Date(projectStartDate).getTime();
    const fin = new Date(projectEndDate).getTime();
    if (!(fin > debut)) return null;
    const total = Math.round((fin - debut) / 86400000);
    /* `floor`, pas `round` : un jour n est ecoule que lorsqu il l est.
       Avec `round`, cette frise passait au jour suivant des midi et se
       mettait a contredire les JOURS ACTIFS du bandeau une demi-journee
       sur deux. */
    const ecoule = Math.max(0, Math.min(total, Math.floor((Date.now() - debut) / 86400000)));
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
      className="mon-panneau relative overflow-hidden h-full flex flex-col"
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

/* ── Vue radar : le viseur ──────────────────────────────────────

   CE QUE LE RADAR MONTRAIT ETAIT A L ENVERS.

   Sa plus longue pointe valait UNE etape. EASY est a 1/1, donc
   100 %, donc une branche qui touche le bord. ANANTA, lui, est a
   15/62 — soixante-deux etapes, 26 % de tout le pacte — et se
   recroquevillait au centre. La figure donnait sa plus grande place
   au plus insignifiant, et sa plus petite a l un de ses deux plus
   gros postes.

   LE VOLUME ENTRE DONC DANS LE DESSIN, par le DIAMETRE des points.
   En racine carree, pour que ce soit l AIRE du point qui suive le
   nombre d etapes — un disque deux fois plus large parait quatre
   fois plus gros. La pointe d EASY se termine en tete d epingle,
   celle d ANANTA en pastille. La longueur dit toujours l avancement,
   le diametre dit ce qu il y a derriere.

   Trois autres corrections, mesurees :

   LE VIDE. Le SVG etait en `w-full h-full` sur un viewBox carre,
   plafonne a 330 px de cote : sur les 862 px du panneau, 532 px ne
   servaient a rien. Une figure polaire est carree et le restera —
   c est la place qui reste qui devient la colonne de charge.

   LES MOTS COUPES. Les etiquettes etaient posees a R+30 d un rayon
   de 150 dans une boite de 300 : sous 400 px de panneau, 21 px de
   « IMPOSSIBLE » disparaissaient. Le viewBox reserve desormais la
   couronne d etiquettes, donc rien ne peut plus etre rogne.

   LE BALAYAGE QUI NE MESURAIT RIEN. Il tournait en 6 s, toujours,
   quoi qu il arrive — le meme defaut que les cinq barres qui
   ondulaient a vide dans la barre systeme. Il garde sa traine, mais
   ce sont les POINTS qui respirent maintenant, chacun a son tour :
   ce qui pulse est ce qui porte une charge.

   Et la grille cesse de faire cube. Quatre hexagones concentriques
   plus six rayons, cela ne se lit pas comme une echelle, cela se lit
   comme un fil de fer en trois dimensions. Des anneaux gradues
   disent ce qu ils sont : des portees.
   ────────────────────────────────────────────────────────────── */
function RadarView({ axes, frise, critique, volumeTotal }: {
  axes: Palier[];
  frise: { total: number; ecoule: number; pct: number } | null;
  critique: Palier | null;
  volumeTotal: number;
}) {
  const sombre = useThemeSombre();
  /* Les degrades sont references par id : deux panneaux sur la meme
     page se voleraient leurs definitions. */
  const uid = useId().replace(/:/g, "");
  const C = 150, R = 100, n = axes.length;
  const pa = (a: number, r: number) => [C + Math.cos(a) * r, C + Math.sin(a) * r] as const;
  const pt = (i: number, r: number) => pa((Math.PI * 2 * i) / n - Math.PI / 2, r);
  const f1 = (v: number) => v.toFixed(1);

  if (!n) {
    return (
      <p className="ds-t-label font-mono flex-1 grid place-items-center" style={{ color: "var(--nexus-text-dimmer)" }}>
        Aucune étape enregistrée.
      </p>
    );
  }

  const teinte = (a: Palier) => selonTheme(a.couleur, sombre);
  const volMax = Math.max(...axes.map((a) => a.etapes));
  const faitesTotal = axes.reduce((s, a) => s + a.faites, 0);
  const sommets = axes.map((a, i) => pt(i, R * Math.max(0.04, a.pct / 100)));
  const rayonPoint = (a: Palier) => 1.8 + 5.2 * Math.sqrt(a.etapes / Math.max(1, volMax));

  /* Les graduations : une seule ellipse en pointilles plutot que
     soixante-douze traits. La periode du tiret fait le pas. */
  const GRAD = 2 * Math.PI * (R + 2.5);
  const GRAD_MAJ = 2 * Math.PI * (R + 4.5);

  /* Le balayage : soixante-quinze degres de traine derriere une arete
     vive, et un degrade en coordonnees utilisateur pour qu il tourne
     avec le secteur au lieu de rester colle a la boite. */
  const aVif = -Math.PI / 2;
  const aQueue = aVif - Math.PI / 2.4;
  const qVif = pa(aVif, R);
  const qQueue = pa(aQueue, R);

  const charge = [...axes].sort((a, b) => b.etapes - a.etapes);

  return (
    <>
      <div className="mon-duo flex-1 min-h-0">
        <svg
          className="mon-viseur"
          viewBox="-28 -8 356 316"
          role="img"
          aria-label={`Avancement par difficulté : ${axes.map((a) => `${a.nom} ${a.pct} % sur ${a.etapes} étapes`).join(", ")}`}
        >
          <defs>
            <radialGradient id={`mon-sol-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={sombre ? 0.13 : 0.1} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id={`mon-bal-${uid}`}
              gradientUnits="userSpaceOnUse"
              x1={f1(qQueue[0])} y1={f1(qQueue[1])} x2={f1(qVif[0])} y2={f1(qVif[1])}
            >
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={sombre ? 0.34 : 0.22} />
            </linearGradient>
          </defs>

          {/* Le sol du viseur : une lueur au centre, pas un aplat. */}
          <circle cx={C} cy={C} r={R + 4} fill={`url(#mon-sol-${uid})`} />

          {/* Anneaux de portee */}
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <circle key={k} className="mon-anneau" cx={C} cy={C} r={R * k} strokeDasharray={k === 1 ? undefined : "2 4"} />
          ))}
          <circle className="mon-grad" cx={C} cy={C} r={R + 2.5} strokeWidth={5}
                  strokeDasharray={`1 ${(GRAD / 72 - 1).toFixed(3)}`} />
          <circle className="mon-grad" cx={C} cy={C} r={R + 4.5} strokeWidth={9}
                  strokeDasharray={`1.6 ${(GRAD_MAJ / 12 - 1.6).toFixed(3)}`} />

          {/* Le balayage */}
          <g className="mon-bal">
            <path
              d={`M${C} ${C} L${f1(qQueue[0])} ${f1(qQueue[1])} A${R} ${R} 0 0 1 ${f1(qVif[0])} ${f1(qVif[1])} Z`}
              fill={`url(#mon-bal-${uid})`}
            />
            <line className="mon-bal-vif" x1={C} y1={C} x2={f1(qVif[0])} y2={f1(qVif[1])} />
          </g>

          {/* Une branche par palier, dans sa couleur */}
          {axes.map((a, i) => {
            const q = pt(i, R);
            return <line key={a.cle} className="mon-axe" x1={C} y1={C} x2={f1(q[0])} y2={f1(q[1])} stroke={teinte(a)} />;
          })}

          {/* Le polygone : un fond neutre, mais chaque arete part dans
              la couleur du palier qu elle quitte. Six couleurs etaient
              choisies pour ce panneau et une seule arrivait au dessin. */}
          <polygon className="mon-poly" points={sommets.map((q) => `${f1(q[0])},${f1(q[1])}`).join(" ")} />
          {sommets.map((q, i) => {
            const r = sommets[(i + 1) % sommets.length];
            return (
              <line key={axes[i].cle} className="mon-arete"
                    x1={f1(q[0])} y1={f1(q[1])} x2={f1(r[0])} y2={f1(r[1])} stroke={teinte(axes[i])} />
            );
          })}

          {/* Les points : le diametre dit le volume */}
          {axes.map((a, i) => {
            const q = sommets[i];
            const rp = rayonPoint(a);
            return (
              <g key={a.cle}>
                <circle className="mon-halo" cx={f1(q[0])} cy={f1(q[1])} r={f1(rp + 3)} fill={teinte(a)}
                        style={{ animationDelay: `${(i * 0.42).toFixed(2)}s` }} />
                <circle className="mon-pt" cx={f1(q[0])} cy={f1(q[1])} r={f1(rp)} fill={teinte(a)}>
                  <title>{`${a.nom} — ${a.faites}/${a.etapes} étapes (${a.pct} %)`}</title>
                </circle>
              </g>
            );
          })}

          {/* Etiquettes : nom du palier et pourcentage. */}
          {axes.map((a, i) => {
            const q = pt(i, R + 22);
            const ancre = Math.abs(q[0] - C) < 8 ? "middle" : q[0] > C ? "start" : "end";
            const dy = q[1] < C - 40 ? -4 : q[1] > C + 40 ? 12 : 0;
            return (
              <g key={a.cle}>
                <text className="mon-lab" x={f1(q[0])} y={f1(q[1] + dy)} textAnchor={ancre}>{a.nom}</text>
                <text className="mon-pct" x={f1(q[0])} y={f1(q[1] + dy + 11)} textAnchor={ancre} fill={teinte(a)}>
                  {a.pct}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* LA COLONNE DE CHARGE prend la place que le viseur ne peut
            pas occuper. La piste entiere vaut la part du palier dans le
            volume total ; la portion pleine, ce qui en est fait. Deux
            paliers a 80 % n ont donc pas la meme barre si l un pese
            trois fois l autre — c est exactement ce que le radar seul
            ne pouvait pas dire. */}
        <div className="mon-charge">
          <p className="mon-ctitre">Charge par palier · part des {volumeTotal} étapes</p>
          {charge.map((a) => (
            <div key={a.cle} className="mon-cl" style={{ ["--c" as string]: teinte(a) }}>
              <i>{a.nom}</i>
              <span className="mon-cpiste">
                <u style={{ width: `${((a.etapes / Math.max(1, volumeTotal)) * 100).toFixed(1)}%` }} />
                <b style={{ width: `${((a.faites / Math.max(1, volumeTotal)) * 100).toFixed(1)}%` }} />
              </span>
              <s>{a.faites}/{a.etapes}</s>
            </div>
          ))}
          <div className="mon-cpied">
            <span>Volume restant</span>
            <b>{volumeTotal - faitesTotal} étapes</b>
          </div>
        </div>
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

/** Un palier de difficulté, tel que le panneau le calcule au-dessus. */
interface AxeDifficulte {
  cle: string;
  nom: string;
  couleur: string;
  pct: number;
  faites: number;
  etapes: number;
  objectifs: string;
}

/** La frise du projet : où l'on en est dans le temps imparti. */
interface FriseProjet {
  total: number;
  ecoule: number;
  pct: number;
}

interface DiagnosticViewProps {
  axes: AxeDifficulte[];
  frise: FriseProjet | null;
  pctObjectifs: number;
  pctEtapes: number;
  pctHabitudes: number;
  ecart: number | null;
  critique: AxeDifficulte | null;
  volumeTotal: number;
  data: MonitoringData;
}

function DiagnosticView({ axes, frise, pctObjectifs, pctEtapes, pctHabitudes, ecart, critique, volumeTotal, data }: DiagnosticViewProps) {
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
        {axes.map((a) => (
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
