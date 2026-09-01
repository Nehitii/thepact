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
  PREREGLAGES_DE_TEINTE, canauxDeLaTeinte, lueurDeLaTeinte, normaliserTeinte, teinteDuPalier,
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

describe("les huit prereglages", () => {
  it("sont tous des hexadecimaux normalisables", () => {
    expect(PREREGLAGES_DE_TEINTE).toHaveLength(8);
    for (const p of PREREGLAGES_DE_TEINTE)
      expect(normaliserTeinte(p.teinte), p.cle).toBe(p.teinte);
  });

  it("portent huit clefs distinctes et huit couleurs distinctes", () => {
    expect(new Set(PREREGLAGES_DE_TEINTE.map((p) => p.cle)).size).toBe(8);
    expect(new Set(PREREGLAGES_DE_TEINTE.map((p) => p.teinte)).size).toBe(8);
  });

  it("le premier n est plus une variable CSS", () => {
    /* Le prereglage « Cyan » valait « hsl(var(--ds-accent-primary)) ».
       Il porte desormais la valeur que cette variable rend, mesuree. */
    const cyan = PREREGLAGES_DE_TEINTE.find((p) => p.cle === "cyan");
    expect(cyan?.teinte).toBe("#5bb4ff");
    expect(normaliserTeinte(cyan!.teinte)).not.toBeNull();
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
