import { describe, it, expect } from "vitest";
import { avancerLaSerie, cleDuJour, type CompteursDeTaches } from "./serie";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Une série fausse ne se voit pas : elle affiche un nombre plausible.
   C'est le genre de calcul qu'on ne relit qu'après avoir perdu une
   série de quarante jours — et alors il est trop tard pour la rendre.

   Les cas retenus sont ceux où un jour se décale : minuit, la veille,
   un trou, un changement de mois. Chacun est une occasion d'être faux
   d'exactement un.
   ═══════════════════════════════════════════════════════════════ */

const compteurs = (p: Partial<CompteursDeTaches> = {}): CompteursDeTaches => ({
  current_streak: 0, longest_streak: 0, last_completion_date: null,
  tasks_completed_month: 0, tasks_completed_year: 0,
  current_month: 1, current_year: 2026, ...p,
});
/* Une date LOCALE : construire avec un `Z` mettrait le test à la merci
   du fuseau de la machine qui l'exécute, ce qui est exactement le
   défaut que `cleDuJour` corrige. */
const le = (a: number, m: number, j: number, h = 12) => new Date(a, m - 1, j, h);

describe("le jour, dans le fuseau de qui coche", () => {
  it("appelle « aujourd'hui » le jour local, même juste après minuit", () => {
    /* `toISOString()` aurait renvoyé la veille pour 00 h 30 à Paris,
       et cassé une série qui devait tenir. */
    expect(cleDuJour(le(2026, 3, 4, 0))).toBe("2026-03-04");
    expect(cleDuJour(le(2026, 3, 4, 23))).toBe("2026-03-04");
  });

  it("garde deux chiffres au mois et au jour", () => {
    expect(cleDuJour(le(2026, 1, 2))).toBe("2026-01-02");
  });
});

describe("la série", () => {
  it("part à un pour la toute première tâche", () => {
    const a = avancerLaSerie(compteurs(), le(2026, 3, 4));
    expect(a.serie).toBe(1);
    expect(a.plusLongueSerie).toBe(1);
  });

  it("avance d'un quand la dernière fois, c'était hier", () => {
    const a = avancerLaSerie(compteurs({ current_streak: 6, last_completion_date: "2026-03-03" }), le(2026, 3, 4));
    expect(a.serie).toBe(7);
  });

  it("n'avance pas une deuxième fois le même jour", () => {
    /* Une série compte des JOURS, pas des tâches : sans ce garde, une
       journée productive vaudrait une semaine de constance. */
    const a = avancerLaSerie(compteurs({ current_streak: 6, last_completion_date: "2026-03-04" }), le(2026, 3, 4));
    expect(a.serie).toBe(6);
  });

  it("repart à un après un jour sauté, pas à zéro", () => {
    /* Zéro effacerait la tâche qu'on vient justement de terminer. */
    const a = avancerLaSerie(compteurs({ current_streak: 40, last_completion_date: "2026-03-01" }), le(2026, 3, 4));
    expect(a.serie).toBe(1);
  });

  it("enjambe la fin du mois", () => {
    const a = avancerLaSerie(compteurs({ current_streak: 3, last_completion_date: "2026-02-28", current_month: 3 }), le(2026, 3, 1));
    expect(a.serie).toBe(4);
  });

  it("enjambe le 29 février d'une année bissextile", () => {
    /* 2028 est bissextile : le 1er mars suit le 29 février, pas le 28. */
    expect(avancerLaSerie(compteurs({ current_streak: 3, last_completion_date: "2028-02-29", current_month: 3, current_year: 2028 }), le(2028, 3, 1)).serie).toBe(4);
    expect(avancerLaSerie(compteurs({ current_streak: 3, last_completion_date: "2028-02-28", current_month: 3, current_year: 2028 }), le(2028, 3, 1)).serie).toBe(1);
  });

  it("enjambe le Nouvel An", () => {
    const a = avancerLaSerie(compteurs({ current_streak: 9, last_completion_date: "2025-12-31", current_month: 1, current_year: 2026 }), le(2026, 1, 1));
    expect(a.serie).toBe(10);
  });
});

describe("le record", () => {
  it("ne descend jamais, même quand la série repart de un", () => {
    const a = avancerLaSerie(compteurs({ current_streak: 40, longest_streak: 40, last_completion_date: "2026-01-01" }), le(2026, 3, 4));
    expect(a).toMatchObject({ serie: 1, plusLongueSerie: 40 });
  });

  it("monte avec la série quand elle le dépasse", () => {
    const a = avancerLaSerie(compteurs({ current_streak: 12, longest_streak: 12, last_completion_date: "2026-03-03" }), le(2026, 3, 4));
    expect(a).toMatchObject({ serie: 13, plusLongueSerie: 13 });
  });
});

describe("les compteurs du mois et de l'année", () => {
  it("compte la tâche qu'on vient de terminer", () => {
    const a = avancerLaSerie(compteurs({ tasks_completed_month: 7, tasks_completed_year: 90, current_month: 3, current_year: 2026 }), le(2026, 3, 4));
    expect(a).toMatchObject({ compteDuMois: 8, compteDeLAnnee: 91, mois: 3, annee: 2026 });
  });

  it("remet le mois à zéro sans toucher à l'année", () => {
    /* Les deux ne tombent ensemble qu'une fois sur douze : les tester
       ensemble laisserait passer une remise à zéro croisée. */
    const a = avancerLaSerie(compteurs({ tasks_completed_month: 30, tasks_completed_year: 200, current_month: 2, current_year: 2026 }), le(2026, 3, 4));
    expect(a).toMatchObject({ compteDuMois: 1, compteDeLAnnee: 201 });
  });

  it("remet les deux à zéro au changement d'année", () => {
    const a = avancerLaSerie(compteurs({ tasks_completed_month: 30, tasks_completed_year: 400, current_month: 12, current_year: 2025 }), le(2026, 1, 4));
    expect(a).toMatchObject({ compteDuMois: 1, compteDeLAnnee: 1, mois: 1, annee: 2026 });
  });

  it("remet l'année sans toucher au mois quand le mois est le même", () => {
    /* Mars 2025 → mars 2026 : le numéro de mois n'a pas bougé, l'année
       si. Sans le test séparé, un `||` à la place des deux conditions
       passerait inaperçu ici. */
    const a = avancerLaSerie(compteurs({ tasks_completed_month: 12, tasks_completed_year: 300, current_month: 3, current_year: 2025 }), le(2026, 3, 4));
    expect(a).toMatchObject({ compteDuMois: 13, compteDeLAnnee: 1 });
  });
});
