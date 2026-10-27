import { describe, expect, it } from "vitest";
import { SEUILS } from "./coeur";
import {
  INSERT_DE_LA_FUSION, PARTITION, REPERES, REPONSE_DE_L_INSERT, SUJETS,
  dosageNeuf, lireLeMontage, suivreLeFocus, type Dosage,
} from "./montage";

const lire = (p: number, force = 1, focus = 0): Dosage => {
  const d = dosageNeuf();
  lireLeMontage(d, p, force, focus);
  return d;
};

describe("la partition", () => {
  it("part de un partout, et le garde tout l eveil", () => {
    expect(PARTITION[0].poids).toEqual(dosageNeuf());
    for (const p of [0, 0.1, 0.2, 0.235]) {
      for (const k of SUJETS) expect(lire(p)[k]).toBe(1);
    }
  });

  /* UN REPERE QUI NE CITE PAS UN CALQUE GARDE LA VALEUR DU PRECEDENT :
     c est tout le langage de la table. L aura n est citee qu au dernier
     acte ; jusque-la elle vaut un. */
  it("fait heriter ce qu un repere ne cite pas", () => {
    const acteII = PARTITION.find((r) => r.p === 0.485);
    expect(acteII?.poids).toEqual({ ...dosageNeuf(), fond: 0.9, portee: 0.6, grille: 0.7, matiere: 0.6 });
    for (const r of PARTITION.filter((x) => x.p < 0.915)) expect(r.poids.aura).toBe(1);
  });

  /* LES ACTES SONT LES INTERVALLES ENTRE LES SEUILS : chaque transition
     dure trois centiemes d avancement, centree sur son seuil. */
  it("centre chaque transition sur son seuil", () => {
    const bornes = REPERES.map((r) => r.p);
    for (const s of SEUILS) {
      const avant = bornes.filter((p) => p < s).at(-1) ?? 0;
      const apres = bornes.find((p) => p > s) ?? 1;
      expect(apres - avant).toBeCloseTo(0.03, 12);
      expect((avant + apres) / 2).toBeCloseTo(s, 12);
    }
    for (let i = 1; i < bornes.length; i++) expect(bornes[i]).toBeGreaterThan(bornes[i - 1]);
  });

  it("tient ses paliers, et passe par le milieu au seuil", () => {
    expect(lire(0.4).grille).toBeCloseTo(0.7, 12);
    expect(lire(0.6).anneaux).toBeCloseTo(0.65, 12);
    expect(lire(0.8).grille).toBeCloseTo(0.9, 12);
    /* Au seuil exact, la rampe douce est a mi-course. */
    expect(lire(0.25).grille).toBeCloseTo(0.85, 12);
    expect(lire(0.5).grille).toBeCloseTo(0.6, 12);
  });

  /* LE DERNIER ACTE EST LA SEULE RAMPE QUI DURE : le cadre se vide vers
     le noyau jusqu a la derniere image, et c est la que le noir se gagne. */
  it("vide le cadre jusqu au bout du dernier acte", () => {
    const attendu: Dosage = {
      fond: 0.6, portee: 0.14, aura: 0.4, grille: 0.12, ondes: 0.15, anneaux: 0.3, matiere: 0.25, plumes: 0.6,
    };
    for (const k of SUJETS) expect(lire(1)[k]).toBeCloseTo(attendu[k], 12);
    const mi = lire(0.9575);
    for (const k of SUJETS) {
      expect(mi[k]).toBeLessThanOrEqual(lire(0.915)[k]);
      expect(mi[k]).toBeGreaterThanOrEqual(lire(1)[k]);
    }
    expect(lire(0.9575).portee).toBeLessThan(lire(0.915).portee);
  });

  /* LE HALO RECULE, LE NOYAU RESTE : la portee du fond tombe au septieme,
     son intensite ne perd que quatre dixiemes. C est ce qui fait une
     source dans le noir plutot qu un voile. */
  it("resserre la portee du halo bien plus qu elle n eteint le fond", () => {
    const fin = lire(1);
    expect(fin.portee).toBeLessThan(fin.fond / 4);
  });
});

describe("l insert de la fusion", () => {
  it("prend la main pendant la lutte, sur les calques qu il cite", () => {
    const d = lire(0.6, 1, 1);
    expect(d.grille).toBeCloseTo(0.35, 12);
    expect(d.portee).toBeCloseTo(0.4, 12);
    expect(d.plumes).toBeCloseTo(0.25, 12);
    /* Le fond et l aura ne sont pas cites : l insert n y touche pas. */
    expect(d.fond).toBe(lire(0.6).fond);
    expect(d.aura).toBe(1);
  });

  /* UN INSERT N ECLAIRE JAMAIS RIEN : il ne peut que baisser un poids. */
  it("ne releve jamais un poids", () => {
    for (let i = 0; i <= 100; i++) {
      const p = i / 100;
      for (const focus of [0.3, 1]) {
        const avec = lire(p, 1, focus), sans = lire(p);
        for (const k of SUJETS) expect(avec[k]).toBeLessThanOrEqual(sans[k] + 1e-12);
      }
    }
    expect(lire(1, 1, 1).grille).toBeCloseTo(0.12, 12);
    for (const v of Object.values(INSERT_DE_LA_FUSION)) expect(v).toBeLessThan(1);
  });

  it("se dose avec le focus, de rien a tout", () => {
    expect(lire(0.6, 1, 0).grille).toBeCloseTo(0.5, 12);
    expect(lire(0.6, 1, 0.5).grille).toBeCloseTo(0.425, 12);
  });
});

describe("la force de la table", () => {
  /* TABLE A ZERO, CHAQUE CALQUE RETROUVE SON DOSAGE D AVANT : c est ce
     que lit l astre d apres, qui a deja son propre calme. */
  it("rend un partout quand elle est muette", () => {
    for (const p of [0, 0.5, 0.95, 1]) {
      for (const focus of [0, 1]) expect(lire(p, 0, focus)).toEqual(dosageNeuf());
    }
  });

  it("reecrit le meme objet au lieu d en rendre un neuf", () => {
    const d = dosageNeuf();
    lireLeMontage(d, 1, 1, 0);
    expect(d.grille).toBeCloseTo(0.12, 12);
    lireLeMontage(d, 0, 1, 0);
    expect(d.grille).toBe(1);
  });
});

describe("le temps de reponse de l insert", () => {
  /* UN QUART DE SECONDE : assez pour ne pas claquer, assez court pour ne
     pas arriver apres l evenement. */
  it("atteint deux tiers de sa cible en deux dixiemes de seconde", () => {
    expect(suivreLeFocus(0, true, REPONSE_DE_L_INSERT)).toBeCloseTo(1 - Math.exp(-1), 12);
    expect(suivreLeFocus(1, false, REPONSE_DE_L_INSERT)).toBeCloseTo(Math.exp(-1), 12);
  });

  /* LA MEME SECONDE DONNE LE MEME FOCUS A TOUTES LES CADENCES : c est
     l interet d une exponentielle sur le temps plutot que d un pas par
     image. */
  it("ne depend pas de la cadence d images", () => {
    let a = 0, b = 0;
    for (let i = 0; i < 60; i++) a = suivreLeFocus(a, true, 1 / 60);
    for (let i = 0; i < 144; i++) b = suivreLeFocus(b, true, 1 / 144);
    expect(a).toBeCloseTo(b, 12);
    expect(a).toBeCloseTo(1 - Math.exp(-1 / REPONSE_DE_L_INSERT), 12);
  });
});
