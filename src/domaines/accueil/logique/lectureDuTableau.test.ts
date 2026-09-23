import { describe, expect, it } from "vitest";
import {
  dans, dateCourte, dateLongue, lireDate, lireLeTableau, resteAvant,
} from "./lectureDuTableau";
import { MAINTENANT, OBJECTIFS, PACTE, type ObjectifDuScenario } from "./scenarioDuTableau";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Les trois refontes du banc lisent les mêmes chiffres ici. S'ils
   étaient faux, on comparerait des erreurs au lieu de compositions —
   et la structure retenue les emporterait avec elle en production.

   Deux règles du tableau de bord actuel s'y retrouvent : une habitude
   n'a pas d'étapes, et un jour n'est écoulé que lorsqu'il l'est.
   ═══════════════════════════════════════════════════════════════ */

describe("la lecture du pacte", () => {
  const l = lireLeTableau(OBJECTIFS, PACTE, MAINTENANT);

  it("compte les jours du pacte, et ceux qui sont derrière", () => {
    expect(l.jours).toBe(2243);
    expect(l.jour).toBe(1057);
    expect(l.restants).toBe(2243 - 1057);
  });

  it("laisse les habitudes hors des étapes", () => {
    const avecHabitude: ObjectifDuScenario[] = [
      { id: "a", nom: "A", difficulte: "easy", statut: "in_progress", etapes: 4, faites: 2 },
      { id: "h", nom: "H", difficulte: "easy", statut: "in_progress", etapes: 90, faites: 60, habitude: { jours: 90, coches: 60 } },
    ];
    const lu = lireLeTableau(avecHabitude, PACTE, MAINTENANT);
    expect(lu.etapes).toEqual({ total: 4, faites: 2, pct: 50 });
    expect(lu.habitudes).toEqual({ jours: 90, coches: 60 });
  });

  it("compte les objectifs par statut", () => {
    expect(l.objectifs).toMatchObject({ total: 15, tenus: 5, ouverts: 8, enAttente: 2 });
  });

  it("mesure l'écart entre objectifs tenus et temps écoulé", () => {
    expect(l.ecart).toBe(Math.round((5 / 15) * 100 - (1057 / 2243) * 100));
    expect(l.ecart).toBeLessThan(0);
  });

  it("désigne le palier qui porte le plus d'étapes restantes", () => {
    expect(l.palierLePlusLourd?.cle).toBe("custom");
  });

  it("ne garde que les paliers qui ont des étapes", () => {
    expect(l.paliers.every((p) => p.etapes > 0)).toBe(true);
  });
});

describe("les mots du temps", () => {
  it("écrit le premier du mois « 1er »", () => {
    expect(dateLongue(new Date(2023, 10, 1), MAINTENANT)).toBe("1er novembre 2023");
    expect(dateLongue(new Date(2026, 8, 26), MAINTENANT)).toBe("samedi 26 septembre");
  });

  it("donne le mois dès que le jour de semaine ne suffit plus", () => {
    expect(dateCourte(new Date(2026, 8, 26), MAINTENANT)).toBe("sam. 26");
    expect(dateCourte(new Date(2026, 10, 15), MAINTENANT)).toBe("15 nov.");
    expect(dateCourte(new Date(2027, 3, 12), MAINTENANT)).toBe("avr. 2027");
  });

  it("dit une distance à l'échelle qui lui va", () => {
    expect(resteAvant(new Date(2026, 8, 26, 18, 0), MAINTENANT)).toBe("2 j 22 h");
    expect(dans(new Date(2026, 8, 24, 2, 0), MAINTENANT)).toBe("6 h 18");
    expect(dans(new Date(2026, 9, 4), MAINTENANT)).toBe("10 jours");
    expect(dans(new Date(2026, 11, 31), MAINTENANT)).toBe("3 mois");
    expect(dans(new Date(2029, 11, 22), MAINTENANT)).toBe("3,2 ans");
  });

  it("lit les dates du scénario en heure locale", () => {
    expect(lireDate("2026-09-26T18:00")).toEqual(new Date(2026, 8, 26, 18, 0));
    expect(lireDate("2026-09-30")).toEqual(new Date(2026, 8, 30));
  });
});
