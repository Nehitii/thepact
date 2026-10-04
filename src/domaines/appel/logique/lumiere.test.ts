import { describe, expect, it } from "vitest";
import {
  GENOU, GENOU_DE_L_EPAULE, HALO_DE_LA_LUTTE, MONTEE, epaule, partQuiBave, reglageDeLaLumiere,
  reglageDeLaMontee,
} from "@/domaines/appel/logique/lumiere";

describe("l’épaule", () => {
  it("laisse passer tout ce qui est sous son genou : l’image d’avant reste intacte", () => {
    for (const x of [0, 0.05, 0.3, 0.6, GENOU_DE_L_EPAULE]) expect(epaule(x)).toBe(x);
  });

  it("tasse ce qui dépasse, sans jamais atteindre le blanc d’un coup", () => {
    expect(epaule(1)).toBeLessThan(1);
    expect(epaule(1)).toBeGreaterThan(GENOU_DE_L_EPAULE);
    expect(epaule(4)).toBeLessThan(1);
    expect(epaule(4)).toBeGreaterThan(0.99);
  });

  it("est continue et croissante au genou", () => {
    expect(epaule(GENOU_DE_L_EPAULE + 1e-6)).toBeCloseTo(GENOU_DE_L_EPAULE, 5);
    let avant = 0;
    for (let x = 0; x <= 3; x += 0.01) {
      const y = epaule(x);
      expect(y).toBeGreaterThanOrEqual(avant);
      avant = y;
    }
  });
});

describe("le seuil doux", () => {
  it("ne fait rien baver sous le seuil moins le genou", () => {
    expect(partQuiBave(0.5, 0.8, GENOU)).toBe(0);
    expect(partQuiBave(0, 0.8, GENOU)).toBe(0);
  });

  it("monte en douceur autour du seuil, puis laisse baver presque tout", () => {
    const juste = partQuiBave(0.8, 0.8, GENOU);
    expect(juste).toBeGreaterThan(0);
    expect(juste).toBeLessThan(0.1);
    expect(partQuiBave(3, 0.8, GENOU)).toBeGreaterThan(0.7);
  });
});

describe("les réglages d’une image", () => {
  it("suivent la montée acte par acte, le seuil descendant à mesure que le noyau chauffe", () => {
    for (const r of MONTEE) {
      expect(reglageDeLaMontee(r.p).eclat).toBeCloseTo(r.eclat, 10);
      expect(reglageDeLaMontee(r.p).seuil).toBeCloseTo(r.seuil, 10);
    }
    expect(reglageDeLaMontee(1).seuil).toBeLessThan(reglageDeLaMontee(0).seuil);
  });

  it("ouvrent le halo pendant la lutte de la fusion", () => {
    const calme = reglageDeLaLumiere(0.6, "montee", 0, 0);
    const lutte = reglageDeLaLumiere(0.6, "montee", 0, 1);
    expect(lutte.eclat - calme.eclat).toBeCloseTo(HALO_DE_LA_LUTTE, 10);
  });

  it("surexposent l’enflement, aspirent la lumière à l’effondrement, l’éteignent au temps mort", () => {
    expect(reglageDeLaLumiere(1, "enflement", 0.6, 0).exposition).toBeCloseTo(1.35, 10);
    expect(reglageDeLaLumiere(1, "effondrement", 0.35, 0).exposition).toBeCloseTo(0.7, 10);
    expect(reglageDeLaLumiere(1, "tempsMort", 0, 0).eclat).toBeLessThan(0.2);
    expect(reglageDeLaLumiere(1, "projection", 0, 0).eclat).toBeGreaterThan(reglageDeLaLumiere(1, "montee", 0, 0).eclat);
  });

  it("reviennent à l’exposition une en dehors de la fin", () => {
    expect(reglageDeLaLumiere(0.3, "montee", 0, 0).exposition).toBe(1);
    expect(reglageDeLaLumiere(1, "verrouille", 0, 0).exposition).toBe(1);
  });
});
