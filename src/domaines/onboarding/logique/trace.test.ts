/* LE SEUIL QUI NE SE VOIT PAS EN RELISANT.
 *
 * Trop bas, on signe par accident — et un engagement qu on donne par
 * accident n en est pas un. Trop haut, on epuise et on abandonne au
 * dernier ecran du rite. Ni l un ni l autre ne se lit dans un
 * composant : ca se mesure.
 */
import { describe, expect, it } from "vitest";
import {
  DIAGONALES_A_PARCOURIR, SEUIL_DE_BOUGE,
  ajouterAuTrace, avancementDuTrace, distanceParcourue, traceAbouti, type Point,
} from "./trace";

const CADRE = { l: 300, h: 60 };
const diagonale = Math.hypot(CADRE.l, CADRE.h);

/** Un aller-retour horizontal de `n` traversees. */
const traversees = (n: number): Point[] => {
  const pts: Point[] = [{ x: 0, y: 30 }];
  for (let i = 1; i <= n; i++) pts.push({ x: i % 2 ? CADRE.l : 0, y: 30 });
  return pts;
};

describe("distanceParcourue", () => {
  it("additionne les segments", () => {
    expect(distanceParcourue([{ x: 0, y: 0 }, { x: 3, y: 4 }])).toBe(5);
    expect(distanceParcourue([{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 3, y: 0 }])).toBe(9);
  });

  it("vaut zero pour rien, ou pour un seul point", () => {
    expect(distanceParcourue([])).toBe(0);
    expect(distanceParcourue([{ x: 5, y: 5 }])).toBe(0);
  });
});

describe("avancementDuTrace", () => {
  it("part de zero et sature a un", () => {
    expect(avancementDuTrace([], CADRE.l, CADRE.h)).toBe(0);
    expect(avancementDuTrace(traversees(40), CADRE.l, CADRE.h)).toBe(1);
  });

  it("UN EFFLEUREMENT NE SIGNE PAS", () => {
    /* Le geste doit etre franc : un doigt qui glisse de dix pixels en
       posant l ecran ne doit pas engager quoi que ce soit. */
    const petit = avancementDuTrace([{ x: 0, y: 0 }, { x: 10, y: 0 }], CADRE.l, CADRE.h);
    expect(petit).toBeLessThan(0.05);
  });

  it("UN GESTE FRANC SUFFIT — deux diagonales, pas davantage", () => {
    /* Assez pour etre voulu, assez court pour ne pas epuiser. */
    const juste = distanceParcourue(traversees(3));
    expect(juste).toBeGreaterThan(diagonale * DIAGONALES_A_PARCOURIR);
    expect(traceAbouti(traversees(3), CADRE.l, CADRE.h)).toBe(true);
  });

  it("LE SEUIL EST RELATIF AU CADRE, pas un nombre de pixels", () => {
    /* Le meme geste doit valoir autant sur un telephone que sur une
       tablette : un seuil absolu serait infranchissable sur l un et
       trivial sur l autre. */
    const petitCadre = avancementDuTrace(
      [{ x: 0, y: 0 }, { x: 150, y: 30 }], 150, 30,
    );
    const grandCadre = avancementDuTrace(
      [{ x: 0, y: 0 }, { x: 600, y: 120 }], 600, 120,
    );
    expect(petitCadre).toBeCloseTo(grandCadre, 10);
  });

  it("un cadre sans surface ne signe jamais", () => {
    /* Le composant peut se mesurer avant d etre dessine. */
    expect(avancementDuTrace(traversees(9), 0, 0)).toBe(0);
  });
});

describe("ajouterAuTrace : la main immobile ne signe pas toute seule", () => {
  it("ignore un point qui n a pas bouge", () => {
    /* Un doigt pose tremble : sans ce filtre, une main immobile
       accumulerait de la distance et finirait par signer. */
    const pts: Point[] = [{ x: 10, y: 10 }];
    const apres = ajouterAuTrace(pts, { x: 10.5, y: 10.5 });
    expect(apres).toBe(pts);
    expect(apres).toHaveLength(1);
  });

  it("garde un point qui a franchement bouge", () => {
    const pts: Point[] = [{ x: 0, y: 0 }];
    expect(ajouterAuTrace(pts, { x: SEUIL_DE_BOUGE + 1, y: 0 })).toHaveLength(2);
  });

  it("accepte le premier point sans condition", () => {
    expect(ajouterAuTrace([], { x: 4, y: 4 })).toEqual([{ x: 4, y: 4 }]);
  });

  it("UN TREMBLEMENT PROLONGE N ABOUTIT PAS", () => {
    /* Cent micro-mouvements sous le seuil : le trace reste a un point,
       et l avancement a zero. */
    let pts: Point[] = [{ x: 50, y: 30 }];
    for (let i = 0; i < 100; i++) {
      pts = ajouterAuTrace(pts, { x: 50 + (i % 2 ? 1 : -1), y: 30 });
    }
    expect(pts).toHaveLength(1);
    expect(avancementDuTrace(pts, CADRE.l, CADRE.h)).toBe(0);
  });
});
