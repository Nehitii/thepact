import { describe, expect, it } from "vitest";
import { computeFrameTransform } from "./unified-frame-renderer";

/* ═══════════════════════════════════════════════════════════════
   LE CADRE D AVATAR A UNE SEULE FORMULE, ET TROIS NOMBRES.

   Echelle, decalage horizontal, decalage vertical. Ces trois-la sont
   ranges en base pour chaque cadre cosmetique, et relus par le profil,
   la boutique, les lots, la barre laterale et la pastille — tous par
   `computeFrameTransform`. Elle n avait aucun test.

   LES DECALAGES SONT DES POURCENTAGES, PAS DES PIXELS. C est le choix
   qui rend un cadre identique sur une vignette de 26 pixels et sur un
   apercu de 96 : le meme nombre s adapte au contenant. Un test qui ne
   le dirait pas laisserait la prochaine lecture croire a des pixels.
   ═══════════════════════════════════════════════════════════════ */

describe("la transformation d un cadre", () => {
  it("ne bouge rien quand rien n est demande", () => {
    expect(computeFrameTransform({})).toEqual({
      transform: "scale(1) translate(0%, 0%)",
      transformOrigin: "center center",
    });
  });

  /* ═══ LES DECALAGES SONT EN POUR CENT ═══
     Le nombre 6,5 range en base vaut « 6,5 % du cadre », pas
     « 6,5 pixels ». Sur une vignette de 26 pixels cela fait 1,7 pixel ;
     sur un apercu de 96, 6,2. C est exactement ce que le choix du
     pourcentage sert a obtenir : la meme image partout. */
  it("ecrit les decalages en pour cent", () => {
    expect(computeFrameTransform({ frameOffsetX: 6.5, frameOffsetY: 0.5 }).transform)
      .toBe("scale(1) translate(6.5%, 0.5%)");
    expect(computeFrameTransform({ frameOffsetX: 6.5 }).transform).not.toContain("px");
  });

  it("accepte des decalages negatifs", () => {
    expect(computeFrameTransform({ frameOffsetX: -4, frameOffsetY: -12 }).transform)
      .toBe("scale(1) translate(-4%, -12%)");
  });

  /* ═══ ZERO EST UNE VALEUR, PAS UNE ABSENCE ═══
     Le repli est `??`, pas `||` : une echelle de zero reste zero, et un
     cadre reglé a zero disparait — ce qui est ce qu on a demande. Avec
     `||`, il reviendrait a 1 sans rien dire. Aucun cadre en base ne
     porte zero aujourd hui (releve du 30/08/2026 : 31 cadres, echelles
     de 1 a 1,75), donc la difference ne se voit pas — mais elle est
     ecrite ici pour le jour ou quelqu un en pose un. */
  it("garde une echelle nulle au lieu de la remplacer", () => {
    expect(computeFrameTransform({ frameScale: 0 }).transform).toBe("scale(0) translate(0%, 0%)");
    expect(computeFrameTransform({ frameScale: 0 }).transform).not.toBe("scale(1) translate(0%, 0%)");
  });

  it("ne retombe sur un que pour une echelle absente", () => {
    expect(computeFrameTransform({ frameScale: undefined }).transform).toContain("scale(1)");
    expect(computeFrameTransform({ frameScale: 1.75 }).transform).toContain("scale(1.75)");
  });

  /* ═══ LE MEME `??` SUR LES DECALAGES NE DECIDE RIEN ═══
   *
   * Le balayage de mutations a survecu a l echange contre `||` sur le
   * decalage horizontal, et c est juste : le repli y vaut ZERO, et
   * `0 ?? 0` comme `0 || 0` rendent zero. Le seul nombre qui les
   * separe est NaN — que `??` laisse passer, et que `||` remplacerait.
   *
   * NaN N EST PAS ATTEIGNABLE : la colonne est numerique, donc la base
   * rend un nombre ou `null`, et le formulaire d administration passe
   * deja par un `parseFloat(...) || 0`. Le test epingle le choix — ne
   * rien substituer — et dit ce qui le rendrait vivant : un decalage
   * qui arriverait d ailleurs que de ces deux chemins. */
  it("laisse passer un decalage illisible plutot que de le remplacer", () => {
    expect(computeFrameTransform({ frameOffsetX: NaN }).transform)
      .toBe("scale(1) translate(NaN%, 0%)");
    /* Le navigateur refuse alors la transformation entiere : rien ne se
       deplace, plutot qu un deplacement faux. */
    expect(computeFrameTransform({ frameOffsetX: NaN }).transform).toContain("NaN");
  });

  /* ═══ L ORDRE DES DEUX OPERATIONS N EST PAS INDIFFERENT ═══
     En CSS, les transformations s appliquent de DROITE A GAUCHE :
     `scale(s) translate(x%)` deplace d abord dans le repere de
     l element, puis met le tout a l echelle — le deplacement effectif
     est donc MULTIPLIE par l echelle. Ecrire `translate(x%) scale(s)`
     donnerait un deplacement independant de l echelle, donc une autre
     image. */
  it("met l echelle avant le deplacement", () => {
    const t = computeFrameTransform({ frameScale: 1.5, frameOffsetX: 10 }).transform;
    expect(t).toBe("scale(1.5) translate(10%, 0%)");
    expect(t.indexOf("scale(")).toBeLessThan(t.indexOf("translate("));
  });

  /* LES TROIS NOMBRES VIENNENT DE COLONNES NULLABLES, et un `null` doit
     valoir absence — donc 1 pour l echelle, pas 0. Les types
     l acceptent desormais, ce qui evite a chaque appelant d ecrire
     `?? undefined` pour traduire un null en absence ; ce test dit ce
     que le repli en fait. */
  it("traite un null comme une absence", () => {
    expect(computeFrameTransform({ frameScale: null, frameOffsetX: null, frameOffsetY: null }))
      .toEqual(computeFrameTransform({}));
    expect(computeFrameTransform({ frameScale: null }).transform).toContain("scale(1)");
  });

  /* LE POINT D ANCRAGE NE CHANGE JAMAIS. Un cadre qui tournerait autour
     d un coin se decalerait a chaque changement d echelle. */
  it("ancre toujours au centre", () => {
    for (const p of [{}, { frameScale: 2 }, { frameOffsetX: 9, frameOffsetY: -9 }]) {
      expect(computeFrameTransform(p).transformOrigin).toBe("center center");
    }
  });

  it("rend une chaine que le navigateur sait lire", () => {
    const t = computeFrameTransform({ frameScale: 1.25, frameOffsetX: 3, frameOffsetY: -2 }).transform;
    expect(t).toMatch(/^scale\([0-9.]+\) translate\(-?[0-9.]+%, -?[0-9.]+%\)$/);
  });
});
