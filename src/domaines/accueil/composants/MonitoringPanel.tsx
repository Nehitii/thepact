import { useMemo, useState } from "react";
import { PREF } from "@/socle/outils/preferencesAffichage";
import { RadarView, DiagnosticView } from "@/domaines/accueil/composants/VuesDeSurveillance";

export interface MonitoringData {
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
export interface Palier {
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

/* ── Vue diagnostic ────────────────────────────────────────────── */

/** La frise du projet : où l'on en est dans le temps imparti. */
export interface FriseProjet {
  total: number;
  ecoule: number;
  pct: number;
}
