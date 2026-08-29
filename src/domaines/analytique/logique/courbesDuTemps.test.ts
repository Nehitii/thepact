import { describe, it, expect } from "vitest";
import { courbesDuTemps, type Series } from "./courbesDuTemps";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Six courbes, six façons de se tromper silencieusement : un ordre
   inversé, une moyenne qui avale un zéro, une épargne bornée, un index
   replié sur une date, un repli de colonne, une durée négative.

   Aucune de ces décisions n'est visible sur le graphique — une courbe
   fausse ressemble à une courbe. C'est pour ça qu'elles sont ici.
   ═══════════════════════════════════════════════════════════════ */

const RIEN: Series = {
  sante: [], finance: [], objectifs: [], objectifsDeLaPeriode: [],
  habitudes: [], taches: [], sessions: [],
};
const avec = (p: Partial<Series>) => courbesDuTemps({ ...RIEN, ...p });
const objectif = (p: Record<string, unknown>) => p as unknown as Series["objectifs"][number];
const mois = (p: Record<string, unknown>) => p as unknown as Series["finance"][number];

describe("la courbe de santé", () => {
  it("rend les relevés dans l'ordre inverse de ce qu'on lui donne", () => {
    /* La requête arrive du plus récent au plus ancien ; le `.reverse()`
       final est ce qui remet le temps à l'endroit. Sans lui la courbe se
       lit de droite à gauche, ce qui ne se voit pas. */
    const { healthTrend } = avec({
      sante: [
        { entry_date: "2025-03-03", mood_level: 5 },
        { entry_date: "2025-03-01", mood_level: 1 },
      ],
    });
    expect(healthTrend.map((h) => h.date)).toEqual(["2025-03-01", "2025-03-03"]);
  });

  it("met la note sur cent et n'invente rien quand le relevé est vide", () => {
    const { healthTrend } = avec({
      sante: [{ entry_date: "2025-03-01", sleep_quality: 4, mood_level: 4, activity_level: 4 }],
    });
    expect(healthTrend[0].score).toBe(80);
    expect(avec({ sante: [{ entry_date: "2025-03-02" }] }).healthTrend[0].score).toBe(0);
  });

  it("plafonne l'hydratation à cinq et retourne le stress", () => {
    /* Boire seize verres ne vaut pas dix sur cinq ; et un stress de 5
       est une mauvaise journée, donc il compte pour 1. */
    const fort = avec({ sante: [{ entry_date: "j", hydration_glasses: 16 }] }).healthTrend[0].score;
    const juste = avec({ sante: [{ entry_date: "j", hydration_glasses: 8 }] }).healthTrend[0].score;
    expect(fort).toBe(juste);
    expect(avec({ sante: [{ entry_date: "j", stress_level: 5 }] }).healthTrend[0].score).toBe(20);
    expect(avec({ sante: [{ entry_date: "j", stress_level: 1 }] }).healthTrend[0].score).toBe(100);
  });
});

describe("la courbe financière", () => {
  it("ne descend jamais l'épargne sous zéro", () => {
    /* Un mois déficitaire donne une épargne nulle, pas une épargne
       négative : la courbe mesure ce qui reste, et il ne reste jamais
       moins que rien. Le déficit se lit sur les deux autres traces. */
    const { financeTrend } = avec({
      finance: [mois({ month: "2025-04-01", actual_total_income: 1000, actual_total_expenses: 1400 })],
    });
    expect(financeTrend[0]).toEqual({ month: "2025-04", income: 1000, expenses: 1400, savings: 0 });
  });
});

describe("les habitudes, jour par jour", () => {
  const LUNDI = new Date("2025-06-09T12:00:00Z");

  it("replie l'index d'une case cochée sur une date", () => {
    const { habitStreak } = avec({
      objectifs: [objectif({ goal_type: "habit", created_at: "2025-06-07T00:00:00Z", habit_checks: [true, false, true] })],
      maintenant: LUNDI,
    });
    expect(habitStreak).toEqual([
      { date: "2025-06-07", completed: 1, total: 1 },
      { date: "2025-06-08", completed: 0, total: 1 },
      { date: "2025-06-09", completed: 1, total: 1 },
    ]);
  });

  it("n'inscrit pas un jour à venir, même si sa case existe", () => {
    /* Un tableau de cases plus long que le nombre de jours écoulés est
       la règle, pas l'exception : il est dimensionné sur la durée
       prévue. Compter ces jours-là ferait chuter le taux de tenue par
       la seule marche du calendrier. */
    const { habitStreak } = avec({
      objectifs: [objectif({ goal_type: "habit", created_at: "2025-06-08T00:00:00Z", habit_checks: [true, false, false, false] })],
      maintenant: LUNDI,
    });
    expect(habitStreak.map((h) => h.date)).toEqual(["2025-06-08", "2025-06-09"]);
  });

  it("ignore un objectif qui n'est pas une habitude", () => {
    const { habitStreak } = avec({
      objectifs: [objectif({ goal_type: "standard", created_at: "2025-06-08T00:00:00Z", habit_checks: [true] })],
      maintenant: LUNDI,
    });
    expect(habitStreak).toEqual([]);
  });

  it("ajoute la table habit_logs par-dessus au lieu de la remplacer", () => {
    /* `habit_logs` n'est écrite par aucune interface aujourd'hui. Le
       jour où elle le sera, les deux mécanismes doivent s'additionner —
       sinon rebrancher l'un effacerait l'autre. */
    const { habitStreak } = avec({
      objectifs: [objectif({ goal_type: "habit", created_at: "2025-06-09T00:00:00Z", habit_checks: [true] })],
      habitudes: [{ log_date: "2025-06-09", completed: true }] as unknown as Series["habitudes"],
      maintenant: LUNDI,
    });
    expect(habitStreak).toEqual([{ date: "2025-06-09", completed: 2, total: 2 }]);
  });
});

describe("la vitesse d'un objectif", () => {
  it("mesure depuis start_date, et retombe sur created_at seulement s'il manque", () => {
    const { goalVelocity } = avec({
      objectifsDeLaPeriode: [
        objectif({ start_date: "2025-01-01", created_at: "2024-01-01", completion_date: "2025-01-11" }),
        objectif({ start_date: null, created_at: "2025-02-01", completion_date: "2025-02-21" }),
      ],
    });
    expect(goalVelocity).toEqual([
      { month: "2025-01", avgDays: 10 },
      { month: "2025-02", avgDays: 20 },
    ]);
  });

  it("écarte une durée négative au lieu de la moyenner", () => {
    /* Un objectif saisi après coup porte une completion_date antérieure
       à sa création. Ce n'est pas une mesure, c'est un artefact de
       saisie — il tirait la moyenne mensuelle jusqu'à -135 jours. */
    const { goalVelocity } = avec({
      objectifsDeLaPeriode: [
        objectif({ start_date: "2025-05-01", completion_date: "2025-05-05" }),
        objectif({ start_date: "2025-06-30", completion_date: "2025-05-10" }),
      ],
    });
    expect(goalVelocity).toEqual([{ month: "2025-05", avgDays: 4 }]);
  });

  it("ne compte pas un objectif non franchi", () => {
    expect(avec({ objectifsDeLaPeriode: [objectif({ start_date: "2025-05-01", completion_date: null })] }).goalVelocity).toEqual([]);
  });
});

describe("le focus et les tâches", () => {
  it("range une session à son jour de fin, et retombe sur son départ", () => {
    const { pomodoroTrend } = avec({
      sessions: [
        { completed_at: "2025-07-01T10:00:00", started_at: "2025-06-30T23:00:00", duration_minutes: 25 },
        { completed_at: null, started_at: "2025-07-02T08:00:00", duration_minutes: 50 },
      ],
    });
    /* `completed_at || started_at` : c'est la FIN qui date une session,
       et une session commencée avant minuit compte pour le lendemain. */
    expect(pomodoroTrend).toEqual([
      { date: "2025-07-01", minutes: 25 },
      { date: "2025-07-02", minutes: 50 },
    ]);
  });

  it("compte les tâches par mois d'accomplissement et laisse les inachevées dehors", () => {
    const { todoStats } = avec({
      taches: [
        { completed_at: "2025-08-03T09:00:00" },
        { completed_at: "2025-08-30T09:00:00" },
        { completed_at: "2025-09-01T09:00:00" },
        { completed_at: null },
      ],
    });
    expect(todoStats).toEqual([{ month: "2025-08", completed: 2 }, { month: "2025-09", completed: 1 }]);
  });
});
