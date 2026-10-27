import { describe, expect, it } from "vitest";
import { INCLINAISONS_BASE, NB_ANNEAUX, SEUILS, clamp01 } from "./coeur";
import {
  RETOUR_DU_RECIT, avancerLaMain, avancerLeRecit, mainNeuve, recitNeuf,
} from "./coeurRecit";

/* ═══════════════════════════════════════════════════════════════
   LA TRAJECTOIRE, RELEVEE IMAGE PAR IMAGE.

   Ces nombres ne sont pas ecrits a la main : ils ont ete produits par
   la machine d avant la coupe — celle qui vivait dans la boucle de
   dessin — et compares aux 1200 images de la machine d apres, etat par
   etat, sans un seul ecart. C est l empreinte de cette coupe : une
   toile ne se releve pas au `innerText`, mais ses nombres, si.

   Le scenario : vingt secondes d appui, l avancement qui monte de 0 a
   1 en mille images, un appui a la centieme, une rupture a la
   sept-centieme.
   ═══════════════════════════════════════════════════════════════ */

/** Un tirage reproductible : la rupture disperse au hasard. */
function tirageFige(graine = 42) {
  let x = graine;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

interface Releve {
  seuil: number; eclat: number; alignement: number; scission: number;
  excentrique: number; incl0: number; impulsion: number; purge: number; ecarts: number[];
}

const JALONS: [number, Releve][] = [
  [0, { seuil: -1, eclat: 0, alignement: 0, scission: 0, excentrique: 0, incl0: 0.28, impulsion: 0, purge: 0, ecarts: [0, 0, 0, 0, 0] }],
  [100, { seuil: -1, eclat: 0, alignement: 0, scission: 0, excentrique: 0, incl0: 0.28, impulsion: 0.9433333333333334, purge: 0, ecarts: [0, 0, 0, 0, 0] }],
  [101, { seuil: -1, eclat: 0, alignement: 0, scission: 0, excentrique: 0, incl0: 0.28, impulsion: 0.8866666666666667, purge: 0, ecarts: [0, 0, 0, 0, 0] }],
  [250, { seuil: 0, eclat: 0.9633333333333334, alignement: 0.02666666666666667, scission: 0, excentrique: 0, incl0: 0.28373333333333334, impulsion: 0, purge: 0, ecarts: [0, 0, 0, 0, 0] }],
  [251, { seuil: 0, eclat: 0.9266666666666667, alignement: 0.05333333333333334, scission: 0, excentrique: 0, incl0: 0.2874666666666667, impulsion: 0, purge: 0, ecarts: [0, 0, 0, 0, 0] }],
  [500, { seuil: 1, eclat: 0.9633333333333334, alignement: 1, scission: 0.02, excentrique: 0, incl0: 0.42, impulsion: 0, purge: 0, ecarts: [0, 0, 0, 0, 0] }],
  [700, { seuil: 1, eclat: 0, alignement: 1, scission: 1, excentrique: 0, incl0: 0.42, impulsion: 0, purge: 0.975, ecarts: [0.6261537948530167, 0.5949093317985534, 0.7924698805809021, 0.684357783794403, 0.7115406012535095] }],
  [701, { seuil: 1, eclat: 0, alignement: 1, scission: 1, excentrique: 0, incl0: 0.42, impulsion: 0, purge: 0.95, ecarts: [0.6111537948530167, 0.5799093317985534, 0.777469880580902, 0.669357783794403, 0.6965406012535095] }],
  [750, { seuil: 2, eclat: 0.9633333333333334, alignement: 1, scission: 1, excentrique: 0.018333333333333333, incl0: 0.42, impulsion: 0, purge: 0, ecarts: [0, 0, 0.04246988058090148, 0, 0] }],
  [900, { seuil: 3, eclat: 0.9633333333333334, alignement: 1, scission: 1, excentrique: 1, incl0: 0.42, impulsion: 0, purge: 0, ecarts: [0, 0, 0, 0, 0] }],
  [1000, { seuil: 3, eclat: 0, alignement: 1, scission: 1, excentrique: 1, incl0: 0.42, impulsion: 0, purge: 0, ecarts: [0, 0, 0, 0, 0] }],
  [1199, { seuil: 3, eclat: 0, alignement: 1, scission: 1, excentrique: 1, incl0: 0.42, impulsion: 0, purge: 0, ecarts: [0, 0, 0, 0, 0] }],
];

function derouler(images = 1200) {
  let recit = recitNeuf();
  let main = mainNeuve();
  const hasard = tirageFige();
  const dt = 1 / 60;
  const releves = new Map<number, Releve>();
  let ondes = 0;
  for (let f = 0; f < images; f++) {
    const p = clamp01(f / 1000);
    const evenements: ("appui" | "rupture")[] = f === 100 ? ["appui"] : f === 700 ? ["rupture"] : [];
    main = avancerLaMain(main, dt, evenements, true, hasard);
    const avance = avancerLeRecit(recit, p, dt, true);
    recit = avance.etat;
    if (avance.onde) ondes++;
    releves.set(f, {
      seuil: recit.seuilAtteint, eclat: recit.eclatSeuil, alignement: recit.alignement,
      scission: recit.scission, excentrique: recit.excentrique, incl0: recit.inclinaisons[0],
      impulsion: main.impulsion, purge: main.purge, ecarts: [...main.ecarts],
    });
  }
  return { releves, ondes, recit, main };
}

describe("l empreinte de vingt secondes", () => {
  const { releves, ondes } = derouler();

  for (const [image, attendu] of JALONS) {
    it(`image ${image}`, () => {
      expect(releves.get(image)).toEqual(attendu);
    });
  }

  /* QUATRE SEUILS, QUATRE ONDES. Pas une de plus : chaque palier ne se
     declenche qu une fois, et rien ne le rearme tant que l avancement
     ne redescend pas. */
  it("ne jette qu une onde par seuil", () => {
    expect(ondes).toBe(SEUILS.length);
    expect(ondes).toBe(4);
  });
});

describe("le recit, seuil par seuil", () => {
  const dt = 1 / 60;

  /* UN SEUL SEUIL PAR IMAGE, ET ON PART DU PLUS HAUT. Un bond de 10 %
     a 95 % en une image pose directement le quatrieme palier sans
     jouer les trois premiers — les rejouer ferait quatre eclairs en
     quatre images. */
  it("saute directement au dernier palier sur un bond", () => {
    const a = avancerLeRecit(recitNeuf(), 0.95, dt, true);
    expect(a.etat.seuilAtteint).toBe(3);
    expect(a.onde).toBe(true);
  });

  /* LE `break` NE DECIDE RIEN — IL FAIT GAGNER TROIS TOURS DE BOUCLE.
   *
   * Le balayage de mutations y a survecu, et c est juste : la boucle
   * descend depuis le plus haut seuil, et des qu elle a pose
   * `seuilAtteint` au rang le plus haut franchi, aucun rang inferieur
   * ne peut plus satisfaire `seuilAtteint < i`. Retirer le `break` ne
   * change donc aucun etat — c est du code DOMINE par le sens de
   * parcours. Ce qui le rendrait vivant, c est de remonter la boucle
   * au lieu de la descendre : cette mutation-la tombe.
   *
   * L invariant qui rend le `break` inutile est teste ici : apres un
   * tour, `seuilAtteint` est TOUJOURS le plus haut seuil franchi, et
   * il ne sort qu une onde. */
  it("pose toujours le plus haut seuil franchi, et une seule onde", () => {
    for (let i = 0; i <= 200; i++) {
      const p = i / 200;
      const attendu = SEUILS.reduce((haut, seuil, rang) => (p >= seuil ? rang : haut), -1);
      const a = avancerLeRecit(recitNeuf(), p, dt, true);
      expect(a.etat.seuilAtteint).toBe(attendu);
      expect(a.onde).toBe(attendu >= 0);
    }
  });

  it("ne rejoue pas un palier deja pose", () => {
    let etat = recitNeuf();
    let ondes = 0;
    for (let i = 0; i < 100; i++) {
      const a = avancerLeRecit(etat, 0.3, dt, true);
      etat = a.etat;
      if (a.onde) ondes++;
    }
    expect(ondes).toBe(1);
    expect(etat.seuilAtteint).toBe(0);
  });

  /* LE RETOUR A ZERO SE FAIT SOUS 2 %, PAS A ZERO. Relacher le doigt
     ramene l avancement a zero en plusieurs images ; attendre
     l egalite stricte laisserait le recit arme pendant la descente. */
  it("se rearme sous deux pour cent, pas a zero pile", () => {
    expect(RETOUR_DU_RECIT).toBe(0.02);
    let etat = avancerLeRecit(recitNeuf(), 0.5, dt, true).etat;
    expect(etat.seuilAtteint).toBe(1);
    etat = avancerLeRecit(etat, 0.03, dt, true).etat;
    expect(etat.seuilAtteint).toBe(1);
    etat = avancerLeRecit(etat, 0.019, dt, true).etat;
    expect(etat.seuilAtteint).toBe(-1);
  });

  /* LES TROIS EFFETS MONTENT LENTEMENT ET REDESCENDENT VITE : environ
     deux fois plus vite a la descente qu a la montee. Ce qui se gagne
     en tenant se perd plus vite en lachant. */
  it("redescend plus vite qu il ne monte", () => {
    let etat = recitNeuf();
    for (let i = 0; i < 60; i++) etat = avancerLeRecit(etat, 0.8, dt, true).etat;
    const hautAlignement = etat.alignement;
    const hautScission = etat.scission;
    let bas = etat;
    for (let i = 0; i < 10; i++) bas = avancerLeRecit(bas, 0, dt, true).etat;
    expect(hautAlignement - bas.alignement).toBeGreaterThan(hautAlignement * 0.4);
    expect(hautScission - bas.scission).toBeGreaterThan(0);
  });

  /* RECIT COUPE : tout retombe a plat, y compris les inclinaisons — et
     l eclair s eteint QUAND MEME, sinon il resterait fige a un si
     l option tombait pile apres un seuil. */
  it("remet tout a plat quand l option est coupee", () => {
    /* Vingt images apres le seuil : l eclair est encore la — il met
       un peu moins d une demi-seconde a s eteindre. */
    let etat = recitNeuf();
    for (let i = 0; i < 20; i++) etat = avancerLeRecit(etat, 0.95, dt, true).etat;
    expect(etat.eclatSeuil).toBeGreaterThan(0);
    const coupe = avancerLeRecit(etat, 0.95, dt, false).etat;
    expect(coupe.seuilAtteint).toBe(-1);
    expect(coupe.alignement).toBe(0);
    expect(coupe.scission).toBe(0);
    expect(coupe.excentrique).toBe(0);
    expect(coupe.inclinaisons).toEqual(INCLINAISONS_BASE);
    expect(coupe.eclatSeuil).toBeLessThan(etat.eclatSeuil);
  });

  it("ne modifie pas l etat qu on lui donne", () => {
    const avant = recitNeuf();
    const copie = { ...avant, inclinaisons: [...avant.inclinaisons] };
    avancerLeRecit(avant, 0.95, dt, true);
    expect(avant).toEqual(copie);
  });
});

describe("la main, l appui et la rupture", () => {
  const dt = 1 / 60;

  it("pose l impulsion a un et la laisse retomber", () => {
    const apres = avancerLaMain(mainNeuve(), dt, ["appui"], true);
    expect(apres.impulsion).toBeCloseTo(1 - dt * 3.4, 12);
    let etat = apres;
    for (let i = 0; i < 60; i++) etat = avancerLaMain(etat, dt, [], true);
    expect(etat.impulsion).toBe(0);
  });

  /* LA RUPTURE DISPERSE LES CINQ ANNEAUX INEGALEMENT : entre 0,35 et
     0,85 chacun. Un ecart identique pour tous ferait cinq cercles qui
     s ecartent au meme rythme, ce qui se lit comme un zoom et non
     comme un desordre. */
  it("disperse les anneaux inegalement", () => {
    const apres = avancerLaMain(mainNeuve(), 0, ["rupture"], true, tirageFige());
    expect(apres.purge).toBe(1);
    expect(new Set(apres.ecarts).size).toBe(NB_ANNEAUX);
    for (const e of apres.ecarts) {
      expect(e).toBeGreaterThanOrEqual(0.35);
      expect(e).toBeLessThanOrEqual(0.85);
    }
  });

  /* TROIS VITESSES, ET L ORDRE COMPTE : le coup part vite (trois
     dixiemes de seconde), la purge met deux tiers de seconde, la
     dispersion des anneaux presque une seconde. Le desordre survit au
     geste qui l a cause. */
  it("eteint le coup avant le desordre qu il laisse", () => {
    let etat = avancerLaMain(mainNeuve(), 0, ["appui", "rupture"], true, tirageFige());
    const vies = { impulsion: -1, purge: -1, ecarts: -1 };
    for (let f = 1; f <= 200; f++) {
      etat = avancerLaMain(etat, dt, [], true);
      if (vies.impulsion < 0 && etat.impulsion === 0) vies.impulsion = f;
      if (vies.purge < 0 && etat.purge === 0) vies.purge = f;
      if (vies.ecarts < 0 && etat.ecarts.every((e) => e === 0)) vies.ecarts = f;
    }
    expect(vies.impulsion).toBeLessThan(vies.purge);
    expect(vies.purge).toBeLessThan(vies.ecarts);
    expect(vies.impulsion / 60).toBeCloseTo(0.3, 1);
  });

  /* LES DECROISSANCES TOURNENT MEME QUAND L OPTION EST COUPEE : seule
     la lecture des evenements est conditionnee. Sans cela, couper
     l option en pleine impulsion la figerait pour toujours. */
  it("laisse retomber ce qui a ete declenche, option coupee", () => {
    let etat = avancerLaMain(mainNeuve(), 0, ["appui"], true);
    expect(etat.impulsion).toBe(1);
    etat = avancerLaMain(etat, dt, ["appui"], false);
    expect(etat.impulsion).toBeCloseTo(1 - dt * 3.4, 12);
  });

  it("ignore les evenements quand l option est coupee", () => {
    const etat = avancerLaMain(mainNeuve(), 0, ["appui", "rupture"], false);
    expect(etat.impulsion).toBe(0);
    expect(etat.purge).toBe(0);
    expect(etat.ecarts).toEqual([0, 0, 0, 0, 0]);
  });

  it("ne modifie pas l etat qu on lui donne", () => {
    const avant = mainNeuve();
    const copie = { ...avant, ecarts: [...avant.ecarts] };
    avancerLaMain(avant, dt, ["rupture"], true, tirageFige());
    expect(avant).toEqual(copie);
  });
});
