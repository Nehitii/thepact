import { describe, expect, it } from "vitest";
import {
  CIBLES, CIBLE_PAR_DEFAUT, ORDRE_DES_TEMPS, SCHEMAS, SEUIL_TENSION,
  partiesDeDuree, rythmeSuggere, schemaDe, sequenceDe, tempsDunCycle, totalSecondes,
} from "./souffle";

/* LE SOUFFLE.
 *
 * Ce module tient ce que la respiration a de calculable — les rythmes,
 * la cible d une seance, le total — pour que le composant n ait plus
 * qu a afficher.
 *
 * Deux choses peuvent casser sans se voir : un temps a zero qui
 * s affiche quand meme (« retiens — 0 s »), et la suggestion du soir
 * qui se ferait doubler par celle de la tension. La seconde est un
 * choix explicite du module : a vingt-trois heures, meme tendu, ce
 * qu on cherche est de s endormir.
 */

describe("Les rythmes", () => {
  it("sont des classiques, et leurs quatre temps tiennent", () => {
    for (const s of SCHEMAS) {
      expect(s.temps).toHaveLength(4);
      for (const t of s.temps) expect(t).toBeGreaterThanOrEqual(0);
      expect(tempsDunCycle(s)).toBeGreaterThan(0);
    }
    expect(SCHEMAS.map((s) => s.id)).toEqual(["coherence", "boite", "apaiser", "dormir"]);
  });

  it("un cycle dure ce que ses temps additionnent", () => {
    /* Un cycle de 4-7-8 dure dix-neuf secondes quand un cycle de
       coherence en dure dix : c est pourquoi le total se compte en
       secondes et jamais en cycles. */
    expect(tempsDunCycle(schemaDe("coherence"))).toBe(10);
    expect(tempsDunCycle(schemaDe("boite"))).toBe(16);
    expect(tempsDunCycle(schemaDe("dormir"))).toBe(19);
  });

  it("un identifiant inconnu rend le premier plutot que rien", () => {
    /* Un reglage venu d une version anterieure ne doit pas rendre
       « undefined » a un composant qui va lire « .temps ». */
    expect(schemaDe("respiration-carree-v2")).toBe(SCHEMAS[0]);
    expect(schemaDe("")).toBe(SCHEMAS[0]);
  });
});

describe("La sequence d un cycle", () => {
  it("SAUTE LES TEMPS A ZERO", () => {
    /* Afficher « retiens — 0 s » serait absurde, et l anneau
       s arreterait une fraction de seconde sur un temps qui n existe
       pas. */
    expect(sequenceDe(schemaDe("coherence")).map((x) => x.nom)).toEqual(["inspire", "expire"]);
    expect(sequenceDe(schemaDe("dormir")).map((x) => x.nom))
      .toEqual(["inspire", "retiens", "expire"]);
    expect(sequenceDe(schemaDe("boite")).map((x) => x.nom)).toEqual([...ORDRE_DES_TEMPS]);
  });

  it("garde l ordre du souffle, et aucune duree nulle", () => {
    for (const s of SCHEMAS) {
      const seq = sequenceDe(s);
      for (const x of seq) expect(x.duree).toBeGreaterThan(0);
      /* La somme de la sequence vaut le cycle : rien ne se perd en
         filtrant. */
      expect(seq.reduce((a, x) => a + x.duree, 0)).toBe(tempsDunCycle(s));
    }
  });
});

describe("Le rythme suggere", () => {
  const soir = new Date(2026, 8, 15, 22, 0);
  const nuit = new Date(2026, 8, 15, 3, 0);
  const jour = new Date(2026, 8, 15, 14, 0);

  it("LE SOIR PASSE AVANT LA TENSION", () => {
    /* A vingt-deux heures, meme a dix de stress, ce qu on cherche est
       de s endormir. C est une decision, pas un ordre d evaluation
       accidentel. */
    expect(rythmeSuggere(10, 10, soir)).toEqual({ rythme: "dormir", motif: "soir" });
    expect(rythmeSuggere(0, 0, nuit)).toEqual({ rythme: "dormir", motif: "soir" });
  });

  it("les bornes du soir sont 21 h et 5 h", () => {
    expect(rythmeSuggere(0, 0, new Date(2026, 8, 15, 20, 59)).motif).toBe("defaut");
    expect(rythmeSuggere(0, 0, new Date(2026, 8, 15, 21, 0)).motif).toBe("soir");
    expect(rythmeSuggere(0, 0, new Date(2026, 8, 15, 4, 59)).motif).toBe("soir");
    expect(rythmeSuggere(0, 0, new Date(2026, 8, 15, 5, 0)).motif).toBe("defaut");
  });

  it("de jour, la tension l emporte au seuil", () => {
    expect(rythmeSuggere(SEUIL_TENSION, 0, jour)).toEqual({ rythme: "apaiser", motif: "tension" });
    expect(rythmeSuggere(0, SEUIL_TENSION, jour)).toEqual({ rythme: "apaiser", motif: "tension" });
    expect(rythmeSuggere(SEUIL_TENSION - 1, SEUIL_TENSION - 1, jour).motif).toBe("defaut");
  });

  it("prend la plus haute des deux mesures, et tolere leur absence", () => {
    /* Un releve incomplet ne doit pas faire retomber la suggestion sur
       « defaut » alors que l autre mesure crie. */
    expect(rythmeSuggere(null, 9, jour).motif).toBe("tension");
    expect(rythmeSuggere(9, undefined, jour).motif).toBe("tension");
    expect(rythmeSuggere(null, null, jour)).toEqual({ rythme: "coherence", motif: "defaut" });
  });

  it("ne suggere jamais un rythme qui n existe pas", () => {
    const ids = SCHEMAS.map((s) => s.id);
    for (const h of [0, 5, 12, 20, 21, 23]) {
      for (const t of [null, 0, 6, 7, 10]) {
        const d = new Date(2026, 8, 15, h, 0);
        expect(ids).toContain(rythmeSuggere(t, t, d).rythme);
      }
    }
  });
});

describe("La cible d une seance", () => {
  it("propose trois termes, et celui par defaut en fait partie", () => {
    /* Le compteur de cycles etait un nombre mort : ni terme, ni but. */
    expect(CIBLES).toEqual([3, 6, 10]);
    expect(CIBLES).toContain(CIBLE_PAR_DEFAUT);
  });
});

describe("Le total respire", () => {
  it("additionne les secondes, pas les cycles", () => {
    expect(totalSecondes([{ duree_secondes: 190 }, { duree_secondes: 100 }])).toBe(290);
    expect(totalSecondes([])).toBe(0);
  });

  it("tolere une seance sans duree plutot que de rendre NaN", () => {
    /* Une ligne ecrite par une version anterieure, ou une seance
       interrompue : un NaN se propagerait jusqu a l ecran. */
    expect(totalSecondes([{ duree_secondes: 0 }, { duree_secondes: 60 }])).toBe(60);
    expect(totalSecondes([{ duree_secondes: undefined as unknown as number }])).toBe(0);
  });

  it("se coupe en heures et minutes, arrondi a la minute", () => {
    expect(partiesDeDuree(0)).toEqual({ heures: 0, minutes: 0 });
    expect(partiesDeDuree(29)).toEqual({ heures: 0, minutes: 0 });
    expect(partiesDeDuree(30)).toEqual({ heures: 0, minutes: 1 });
    expect(partiesDeDuree(4320)).toEqual({ heures: 1, minutes: 12 });
    /* Jamais de negatif, meme sur une duree aberrante. */
    expect(partiesDeDuree(-500)).toEqual({ heures: 0, minutes: 0 });
  });
});
