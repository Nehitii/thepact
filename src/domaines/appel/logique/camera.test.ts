import { describe, expect, it } from "vitest";
import {
  AMPLITUDE_DE_LA_SECOUSSE, BANDE_MAX, COUPS, TRAVELLING, ZOOM_EFFONDRE, avancerLeTrauma, bandesVoulues,
  bruitLisse, cadrageVoulu, champVisible, hauteurDesBandes, plancherDuTrauma, remonteeDuSujet, secousseDe,
  suivre, zoomDuTravelling, zoomVoulu,
} from "@/domaines/appel/logique/camera";

describe("le travelling", () => {
  it("passe par chaque repère, à la fin de chaque acte", () => {
    for (const r of TRAVELLING) expect(zoomDuTravelling(r.p)).toBeCloseTo(r.z, 10);
  });

  it("recule d’un pas au décentrage, puis pousse jusqu’au noyau", () => {
    expect(zoomDuTravelling(0.82)).toBeLessThan(zoomDuTravelling(0.75));
    expect(zoomDuTravelling(0.97)).toBeGreaterThan(zoomDuTravelling(0.9));
  });

  it("aspire la caméra à l’effondrement et la rejette au souffle", () => {
    expect(zoomVoulu(1, "effondrement", 0)).toBe(ZOOM_EFFONDRE);
    expect(zoomVoulu(1, "projection", 0)).toBe(1);
    expect(zoomVoulu(0.6, "montee", 0)).toBeCloseTo(zoomDuTravelling(0.6), 12);
  });

  it("suit sa cible sans jamais la dépasser", () => {
    let z = 1;
    for (let i = 0; i < 200; i++) {
      z = suivre(z, 1.48, 1 / 60, 0.08);
      expect(z).toBeLessThanOrEqual(1.48);
    }
    expect(z).toBeCloseTo(1.48, 6);
  });
});

describe("le cadrage tactile", () => {
  it("ne remonte le sujet que sous un doigt, pendant la montée", () => {
    expect(cadrageVoulu(true, "montee", true)).toBe(1);
    expect(cadrageVoulu(false, "montee", true)).toBe(0);
    expect(cadrageVoulu(true, "montee", false)).toBe(0);
    expect(cadrageVoulu(true, "enflement", true)).toBe(0);
  });

  it("remonte jusqu’au tiers de la hauteur, jamais vers le bas", () => {
    expect(remonteeDuSujet(422, 844, 1)).toBeCloseTo(844 / 3 - 422, 10);
    expect(remonteeDuSujet(200, 844, 1)).toBe(0);
    expect(remonteeDuSujet(422, 844, 0.5)).toBeCloseTo((844 / 3 - 422) / 2, 10);
  });
});

describe("la secousse « trauma »", () => {
  it("monte d’un coup et retombe linéairement", () => {
    const t = avancerLeTrauma(0, 0, COUPS.union, 0);
    expect(t).toBe(0.6);
    expect(avancerLeTrauma(t, 0.1, 0, 0)).toBeCloseTo(0.49, 10);
    expect(avancerLeTrauma(0.9, 0, COUPS.souffle, 0)).toBe(1);
  });

  it("ne descend pas sous son plancher : la lutte gronde, la fin de la montée frémit", () => {
    expect(plancherDuTrauma(0.3, 0, 0)).toBe(0);
    expect(plancherDuTrauma(1, 0, 0)).toBeCloseTo(0.42, 10);
    expect(plancherDuTrauma(0.6, 0.8, 0)).toBeCloseTo(0.496, 10);
    expect(avancerLeTrauma(0, 1, 0, 0.3)).toBe(0.3);
  });

  it("tremble du carré du trauma : un petit choc frissonne, un gros cogne", () => {
    const petit = Math.abs(secousseDe(0.3, 0.37).x);
    const gros = Math.abs(secousseDe(1, 0.37).x);
    expect(gros).toBeCloseTo(petit / 0.09, 6);
    expect(gros).toBeLessThanOrEqual(AMPLITUDE_DE_LA_SECOUSSE);
  });

  it("suit un bruit lisse, borné, sans saut d’une image à l’autre", () => {
    let avant = bruitLisse(0, 1);
    for (let i = 1; i < 600; i++) {
      const v = bruitLisse(i / 60, 1);
      expect(Math.abs(v)).toBeLessThanOrEqual(1);
      expect(Math.abs(v - avant)).toBeLessThan(1.4);
      avant = v;
    }
  });
});

describe("les bandes", () => {
  it("cadrent en 2,39:1 sur un écran large", () => {
    expect(hauteurDesBandes(1920, 1080)).toBeCloseTo((1080 - 1920 / 2.39) / 2, 10);
  });

  it("s’arrêtent à 14 % de la hauteur sur un écran en hauteur", () => {
    expect(hauteurDesBandes(390, 844)).toBeCloseTo(844 * BANDE_MAX, 10);
    expect(hauteurDesBandes(2560, 1000)).toBe(0);
  });

  it("tiennent du premier instant de la montée à l’astre d’après", () => {
    expect(bandesVoulues("attente", 0)).toBe(0);
    expect(bandesVoulues("montee", 0.3)).toBe(1);
    expect(bandesVoulues("projection", 1)).toBe(1);
    expect(bandesVoulues("verrouille", 1)).toBe(0);
  });
});

describe("le champ visible", () => {
  it("rend l’écran tel quel sans caméra", () => {
    const v = champVisible({ cx: 500, cy: 400, sx: 500, sy: 400, z: 1, roulis: 0 }, 1000, 800);
    expect(v.x0).toBeCloseTo(0, 10);
    expect(v.y0).toBeCloseTo(0, 10);
    expect(v.x1).toBeCloseTo(1000, 10);
    expect(v.y1).toBeCloseTo(800, 10);
  });

  it("se resserre au zoom et suit le sujet remonté", () => {
    const v = champVisible({ cx: 500, cy: 400, sx: 500, sy: 300, z: 2, roulis: 0 }, 1000, 800);
    expect(v.x0).toBeCloseTo(250, 10);
    expect(v.x1).toBeCloseTo(750, 10);
    expect(v.y0).toBeCloseTo(250, 10);
    expect(v.y1).toBeCloseTo(650, 10);
  });

  it("s’élargit au roulis pour en couvrir les coins", () => {
    const droit = champVisible({ cx: 500, cy: 400, sx: 500, sy: 400, z: 1, roulis: 0 }, 1000, 800);
    const penche = champVisible({ cx: 500, cy: 400, sx: 500, sy: 400, z: 1, roulis: 0.028 }, 1000, 800);
    expect(penche.x1 - penche.x0).toBeGreaterThan(droit.x1 - droit.x0);
    expect(penche.y1 - penche.y0).toBeGreaterThan(droit.y1 - droit.y0);
  });
});
