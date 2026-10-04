import { describe, expect, it } from "vitest";
import { SEUILS } from "./coeur";
import {
  BRINS, BRINS_DU_JET, CAMBRURE, EVASEMENT, FROID, SEUIL_DES_JETS,
  forceDesJets, largeurDuJet, longueurDuJet, pointDuJet, rayonDeLaGorge, repereDuJet, versLeFroid,
  type Nervure, type PointDuJet,
} from "./nervure";
import { DUREE_EFFONDREMENT, DUREE_ENFLEMENT } from "./sequence";

const nervure: Nervure = { cx: 400, cy: 300, base: 88, pied: 20, longueur: 800 };
const point = (sens: 1 | -1, t: number, eb = 0, ec = 0): PointDuJet =>
  pointDuJet(repereDuJet(sens), nervure, t, eb, ec, 1, { x: 0, y: 0, k: 0, z: 0 });

describe("la force des jets", () => {
  /* LES JETS NAISSENT A DEUX SECONDES DE LA FIN, pas avant : le plus
     spectaculaire des calques ne doit pas etre la vingt secondes trop tot. */
  it("reste nulle avant le dernier seuil, puis monte en six centiemes", () => {
    expect(SEUIL_DES_JETS).toBe(SEUILS[3]);
    expect(forceDesJets("critique", 0, 0.89)).toBe(0);
    expect(forceDesJets("critique", 0, SEUIL_DES_JETS + 0.03)).toBeCloseTo(0.5, 12);
    expect(forceDesJets("critique", 0, 1)).toBe(1);
    expect(forceDesJets("verrouille", 3, 0)).toBe(0);
  });

  /* DANS LES QUATRE TEMPS, ELLE RACONTE : les jets enflent avec la
     coquille, sont ravales par l effondrement, se taisent, et repartent a
     plein sans jamais en redescendre. */
  it("enfle, est ravalee, se tait, puis tient", () => {
    expect(forceDesJets("enflement", 0, 1)).toBeCloseTo(0.42, 12);
    expect(forceDesJets("enflement", DUREE_ENFLEMENT / 1000, 1)).toBeCloseTo(0.72, 12);
    expect(forceDesJets("effondrement", 0, 1)).toBeCloseTo(0.72, 12);
    expect(forceDesJets("effondrement", DUREE_EFFONDREMENT / 1000, 1)).toBe(0);
    expect(forceDesJets("tempsMort", 0.2, 1)).toBe(0);
    for (const t of [0, 1, 3600]) expect(forceDesJets("projection", t, 1)).toBe(1);
  });

  /* L effondrement les ravale plus vite qu il ne les a laisses enfler :
     a mi-temps, il n en reste qu un tiers. */
  it("en ravale les deux tiers a mi-temps de l effondrement", () => {
    expect(forceDesJets("effondrement", DUREE_EFFONDREMENT / 2000, 1)).toBeCloseTo(0.72 * Math.pow(0.5, 1.6), 12);
    expect(forceDesJets("effondrement", DUREE_EFFONDREMENT / 2000, 1)).toBeLessThan(0.72 / 3);
  });
});

describe("la nervure", () => {
  /* LA SYMETRIE EST UNE ROTATION, PAS UN MIROIR : le second jet se deduit
     du premier par un demi-tour autour du coeur. Un miroir donnerait un
     « C », que l oeil refuse aussitot. */
  it("oppose les deux jets par un demi-tour", () => {
    for (const t of [0, 0.25, 0.6, 1]) {
      const a = point(1, t, 7), b = point(-1, t, 7);
      expect(a.x - nervure.cx).toBeCloseTo(-(b.x - nervure.cx), 9);
      expect(a.y - nervure.cy).toBeCloseTo(-(b.y - nervure.cy), 9);
      expect(a.z).toBeCloseTo(-b.z, 9);
    }
  });

  /* L un des deux jets vient vers nous, l autre s eloigne : c est ce qui
     les fait passer l un devant, l autre derriere le coeur. */
  it("envoie un jet vers nous et l autre au loin", () => {
    expect(Math.sign(repereDuJet(1).a.z)).toBe(-Math.sign(repereDuJet(-1).a.z));
    expect(repereDuJet(1).a.z).not.toBe(0);
  });

  /* ELLE SORT LE LONG DE L AXE, PUIS SE CAMBRE : l ecart lateral croit en
     t², donc la tangente ne casse pas au depart. L ecart se relit en trois
     dimensions, sur la laterale du repere. */
  it("part droit et vire de plus en plus", () => {
    const rep = repereDuJet(1);
    const lateral = (t: number) => {
      const q = point(1, t);
      return (q.x - nervure.cx) * rep.b.x + (q.y - nervure.cy) * rep.b.y + q.z * rep.b.z;
    };
    expect(lateral(0)).toBeCloseTo(0, 9);
    expect(lateral(1)).toBeCloseTo(nervure.longueur * CAMBRURE, 6);
    expect(lateral(0.5)).toBeCloseTo(lateral(1) / 4, 6);
    const pente = (t: number) => (lateral(t + 1e-6) - lateral(t)) / 1e-6;
    expect(Math.abs(pente(0))).toBeLessThan(1e-2);
    expect(pente(0.9)).toBeGreaterThan(pente(0.3));
  });

  it("ecrit dans l ardoise qu on lui donne, et la rend", () => {
    const ardoise = { x: 0, y: 0, k: 0, z: 0 };
    expect(pointDuJet(repereDuJet(1), nervure, 0.5, 0, 0, 1, ardoise)).toBe(ardoise);
    expect(ardoise.k).toBe(1);
  });
});

describe("la gerbe", () => {
  /* LES LONGUEURS INEGALES SONT LE POINT IMPORTANT : des brins qui
     s arretent chacun ou il veut n ont pas de bord. */
  it("tire onze brins de longueurs, d ecarts et de virages inegaux", () => {
    expect(BRINS).toHaveLength(BRINS_DU_JET);
    for (const cle of ["fin", "ecart", "cambre"] as const) {
      expect(new Set(BRINS.map((b) => b[cle].toFixed(4))).size).toBe(BRINS_DU_JET);
    }
    for (const b of BRINS) {
      expect(b.fin).toBeGreaterThanOrEqual(0.58);
      expect(b.fin).toBeLessThanOrEqual(1);
      expect(b.ecart).toBeGreaterThanOrEqual(0.55);
      expect(b.ecart).toBeLessThanOrEqual(2.85);
    }
  });

  /* LE PAVILLON EST EXPONENTIEL : la gorge reste presque parallele, puis
     l ecart s ouvre de plus en plus vite. */
  it("ouvre la gerbe en trompette", () => {
    expect(largeurDuJet(1, 88, 1) / largeurDuJet(0, 88, 1)).toBeCloseTo(Math.exp(EVASEMENT), 9);
    const ouverture = (a: number, b: number) => largeurDuJet(b, 88, 1) - largeurDuJet(a, 88, 1);
    expect(ouverture(0.8, 1)).toBeGreaterThan(10 * ouverture(0, 0.2));
  });

  /* EN REGIME, LE FAISCEAU SORT DU CADRE — d un cinquieme, pas plus :
     au-dela, tout le pavillon sortait avec lui. */
  it("s allonge d un cinquieme en regime, et elargit sa gorge", () => {
    expect(longueurDuJet(88, 1, true) / longueurDuJet(88, 1, false)).toBeCloseTo(1.2, 12);
    expect(longueurDuJet(88, 0, false)).toBeCloseTo(88 * 3.2, 12);
    expect(rayonDeLaGorge(4, 88, true)).toBeCloseTo(88 * 0.19, 12);
    expect(rayonDeLaGorge(4, 88, false)).toBe(4);
    expect(rayonDeLaGorge(40, 88, true)).toBe(40);
  });

  /* LE FAISCEAU SE REFROIDIT EN S ELOIGNANT DU COEUR : les couches
     exterieures tirent vers le bleu, le coeur garde la teinte. */
  it("tire les couches exterieures vers le froid", () => {
    const blanc: [number, number, number] = [255, 245, 255];
    expect(versLeFroid(blanc, 0)).toEqual(blanc);
    expect(versLeFroid(blanc, 1)).toEqual(FROID);
    expect(versLeFroid(blanc, 0.85)[2]).toBeLessThan(blanc[2]);
    expect(versLeFroid(blanc, 0.85)[0]).toBeLessThan(versLeFroid(blanc, 0.3)[0]);
  });
});
