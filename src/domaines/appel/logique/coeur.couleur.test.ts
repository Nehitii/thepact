import { describe, expect, it } from "vitest";
import { RENDU, renduDe, rgba, teinte } from "./coeur";
import { teinteDe } from "./rituel";

const arrondi = ([r, g, b]: [number, number, number]) =>
  `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

describe("la rampe de la toile", () => {
  it("part du cyan froid et finit presque blanche", () => {
    expect(arrondi(teinte(0))).toBe("rgb(6, 182, 212)");
    expect(arrondi(teinte(1))).toBe("rgb(255, 245, 255)");
  });

  it("passe par le violet a la moitie", () => {
    expect(arrondi(teinte(0.5))).toBe("rgb(139, 92, 246)");
  });

  it("passe par le rose a la seconde cassure", () => {
    expect(arrondi(teinte(0.85))).toBe("rgb(255, 64, 255)");
  });

  /* CE POINT-LA A ETE LU SUR L ECRAN. A 6,026 % d avancement, la page
     affichait rgb(22, 171, 216) ; l arithmetique donne exactement les
     memes trois nombres. La verification portait sur la rampe du
     compte a rebours, et elle vaut aussi pour celle-ci : les deux
     coincident sous la moitie. */
  it("rend la couleur relevee sur l ecran a 6 %", () => {
    expect(arrondi(teinte(0.06026))).toBe("rgb(22, 171, 216)");
    expect(teinteDe(0.06026)).toBe("rgb(22, 171, 216)");
  });

  /* ═══ LA TOILE ET LE TEXTE NE SONT PAS DE LA MEME COULEUR ═══
     Balayage de 100 001 points : identiques jusqu a la moitie,
     differents sur 49 602 points a partir de p = 0,50191. Le reacteur
     va vers 255,64,255 puis 255,245,255 ; le compte a rebours va vers
     255,0,255 puis 255,255,255. Constate, non corrige — les unifier
     changerait ce que l ecran montre. */
  it("s accorde au texte sous la moitie et s en ecarte au-dessus", () => {
    for (const p of [0, 0.1, 0.25, 0.4, 0.49, 0.5]) {
      expect(arrondi(teinte(p))).toBe(teinteDe(p));
    }
    expect(arrondi(teinte(0.6))).not.toBe(teinteDe(0.6));
    expect(arrondi(teinte(0.9))).not.toBe(teinteDe(0.9));
    expect(arrondi(teinte(1))).toBe("rgb(255, 245, 255)");
    expect(teinteDe(1)).toBe("rgb(255, 255, 255)");
  });

  it("ne bouge pas le rouge ni le bleu sur le dernier segment", () => {
    for (const p of [0.85, 0.9, 0.95, 1]) {
      const [r, , b] = teinte(p);
      expect(r).toBe(255);
      expect(b).toBe(255);
    }
  });

  it("ecrit une couleur que la toile sait lire", () => {
    expect(rgba([1.4, 2.6, 3.5], 0.25)).toBe("rgba(1, 3, 4, 0.25)");
  });

  /* LA RAMPE NE SAUTE NULLE PART, ET C EST CE QUI LA TIENT.
   *
   * Les trois segments se rejoignent exactement : a 50 % le premier
   * finit sur 139,92,246 et le deuxieme en part ; a 85 % le deuxieme
   * finit sur 255,64,255 et le dernier en part. Trois mutations ont
   * survecu au balayage tant que ce test n existait pas — deplacer une
   * cassure, ou changer le denominateur d un segment, ne casse aucun
   * point remarquable : cela ouvre une MARCHE entre deux d entre eux.
   * Un pas de 1/10 000 ne peut pas faire bouger une composante de plus
   * d une unite ; au-dela, il y a une marche. */
  it("ne fait aucun saut entre ses trois segments", () => {
    let precedent = teinte(0);
    let plusGrandPas = 0;
    for (let i = 1; i <= 10_000; i++) {
      const actuel = teinte(i / 10_000);
      for (let k = 0; k < 3; k++) plusGrandPas = Math.max(plusGrandPas, Math.abs(actuel[k] - precedent[k]));
      precedent = actuel;
    }
    expect(plusGrandPas).toBeLessThan(1);
  });

  it("recolle exactement aux deux cassures", () => {
    expect(teinte(0.5)).toEqual([139, 92, 246]);
    expect(teinte(0.85)).toEqual([255, 64, 255]);
    /* Juste avant la cassure, on est deja arrive. */
    for (let k = 0; k < 3; k++) {
      expect(teinte(0.5 - 1e-9)[k]).toBeCloseTo(teinte(0.5)[k], 6);
      expect(teinte(0.85 - 1e-9)[k]).toBeCloseTo(teinte(0.85)[k], 6);
    }
  });
});

describe("les deux facons de dessiner", () => {
  /* Sur du noir on AJOUTE de la lumiere ; sur du papier on en RETIRE.
     Le dessin est le meme, le mode de fusion est l oppose — et
     l eclair de blanc devient un eclair de noir. */
  it("inverse tout entre l ecran et le papier", () => {
    expect(renduDe(true)).toEqual(RENDU.sombre);
    expect(renduDe(false)).toEqual(RENDU.clair);
    expect(RENDU.sombre.fusion).toBe("lighter");
    expect(RENDU.clair.fusion).toBe("multiply");
    expect(RENDU.sombre.trait).toEqual([255, 255, 255]);
    expect(RENDU.clair.trait).toEqual([16, 22, 26]);
    expect(RENDU.sombre.flash).toBe("#fff");
    expect(RENDU.clair.flash).toBe("#12171a");
  });

  /* UN TRAIT BLANC EN `multiply` SERAIT INVISIBLE : le blanc y est
     neutre. C est pour cela que le trait clair est presque noir. */
  it("n ecrit jamais du blanc en encre", () => {
    expect(RENDU.clair.trait).not.toEqual([255, 255, 255]);
  });
});
