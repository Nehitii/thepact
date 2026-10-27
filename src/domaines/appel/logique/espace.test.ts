import { describe, expect, it } from "vitest";
import { TAU } from "./coeur";
import {
  PERSPECTIVE, PLAN_DE_MATIERE, POINTS_DU_CERCLE, axeDesJets, cercleSurUnAxe, directionSurLaSphere,
  eclatSelonProfondeur, graine, perpendiculaire, pointDOrbite, produitVectoriel, traitSelonProfondeur,
  type Vecteur,
} from "./espace";

const scalaire = (a: Vecteur, b: Vecteur) => a.x * b.x + a.y * b.y + a.z * b.z;
const norme = (a: Vecteur) => Math.hypot(a.x, a.y, a.z);

describe("le hasard a graine", () => {
  /* CE QUI EST TIRE A LA GRAINE NE CHANGE JAMAIS : les brins, le disque,
     les rayons de l union sont les memes a chaque ouverture. */
  it("rend la meme suite pour la meme graine, dans [0, 1)", () => {
    const a = graine(70415), b = graine(70415), c = graine(70416);
    const suiteA = Array.from({ length: 50 }, a);
    expect(Array.from({ length: 50 }, b)).toEqual(suiteA);
    expect(Array.from({ length: 50 }, c)).not.toEqual(suiteA);
    for (const v of suiteA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("le point d une orbite", () => {
  /* A PERSPECTIVE NULLE, L ORBITE EST L ELLIPSE ORTHOGRAPHIQUE : ce que
     peignait la toile avant, a ceci pres qu elle tourne. */
  it("rend l ellipse orthographique quand la perspective est nulle", () => {
    expect(PERSPECTIVE).toBe(0);
    for (let s = 0; s < 24; s++) {
      const u = (s / 24) * TAU;
      const q = pointDOrbite(u, 100, 0.4, 0, PERSPECTIVE);
      expect(q.k).toBe(1);
      expect((q.x / 100) ** 2 + (q.y / 40) ** 2).toBeCloseTo(1, 12);
    }
  });

  it("tourne l ellipse de son noeud sans la deformer", () => {
    const a = pointDOrbite(1.1, 100, 0.4, 0, 0), b = pointDOrbite(1.1, 100, 0.4, 0.7, 0);
    expect(Math.hypot(b.x, b.y)).toBeCloseTo(Math.hypot(a.x, a.y), 12);
    expect(Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x)).toBeCloseTo(0.7, 12);
  });

  /* LA MOITIE AVANT EST UN INTERVALLE : la profondeur depasse un demi
     exactement sur u dans (0, pi). C est ce qui permet de peindre chaque
     moitie d un seul trait. */
  it("place la moitie avant sur (0, pi)", () => {
    expect(pointDOrbite(Math.PI / 2, 100, 0.4, 0, 0).profondeur).toBe(1);
    expect(pointDOrbite(-Math.PI / 2, 100, 0.4, 0, 0).profondeur).toBe(0);
    for (const u of [0.1, 1, 3]) expect(pointDOrbite(u, 50, 0.3, 1, 0).profondeur).toBeGreaterThan(0.5);
    for (const u of [3.3, 4, 6.2]) expect(pointDOrbite(u, 50, 0.3, 1, 0).profondeur).toBeLessThan(0.5);
  });

  /* Une perspective non nulle grossit ce qui vient vers nous : c est
     d ici qu on la rouvrirait. */
  it("grossit ce qui s approche quand on rouvre la perspective", () => {
    expect(pointDOrbite(Math.PI / 2, 100, 0.4, 0, 0.3).k).toBeGreaterThan(1);
    expect(pointDOrbite(-Math.PI / 2, 100, 0.4, 0, 0.3).k).toBeLessThan(1);
  });

  it("palit et affine ce qui passe derriere", () => {
    expect(eclatSelonProfondeur(0)).toBeLessThan(eclatSelonProfondeur(1));
    expect(traitSelonProfondeur(0)).toBeLessThan(traitSelonProfondeur(1));
    expect(eclatSelonProfondeur(1)).toBeCloseTo(1.05, 12);
    expect(traitSelonProfondeur(0.5)).toBeCloseTo(1, 12);
  });
});

describe("les directions", () => {
  it("rend une perpendiculaire unitaire, meme a la verticale", () => {
    for (const v of [{ x: 0, y: 0, z: 1 }, { x: 0.6, y: 0.8, z: 0 }, { x: 0.2, y: -0.3, z: 0.93 }]) {
      const n = norme(v);
      const u = { x: v.x / n, y: v.y / n, z: v.z / n };
      const w = perpendiculaire(u);
      expect(norme(w)).toBeCloseTo(1, 12);
      expect(scalaire(u, w)).toBeCloseTo(0, 12);
    }
  });

  /* UNIFORMEMENT SUR LA SPHERE : tirer les deux angles a plat entasserait
     tout aux poles. Sur une sphere uniforme, un quart des directions a une
     hauteur au-dessus d un demi. */
  it("tire les directions uniformement sur la sphere", () => {
    const hasard = graine(12345);
    const dirs = Array.from({ length: 4000 }, () => directionSurLaSphere(hasard));
    for (const d of dirs) expect(norme(d)).toBeCloseTo(1, 12);
    const hautes = dirs.filter((d) => d.z > 0.5).length / dirs.length;
    expect(hautes).toBeGreaterThan(0.22);
    expect(hautes).toBeLessThan(0.28);
    expect(Math.abs(dirs.reduce((s, d) => s + d.x, 0) / dirs.length)).toBeLessThan(0.05);
  });

  it("forme un repere direct avec le produit vectoriel", () => {
    const x = { x: 1, y: 0, z: 0 }, y = { x: 0, y: 1, z: 0 };
    expect(produitVectoriel(x, y)).toEqual({ x: 0, y: 0, z: 1 });
  });

  /* LE CERCLE SUR UN AXE : chaque point est a la meme distance angulaire
     du pole, et le trace se referme. */
  it("pose un cercle ferme a distance angulaire constante de son axe", () => {
    const axe = { x: 0, y: 0.6, z: 0.8 };
    const u1 = perpendiculaire(axe);
    const u2 = produitVectoriel(axe, u1);
    const pts = cercleSurUnAxe(axe, u1, u2, 0.7);
    expect(pts).toHaveLength(POINTS_DU_CERCLE + 1);
    for (const p of pts) {
      expect(scalaire(p, axe)).toBeCloseTo(Math.cos(0.7), 12);
      expect(norme(p)).toBeCloseTo(1, 12);
    }
    expect(pts[0].x).toBeCloseTo(pts[pts.length - 1].x, 12);
  });
});

describe("l axe des jets", () => {
  /* LA NORMALE AU PLAN D ACCRETION : perpendiculaire aux deux directions
     qui portent le plan du disque et des grains. */
  it("est la normale au plan de la matiere", () => {
    const axe = axeDesJets();
    const { aplati, noeud } = PLAN_DE_MATIERE;
    const sinI = Math.sqrt(1 - aplati * aplati);
    const tourner = (v: Vecteur) => ({
      x: v.x * Math.cos(noeud) - v.y * Math.sin(noeud),
      y: v.x * Math.sin(noeud) + v.y * Math.cos(noeud),
      z: v.z,
    });
    expect(norme(axe)).toBeCloseTo(1, 12);
    expect(scalaire(axe, tourner({ x: 1, y: 0, z: 0 }))).toBeCloseTo(0, 12);
    expect(scalaire(axe, tourner({ x: 0, y: aplati, z: sinI }))).toBeCloseTo(0, 12);
    /* Le plan est incline : un jet vient vers nous, l autre s eloigne. */
    expect(axe.z).toBeCloseTo(aplati, 12);
  });
});
