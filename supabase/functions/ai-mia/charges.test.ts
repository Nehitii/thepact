import { describe, expect, it } from "vitest";
import {
  DUREE_PAR_DEFAUT_MS, bornesDeLEvenement, choixOuDefaut, drapeau, instantLu, valeurOuNulle,
} from "./charges.ts";

describe("lire un instant", () => {
  it("accepte une date ISO", () => {
    expect(instantLu("2026-09-15T14:00:00Z")?.toISOString()).toBe("2026-09-15T14:00:00.000Z");
  });

  it("rend rien pour ce qui est absent", () => {
    expect(instantLu(null)).toBeNull();
    expect(instantLu(undefined)).toBeNull();
    expect(instantLu("")).toBeNull();
  });

  /* ═══ ZERO EST REFUSE, ET IL FALLAIT LE VERIFIER ═══
   *
   * Le code d avant testait la VERITE de l argument, pas sa presence.
   * Sur un seul argument les deux different : le nombre zero.
   * `String(0)` vaut « 0 », et `new Date("0")` vaut le premier janvier
   * 2000 — un test de presence aurait donc transforme `start_time: 0`
   * en evenement de l an 2000. Le test de verite le refuse, comme
   * avant. */
  it("refuse zero, que le test de presence aurait accepte", () => {
    expect(new Date("0").getFullYear()).toBe(2000);
    expect(instantLu(0)).toBeNull();
    expect(instantLu(false)).toBeNull();
  });

  /* UNE DATE ILLISIBLE NE LEVE PAS, elle rend une date dont le temps
     vaut NaN. C est la seule facon de la reconnaitre — et c est ce
     test-la qui manque au bout de la chaine, cote fin d evenement. */
  it("reconnait une date illisible a son temps", () => {
    expect(new Date("pas une date").getTime()).toBeNaN();
    expect(instantLu("pas une date")).toBeNull();
    expect(instantLu("2026-13-45")).toBeNull();
  });

  /* UN HORODATAGE EN MILLISECONDES EST REFUSE, et c est le passage par
     `String()` qui en decide : `new Date(1767225600000)` serait une
     date valide, `new Date("1767225600000")` n en est pas une. Le
     modele doit donc repondre une date ecrite, jamais un nombre. */
  it("refuse un horodatage en millisecondes", () => {
    const ms = Date.UTC(2026, 0, 1);
    expect(new Date(ms).getTime()).toBe(ms);
    expect(new Date(String(ms)).getTime()).toBeNaN();
    expect(instantLu(ms)).toBeNull();
  });

  /* UN NOMBRE A QUATRE CHIFFRES, LUI, PASSE — et vaut une annee. */
  it("prend un nombre a quatre chiffres pour une annee", () => {
    expect(instantLu(2026)?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("les bornes d un evenement", () => {
  const debut = "2026-09-15T14:00:00Z";

  it("pose une heure quand la fin n est pas dite", () => {
    expect(DUREE_PAR_DEFAUT_MS).toBe(3_600_000);
    const b = bornesDeLEvenement(debut, undefined);
    expect(b?.debut.toISOString()).toBe("2026-09-15T14:00:00.000Z");
    expect(b?.fin.toISOString()).toBe("2026-09-15T15:00:00.000Z");
    expect((b as { fin: Date; debut: Date }).fin.getTime() - (b as { debut: Date }).debut.getTime())
      .toBe(DUREE_PAR_DEFAUT_MS);
  });

  it("garde la fin quand elle est dite", () => {
    const b = bornesDeLEvenement(debut, "2026-09-15T16:30:00Z");
    expect(b?.fin.toISOString()).toBe("2026-09-15T16:30:00.000Z");
  });

  it("refuse un debut absent ou illisible", () => {
    expect(bornesDeLEvenement(null, null)).toBeNull();
    expect(bornesDeLEvenement("", null)).toBeNull();
    expect(bornesDeLEvenement("hier", null)).toBeNull();
  });

  /* ═══ LE DEBUT EST VERIFIE, LA FIN NE L EST PAS ═══
   *
   * Le meme mot mal forme donne un refus propre cote debut, et une
   * RangeError cote fin : l appelant enchaine sur `fin.toISOString()`,
   * qui LEVE sur une date invalide. Un argument mal forme suffit donc a
   * faire tomber le tour d outil. Constate, non corrige. */
  it("laisse passer une fin illisible, que l appelant fera lever", () => {
    const b = bornesDeLEvenement(debut, "pas une date");
    expect(b).not.toBeNull();
    expect(b?.fin.getTime()).toBeNaN();
    expect(() => b?.fin.toISOString()).toThrow(RangeError);
    /* Le meme mot, cote debut, est refuse proprement. */
    expect(bornesDeLEvenement("pas une date", debut)).toBeNull();
  });

  /* RIEN NE VERIFIE QUE LA FIN SUIT LE DEBUT. Un evenement qui se
     termine avant de commencer part en base tel quel. */
  it("accepte un evenement qui finit avant de commencer", () => {
    const b = bornesDeLEvenement(debut, "2026-09-15T09:00:00Z");
    expect(b?.fin.getTime()).toBeLessThan(b?.debut.getTime() ?? 0);
  });

  /* UNE FIN A LA CHAINE VIDE N EST PAS UNE FIN : le test de verite la
     traite comme absente, et l heure par defaut s applique. */
  it("traite une fin vide comme une fin absente", () => {
    expect(bornesDeLEvenement(debut, "")?.fin.toISOString()).toBe("2026-09-15T15:00:00.000Z");
    expect(bornesDeLEvenement(debut, 0)?.fin.toISOString()).toBe("2026-09-15T15:00:00.000Z");
  });
});

describe("les drapeaux", () => {
  it("lit les booleens que le schema demande", () => {
    expect(drapeau(true)).toBe(true);
    expect(drapeau(false)).toBe(false);
    expect(drapeau(undefined)).toBe(false);
    expect(drapeau(null)).toBe(false);
  });

  /* ═══ « false » EST VRAI ═══
   *
   * Le schema demande un booleen ; un modele qui repond en texte fait
   * lever le drapeau. « false », « 0 », « non » : toutes ces chaines
   * sont vraies pour JavaScript, et la ligne part en base avec
   * l evenement marque toute la journee, ou la tache marquee urgente.
   * Constate, non corrige. */
  it("prend une chaine « false » pour un oui", () => {
    expect(drapeau("false")).toBe(true);
    expect(drapeau("0")).toBe(true);
    expect(drapeau("non")).toBe(true);
  });

  it("ne prend pas le zero ni la chaine vide pour un oui", () => {
    expect(drapeau(0)).toBe(false);
    expect(drapeau("")).toBe(false);
  });
});

describe("les choix fermes", () => {
  it("pose le defaut quand rien n est dit", () => {
    expect(choixOuDefaut(undefined, "medium")).toBe("medium");
    expect(choixOuDefaut(null, "general")).toBe("general");
  });

  it("garde ce que le modele a repondu", () => {
    expect(choixOuDefaut("hard", "medium")).toBe("hard");
  });

  /* ═══ LE SCHEMA EST UNE DEMANDE, PAS UNE GARANTIE ═══
   *
   * `difficulty`, `priority` et `category` sont des listes fermees dans
   * le schema envoye au modele — et rien ne les verifie au retour. Ce
   * qu il repond part en base, meme hors liste. Constate, non
   * corrige. */
  it("ecrit une valeur hors liste sans broncher", () => {
    expect(choixOuDefaut("impossible", "medium")).toBe("impossible");
    expect(choixOuDefaut("", "medium")).toBe("");
    expect(choixOuDefaut(42, "medium")).toBe(42);
  });

  /* LA CHAINE VIDE N EST PAS « RIEN » : `??` ne retient que null et
     undefined. Un modele qui repond une chaine vide ecrit une chaine
     vide, pas le defaut. */
  it("distingue la chaine vide de l absence", () => {
    expect(choixOuDefaut("", "medium")).not.toBe("medium");
    expect(choixOuDefaut(undefined, "medium")).toBe("medium");
  });
});

describe("ce qui n est pas donne vaut null", () => {
  it("remplace l absence par null, et rien d autre", () => {
    expect(valeurOuNulle(undefined)).toBeNull();
    expect(valeurOuNulle(null)).toBeNull();
    expect(valeurOuNulle("")).toBe("");
    expect(valeurOuNulle(0)).toBe(0);
    expect(valeurOuNulle(false)).toBe(false);
  });
});
