/* LA TEINTE D UN PALIER, ET LE FORMAT QUI L A CASSEE.
 *
 * `ranks.frame_color` est du texte libre, et l editeur y ecrivait deux
 * formes incompatibles : sept prereglages en hexadecimal, et un —
 * « Cyan » — en variable CSS, « hsl(var(--ds-accent-primary)) ».
 *
 * Le panneau fabriquait ses transparences par concatenation :
 * `${rank.frame_color}60`. Sur « #f59e0b » cela donne « #f59e0b60 »,
 * qui est valide. Sur la variable, « hsl(var(--ds-accent-primary))60 »,
 * qui ne l est pas — et le navigateur jette la declaration entiere. LE
 * PALIER CYAN ETAIT SANS COULEUR PARTOUT.
 *
 * Ce module est la porte qui rend cela impossible : un seul format en
 * sortie, et `null` pour tout le reste.
 */
import { describe, expect, it } from "vitest";
import {
  FOND_DU_PANNEAU, PREREGLAGES_DE_TEINTE, canauxDeLaTeinte, contrasteDeLaTeinte,
  lueurDeLaTeinte, normaliserTeinte, teinteDuPalier,
} from "./teinte";

describe("normaliserTeinte : un seul format en sortie", () => {
  it("laisse passer un hexadecimal a six chiffres, en minuscules", () => {
    expect(normaliserTeinte("#f59e0b")).toBe("#f59e0b");
    expect(normaliserTeinte("#F59E0B")).toBe("#f59e0b");
    expect(normaliserTeinte("  #5BB4FF  ")).toBe("#5bb4ff");
  });

  it("deplie la forme courte, qui est du CSS valide", () => {
    /* La refuser perdrait une couleur que l utilisateur a bien
       choisie : « #abc » est exactement « #aabbcc ». */
    expect(normaliserTeinte("#abc")).toBe("#aabbcc");
    expect(normaliserTeinte("#0F8")).toBe("#00ff88");
  });

  it("REFUSE la variable CSS qui a produit la panne", () => {
    expect(normaliserTeinte("hsl(var(--ds-accent-primary))")).toBeNull();
    expect(normaliserTeinte("var(--primary)")).toBeNull();
  });

  it("refuse tout ce qui n est pas manipulable", () => {
    for (const v of [
      null, undefined, "", "   ", "cyan", "rgb(91,180,255)", "rgba(91,180,255,0.5)",
      "hsl(210 100% 50%)", "#12345", "#1234567", "#gggggg", "#f59e0b60", 5, {},
    ]) expect(normaliserTeinte(v as string), JSON.stringify(v)).toBeNull();
  });

  it("refuse l hexadecimal a huit chiffres — la transparence n est pas une teinte", () => {
    /* C EST LE C(OE)UR DU DEFAUT. « #f59e0b60 » est ce que produisait
       la concatenation ; l accepter en entree reviendrait a laisser une
       transparence deja cuite se propager dans les calculs. Les
       transparences se font en CSS, par color-mix(). */
    expect(normaliserTeinte("#f59e0b60")).toBeNull();
  });
});

describe("les vingt prereglages", () => {
  it("sont tous des hexadecimaux normalisables", () => {
    expect(PREREGLAGES_DE_TEINTE).toHaveLength(20);
    for (const p of PREREGLAGES_DE_TEINTE)
      expect(normaliserTeinte(p.teinte), p.cle).toBe(p.teinte);
  });

  it("portent vingt clefs distinctes et vingt couleurs distinctes", () => {
    expect(new Set(PREREGLAGES_DE_TEINTE.map((p) => p.cle)).size).toBe(20);
    expect(new Set(PREREGLAGES_DE_TEINTE.map((p) => p.teinte)).size).toBe(20);
  });

  it("aucun n est une variable CSS", () => {
    /* Le prereglage « Cyan » valait « hsl(var(--ds-accent-primary)) ».
       C est la panne d origine ; plus une seule ne peut la reproduire. */
    for (const p of PREREGLAGES_DE_TEINTE)
      expect(normaliserTeinte(p.teinte), p.cle).not.toBeNull();
  });

  it("SE LISENT TOUS sur le fond du panneau", () => {
    /* LA TEINTE N EST PAS QU UN ORNEMENT : le nom du palier s ecrit
       DEDANS, en 12,3 px demi-gras — du texte courant, donc 4,5.
       Trois candidates ont ete ecartees a la mesure : indigo #6366f1
       a 4,38, acier #64748b a 4,11, bronze #b45309 a 3,89. Ce test
       est ce qui empeche la prochaine d entrer. */
    const sombres = PREREGLAGES_DE_TEINTE
      .map((p) => ({ ...p, k: contrasteDeLaTeinte(p.teinte) }))
      .filter((p) => p.k < 4.5);
    expect(sombres.map((p) => p.cle + " " + p.k.toFixed(2))).toEqual([]);
  });

  it("refuse les trois nuances ecartees, et accepte celles qui les remplacent", () => {
    for (const [ecartee, retenue] of [["#6366f1", "#818cf8"], ["#64748b", "#8595ab"], ["#b45309", "#cd7f32"]]) {
      expect(contrasteDeLaTeinte(ecartee), ecartee).toBeLessThan(4.5);
      expect(contrasteDeLaTeinte(retenue), retenue).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("le fond de reference est celui releve a l ecran", () => {
    expect(FOND_DU_PANNEAU).toEqual([3, 13, 23]);
    /* Le repere : du blanc sur ce fond donne pres de dix-neuf. */
    expect(contrasteDeLaTeinte("#ffffff")).toBeGreaterThan(18);
    expect(contrasteDeLaTeinte("#0d0d0d")).toBeLessThan(1.3);
  });
});

describe("canauxDeLaTeinte et lueurDeLaTeinte", () => {
  it("decoupe les trois canaux", () => {
    expect(canauxDeLaTeinte("#5bb4ff")).toEqual([91, 180, 255]);
    expect(canauxDeLaTeinte("#000000")).toEqual([0, 0, 0]);
    expect(canauxDeLaTeinte("#ffffff")).toEqual([255, 255, 255]);
  });

  it("derive la lueur de la teinte, a cinquante pour cent", () => {
    /* La lueur n a jamais ete un reglage distinct : l editeur la
       calculait deja ainsi. Elle cesse d etre une decision. */
    expect(lueurDeLaTeinte("#5bb4ff")).toBe("rgba(91,180,255,0.5)");
    expect(lueurDeLaTeinte("#F59E0B")).toBe("rgba(245,158,11,0.5)");
  });

  it("ne fabrique aucune lueur pour une teinte illisible", () => {
    expect(lueurDeLaTeinte("hsl(var(--ds-accent-primary))")).toBeNull();
    expect(lueurDeLaTeinte(null)).toBeNull();
  });
});

describe("teinteDuPalier", () => {
  it("lit la colonne du palier", () => {
    expect(teinteDuPalier({ frame_color: "#a855f7" })).toBe("#a855f7");
  });

  it("rend null pour un palier sans teinte, ou avec l ancienne variable", () => {
    for (const p of [null, undefined, {}, { frame_color: null },
      { frame_color: "hsl(var(--ds-accent-primary))" }])
      expect(teinteDuPalier(p), JSON.stringify(p)).toBeNull();
  });
});
