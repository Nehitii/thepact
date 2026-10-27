import { describe, it, expect } from "vitest";
import { totalReel, totalPointe, aVenir, oubliees, restant } from "./pointage";
import type { Rang } from "@/domaines/finance/types";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Deux choses, et les deux comptent.

   L'ARGENT. Additionner des flottants donne
   0,30000000000000004 : la somme s'affiche avec quinze décimales, ou
   pire, deux montants égaux se comparent inégaux. On compte en
   centimes, on rend en euros.

   LE REPROCHE. Une ligne non pointée dont l'argent n'a pas encore bougé
   n'est PAS un oubli — le loyer d'août encaissé le 3 septembre ne peut
   pas être coché le 21 août. Les compter ensemble faisait reprocher un
   retard à qui n'avait rien oublié, et poussait à cocher pour faire
   taire le compteur : exactement ce qu'un pointage ne doit pas
   encourager.
   ═══════════════════════════════════════════════════════════════ */

let n = 0;
const rang = (p: Partial<Rang> & { reel?: number } = {}): Rang => ({
  item: { id: `i${++n}`, name: "Ligne" }, prevu: 0, reel: 0, pointe: false,
  quand: null, passe: true, ...p,
} as unknown as Rang);

describe("l'argent", () => {
  it("additionne en centimes, pas en flottants", () => {
    /* 0.1 + 0.2 vaut 0.30000000000000004 en JavaScript. Le total
       affiché serait « 0,30000000000000004 € ». */
    expect(totalReel([rang({ reel: 0.1 }), rang({ reel: 0.2 })])).toBe(0.3);
  });

  it("arrondit le centime au lieu de le perdre", () => {
    /* 19,99 + 0,01 fait 1999,9999999999998 centimes. Arrondi : 20,00 €.
       Tronqué : 19,99 € — un centime disparu d'un total d'argent.
     *
     * Mon premier exemple, 1,005 + 2,005, ne prouvait rien : les deux
     * façons y donnent 3,01. Il a fallu chercher le cas où elles
     * divergent, et c'est un abonnement à 19,99 plus un ajustement
     * d'un centime — pas un cas de laboratoire. */
    expect(totalReel([rang({ reel: 19.99 }), rang({ reel: 0.01 })])).toBe(20);
  });

  it("ne compte que le pointé, et tout dans l'autre lecture", () => {
    const rs = [rang({ reel: 100, pointe: true }), rang({ reel: 40 })];
    expect(totalPointe(rs)).toBe(100);
    expect(totalReel(rs)).toBe(140);
  });

  it("rend zéro sur une liste vide, jamais NaN", () => {
    expect(totalReel([])).toBe(0);
    expect(totalPointe([])).toBe(0);
  });

  it("compte le réel, pas le prévu — c'est toute la raison de pointer", () => {
    expect(totalPointe([rang({ prevu: 900, reel: 750, pointe: true })])).toBe(750);
  });

  it("accepte un montant négatif sans le redresser", () => {
    /* Un remboursement est une dépense négative ; l'écraser à zéro
       ferait mentir le bilan du mois. */
    expect(totalReel([rang({ reel: 100 }), rang({ reel: -30 })])).toBe(70);
  });
});

describe("ce qui reste n'est pas ce qui manque", () => {
  const passee = rang({ passe: true });
  const aucuneDate = rang({ passe: undefined });
  const future = rang({ passe: false });
  const cochee = rang({ passe: true, pointe: true });
  const rs = [passee, aucuneDate, future, cochee];

  it("ne met dans « à venir » que ce dont l'argent n'a pas encore bougé", () => {
    expect(aVenir(rs)).toEqual([future]);
  });

  it("met dans « oubliées » le passé ET ce dont on ignore la date", () => {
    /* Les deux tests ne sont pas symétriques par hasard : `passe` vaut
       `undefined` quand la date de mouvement est inconnue, et une ligne
       dont on ignore la date n'est PAS à venir. La ranger avec les
       futures la ferait disparaître de ce qui appelle une action. */
    expect(oubliees(rs)).toEqual([passee, aucuneDate]);
  });

  it("ne compte comme restant que les oubliées", () => {
    /* C'est ce nombre qui décide si le mois peut être validé. S'il
       comptait les lignes à venir, un mois normalement mené resterait
       ouvert jusqu'à ce qu'on coche des mouvements qui n'ont pas eu
       lieu. */
    expect(restant(rs)).toBe(2);
    expect(restant([future])).toBe(0);
    expect(restant([cochee])).toBe(0);
  });

  it("laisse dehors ce qui est déjà pointé, dans les deux lectures", () => {
    const futureCochee = rang({ passe: false, pointe: true });
    expect(aVenir([futureCochee])).toEqual([]);
    expect(oubliees([futureCochee])).toEqual([]);
  });

  it("ne compte aucune ligne deux fois", () => {
    /* Un rang appartient à « à venir » ou à « oubliées », jamais aux
       deux — sinon le total des deux dépasserait la liste. */
    const tous = [...aVenir(rs), ...oubliees(rs)];
    expect(new Set(tous).size).toBe(tous.length);
    expect(tous.length).toBe(rs.filter((r) => !r.pointe).length);
  });
});
