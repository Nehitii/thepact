import { describe, expect, it } from "vitest";
import { avancementDeLObjectif } from "./avancement";
import type { SuperGoalChildInfo } from "@/domaines/objectifs/types";

const membre = (id: string, isCompleted: boolean, isMissing = false): SuperGoalChildInfo =>
  ({ id, name: id, progress: 0, isCompleted, isMissing }) as SuperGoalChildInfo;

const etape = (status: string) => ({ status });

describe("avancementDeLObjectif — un groupe compte ses membres", () => {
  it("compte les membres franchis, pas les etapes", () => {
    const a = avancementDeLObjectif(
      { goal_type: "super" },
      [etape("completed"), etape("completed"), etape("completed")],
      [membre("a", true), membre("b", false), membre("c", false), membre("d", false)],
    );
    expect(a).toEqual({ faites: 1, total: 4, pourcentage: 25, unite: "membres" });
  });

  /* UN MEMBRE DISPARU NE COMPTE PAS. Il ne peut plus etre franchi :
     le laisser au denominateur bloquerait le groupe sous 100 %. */
  it("ecarte les liens casses des deux cotes de la fraction", () => {
    const a = avancementDeLObjectif({ goal_type: "super" }, [], [
      membre("a", true), membre("b", true), membre("perdu", false, true),
    ]);
    expect(a.faites).toBe(2);
    expect(a.total).toBe(2);
    expect(a.pourcentage).toBe(100);
  });

  /* UN GROUPE VIDE RESTE A ZERO SUR ZERO — et non a « 0/1 ». Le total
     nul est ce qui permet a la fiche de ne pas proposer le geste. */
  it("laisse un groupe vide a zero sur zero", () => {
    const a = avancementDeLObjectif({ goal_type: "super" }, [], []);
    expect(a).toEqual({ faites: 0, total: 0, pourcentage: 0, unite: "membres" });
  });

  it("rend un pourcentage arrondi pour un groupe", () => {
    const a = avancementDeLObjectif({ goal_type: "super" }, [], [
      membre("a", true), membre("b", false), membre("c", false),
    ]);
    expect(a.pourcentage).toBe(33);
  });
});

describe("avancementDeLObjectif — une habitude compte ses jours", () => {
  it("compte les jours coches sur la duree prevue", () => {
    const a = avancementDeLObjectif(
      { goal_type: "habit", habit_checks: [true, false, true, false], habit_duration_days: 8 },
      [etape("completed")],
      [],
    );
    expect(a).toEqual({ faites: 2, total: 8, pourcentage: 25, unite: "jours" });
  });

  /* PAS ENCORE UN SEUL JOUR COCHE. Le tableau est absent, pas vide. */
  it("tient une habitude jamais cochee a zero", () => {
    const a = avancementDeLObjectif({ goal_type: "habit", habit_duration_days: 30 }, [], []);
    expect(a.faites).toBe(0);
    expect(a.pourcentage).toBe(0);
  });

  /* UNE DUREE NULLE NE DOIT PAS DONNER « NaN% ». */
  it("ne divise pas par zero quand aucune duree n est posee", () => {
    const a = avancementDeLObjectif({ goal_type: "habit", habit_checks: [true] }, [], []);
    expect(a.total).toBe(1);
    expect(a.pourcentage).toBe(100);
    expect(Number.isNaN(a.pourcentage)).toBe(false);
  });

  /* UNE DUREE RACCOURCIE APRES COUP peut faire depasser cent. C est
     constate, pas corrige : ecreter mentirait sur ce qui a ete tenu. */
  it("laisse depasser cent quand la duree a ete raccourcie apres coup", () => {
    const a = avancementDeLObjectif(
      { goal_type: "habit", habit_checks: [true, true, true], habit_duration_days: 2 },
      [], [],
    );
    expect(a.pourcentage).toBe(150);
  });
});

describe("avancementDeLObjectif — tout autre objectif compte ses etapes", () => {
  it("ne compte que les etapes achevees", () => {
    const a = avancementDeLObjectif({ goal_type: "standard" }, [
      etape("completed"), etape("in_progress"), etape("not_started"), etape("completed"),
    ], []);
    expect(a).toEqual({ faites: 2, total: 4, pourcentage: 50, unite: "etapes" });
  });

  /* « VALIDEE » N EST PAS « ACHEVEE » POUR UNE ETAPE. La fiche ne
     comptait deja que « completed » ; le pin le dit. */
  it("ne compte pas une etape validee comme achevee", () => {
    const a = avancementDeLObjectif({ goal_type: "standard" }, [
      etape("completed"), etape("validated"),
    ], []);
    expect(a.faites).toBe(1);
  });

  it("tient un objectif sans etape a zero sur un, jamais a NaN", () => {
    const a = avancementDeLObjectif({}, [], []);
    expect(a).toEqual({ faites: 0, total: 1, pourcentage: 0, unite: "etapes" });
  });

  /* UN TYPE INCONNU COMPTE SES ETAPES. C est le cas par defaut : mieux
     vaut un comptage juste des etapes qu une barre vide. */
  it("compte les etapes d un objectif de type inconnu", () => {
    const a = avancementDeLObjectif({ goal_type: "chimere" }, [etape("completed")], []);
    expect(a.unite).toBe("etapes");
    expect(a.pourcentage).toBe(100);
  });

  it("ignore les membres qu on lui passe quand l objectif n est pas un groupe", () => {
    const a = avancementDeLObjectif({ goal_type: "standard" }, [etape("completed")], [
      membre("a", false), membre("b", false),
    ]);
    expect(a.total).toBe(1);
    expect(a.pourcentage).toBe(100);
  });
});

/* L UNITE SORT DE LA MEME DECISION QUE LE COMPTAGE — c est tout
   l interet : la fiche ne peut plus annoncer « 3/5 jours » pour un
   groupe. */
describe("l unite suit toujours ce qui a ete compte", () => {
  it.each([
    ["super", "membres"],
    ["habit", "jours"],
    ["standard", "etapes"],
  ])("%s compte en %s", (type, unite) => {
    expect(avancementDeLObjectif({ goal_type: type }, [], []).unite).toBe(unite);
  });
});
