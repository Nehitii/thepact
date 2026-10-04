import { describe, expect, it } from "vitest";
import {
  DUREE_DE_LA_PROPAGATION, POINTS_DE_LA_FAILLE, SEGMENTS_DE_LA_FAILLE,
  avancerLaFaille, construireLaFaille, deplacerParLaFaille, failleNeuve, type Faille,
} from "./faille";
import { pointDuJet, repereDuJet } from "./nervure";

const cx = 400, cy = 300, base = 88, rc = 30;

/* Une faille ouverte depuis longtemps : le choc est passe, la fissure a
   parcouru toute sa longueur. */
function failleOuverte(): Faille {
  const f = failleNeuve();
  avancerLaFaille(f, 1 / 60, 1000, base, true);
  avancerLaFaille(f, 1 / 60, 6000, base, true);
  construireLaFaille(f, cx, cy, base, rc);
  return f;
}

describe("l ouverture de la faille", () => {
  it("s ouvre au franchissement, et date son ouverture", () => {
    const f = failleNeuve();
    avancerLaFaille(f, 1 / 60, 1234, base, true);
    expect(f.debut).toBe(1234);
    expect(f.ouverture).toBe(1);
    avancerLaFaille(f, 1 / 60, 1500, base, true);
    expect(f.debut).toBe(1234);
  });

  /* LA FISSURE COURT DU NOYAU VERS LES BORDS EN UN TIERS DE SECONDE, et
     depasse un peu le bout pour que les pointes soient franches. */
  it("parcourt toute sa longueur en un tiers de seconde", () => {
    const f = failleNeuve();
    avancerLaFaille(f, 1 / 60, 0, base, true);
    avancerLaFaille(f, 1 / 60, (DUREE_DE_LA_PROPAGATION * 1000) / 2, base, true);
    expect(f.propagation).toBeCloseTo(1.15 / 2, 12);
    avancerLaFaille(f, 1 / 60, DUREE_DE_LA_PROPAGATION * 1000, base, true);
    expect(f.propagation).toBeCloseTo(1.15, 12);
    avancerLaFaille(f, 1 / 60, 9000, base, true);
    expect(f.propagation).toBe(1.15);
  });

  /* LE CHOC PUIS LA BRAISE : le cisaillement part a plus d une demi-base,
     et se pose a un peu moins de la moitie de son pic — le systeme reste
     casse. */
  it("frappe fort, puis reste fendue", () => {
    const f = failleNeuve();
    avancerLaFaille(f, 1 / 60, 0, base, true);
    expect(f.cisaillement).toBeCloseTo(base * 0.52, 9);
    avancerLaFaille(f, 1 / 60, 8000, base, true);
    expect(f.cisaillement).toBeCloseTo(base * 0.22, 9);
    expect(f.cisaillement / (base * 0.52)).toBeLessThan(0.5);
    expect(f.bouche).toBeCloseTo(base * 0.06, 9);
  });

  it("se referme en un tiers de seconde quand le seuil retombe", () => {
    const f = failleOuverte();
    avancerLaFaille(f, 0.1, 7000, base, false);
    expect(f.debut).toBe(-1);
    expect(f.ouverture).toBeCloseTo(0.7, 12);
    for (let i = 0; i < 5; i++) avancerLaFaille(f, 0.1, 7100 + i * 100, base, false);
    expect(f.ouverture).toBe(0);
    expect(f.cisaillement).toBe(0);
  });
});

describe("le trace de la faille", () => {
  /* ELLE SUIT LE TRACE EXACT QUE LES JETS PRENDRONT : les deux bouts de
     la faille sont les bouts de la nervure a pleine force. */
  it("suit la nervure des jets, de bout en bout", () => {
    const f = failleOuverte();
    expect(f.n).toBe(POINTS_DE_LA_FAILLE);
    const nervure = { cx, cy, base, pied: rc * 0.88, longueur: base * 9.7 };
    const bout = pointDuJet(repereDuJet(1), nervure, 1, 0, 0, 1, { x: 0, y: 0, k: 0, z: 0 });
    expect(f.x[f.n - 1]).toBeCloseTo(bout.x, 9);
    expect(f.y[f.n - 1]).toBeCloseTo(bout.y, 9);
    const centre = SEGMENTS_DE_LA_FAILLE + 1;
    expect([f.x[centre], f.y[centre], f.u[centre]]).toEqual([cx, cy, 0]);
  });

  /* UN S, COMME LE MOULINET QU ELLE ANNONCE : les deux bras se deduisent
     l un de l autre par un demi-tour. */
  it("est symetrique par un demi-tour, et parcourue de -1 a 1", () => {
    const f = failleOuverte();
    for (let i = 0; i < f.n; i++) {
      expect(f.x[i] - cx).toBeCloseTo(-(f.x[f.n - 1 - i] - cx), 9);
      expect(f.y[i] - cy).toBeCloseTo(-(f.y[f.n - 1 - i] - cy), 9);
      if (i > 0) expect(f.u[i]).toBeGreaterThan(f.u[i - 1]);
    }
    expect(f.u[0]).toBeCloseTo(-1, 12);
    expect(f.u[f.n - 1]).toBeCloseTo(1, 12);
  });
});

describe("ce que la faille fait a la grille", () => {
  /* Deux points de part et d autre de la fente, pres du centre. */
  function deuxCotes(f: Faille) {
    const i = SEGMENTS_DE_LA_FAILLE + 3;
    const tx = f.tx[i], ty = f.ty[i];
    const mx = (f.x[i] + f.x[i + 1]) / 2, my = (f.y[i] + f.y[i + 1]) / 2;
    const ecart = 12;
    return [
      [mx - ty * ecart, my + tx * ecart] as [number, number],
      [mx + ty * ecart, my - tx * ecart] as [number, number],
    ];
  }

  /* LES DEUX BORDS GLISSENT EN SENS CONTRAIRE et s ecartent : c est une
     fracture, pas un glissement du decor. */
  it("fait glisser les deux bords en sens contraire", () => {
    const f = failleOuverte();
    const [a, b] = deuxCotes(f);
    const [a0, b0] = [[...a], [...b]];
    deplacerParLaFaille(f, a);
    const coteA = f.cote;
    deplacerParLaFaille(f, b);
    expect(f.cote).toBe(-coteA);
    const da = [a[0] - a0[0], a[1] - a0[1]], db = [b[0] - b0[0], b[1] - b0[1]];
    expect(Math.hypot(da[0], da[1])).toBeGreaterThan(base * 0.1);
    expect(da[0] * db[0] + da[1] * db[1]).toBeLessThan(0);
  });

  it("s eteint en s eloignant de la fente", () => {
    const f = failleOuverte();
    const i = SEGMENTS_DE_LA_FAILLE + 3;
    const mx = (f.x[i] + f.x[i + 1]) / 2, my = (f.y[i] + f.y[i + 1]) / 2;
    const deplacement = (d: number) => {
      const p: [number, number] = [mx - f.ty[i] * d, my + f.tx[i] * d];
      const avant = [...p];
      deplacerParLaFaille(f, p);
      return Math.hypot(p[0] - avant[0], p[1] - avant[1]);
    };
    expect(deplacement(10)).toBeGreaterThan(deplacement(60));
    expect(deplacement(60)).toBeGreaterThan(deplacement(400));
  });

  /* CE QUE LA FISSURE N A PAS ENCORE PARCOURU RESTE INTACT. */
  it("ne touche pas ce que la fissure n a pas encore atteint", () => {
    const f = failleNeuve();
    avancerLaFaille(f, 1 / 60, 0, base, true);
    construireLaFaille(f, cx, cy, base, rc);
    expect(f.propagation).toBe(0);
    const [a] = deuxCotes(f);
    const avant = [...a];
    deplacerParLaFaille(f, a);
    expect(a).toEqual(avant);
    expect(f.devoile).toBe(0);
  });
});
