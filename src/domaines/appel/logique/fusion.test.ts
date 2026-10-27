import { describe, expect, it } from "vitest";
import { TAU, teinte } from "./coeur";
import {
  APRES_L_UNION, CYAN_DU_DEPART, DUREE_DE_LA_DETONATION, DUREE_DE_LA_FUSION, MAGENTA_DE_LA_FIN,
  PART_DE_L_OUVERTURE, RAYONS, RAYONS_DE_L_UNION,
  avancerLaFusion, courbeDeLaFusion, horlogeDeLaFusionNeuve, pureteDuScript, teinteDuLobe,
} from "./fusion";

/* La lutte echantillonnee a la milliseconde, de l ouverture a l union. */
const lutte = () =>
  Array.from({ length: DUREE_DE_LA_FUSION + 1 }, (_, ms) => ({ ms, ...courbeDeLaFusion(ms) }));

function extremes(serie: { ecart: number }[], sens: 1 | -1) {
  const trouves: number[] = [];
  for (let i = 1; i < serie.length - 1; i++) {
    const a = serie[i - 1].ecart * sens, b = serie[i].ecart * sens, c = serie[i + 1].ecart * sens;
    if (b > a && b >= c) trouves.push(i);
  }
  return trouves;
}

describe("la fusion difficile", () => {
  it("s ouvre vite : les deux noyaux sont au large au sixieme de la lutte", () => {
    expect(courbeDeLaFusion(0)).toEqual({ u: 0, ecart: 0, puissance: 0 });
    const ouvert = courbeDeLaFusion(DUREE_DE_LA_FUSION * PART_DE_L_OUVERTURE);
    expect(ouvert.ecart).toBeCloseTo(1, 12);
    expect(ouvert.puissance).toBeCloseTo(0, 12);
  });

  /* LA REFUSION N EST PLUS LA SEPARATION LUE A L ENVERS. Ils approchent,
     sont rejetes, approchent de nouveau, plus pres a chaque fois : deux
     approches — 0,50 puis 0,26 — et deux rejets — presque jusqu au large,
     puis plus mollement —, avant de se recoller. */
  it("se referme en luttant, plus pres a chaque assaut", () => {
    const serie = lutte().filter((e) => e.u > PART_DE_L_OUVERTURE);
    const approches = extremes(serie, -1).map((i) => serie[i].ecart);
    const rejets = extremes(serie, 1).map((i) => serie[i].ecart);
    expect(approches).toHaveLength(2);
    expect(rejets).toHaveLength(2);
    expect(approches[0]).toBeCloseTo(0.5, 1);
    expect(approches[1]).toBeCloseTo(0.26, 1);
    expect(rejets[0]).toBeGreaterThan(0.95);
    expect(rejets[1]).toBeLessThan(rejets[0]);
    expect(courbeDeLaFusion(DUREE_DE_LA_FUSION).ecart).toBe(0);
  });

  /* PLUS CA REFUSIONNE, PLUS CA S ACCENTUE : la puissance est un produit
     de la proximite et de l avancement. Le premier frolement ne vaut
     presque rien, le second pres de la moitie, l union tout. */
  it("donne plus de puissance a chaque approche", () => {
    const serie = lutte().filter((e) => e.u > PART_DE_L_OUVERTURE);
    const puissances = extremes(serie, -1).map((i) => serie[i].puissance);
    expect(puissances[0]).toBeLessThan(0.05);
    expect(puissances[1]).toBeGreaterThan(0.4);
    expect(courbeDeLaFusion(DUREE_DE_LA_FUSION).puissance).toBeCloseTo(1, 12);
  });

  it("reste bornee sur toute la lutte", () => {
    for (const e of lutte()) {
      expect(e.ecart).toBeGreaterThanOrEqual(0);
      expect(e.puissance).toBeGreaterThanOrEqual(0);
      expect(e.puissance).toBeLessThanOrEqual(1);
    }
  });

  /* APRES L UNION, LA PUISSANCE RETOMBE en neuf dixiemes de seconde :
     sans ce retour, le surcroit d eclat devenait un reglage, et le seul
     instant qui devait compter cessait de se distinguer. */
  it("retombe apres l union, et les noyaux restent colles", () => {
    const demi = courbeDeLaFusion(DUREE_DE_LA_FUSION + (APRES_L_UNION * 1000) / 2);
    expect(demi.ecart).toBe(0);
    expect(demi.puissance).toBeCloseTo(0.5, 12);
    expect(courbeDeLaFusion(DUREE_DE_LA_FUSION + APRES_L_UNION * 1000).puissance).toBe(0);
    expect(courbeDeLaFusion(DUREE_DE_LA_FUSION + 60_000)).toEqual({ u: 1, ecart: 0, puissance: 0 });
  });
});

describe("l horloge de la fusion", () => {
  it("demarre avec la scission, et n en depend plus ensuite", () => {
    const h = horlogeDeLaFusionNeuve();
    expect(avancerLaFusion(h, 0, 1000).luttant).toBe(false);
    expect(h.depart).toBe(-1);
    avancerLaFusion(h, 0.01, 2000);
    expect(h.depart).toBe(2000);
    /* La scission peut monter a un : l horloge garde son depart. */
    avancerLaFusion(h, 1, 2500);
    expect(h.depart).toBe(2000);
    expect(avancerLaFusion(h, 1, 2000 + DUREE_DE_LA_FUSION / 2).u).toBeCloseTo(0.5, 12);
  });

  /* L UNION NE SE PRODUIT QU UNE FOIS PAR SCISSION : l horloge reste au
     bout, et sans verrou la detonation repartirait a chaque image. */
  it("fait detoner l union une seule fois", () => {
    const h = horlogeDeLaFusionNeuve();
    avancerLaFusion(h, 1, 0);
    const union = avancerLaFusion(h, 1, DUREE_DE_LA_FUSION);
    expect(union.union).toBe(true);
    expect(union.tDeLUnion).toBe(0);
    expect(h.debutDeLUnion).toBe(DUREE_DE_LA_FUSION);
    expect(avancerLaFusion(h, 1, DUREE_DE_LA_FUSION + DUREE_DE_LA_DETONATION / 2).tDeLUnion).toBeCloseTo(0.5, 12);
    const apres = avancerLaFusion(h, 1, DUREE_DE_LA_FUSION + DUREE_DE_LA_DETONATION);
    expect(apres.union).toBe(false);
    expect(h.debutDeLUnion).toBe(-1);
    expect(avancerLaFusion(h, 1, DUREE_DE_LA_FUSION + 20_000).union).toBe(false);
  });

  /* LA FUSION COMMANDE LA TABLE DE MONTAGE TANT QU ELLE LUTTE — detonation
     comprise —, et la lui rend ensuite. */
  it("lutte jusqu a la fin de la detonation, pas au-dela", () => {
    const h = horlogeDeLaFusionNeuve();
    expect(avancerLaFusion(h, 1, 0).luttant).toBe(true);
    expect(avancerLaFusion(h, 1, DUREE_DE_LA_FUSION - 1).luttant).toBe(true);
    expect(avancerLaFusion(h, 1, DUREE_DE_LA_FUSION).luttant).toBe(true);
    expect(avancerLaFusion(h, 1, DUREE_DE_LA_FUSION + 500).luttant).toBe(true);
    expect(avancerLaFusion(h, 1, DUREE_DE_LA_FUSION + DUREE_DE_LA_DETONATION + 1).luttant).toBe(false);
  });

  it("se rearme quand la scission retombe", () => {
    const h = horlogeDeLaFusionNeuve();
    avancerLaFusion(h, 1, 0);
    avancerLaFusion(h, 1, DUREE_DE_LA_FUSION);
    avancerLaFusion(h, 0, 9000);
    expect(h).toEqual(horlogeDeLaFusionNeuve());
    avancerLaFusion(h, 1, 10_000);
    expect(avancerLaFusion(h, 1, 10_000 + DUREE_DE_LA_FUSION).union).toBe(true);
  });
});

describe("le script couleur de la scission", () => {
  /* LE COEUR SE DIVISE EN SES DEUX COULEURS : celle d ou il vient, a
     gauche, celle ou il va, a droite. */
  it("prend ses deux couleurs aux deux bouts de la rampe", () => {
    expect(CYAN_DU_DEPART).toEqual(teinte(0));
    expect(MAGENTA_DE_LA_FIN).toEqual(teinte(0.85));
    const violet = teinte(0.5);
    expect(teinteDuLobe(violet, -1, 1)).toEqual(CYAN_DU_DEPART);
    expect(teinteDuLobe(violet, 1, 1)).toEqual(MAGENTA_DE_LA_FIN);
    expect(teinteDuLobe(violet, 0, 1)).toBe(violet);
    expect(teinteDuLobe(violet, -1, 0)).toBe(violet);
  });

  /* ET LEUR UNION FAIT LE BLANC : en fusion additive, la toile le rend
     d elle-meme. Le blanc de l union annonce le blanc de la fin. */
  it("fait du blanc quand les deux lobes se superposent", () => {
    for (let k = 0; k < 3; k++) {
      expect(Math.min(255, CYAN_DU_DEPART[k] + MAGENTA_DE_LA_FIN[k])).toBeGreaterThanOrEqual(245);
    }
  });

  /* LA PURETE SUIT L ECART : pleine au large, nulle au contact. C est la
     couleur qui raconte la resistance. */
  it("ne separe les couleurs que quand les noyaux se detachent", () => {
    expect(pureteDuScript(0.2, true)).toBe(1);
    expect(pureteDuScript(0.03, true)).toBe(0);
    expect(pureteDuScript(0.115, true)).toBeCloseTo(0.5, 12);
    expect(pureteDuScript(0.5, false)).toBe(0);
  });
});

describe("les rayons de l union", () => {
  it("sont tires une fois, autour du cercle entier", () => {
    expect(RAYONS).toHaveLength(RAYONS_DE_L_UNION);
    for (let i = 0; i < RAYONS.length; i++) {
      expect(Math.abs(RAYONS[i].angle - (i / RAYONS_DE_L_UNION) * TAU)).toBeLessThanOrEqual(0.08);
      expect(RAYONS[i].portee).toBeGreaterThanOrEqual(0.3);
      expect(RAYONS[i].portee).toBeLessThan(1.35);
    }
    const epais = RAYONS.filter((r) => r.epais).length;
    expect(epais).toBeGreaterThan(0);
    expect(epais).toBeLessThan(RAYONS.length / 2);
  });
});
