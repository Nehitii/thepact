import { describe, it, expect } from "vitest";
import { comparerALaPeriodePrecedente, getPeriodDates, type FenetreComparee } from "./tendances";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Une flèche vers le haut n'est pas une donnée : c'est un rapport entre
   deux fenêtres. Si la fenêtre précédente est mal découpée, la flèche
   ment sans que rien ne le signale.

   Un test ci-dessous ne protège pas un comportement correct — il CLOUE
   une asymétrie connue : le score de santé courant se calcule sur six
   mesures, le précédent sur trois. Le figer, c'est s'assurer que le
   jour où on le corrigera, ce sera un choix et non un accident.
   ═══════════════════════════════════════════════════════════════ */

const MILIEU = new Date("2025-01-01T00:00:00Z");
const DEBUT = new Date("2025-02-01T00:00:00Z");
const RIEN: FenetreComparee = {
  periode: "30d", debut: DEBUT, milieu: MILIEU,
  tousLesObjectifs: [], toutesLesEtapes: [], tousLesReleves: [], toutesLesSessions: [],
  objectifsFranchis: 0, etapesValidees: 0, scoreSante: 0, minutesDeFocus: 0,
};
const avec = (p: Partial<FenetreComparee>) => comparerALaPeriodePrecedente({ ...RIEN, ...p });
const objectif = (p: Record<string, unknown>) => p as unknown as FenetreComparee["tousLesObjectifs"][number];
const etape = (p: Record<string, unknown>) => p as unknown as FenetreComparee["toutesLesEtapes"][number];

describe("la fenêtre précédente", () => {
  it("prend ce qui est entre le milieu inclus et le début exclu", () => {
    const { goalsCompleted } = avec({
      objectifsFranchis: 5,
      tousLesObjectifs: [
        objectif({ created_at: "2025-01-01T00:00:00Z", status: "fully_completed" }), // le milieu : dedans
        objectif({ created_at: "2025-01-20T00:00:00Z", status: "fully_completed" }),
        objectif({ created_at: "2025-02-01T00:00:00Z", status: "fully_completed" }), // le début : dehors
        objectif({ created_at: "2024-12-31T00:00:00Z", status: "fully_completed" }), // trop vieux
      ],
    });
    expect(goalsCompleted).toEqual({ current: 5, previous: 2, percentChange: 150 });
  });

  it("compare « tout » à lui-même, ce qui neutralise la flèche", () => {
    /* Sur la période « tout » il n'y a pas de fenêtre précédente : les
       deux bornes sont la même date de 2020. Les objectifs sont donc
       tous « précédents », et les trois autres séries sont vides. */
    const tous = [objectif({ created_at: "2025-01-20T00:00:00Z", status: "fully_completed" })];
    const r = avec({ periode: "all", objectifsFranchis: 1, tousLesObjectifs: tous });
    expect(r.goalsCompleted).toEqual({ current: 1, previous: 1, percentChange: 0 });
    expect(r.healthScore.previous).toBe(0);
    expect(r.focusMinutes.previous).toBe(0);
  });
});

describe("la variation en pourcentage", () => {
  it("annonce cent pour cent quand on part de rien vers quelque chose", () => {
    expect(avec({ etapesValidees: 7 }).stepsCompleted).toEqual({ current: 7, previous: 0, percentChange: 100 });
  });

  it("annonce zéro quand on part de rien vers rien", () => {
    /* Sans ce cas, une division par zéro donnerait NaN, et le panneau
       afficherait « NaN % » — ce qui est arrivé assez souvent ailleurs
       pour mériter un test. */
    expect(avec({}).stepsCompleted.percentChange).toBe(0);
  });

  it("arrondit une baisse au lieu de la tronquer", () => {
    /* 2 sur 3 donne -33,33 : arrondi et troncature tombent tous deux sur
       -33, et le test ne prouvait rien. 1 sur 3 donne -66,67, où les
       deux divergent — c'est le seul endroit où la différence existe. */
    const { stepsCompleted } = avec({
      etapesValidees: 1,
      toutesLesEtapes: Array.from({ length: 3 }, () => etape({ validated_at: "2025-01-10T00:00:00Z" })),
    });
    expect(stepsCompleted).toEqual({ current: 1, previous: 3, percentChange: -67 });
  });

  it("écarte une étape sans date de validation", () => {
    /* Le garde explicite est REDONDANT à l'exécution : `new Date(null)`
       vaut 1970 et se fait écarter par la borne juste après. Il n'est
       donc pas éprouvable — il sert au compilateur, qui refuse de
       passer `string | null` à `new Date`. Le test fixe le résultat,
       pas le chemin par lequel on l'obtient. */
    expect(avec({ toutesLesEtapes: [etape({ validated_at: null })] }).stepsCompleted.previous).toBe(0);
  });
});

describe("l'asymétrie du score de santé", () => {
  it("calcule le score précédent sur TROIS mesures quand le courant en compte six", () => {
    /* Ceci n'est pas une validation : c'est un constat cloué. Le relevé
       ci-dessous porte six mesures ; seules sommeil, humeur et activité
       comptent dans le passé. 4 sur 5 → 80, et l'hydratation, les repas
       et le stress sont ignorés. Le jour où les deux formules seront
       les mêmes, ce test tombera — et ce sera le bon moment. */
    const { healthScore } = avec({
      scoreSante: 80,
      tousLesReleves: [{
        entry_date: "2025-01-10",
        /* Trois valeurs DISTINCTES : avec 4-4-4 la moyenne ne bouge pas
           qu'on retire une mesure ou non, et le test ne voyait rien. */
        sleep_quality: 5, mood_level: 3, activity_level: 1,
        // ignorés côté période précédente :
        ...{ hydration_glasses: 8, meal_balance: 1, stress_level: 5 },
      }],
    });
    expect(healthScore).toEqual({ current: 80, previous: 60, percentChange: 33 });
  });
});

describe("les bornes d'une période", () => {
  it("donne deux fenêtres accolées de même longueur", () => {
    const { start, mid } = getPeriodDates("30d");
    const jours = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86_400_000);
    expect(jours(new Date(), start)).toBe(30);
    expect(jours(start, mid)).toBe(30);
  });

  it("aplatit « tout » sur une seule date, sans fenêtre précédente", () => {
    const { start, mid } = getPeriodDates("all");
    expect(start.getTime()).toBe(mid.getTime());
    expect(start.getFullYear()).toBe(2020);
  });
});
