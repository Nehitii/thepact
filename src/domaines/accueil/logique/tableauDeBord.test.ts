import { describe, it, expect } from "vitest";
import { composerLeTableauDeBord, type EntreesDuTableau } from "./tableauDeBord";
import type { Goal } from "@/domaines/objectifs";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Tous ces nombres se trompent en silence. Un total d'étapes qui compte
   les habitudes, un état « onboarding » qui ne s'éteint jamais, un
   palier vide qui affiche 0 % au lieu de rien : l'écran n'a pas l'air
   cassé, il affiche simplement autre chose que la vérité.

   La distinction qui porte tout le fichier : UNE HABITUDE N'A PAS
   D'ÉTAPES. Elle recopie sa durée dans `total_steps`, et la compter
   avec les autres gonflerait le dénominateur de l'avancement général
   avec des jours qui ne sont pas des étapes.
   ═══════════════════════════════════════════════════════════════ */

const objectif = (p: Record<string, unknown>) => p as unknown as Goal;
const composer = (p: Partial<EntreesDuTableau> = {}) =>
  composerLeTableauDeBord({ objectifs: [], maintenant: new Date(2026, 2, 4), ...p });

describe("une habitude n'a pas d'étapes", () => {
  const HABITUDE = objectif({ goal_type: "habit", habit_duration_days: 180, habit_checks: [true, true, false], total_steps: 180, validated_steps: 2, status: "in_progress" });
  const CLASSIQUE = objectif({ goal_type: "standard", total_steps: 10, validated_steps: 4, status: "in_progress" });

  it("laisse la durée d'une habitude hors du total d'étapes", () => {
    /* `total_steps` recopie `habit_duration_days` : compter les deux
       ensemble ajouterait 180 « étapes » qui sont des jours. */
    const { dashboardData: d } = composer({ objectifs: [HABITUDE, CLASSIQUE] });
    expect(d.totalSteps).toBe(10);
    expect(d.totalStepsCompleted).toBe(4);
  });

  it("compte les cases cochées d'une habitude à part", () => {
    const { dashboardData: d } = composer({ objectifs: [HABITUDE, CLASSIQUE] });
    expect(d.totalHabitChecks).toBe(180);
    expect(d.completedHabitChecks).toBe(2);
  });

  it("ne met aucune habitude dans les objectifs en avant", () => {
    /* Une habitude ne se « met pas en avant » : elle se tient. */
    const enAvant = objectif({ goal_type: "habit", is_focus: true, status: "in_progress" });
    const { focusGoals } = composer({ objectifs: [enAvant, objectif({ goal_type: "standard", is_focus: true, status: "in_progress" })] });
    expect(focusGoals).toHaveLength(1);
  });

  it("retire des objectifs en avant celui qui est franchi", () => {
    const { focusGoals } = composer({ objectifs: [objectif({ goal_type: "standard", is_focus: true, status: "fully_completed" })] });
    expect(focusGoals).toEqual([]);
  });
});

describe("les paliers de difficulté", () => {
  it("rend les six paliers, même vides", () => {
    /* Un palier absent laisserait un trou dans le radar ; un palier
       vide à 0 % le dessine fermé, ce qui est la vérité. */
    const { dashboardData: d } = composer({ objectifs: [] });
    expect(d.difficultyProgress.map((p) => p.difficulty))
      .toEqual(["easy", "medium", "hard", "extreme", "impossible", "custom"]);
    expect(d.difficultyProgress.every((p) => p.total === 0 && p.percentage === 0)).toBe(true);
  });

  it("compte par palier, et ne divise jamais par zéro", () => {
    const { dashboardData: d } = composer({ objectifs: [
      objectif({ difficulty: "hard", status: "fully_completed", goal_type: "standard", total_steps: 4, validated_steps: 4 }),
      objectif({ difficulty: "hard", status: "in_progress", goal_type: "standard", total_steps: 6, validated_steps: 1 }),
    ] });
    const dur = d.difficultyProgress.find((p) => p.difficulty === "hard")!;
    expect(dur).toMatchObject({ total: 2, completed: 1, percentage: 50, totalSteps: 10, completedSteps: 5 });
    expect(d.difficultyProgress.find((p) => p.difficulty === "easy")!.percentage).toBe(0);
  });
});

describe("les compteurs d'état", () => {
  it("range « validated » avec les franchis, pas ailleurs", () => {
    /* Deux statuts disent la même chose ; les séparer ferait disparaître
       des objectifs franchis du compte. */
    const { dashboardData: d } = composer({ objectifs: [
      objectif({ status: "validated" }), objectif({ status: "fully_completed" }),
      objectif({ status: "in_progress" }), objectif({ status: "not_started" }),
    ] });
    expect(d.statusCounts).toEqual({ not_started: 1, in_progress: 1, fully_completed: 2 });
  });

  it("ne compte comme franchi, dans le total, que « fully_completed »", () => {
    /* Écart assumé entre `statusCounts.fully_completed` et
       `goalsCompleted` : le premier alimente une jauge d'état, le second
       le compteur de la bannière. Le figer évite qu'on les « aligne »
       un jour sans voir que deux écrans changent. */
    const { dashboardData: d } = composer({ objectifs: [objectif({ status: "validated" }), objectif({ status: "fully_completed" })] });
    expect(d.goalsCompleted).toBe(1);
    expect(d.statusCounts.fully_completed).toBe(2);
    expect(d.totalGoals).toBe(2);
  });
});

describe("l'état de qui regarde", () => {
  const jeune = { created_at: new Date(2026, 2, 1).toISOString() };   // trois jours
  const vieux = { created_at: new Date(2025, 2, 1).toISOString() };

  it("dit « onboarding » à un pacte jeune et presque vide", () => {
    expect(composer({ objectifs: [objectif({})], pacte: jeune }).userState).toBe("onboarding");
  });

  it("sort de l'onboarding dès le deuxième objectif, même le premier jour", () => {
    expect(composer({ objectifs: [objectif({}), objectif({})], pacte: jeune }).userState).toBe("active");
  });

  it("sort de l'onboarding au bout d'une semaine, même sans objectif", () => {
    /* Sans cette porte de sortie, un pacte laissé de côté resterait
       « onboarding » pour toujours. */
    expect(composer({ objectifs: [], pacte: vieux }).userState).toBe("active");
    expect(composer({ objectifs: [], pacte: jeune }).userState).toBe("onboarding");
  });

  it("dit « advanced » à partir de cinq objectifs franchis", () => {
    const franchis = (n: number) => Array.from({ length: n }, () => objectif({ status: "fully_completed" }));
    expect(composer({ objectifs: franchis(4), pacte: vieux }).userState).toBe("active");
    expect(composer({ objectifs: franchis(5), pacte: vieux }).userState).toBe("advanced");
  });

  it("traite un pacte sans date comme tout neuf", () => {
    expect(composer({ objectifs: [objectif({})], pacte: null }).userState).toBe("onboarding");
  });
});

describe("les modules", () => {
  it("verrouille tout quand rien ne répond", () => {
    /* Sans fonction d'achat, on ne suppose pas que tout est possédé :
       ouvrir un module qu'on n'a pas est pire que le montrer fermé. */
    const { ownedModules, lockedModules } = composer({ moduleAchete: undefined });
    expect(Object.values(ownedModules).every((v) => v === false)).toBe(true);
    expect(lockedModules).toHaveLength(6);
  });

  it("ne laisse dans les verrouillés que ce qui n'est pas possédé", () => {
    const { ownedModules, lockedModules } = composer({ moduleAchete: (c) => c === "journal" || c === "finance" });
    expect(ownedModules.journal).toBe(true);
    expect(lockedModules).toEqual(["the-call", "todo-list", "track-health", "wishlist"]);
  });
});
