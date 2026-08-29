import { describe, it, expect } from "vitest";
import { fr } from "date-fns/locale";
import {
  ordonnerLesSucces, compterLePantheon, plusHauteRareteObtenue, chroniqueParMois, lesPlusProches, TOUT,
} from "./pantheon";
import type { Succes } from "@/domaines/succes/types";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Cinq façons de se tromper sans bruit : une liste mal triée ressemble
   à une liste, un compteur faux ressemble à un compteur.

   Le tri du panthéon a QUATRE départages, et chacun ne tranche que ce
   que le précédent laisse à égalité. En permuter deux change ce que la
   page montre en premier sans rien casser — et ce qu'elle montre en
   premier est la raison de l'ouvrir.
   ═══════════════════════════════════════════════════════════════ */

let n = 0;
const succes = (p: Partial<Succes> = {}): Succes => ({
  cle: `s${++n}`, categorie: "general", obtenu: false, avancement: 0,
  rarete: "common", points: 0, cache: false, obtenu_le: null,
  ...p,
} as unknown as Succes);

describe("l'ordre du panthéon", () => {
  const cles = (l: Succes[]) => l.map((s) => s.cle);

  it("met les nouveaux devant tout le reste", () => {
    /* Ils sont la raison d'ouvrir la page : un nouveau obtenu doit
       passer devant un ancien non obtenu, même mieux avancé. */
    const neuf = succes({ cle: "neuf", obtenu: true, rarete: "common" });
    const vieux = succes({ cle: "vieux", obtenu: false, avancement: 90, rarete: "legendary" });
    const r = ordonnerLesSucces({ succes: [vieux, neuf], categorie: TOUT, cacherObtenus: false, neufs: new Set(["neuf"]) });
    expect(cles(r)).toEqual(["neuf", "vieux"]);
  });

  it("range ensuite ce qui n'est pas encore obtenu avant ce qui l'est", () => {
    const fait = succes({ cle: "fait", obtenu: true, avancement: 100 });
    const enCours = succes({ cle: "enCours", obtenu: false, avancement: 10 });
    expect(cles(ordonnerLesSucces({ succes: [fait, enCours], categorie: TOUT, cacherObtenus: false, neufs: null })))
      .toEqual(["enCours", "fait"]);
  });

  it("départage deux non-obtenus par avancement, puis par rareté", () => {
    const a = succes({ cle: "a", avancement: 10, rarete: "legendary" });
    const b = succes({ cle: "b", avancement: 80, rarete: "common" });
    const c = succes({ cle: "c", avancement: 80, rarete: "mythic" });
    expect(cles(ordonnerLesSucces({ succes: [a, b, c], categorie: TOUT, cacherObtenus: false, neufs: null })))
      .toEqual(["c", "b", "a"]);
  });

  it("filtre par catégorie, et « tout » n'en filtre aucune", () => {
    const l = [succes({ cle: "x", categorie: "sport" }), succes({ cle: "y", categorie: "focus" })];
    expect(cles(ordonnerLesSucces({ succes: l, categorie: "sport", cacherObtenus: false, neufs: null }))).toEqual(["x"]);
    expect(ordonnerLesSucces({ succes: l, categorie: TOUT, cacherObtenus: false, neufs: null })).toHaveLength(2);
  });

  it("cache les obtenus quand on le demande, et seulement alors", () => {
    const l = [succes({ cle: "fait", obtenu: true }), succes({ cle: "reste" })];
    expect(cles(ordonnerLesSucces({ succes: l, categorie: TOUT, cacherObtenus: true, neufs: null }))).toEqual(["reste"]);
    expect(ordonnerLesSucces({ succes: l, categorie: TOUT, cacherObtenus: false, neufs: null })).toHaveLength(2);
  });

  it("ne se plaint pas quand rien n'est nouveau", () => {
    const l = [succes({ cle: "a" }), succes({ cle: "b" })];
    expect(ordonnerLesSucces({ succes: l, categorie: TOUT, cacherObtenus: false, neufs: null })).toHaveLength(2);
  });
});

describe("les compteurs", () => {
  it("compte les obtenus, leurs points, les coffres complets et la part", () => {
    const l = [
      succes({ obtenu: true, points: 30 }), succes({ obtenu: true, points: 20 }),
      succes({ points: 500 }), succes({ points: 500 }),
    ];
    expect(compterLePantheon(l, [{ complet: true }, { complet: false }]))
      .toEqual({ obtenus: 2, points: 50, trophees: 1, part: 50 });
  });

  it("ne compte QUE les points des succès obtenus", () => {
    /* Un panthéon qui annonce les points qu'on n'a pas gagnés ment
       exactement là où il est censé récompenser. */
    expect(compterLePantheon([succes({ points: 999 })], []).points).toBe(0);
  });

  it("rend zéro pour cent plutôt qu'une division par zéro", () => {
    expect(compterLePantheon([], []).part).toBe(0);
  });

  it("arrondit la part au lieu de la tronquer", () => {
    /* 1 sur 3 fait 33,33 : arrondi et troncature donnent tous deux 33,
       et le test ne prouvait rien. 2 sur 3 fait 66,67, ou les deux
       divergent — c est le seul endroit ou la difference existe. */
    const l = [succes({ obtenu: true }), succes({ obtenu: true }), succes()];
    expect(compterLePantheon(l, []).part).toBe(67);
  });
});

describe("la plus haute rareté obtenue", () => {
  it("rend la plus rare EFFECTIVEMENT obtenue, pas la plus rare existante", () => {
    /* Le rang affichait « Élite » en dur : une statistique fictive
       posée entre deux vraies. */
    const l = [succes({ obtenu: true, rarete: "rare" }), succes({ obtenu: false, rarete: "legendary" })];
    expect(plusHauteRareteObtenue(l)).toBe("rare");
  });

  it("rend null quand rien n'est obtenu — jamais une valeur par défaut", () => {
    expect(plusHauteRareteObtenue([succes({ rarete: "mythic" })])).toBeNull();
    expect(plusHauteRareteObtenue([])).toBeNull();
  });

  it("respecte l'échelle, pas l'ordre alphabétique", () => {
    /* « epic » vient avant « legendary » dans l'alphabet mais après
       dans l'échelle ; « common » avant « rare » dans les deux. */
    expect(plusHauteRareteObtenue([
      succes({ obtenu: true, rarete: "legendary" }), succes({ obtenu: true, rarete: "epic" }),
    ])).toBe("legendary");
  });
});

describe("la chronique par mois", () => {
  const obtenuLe = (iso: string, rarete = "common") => succes({ obtenu: true, obtenu_le: iso, rarete });

  it("regroupe par mois, du plus récent au plus ancien", () => {
    const c = chroniqueParMois([
      obtenuLe("2026-01-15T10:00:00"), obtenuLe("2026-03-02T10:00:00"), obtenuLe("2026-01-28T10:00:00"),
    ], fr);
    expect(c.map((g) => g.titre)).toEqual(["mars 2026", "janvier 2026"]);
    expect(c.map((g) => g.succes.length)).toEqual([1, 2]);
  });

  it("range chaque mois du plus rare au plus commun", () => {
    const c = chroniqueParMois([
      obtenuLe("2026-01-02T10:00:00", "common"), obtenuLe("2026-01-03T10:00:00", "legendary"),
    ], fr);
    expect(c[0].succes.map((s) => s.rarete)).toEqual(["legendary", "common"]);
  });

  it("laisse dehors ce qui n'est pas obtenu, et ce qui n'a pas de date", () => {
    /* Un succès obtenu sans date ne peut pas être raconté : le mettre
       dans un mois arbitraire inventerait une histoire. */
    expect(chroniqueParMois([
      succes({ obtenu: false, obtenu_le: "2026-01-01T00:00:00" }),
      succes({ obtenu: true, obtenu_le: null }),
    ], fr)).toEqual([]);
  });
});

describe("les trois plus proches", () => {
  it("prend les mieux avancés, sans les obtenus ni les cachés", () => {
    const l = [
      succes({ cle: "haut", avancement: 90 }), succes({ cle: "moyen", avancement: 50 }),
      succes({ cle: "fait", avancement: 100, obtenu: true }),
      succes({ cle: "secret", avancement: 95, cache: true }),
    ];
    expect(lesPlusProches(l).map((s) => s.cle)).toEqual(["haut", "moyen"]);
  });

  it("écarte ce qui n'est pas commencé — zéro pour cent n'est pas « proche »", () => {
    expect(lesPlusProches([succes({ avancement: 0 })])).toEqual([]);
  });

  it("n'en montre jamais plus de trois", () => {
    expect(lesPlusProches(Array.from({ length: 8 }, (_, i) => succes({ avancement: i + 1 })))).toHaveLength(3);
  });
});
