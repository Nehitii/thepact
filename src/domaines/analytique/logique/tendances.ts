import { subDays, subMonths } from "date-fns";
import type { AnalyticsPeriod, LigneObjectif, LigneEtape, TrendData } from "@/domaines/analytique/types";

/* LA PERIODE, ET CE QU ELLE VAUT COMPAREE A LA PRECEDENTE.
 *
 * Une fleche vers le haut n est pas une donnee : c est un rapport entre
 * deux fenetres. Le calcul vivait dans le `queryFn`, ou les deux bornes
 * `start` et `mid` etaient deux variables parmi quinze.
 *
 * UNE ASYMETRIE EST CONSERVEE ICI, ET NOMMEE — pas corrigee. Le score
 * de sante de la periode COURANTE se calcule sur six mesures (sommeil,
 * humeur, activite, hydratation, repas, stress) ; celui de la periode
 * PRECEDENTE sur trois seulement (sommeil, humeur, activite). Les deux
 * nombres compares ne sortent donc pas de la meme formule, et la
 * variation affichee melange une evolution reelle avec un changement de
 * regle. C etait deja le cas avant cette sortie ; le dire ici est le
 * seul progres que cette etape pouvait faire sans changer l ecran.
 */
export function getPeriodDates(period: AnalyticsPeriod): { start: Date; mid: Date } {
  const now = new Date();
  switch (period) {
    case "30d":
      return { start: subDays(now, 30), mid: subDays(now, 60) };
    case "90d":
      return { start: subDays(now, 90), mid: subDays(now, 180) };
    case "6m":
      return { start: subMonths(now, 6), mid: subMonths(now, 12) };
    case "all":
    default:
      return { start: new Date(2020, 0, 1), mid: new Date(2020, 0, 1) };
  }
}

function computeTrend(current: number, previous: number): TrendData {
  const percentChange = previous === 0 
    ? (current > 0 ? 100 : 0)
    : Math.round(((current - previous) / previous) * 100);
  return { current, previous, percentChange };
}
export interface FenetreComparee {
  periode: AnalyticsPeriod;
  /** Les deux bornes rendues par `getPeriodDates`. */
  debut: Date;
  milieu: Date;
  tousLesObjectifs: LigneObjectif[];
  toutesLesEtapes: LigneEtape[];
  tousLesReleves: { entry_date: string; sleep_quality?: number | null; mood_level?: number | null; activity_level?: number | null }[];
  toutesLesSessions: { completed_at: string | null; started_at: string | null; duration_minutes: number | null }[];
  /** Les valeurs de la periode courante, deja calculees ailleurs. */
  objectifsFranchis: number;
  etapesValidees: number;
  scoreSante: number;
  minutesDeFocus: number;
}

export function comparerALaPeriodePrecedente({
  periode: period, debut: start, milieu: mid,
  tousLesObjectifs: allGoals, toutesLesEtapes: allSteps,
  tousLesReleves: allHealth, toutesLesSessions: allPomodoros,
  objectifsFranchis, etapesValidees, scoreSante, minutesDeFocus,
}: FenetreComparee): Record<"goalsCompleted" | "stepsCompleted" | "healthScore" | "focusMinutes", TrendData> {

  // Compute trends (current period vs previous period)
  const prevGoals = period === "all" ? allGoals : allGoals.filter((g) => {
    const date = new Date(g.created_at);
    return date >= mid && date < start;
  });
  const prevCompletedGoals = prevGoals.filter((g) => g.status === "fully_completed").length;

  const prevHealth = period === "all" ? [] : allHealth.filter((h) => {
    const date = new Date(h.entry_date);
    return date >= mid && date < start;
  });
  const prevAvgHealth = prevHealth.length 
    ? prevHealth.map((h) => {
        const metrics = [h.sleep_quality, h.mood_level, h.activity_level].filter(Boolean) as number[];
        return metrics.length ? metrics.reduce((a, b) => a + b, 0) / metrics.length * 20 : 0;
      }).reduce((a, b) => a + b, 0) / prevHealth.length
    : 0;

  const prevPomodoros = period === "all" ? [] : allPomodoros.filter((p) => {
    const date = new Date(p.completed_at || p.started_at || 0);
    return date >= mid && date < start;
  });
  const prevPomodoroMinutes = prevPomodoros.reduce((a, p) => a + (p.duration_minutes || 0), 0);

  const prevSteps = period === "all" ? [] : allSteps.filter((s) => {
    if (!s.validated_at) return false;
    const date = new Date(s.validated_at);
    return date >= mid && date < start;
  });
  const prevCompletedSteps = prevSteps.length;

  return {
    goalsCompleted: computeTrend(objectifsFranchis, prevCompletedGoals),
    stepsCompleted: computeTrend(etapesValidees, prevCompletedSteps),
    healthScore: computeTrend(scoreSante, Math.round(prevAvgHealth)),
    focusMinutes: computeTrend(minutesDeFocus, prevPomodoroMinutes),
  };
}
