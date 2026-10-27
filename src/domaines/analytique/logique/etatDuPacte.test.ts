import { describe, it, expect } from "vitest";
import { etatDuPacte, type EtatDuPacte } from "./etatDuPacte";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   L'état du pacte se lit sur DEUX collections d'objectifs : celle de la
   période affichée, et toutes. Un coût total qui changerait selon la
   fenêtre choisie ne serait pas un coût total — et personne ne le
   verrait, puisqu'un nombre faux ressemble à un nombre.

   C'est le seul endroit du domaine où la confusion des deux serait
   invisible à l'œil ET fausse. D'où ces tests.
   ═══════════════════════════════════════════════════════════════ */

const RIEN: EtatDuPacte = {
  objectifs: [], tousLesObjectifs: [], etapes: [], etiquettes: [], dejaFinance: 0,
};
const avec = (p: Partial<EtatDuPacte>) => etatDuPacte({ ...RIEN, ...p });
const objectif = (p: Record<string, unknown>) => p as unknown as EtatDuPacte["objectifs"][number];
const etape = (p: Record<string, unknown>) => p as unknown as EtatDuPacte["etapes"][number];
const etiquette = (p: Record<string, unknown>) => p as unknown as EtatDuPacte["etiquettes"][number];

describe("les deux collections", () => {
  const DANS = [objectif({ id: "a", estimated_cost: 100, status: "in_progress" })];
  const TOUS = [
    ...DANS,
    objectif({ id: "b", estimated_cost: 900, status: "fully_completed", completion_date: "2025-01-01" }),
  ];

  it("compte le coût total sur TOUS les objectifs, pas sur ceux de la période", () => {
    const { totalCost } = avec({ objectifs: DANS, tousLesObjectifs: TOUS });
    expect(totalCost).toBe(1000);
  });

  it("répartit par difficulté sur les seuls objectifs de la période", () => {
    const { goalsByDifficulty } = avec({
      objectifs: [objectif({ id: "a", difficulty: "hard" })],
      tousLesObjectifs: [objectif({ id: "a", difficulty: "hard" }), objectif({ id: "b", difficulty: "easy" })],
    });
    expect(goalsByDifficulty).toEqual([{ difficulty: "hard", count: 1, color: expect.any(String) }]);
  });

  it("range un objectif sans difficulté déclarée dans « easy »", () => {
    expect(avec({ objectifs: [objectif({ id: "a" })] }).goalsByDifficulty[0].difficulty).toBe("easy");
  });
});

describe("le coût payé", () => {
  it("additionne les objectifs franchis et ce qui est déjà financé", () => {
    const { paidCost, remainingCost } = avec({
      tousLesObjectifs: [
        objectif({ id: "a", estimated_cost: 300, status: "fully_completed" }),
        objectif({ id: "b", estimated_cost: 700, status: "in_progress" }),
      ],
      dejaFinance: 200,
    });
    expect(paidCost).toBe(500);
    expect(remainingCost).toBe(500);
  });

  it("ne dépasse jamais le coût total, même sur-financé", () => {
    /* Le `Math.min` est ce qui tient : retiré, `paidCost` vaut 5 100.
       Le `Math.max` qui borne `remainingCost`, lui, est INATTEIGNABLE
       tant que le `Math.min` est là — sa soustraction ne peut plus être
       négative. Aucun test ne peut donc le faire tomber, et il ne faut
       pas prétendre le contraire : il reste comme garde-fou du jour où
       la première borne bougerait, pas comme comportement éprouvé. */
    const { paidCost, remainingCost } = avec({
      tousLesObjectifs: [objectif({ id: "a", estimated_cost: 100, status: "not_started" })],
      dejaFinance: 5000,
    });
    expect(paidCost).toBe(100);
    expect(remainingCost).toBe(0);
  });

  it("compte comme franchi les trois statuts qui le sont", () => {
    for (const status of ["completed", "fully_completed", "validated"]) {
      expect(avec({ tousLesObjectifs: [objectif({ id: "a", estimated_cost: 40, status })] }).paidCost).toBe(40);
    }
    expect(avec({ tousLesObjectifs: [objectif({ id: "a", estimated_cost: 40, status: "in_progress" })] }).paidCost).toBe(0);
  });
});

describe("les objectifs dans le temps", () => {
  it("inscrit une création et un franchissement sur deux mois différents", () => {
    const { goalsOverTime } = avec({
      objectifs: [objectif({ id: "a", created_at: "2025-01-15T00:00:00", completion_date: "2025-04-02" })],
    });
    expect(goalsOverTime).toEqual([
      { month: "2025-01", created: 1, completed: 0 },
      { month: "2025-04", created: 0, completed: 1 },
    ]);
  });
});

describe("les étiquettes", () => {
  it("ne compte que celles accrochées à un objectif de la période", () => {
    const { goalsByTag } = avec({
      objectifs: [objectif({ id: "a" })],
      etiquettes: [etiquette({ goal_id: "a", tag: "sport" }), etiquette({ goal_id: "hors", tag: "travel" })],
    });
    expect(goalsByTag).toEqual([{ tag: "sport", count: 1, color: expect.any(String) }]);
  });
});

describe("les étapes et la cadence de dépense", () => {
  it("sépare le total des étapes de celles qui sont validées", () => {
    const { totalSteps, completedSteps } = avec({
      etapes: [etape({ status: "completed" }), etape({ status: "pending" }), etape({ status: "completed" })],
    });
    expect([totalSteps, completedSteps]).toEqual([3, 2]);
  });

  it("rend zéro quand aucun objectif ne porte de date de franchissement", () => {
    /* Le cas piège n'est pas « rien de franchi » — là le numérateur est
       nul et le résultat tombe à zéro tout seul. C'est un objectif
       franchi SANS date : la dépense existe, le diviseur est zéro, et
       seul le `> 0` empêche d'annoncer la somme entière comme cadence
       mensuelle. Écrit d'abord avec un objectif en cours, ce test
       passait encore le garde retiré. */
    expect(avec({
      tousLesObjectifs: [objectif({ id: "a", estimated_cost: 500, status: "fully_completed", completion_date: null })],
    }).monthlyBurnRate).toBe(0);
  });

  it("divise la dépense franchie par le nombre d'objectifs datés", () => {
    const { monthlyBurnRate } = avec({
      tousLesObjectifs: [
        objectif({ id: "a", estimated_cost: 300, status: "fully_completed", completion_date: "2025-01-01" }),
        objectif({ id: "b", estimated_cost: 100, status: "fully_completed", completion_date: "2025-02-01" }),
      ],
    });
    expect(monthlyBurnRate).toBe(200);
  });
});
