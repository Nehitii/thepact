import { describe, it, expect } from "vitest";
import { fr } from "date-fns/locale";
import {
  moisValides, serieDeMoisTenus, construireLaFrise, estMensuelle, type Validation,
} from "./frise";
import type { FinancialItem } from "@/domaines/finance/types";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Des dates et des sommes — les deux se trompent sans bruit. Une série
   fausse est un nombre plausible ; une case qui montre une PRÉVISION là
   où il existe un CONSTATÉ ressemble à une case correcte.

   Le mois en cours n'a pas encore eu lieu : son absence ne compte pas
   contre la série. Sans ce recul d'un cran, toute série tomberait à
   zéro le premier de chaque mois, et remonterait à son vrai chiffre le
   jour où l'on valide — un compteur qui clignote.
   ═══════════════════════════════════════════════════════════════ */

const validation = (mois: string, p: Partial<Validation> = {}): Validation => ({
  month: `${mois}-01`, validated_at: "2026-01-01T00:00:00Z", ...p,
});
const ligne = (p: Record<string, unknown>) => p as unknown as FinancialItem;
/* Mars 2026, pour que « le mois en cours » soit une date fixe. */
const MARS = new Date(2026, 2, 15);

describe("les mois validés", () => {
  it("ne retient que ceux qui portent une date de validation", () => {
    /* Une ligne créée mais jamais validée existe en base : la compter
       ferait croire à un mois tenu. */
    const v = moisValides([validation("2026-01"), validation("2026-02", { validated_at: null })]);
    expect([...v]).toEqual(["2026-01"]);
  });

  it("range par mois, pas par jour", () => {
    expect([...moisValides([{ month: "2026-01-17", validated_at: "x" }])]).toEqual(["2026-01"]);
  });
});

describe("la série de mois tenus", () => {
  it("ne compte pas le mois en cours contre elle", () => {
    /* Mars n'est pas validé — c'est normal, il n'est pas fini. La série
       part donc de février. */
    const v = moisValides([validation("2026-02"), validation("2026-01")]);
    expect(serieDeMoisTenus(v, MARS)).toBe(2);
  });

  it("compte le mois en cours quand il EST validé", () => {
    const v = moisValides([validation("2026-03"), validation("2026-02")]);
    expect(serieDeMoisTenus(v, MARS)).toBe(2);
  });

  it("s'arrête au premier trou, sans sauter par-dessus", () => {
    /* Février manque : janvier et décembre ne comptent plus, même
       validés. Une série est continue ou n'est pas. */
    const v = moisValides([validation("2026-01"), validation("2025-12")]);
    expect(serieDeMoisTenus(v, MARS)).toBe(0);
  });

  it("enjambe le Nouvel An", () => {
    const v = moisValides([validation("2026-02"), validation("2026-01"), validation("2025-12"), validation("2025-11")]);
    expect(serieDeMoisTenus(v, MARS)).toBe(4);
  });

  it("rend zéro quand rien n'a jamais été validé", () => {
    expect(serieDeMoisTenus(new Set(), MARS)).toBe(0);
  });
});

describe("ce que chaque case montre", () => {
  const frise = (validations: Validation[], depenses: FinancialItem[] = [], revenus: FinancialItem[] = []) =>
    construireLaFrise({
      annee: 2026, validations, depenses, revenus,
      moisAffiche: new Date(2026, 2, 1), locale: fr, maintenant: MARS,
    });

  it("rend douze cases, quoi qu'il arrive", () => {
    expect(frise([])).toHaveLength(12);
    expect(frise([]).map((c) => c.cle)).toEqual(
      Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`));
  });

  it("montre le solde CONSTATÉ d'un mois validé, pas la prévision", () => {
    /* C'est justement l'écart entre les deux qui a de la valeur : le
       masquer effacerait la seule information que le pointage produit. */
    const c = frise(
      [validation("2026-01", { actual_total_income: 2000, actual_total_expenses: 1750 })],
      [ligne({ id: "d", is_active: true, amount: 9999, periode_mois: 1 })],
    )[0];
    expect(c).toMatchObject({ solde: 250, reel: true, valide: true });
  });

  it("n'invente rien pour un mois passé sans validation", () => {
    /* Lui calculer un résultat après coup serait une prévision déguisée
       en histoire. */
    expect(frise([])[0]).toMatchObject({ solde: null, reel: false, passe: true });
  });

  it("calcule le mois en cours et ceux d'après", () => {
    const c = frise([],
      [ligne({ id: "d", is_active: true, amount: 300, periode_mois: 1 })],
      [ligne({ id: "r", is_active: true, amount: 1000, periode_mois: 1 })]);
    expect(c[2]).toMatchObject({ solde: 700, reel: false, encours: true, passe: false });
    expect(c[11]).toMatchObject({ solde: 700, passe: false });
  });

  it("marque le mois en cours et le mois choisi séparément", () => {
    const c = construireLaFrise({
      annee: 2026, validations: [], depenses: [], revenus: [],
      moisAffiche: new Date(2026, 6, 1), locale: fr, maintenant: MARS,
    });
    expect(c.filter((x) => x.encours).map((x) => x.cle)).toEqual(["2026-03"]);
    expect(c.filter((x) => x.choisi).map((x) => x.cle)).toEqual(["2026-07"]);
  });

  it("ne marque « en cours » aucune case d'une autre année", () => {
    const c = construireLaFrise({
      annee: 2025, validations: [], depenses: [], revenus: [],
      moisAffiche: new Date(2026, 2, 1), locale: fr, maintenant: MARS,
    });
    expect(c.some((x) => x.encours)).toBe(false);
    expect(c.every((x) => x.passe)).toBe(true);
  });

  it("écrit ses libellés dans la langue demandée", () => {
    /* Sans locale, date-fns rend « Jul 2026 » dans une interface
       française. */
    const c = frise([]);
    expect(c[6].libelle).toMatch(/juil/i);
    expect(c[6].lettre).toBe("J");
  });
});

describe("les charges particulières", () => {
  const mensuelle = ligne({ id: "m", is_active: true, amount: 50, periode_mois: 1, echeances: null });
  const trimestrielle = ligne({ id: "t", is_active: true, amount: 120, periode_mois: 3, echeances: null, mois_ancre: "2026-01-15" });
  const echeancee = ligne({ id: "e", is_active: true, amount: 300, periode_mois: 1, echeances: 4 });

  it("appelle « mensuelle » ce qui tombe chaque mois sans échéancier", () => {
    expect(estMensuelle(mensuelle)).toBe(true);
    expect(estMensuelle(trimestrielle)).toBe(false);
    /* Un échéancier a une fin : ce n'est pas une charge de fond. */
    expect(estMensuelle(echeancee)).toBe(false);
  });

  it("ne met dans la surcharge que ce qui n'est pas mensuel", () => {
    /* Ce sont elles qui font les mois lourds, et elles seules méritent
       l'alerte : y verser le loyer la rendrait constante, donc muette. */
    const c = construireLaFrise({
      annee: 2026, validations: [], depenses: [mensuelle, trimestrielle], revenus: [],
      moisAffiche: new Date(2026, 2, 1), locale: fr, maintenant: MARS,
    });
    expect(c[0].surcharge).toBe(120);
    expect(c[1].surcharge).toBe(0);
    expect(c[3].surcharge).toBe(120);
  });
});
