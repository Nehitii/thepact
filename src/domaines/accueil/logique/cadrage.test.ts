import { describe, expect, it } from "vitest";
import { boiteOpaque, placement } from "./cadrage";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   L'emblème du palier « trop petit dans son cercle » : le dessin doit
   remplir sa boite, quelle que soit la marge transparente de l'image.
   Une erreur de signe ici ne casse rien — elle pousse l'emblème hors
   du cadre ou le laisse tout petit, exactement le défaut signalé.
   ═══════════════════════════════════════════════════════════════ */

/** Une image RGBA de l × h, opaque sur le rectangle donné (en pixels). */
function image(l: number, h: number, rect?: [number, number, number, number]): Uint8ClampedArray {
  const px = new Uint8ClampedArray(l * h * 4);
  if (!rect) return px;
  const [x0, y0, x1, y1] = rect;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px[(y * l + x) * 4 + 3] = 255;
  return px;
}

describe("la boîte opaque", () => {
  it("trouve le dessin au milieu de sa marge", () => {
    expect(boiteOpaque(image(100, 100, [25, 10, 75, 90]), 100, 100))
      .toEqual({ x0: 0.25, y0: 0.1, x1: 0.75, y1: 0.9 });
  });

  it("rend null pour une image vide", () => {
    expect(boiteOpaque(image(8, 8), 8, 8)).toBeNull();
  });

  it("ignore la poussière sous le seuil", () => {
    const px = image(10, 10, [4, 4, 6, 6]);
    px[3] = 5; /* un pixel à 2 % en haut à gauche */
    expect(boiteOpaque(px, 10, 10)).toEqual({ x0: 0.4, y0: 0.4, x1: 0.6, y1: 0.6 });
  });
});

describe("le placement", () => {
  it("laisse une image pleine telle quelle", () => {
    expect(placement({ x0: 0, y0: 0, x1: 1, y1: 1 }, 100, 100)).toEqual({
      largeur: 100, hauteur: 100, gauche: 0, haut: 0,
    });
  });

  it("agrandit un dessin entouré de marge jusqu'à remplir la boîte", () => {
    const p = placement({ x0: 0.25, y0: 0.25, x1: 0.75, y1: 0.75 }, 100, 100);
    expect(p).toEqual({ largeur: 200, hauteur: 200, gauche: -50, haut: -50 });
  });

  it("borne un dessin large par la largeur, et le centre en hauteur", () => {
    const p = placement({ x0: 0, y0: 0.25, x1: 1, y1: 0.75 }, 100, 100);
    expect(p.largeur).toBeCloseTo(100);
    expect(p.hauteur).toBeCloseTo(100);
    expect(p.haut).toBeCloseTo(0);
  });

  it("recentre un dessin décalé dans son fichier", () => {
    const p = placement({ x0: 0, y0: 0, x1: 0.5, y1: 0.5 }, 100, 100);
    /* Le dessin occupe le quart haut-gauche : l'image double de taille,
       et c'est ce quart qui remplit la boîte ; le reste déborde. */
    expect(p.largeur).toBeCloseTo(200);
    expect(p.gauche).toBeCloseTo(0);
    expect(p.haut).toBeCloseTo(0);
  });

  it("garde les proportions d'une image plus large que haute", () => {
    const p = placement({ x0: 0, y0: 0, x1: 1, y1: 1 }, 200, 100, 1);
    /* Une image deux fois plus large que haute, dans un carré : elle
       prend toute la largeur et la moitié de la hauteur. */
    expect(p.largeur).toBeCloseTo(100);
    expect(p.hauteur).toBeCloseTo(50);
    expect(p.haut).toBeCloseTo(25);
  });

  it("laisse un souffle quand on le demande", () => {
    const p = placement({ x0: 0, y0: 0, x1: 1, y1: 1 }, 100, 100, 1, 0.9);
    expect(p.largeur).toBeCloseTo(90);
    expect(p.gauche).toBeCloseTo(5);
  });
});
