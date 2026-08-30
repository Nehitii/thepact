import { describe, expect, it } from "vitest";
import {
  avancementDuPointage, bilanDuMois, DEMI_CENTIME, estCorrige, nonCochees, soldeDuMois,
} from "./bilan";
import type { Rang } from "@/domaines/finance/types";

/* passe : true = a deja eu lieu, false = a venir, null = on ne sait pas. */
const rang = (
  prevu: number, reel: number, pointe: boolean, passe: boolean | null = true,
): Rang => ({
  item: { id: String(Math.abs(prevu) + reel + (pointe ? 1 : 0)), name: "x", amount: prevu } as Rang["item"],
  prevu, reel, pointe, quand: null, passe,
});

describe("estCorrige — deux montants d argent ne se comparent pas avec ===", () => {
  it("ne voit aucune correction quand le reel vaut le prevu", () => {
    expect(estCorrige({ prevu: 19.99, reel: 19.99 })).toBe(false);
  });

  /* 0,1 + 0,2 ne fait pas 0,3 en virgule flottante. L egalite stricte
     declarerait cette ligne corrigee alors que personne n y a touche. */
  it("ne voit aucune correction sur un ecart de virgule flottante", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(estCorrige({ prevu: 0.3, reel: 0.1 + 0.2 })).toBe(false);
  });

  it("voit un centime d ecart", () => {
    expect(estCorrige({ prevu: 19.99, reel: 20 })).toBe(true);
  });

  it("voit un ecart dans les deux sens", () => {
    expect(estCorrige({ prevu: 20, reel: 19.99 })).toBe(true);
    expect(estCorrige({ prevu: 19.99, reel: 20 })).toBe(true);
  });

  /* LE SEUIL EST LA MOITIE DE LA PLUS PETITE SOMME QU ON PUISSE
     ECRIRE : en dessous, aucune saisie possible ne peut tomber. */
  it("place le seuil au demi-centime, borne comprise", () => {
    expect(DEMI_CENTIME).toBe(0.005);
    expect(estCorrige({ prevu: 0, reel: DEMI_CENTIME })).toBe(true);
    expect(estCorrige({ prevu: 0, reel: DEMI_CENTIME - 1e-9 })).toBe(false);
  });
});

describe("avancementDuPointage", () => {
  it("compte les lignes cochees sur le total", () => {
    expect(avancementDuPointage([rang(10, 10, true), rang(20, 20, false), rang(5, 5, true)]))
      .toEqual({ faits: 2, total: 3 });
  });

  /* UNE LIGNE A VENIR COMPTE DANS LE TOTAL. Elle est affichee, donc
     elle se compte : « 2 / 5 » doit dire ce qu on voit. */
  it("compte les lignes a venir dans le total", () => {
    expect(avancementDuPointage([rang(10, 10, true), rang(20, 20, false, false)]))
      .toEqual({ faits: 1, total: 2 });
  });

  it("rend zero sur zero pour une liste vide", () => {
    expect(avancementDuPointage([])).toEqual({ faits: 0, total: 0 });
  });
});

describe("soldeDuMois", () => {
  /* LES TOTAUX NE COMPTENT QUE LES LIGNES COCHEES. Une ligne non
     cochee veut dire « je n ai pas verifie », et non « zero ». */
  it("ne somme que les lignes cochees", () => {
    const s = soldeDuMois({
      income: [rang(2000, 2000, true), rang(500, 500, false)],
      expense: [rang(800, 850, true), rang(100, 100, false)],
    });
    expect(s.revenus).toBe(2000);
    expect(s.depenses).toBe(850);
    expect(s.solde).toBe(1150);
  });

  it("prend le montant REEL et non le prevu", () => {
    const s = soldeDuMois({ income: [rang(1000, 1200, true)], expense: [] });
    expect(s.revenus).toBe(1200);
  });

  it("dit « moins » quand les depenses l emportent", () => {
    const s = soldeDuMois({ income: [rang(500, 500, true)], expense: [rang(800, 800, true)] });
    expect(s.solde).toBe(-300);
    expect(s.signe).toBe("moins");
  });

  /* NE RIEN PERDRE N EST PAS PERDRE : un solde nul compte comme
     « plus ». */
  it("dit « plus » sur un solde nul", () => {
    const s = soldeDuMois({ income: [rang(800, 800, true)], expense: [rang(800, 800, true)] });
    expect(s.solde).toBe(0);
    expect(s.signe).toBe("plus");
  });

  it("rend zero partout quand rien n est coche", () => {
    const s = soldeDuMois({ income: [rang(2000, 2000, false)], expense: [rang(800, 800, false)] });
    expect(s).toEqual({ revenus: 0, depenses: 0, solde: 0, signe: "plus" });
  });
});

describe("nonCochees et bilanDuMois — ce qui part en base", () => {
  /* UNE LIGNE A VENIR N EST PAS UN OUBLI : elle n a pas encore eu
     lieu, la cocher inscrirait un mouvement qui n a pas eu lieu. */
  it("ne compte pas les lignes a venir parmi les oubliees", () => {
    expect(nonCochees({
      income: [rang(500, 500, false, false)],
      expense: [rang(100, 100, false, true)],
    })).toBe(1);
  });

  /* LES DEUX COTES SE COMPTENT. Le balayage de mutations a montre
     ce trou : ne sommer que les depenses passait tous les tests
     precedents, parce qu aucun ne posait d oubli des deux cotes a la
     fois. */
  it("additionne les oubliees des deux cotes", () => {
    expect(nonCochees({
      income: [rang(500, 500, false), rang(300, 300, false)],
      expense: [rang(100, 100, false)],
    })).toBe(3);
  });

  it("compte une oubliee cote revenus seule", () => {
    expect(nonCochees({ income: [rang(500, 500, false)], expense: [] })).toBe(1);
  });

  it("compte une ligne dont on ignore la date comme ayant eu lieu", () => {
    expect(nonCochees({ income: [], expense: [rang(100, 100, false, null)] })).toBe(1);
  });

  it("declare le mois confirme quand plus rien qui ait eu lieu n attend", () => {
    const b = bilanDuMois({
      income: [rang(2000, 2000, true)],
      expense: [rang(800, 800, true), rang(50, 50, false, false)],
    });
    expect(b.confirmed_income).toBe(true);
    /* La ligne a venir n empeche pas la confirmation. */
    expect(b.confirmed_expenses).toBe(true);
  });

  it("ne declare pas confirme ce qui attend encore", () => {
    const b = bilanDuMois({ income: [], expense: [rang(800, 800, false, true)] });
    expect(b.confirmed_expenses).toBe(false);
    /* Une liste vide est confirmee : il n y a rien a verifier. */
    expect(b.confirmed_income).toBe(true);
  });

  it("emporte les totaux reels des lignes cochees", () => {
    const b = bilanDuMois({
      income: [rang(2000, 2100, true)],
      expense: [rang(800, 790, true)],
    });
    expect(b.actual_total_income).toBe(2100);
    expect(b.actual_total_expenses).toBe(790);
  });

  /* LES DEUX COLONNES « IMPREVU » PARTENT TOUJOURS A ZERO. Rien, dans
     toute l application, n ecrit jamais autre chose : ce parcours est
     leur seul redacteur. L analytique les relit pourtant et en tire
     une barre « Dont imprevu » qui ne peut donc jamais monter. Ce
     test fixe le fait, il ne l approuve pas. */
  it("ecrit toujours zero dans les deux colonnes d imprevu", () => {
    const b = bilanDuMois({ income: [rang(2000, 2100, true)], expense: [rang(800, 950, true)] });
    expect(b.unplanned_income).toBe(0);
    expect(b.unplanned_expenses).toBe(0);
  });
});
