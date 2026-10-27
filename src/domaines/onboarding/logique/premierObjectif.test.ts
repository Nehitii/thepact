import { describe, expect, it } from "vitest";
import {
  ETAPES_SUR_MESURE, GabaritDObjectif, objectifDuGabarit, objectifSurMesure,
  PALIER_SUR_MESURE,
} from "./premierObjectif";

const habitude: GabaritDObjectif = {
  placeholder: "Méditer 10 minutes par jour",
  difficulty: "medium",
  goal_type: "habit",
  habit_duration_days: 30,
};

const ordinaire: GabaritDObjectif = {
  placeholder: "Préparer un semi-marathon",
  difficulty: "hard",
  goal_type: "normal",
  total_steps: 5,
};

describe("objectifDuGabarit — ce qui est ecrit", () => {
  it("emporte le nom, le palier et le genre du gabarit", () => {
    const o = objectifDuGabarit(ordinaire, "p1");
    expect(o.name).toBe("Préparer un semi-marathon");
    expect(o.difficulty).toBe("hard");
    expect(o.goal_type).toBe("normal");
    expect(o.pact_id).toBe("p1");
  });

  /* UNE HABITUDE COMPTE SES JOURS, un objectif ordinaire ses etapes. */
  it("prend les etapes d un objectif ordinaire", () => {
    expect(objectifDuGabarit(ordinaire, "p1").total_steps).toBe(5);
  });

  it("prend les jours d une habitude qui n a pas d etapes", () => {
    expect(objectifDuGabarit(habitude, "p1").total_steps).toBe(30);
  });

  it("prefere les etapes aux jours quand le gabarit porte les deux", () => {
    const deux = { ...habitude, total_steps: 7 };
    expect(objectifDuGabarit(deux, "p1").total_steps).toBe(7);
  });

  it("retombe a zero quand le gabarit ne porte ni l un ni l autre", () => {
    const nu = { ...ordinaire, total_steps: undefined };
    expect(objectifDuGabarit(nu, "p1").total_steps).toBe(0);
  });

  /* LES JOURS NE SE POSENT QUE POUR UNE HABITUDE QUI EN DECLARE. */
  it("pose un tableau de jours pour une habitude", () => {
    const o = objectifDuGabarit(habitude, "p1");
    expect(o.habit_duration_days).toBe(30);
    expect(o.habit_checks).toHaveLength(30);
    expect((o.habit_checks as boolean[]).every((j) => j === false)).toBe(true);
  });

  it("ne pose aucun jour pour un objectif ordinaire", () => {
    const o = objectifDuGabarit(ordinaire, "p1");
    expect(o.habit_duration_days).toBeUndefined();
    expect(o.habit_checks).toBeUndefined();
  });

  it("ne pose aucun jour pour une habitude sans duree", () => {
    const o = objectifDuGabarit({ ...habitude, habit_duration_days: undefined }, "p1");
    expect(o.habit_checks).toBeUndefined();
  });

  /* LE GENRE COMPTE AUTANT QUE LA DUREE. Le type d un gabarit permet
     de porter les deux : un gabarit ORDINAIRE qui declarerait une
     duree ne doit pas recevoir de cases a cocher pour autant — elles
     ne s afficheraient nulle part. Le balayage de mutations a montre
     ce trou en laissant survivre le retrait du test sur le genre :
     aucun de mes cas ne posait cette combinaison. */
  it("ne pose aucun jour pour un objectif ordinaire qui declare une duree", () => {
    const o = objectifDuGabarit({ ...ordinaire, habit_duration_days: 30 }, "p1");
    expect(o.habit_checks).toBeUndefined();
    expect(o.habit_duration_days).toBeUndefined();
    /* Les etapes l emportent quand meme sur les jours. */
    expect(o.total_steps).toBe(5);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUI N EST PAS ECRIT, ET QUE LA BASE REMPLIT A SA FACON.

   Ces tests ne servent qu a rendre trois ecarts VISIBLES. Ils
   constatent, ils n approuvent pas.
   ═══════════════════════════════════════════════════════════════ */
describe("les colonnes que ce chemin n ecrit pas", () => {
  /* potential_score vaut ZERO par defaut en base. La creation
     ordinaire y met le potentiel du palier — 25 pour « medium », 50
     pour « hard ». Le premier objectif d un pacte ne vaut donc aucun
     point, et la somme des potentiels du pacte, calculee en base, est
     courte de sa valeur pour toujours. */
  it("n ecrit pas le potentiel, qui vaudra donc zero", () => {
    for (const g of [habitude, ordinaire]) {
      expect("potential_score" in objectifDuGabarit(g, "p1")).toBe(false);
    }
    expect("potential_score" in objectifSurMesure("Un objectif", "p1")).toBe(false);
  });

  /* status vaut « active » par defaut, une valeur de l enum d ORIGINE
     que le vocabulaire de l application a abandonnee. Le tri du
     registre ne la connait pas. */
  it("n ecrit pas le statut, qui vaudra donc « active »", () => {
    expect("status" in objectifDuGabarit(ordinaire, "p1")).toBe(false);
    expect("status" in objectifSurMesure("Un objectif", "p1")).toBe(false);
  });

  it("n ecrit pas la date de depart", () => {
    expect("start_date" in objectifDuGabarit(ordinaire, "p1")).toBe(false);
  });

  /* QUATRE COLONNES ICI, DOUZE A LA CREATION ORDINAIRE. Ce test fixe
     le compte : si quelqu un en ajoute une, il verra ici pourquoi. */
  it("ne pose que quatre colonnes pour un objectif ordinaire", () => {
    expect(Object.keys(objectifDuGabarit(ordinaire, "p1")).sort())
      .toEqual(["difficulty", "goal_type", "name", "pact_id", "total_steps"]);
  });
});

describe("objectifSurMesure", () => {
  it("coupe les blancs du nom", () => {
    expect(objectifSurMesure("  Mon objectif  ", "p1").name).toBe("Mon objectif");
  });

  /* LE PALIER ET LE NOMBRE D ETAPES SONT ECRITS EN CLAIR : aucun
     gabarit ne les porte, et rien a l ecran ne les annonce. */
  it("pose un palier moyen et cinq etapes", () => {
    const o = objectifSurMesure("Mon objectif", "p1");
    expect(o.difficulty).toBe(PALIER_SUR_MESURE);
    expect(o.total_steps).toBe(ETAPES_SUR_MESURE);
    expect([PALIER_SUR_MESURE, ETAPES_SUR_MESURE]).toEqual(["medium", 5]);
  });

  it("est toujours un objectif ordinaire", () => {
    expect(objectifSurMesure("x", "p1").goal_type).toBe("normal");
    expect(objectifSurMesure("x", "p1").habit_checks).toBeUndefined();
  });
});
