import { describe, it, expect } from "vitest";
import { partsDeLEcheancier, montantDuMois, nombreDEcheances } from "./cadence";
import type { FinancialItem } from "@/domaines/finance/types";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Cette division était écrite DEUX FOIS : ici pour ce qui part
   réellement du compte, et dans le formulaire pour l'aperçu montré
   AVANT d'enregistrer. Deux écritures de la même règle sont deux façons
   de dériver — et c'est l'aperçu qui sert à décider.

   Le dernier test de ce fichier est celui qui compte : il confronte les
   deux lectures de la même fonction, pour que la ligne du formulaire et
   la ligne du relevé ne puissent plus se contredire.
   ═══════════════════════════════════════════════════════════════ */

const somme = (l: number[]) => Math.round(l.reduce((s, x) => s + x, 0) * 100) / 100;

describe("la division en échéances", () => {
  it("fait tomber le reste sur la DERNIÈRE, pas sur la première", () => {
    /* 200 € en trois fois : 66,66 puis 66,66 puis 66,68. Sur la
       première, le premier prélèvement serait plus gros que les
       suivants — ce n'est pas ce qu'on annonce en vendant « en 3 fois ». */
    expect(partsDeLEcheancier(200, 3)).toEqual([66.66, 66.66, 66.68]);
  });

  it("rend une somme exactement égale au prix payé", () => {
    /* C'est la seule chose qui compte vraiment : un écart d'un centime
       fait douter de tout le tableau. */
    for (const [total, n] of [[200, 3], [100, 7], [19.99, 4], [1, 3], [1234.56, 11], [0.05, 4]] as [number, number][]) {
      expect(somme(partsDeLEcheancier(total, n)), `${total} en ${n} fois`).toBe(total);
    }
  });

  it("rend n échéances, ni plus ni moins", () => {
    expect(partsDeLEcheancier(100, 7)).toHaveLength(7);
    expect(partsDeLEcheancier(100, 2)).toHaveLength(2);
  });

  it("répartit à l'euro près quand ça tombe juste", () => {
    expect(partsDeLEcheancier(300, 3)).toEqual([100, 100, 100]);
  });

  it("ne perd pas les centimes d'un total qui n'en a pas de rond", () => {
    /* 0,05 € en quatre fois : trois à zéro et une à cinq centimes. Le
       total est juste, même si la répartition est bancale — et c'est
       préférable à quatre fois 0,0125 € qui n'existent pas. */
    const p = partsDeLEcheancier(0.05, 4);
    expect(p).toEqual([0.01, 0.01, 0.01, 0.02]);
    expect(somme(p)).toBe(0.05);
  });
});

describe("le nombre d'échéances saisi", () => {
  it("borne entre deux et soixante", () => {
    /* En deçà ce n'est pas un échéancier ; au-delà, cinq ans de
       prélèvements saisis par erreur. */
    expect(nombreDEcheances("1")).toBe(2);
    expect(nombreDEcheances("0")).toBe(2);
    expect(nombreDEcheances("-5")).toBe(2);
    expect(nombreDEcheances("999")).toBe(60);
  });

  it("retombe sur deux quand la saisie n'est pas un nombre", () => {
    expect(nombreDEcheances("")).toBe(2);
    expect(nombreDEcheances("abc")).toBe(2);
  });

  it("laisse passer ce qui est dans les bornes", () => {
    expect(nombreDEcheances("3")).toBe(3);
    expect(nombreDEcheances("60")).toBe(60);
  });
});

describe("l'aperçu et le prélèvement disent la même chose", () => {
  /* LE TEST QUI JUSTIFIE LA FUSION. Tant que les deux règles étaient
     écrites séparément, rien ne les tenait d'accord — et personne
     n'aurait vu la divergence avant un relevé bancaire. */
  const ligne = (montantTotal: number, n: number): FinancialItem => ({
    id: "l", name: "Achat", amount: 0, is_active: true,
    periode_mois: 1, echeances: n, montant_total: montantTotal,
    mois_ancre: "2026-01-01",
  } as unknown as FinancialItem);

  it("chaque mois prélève exactement la part que l'aperçu annonçait", () => {
    for (const [total, n] of [[200, 3], [19.99, 4], [1234.56, 11]] as [number, number][]) {
      const apercu = partsDeLEcheancier(total, n);
      const preleve = Array.from({ length: n }, (_, i) =>
        montantDuMois(ligne(total, n), new Date(2026, i, 1)));
      expect(preleve, `${total} en ${n} fois`).toEqual(apercu);
    }
  });

  it("et la somme des prélèvements fait le prix payé", () => {
    const n = 7, total = 100;
    const preleve = Array.from({ length: n }, (_, i) =>
      montantDuMois(ligne(total, n), new Date(2026, i, 1)));
    expect(somme(preleve)).toBe(total);
  });
});
