import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PALETTE, alea, bruit, jetonEnRvb, palette, placeLibre, rgba, segmentBase } from "./peintures";
import type { Etat } from "@/domaines/focus/types";

/* CE QUI SE CALCULE — le champ de bruit, les mesures du cadre, les
   couleurs, le choix d une place libre. C est la part du fichier dont
   le resultat NE SE LIT PAS a l ecran : une teinte fausse de dix degres
   reste une couleur plausible, et un champ de bruit borne de travers
   reste un champ. Ce qui s installe et se peint est eprouve dans
   `peintures.scenes.test.ts`.

   Aucune de ces fonctions n ecrit sur le canevas : un cadre suffit a
   les interroger, sans contrefacon de contexte. */
const cadre = (w: number, h: number, germes: { x: number; y: number }[] = []) =>
  ({ w, h, germes }) as Etat;

/** Un tirage reproductible, pour que « il choisit le plus loin » veuille dire quelque chose. */
function hasard(graine: number) {
  let s = graine >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

beforeEach(() => { document.documentElement.classList.add("dark"); });
afterEach(() => { document.documentElement.classList.remove("dark"); vi.restoreAllMocks(); });

/* ═══════════════════════════════════════════════════════════════
   LE CHAMP DE BRUIT DOIT OCCUPER TOUT SON INTERVALLE.

   Il n en occupait que la moitie basse. `alea` finissait par
   `(n ^ (n >> 16)) >>> 0` : le decalage etait SIGNE, donc des que le
   bit de tete de `n` valait un, JavaScript lisait `n` comme un entier
   negatif, `>> 16` recopiait ce bit sur les seize positions hautes, et
   le XOR l effacait a tous les coups. Le champ ne pouvait pas
   atteindre 0,5.

   MESURE DU 30/08/2026, LES DEUX COTES :

     champ     avant  0,0006 .. 0,4984, moyenne 0,2506
               apres  0,0011 .. 0,9994, moyenne 0,4971

     virage    avant  5 000 a gauche, 0 a droite, cumul -68,39 rad
               apres  2 573 a gauche, 2 427 a droite, cumul -0,52 rad

     aurores   avant  0 .. 6,26 rad, un tour
               apres  0 .. 12,53 rad, deux tours

   LE MYCELIUM S ENROULAIT AU LIEU DE SERPENTER. Son virage vaut
   `(bruit - 0.5) * 0.055` : un bruit borne a la moitie le rendait
   toujours negatif — pres de onze tours cumules sur cinq mille images,
   toujours dans le meme sens. L amplitude du virage ne change pas ;
   c est son CENTRE qui passe de -0,0137 a zero.

   ET LES AURORES NE FAISAIENT QU UN TOUR SUR LES DEUX que leur
   constante `12.566` — quatre pi — demande.

   Ces tests epinglent desormais l intervalle entier. Repasser a `>>`
   les fait tomber.
   ═══════════════════════════════════════════════════════════════ */
describe("le bruit de valeur", () => {
  it("couvre tout son intervalle, sur cent mille points", () => {
    let mini = 2, maxi = -1, somme = 0, n = 0, infinis = 0;
    for (let x = -500; x <= 500; x++) {
      for (let y = -60; y <= 60; y++) {
        const v = alea(x, y);
        if (!Number.isFinite(v)) infinis++;
        mini = Math.min(mini, v); maxi = Math.max(maxi, v); somme += v; n++;
      }
    }
    expect([n, infinis]).toEqual([121121, 0]);
    expect(mini).toBeGreaterThanOrEqual(0);
    expect(mini).toBeLessThan(0.001);
    expect(maxi).toBeGreaterThan(0.999);
    expect(maxi).toBeLessThanOrEqual(1);
    /* La moyenne est le detecteur : un decalage signe la ramenerait a
       un quart sans jamais rien faire echouer d autre. */
    expect(somme / n).toBeCloseTo(0.5, 2);
  });

  /* LE BIT DE TETE DOIT ETRE POSE UNE FOIS SUR DEUX. C est exactement
     ce que le decalage signe interdisait : il ne l etait JAMAIS. */
  it("pose le bit de tete une fois sur deux", () => {
    let poses = 0;
    for (let x = 0; x < 20000; x++) if (alea(x, 7) * 4294967295 >= 2 ** 31) poses++;
    expect(poses).toBeGreaterThan(9000);
    expect(poses).toBeLessThan(11000);
  });

  it("rend deux fois la meme valeur pour le meme point", () => {
    expect(alea(12, 34)).toBe(alea(12, 34));
    expect(alea(-9, 0)).toBe(alea(-9, 0));
  });

  /* LES DEUX AXES DOIVENT COMPTER SEPAREMENT : un hachage symetrique
     dessinerait une diagonale visible dans le fond. */
  it("distingue les deux axes", () => {
    expect(alea(3, 8)).not.toBe(alea(8, 3));
  });

  it("ne rend pas deux fois la meme valeur le long d une droite", () => {
    const vus = new Set<number>();
    for (let i = 0; i < 400; i++) vus.add(alea(i, i * 3));
    expect(vus.size).toBe(400);
  });
});

describe("le champ interpole", () => {
  /* AUX POINTS ENTIERS, L INTERPOLATION DOIT S EFFACER. C est ce qui
     dit que les poids du lissage valent bien zero et un aux coins. */
  it("retombe exactement sur le bruit de valeur aux points entiers", () => {
    for (const [x, y] of [[0, 0], [3, 7], [-4, 9], [120, -33]]) {
      expect(bruit(x, y)).toBe(alea(x, y));
    }
  });

  it("reste entre zero et un, y compris en coordonnees negatives", () => {
    let mini = 2, maxi = -1;
    for (let x = -50; x <= 50; x += 0.37) {
      for (let y = -50; y <= 50; y += 0.53) {
        const v = bruit(x, y);
        mini = Math.min(mini, v); maxi = Math.max(maxi, v);
      }
    }
    expect(mini).toBeGreaterThanOrEqual(0);
    expect(maxi).toBeLessThanOrEqual(1);
    /* Et il monte VRAIMENT dans la moitie haute : un champ qui plafonne
       a 0,5 passerait les deux bornes ci-dessus sans broncher. */
    expect(maxi).toBeGreaterThan(0.9);
  });

  /* LE CHAMP EST CONTINU, ET C EST TOUT SON INTERET : deux hyphes
     voisines lisent presque la meme valeur, donc s incurvent ensemble.
     Un pas d un centieme ne peut pas faire sauter la valeur. */
  it("ne saute pas d un point au suivant", () => {
    let saut = 0;
    for (let i = 0; i < 2000; i++) {
      const x = i * 0.01;
      saut = Math.max(saut, Math.abs(bruit(x + 0.01, 3.3) - bruit(x, 3.3)));
    }
    /* Mesure : 0,0095 au pire. Le seuil est a deux fois cela, et non au
       ras : un champ DISCONTINU sauterait d un demi, pas d un
       centieme — c est cet ordre de grandeur que le test separe, pas la
       troisieme decimale. */
    expect(saut).toBeLessThan(0.02);
  });

  /* ═══ LE LISSAGE S APLATIT AUX COINS DE MAILLE ═══
     `xf * xf * (3 - 2 * xf)` a une pente NULLE en zero et en un. Une
     interpolation lineaire, elle, garde la meme pente partout : le
     champ se lirait alors comme un damier, chaque maille cassant sur
     ses bords. MESURE : pente 0,0006 au coin contre 0,29 au milieu,
     un rapport de cinq cents. */
  it("s aplatit aux coins de maille et pas au milieu", () => {
    const eps = 0.001;
    let coin = 0, milieu = 0;
    for (const xi of [0, 5, -3, 17]) {
      coin = Math.max(coin, Math.abs(bruit(xi + eps, 4) - bruit(xi, 4)) / eps);
      milieu = Math.max(milieu, Math.abs(bruit(xi + 0.5 + eps, 4) - bruit(xi + 0.5, 4)) / eps);
    }
    expect(coin).toBeLessThan(0.01);
    expect(milieu).toBeGreaterThan(0.1);
  });

  /* AU CENTRE D UNE MAILLE, LES QUATRE COINS PESENT EXACTEMENT PAREIL.
     C est ce qui dit que les quatre voisins sont lus aux bonnes
     positions, et que les deux axes ne sont pas intervertis. */
  it("rend la moyenne des quatre coins au centre d une maille", () => {
    for (const [xi, yi] of [[0, 0], [3, 8], [-5, 2]]) {
      const moyenne = (alea(xi, yi) + alea(xi + 1, yi) + alea(xi, yi + 1) + alea(xi + 1, yi + 1)) / 4;
      expect(bruit(xi + 0.5, yi + 0.5)).toBeCloseTo(moyenne, 12);
    }
  });

  /* LE LONG D UN AXE, LA VALEUR RESTE ENTRE SES DEUX VOISINS : le
     lissage adoucit, il ne depasse jamais. */
  it("reste encadre par ses deux voisins le long d un axe", () => {
    for (const xi of [0, 7, -4]) {
      const a = alea(xi, 9), b = alea(xi + 1, 9);
      for (let t = 0.05; t < 1; t += 0.05) {
        const v = bruit(xi + t, 9);
        expect(v, `${xi}+${t}`).toBeGreaterThanOrEqual(Math.min(a, b) - 1e-12);
        expect(v, `${xi}+${t}`).toBeLessThanOrEqual(Math.max(a, b) + 1e-12);
      }
    }
  });
});

describe("les mesures du cadre", () => {
  it("tire le segment du PETIT cote", () => {
    expect(segmentBase(cadre(800, 600))).toBeCloseTo(96);
    expect(segmentBase(cadre(600, 800))).toBeCloseTo(96);
  });

  it("compose une couleur lisible par le canevas", () => {
    expect(rgba([1, 2, 3], 0.5)).toBe("rgba(1,2,3,0.5)");
  });

  it("se tient a distance des bords en cherchant une place libre", () => {
    const e = cadre(800, 600);
    for (let i = 0; i < 200; i++) {
      const p = placeLibre(e);
      expect(p.x).toBeGreaterThanOrEqual(e.w * 0.18);
      expect(p.x).toBeLessThanOrEqual(e.w * 0.82);
      expect(p.y).toBeGreaterThanOrEqual(e.h * 0.18);
      expect(p.y).toBeLessThanOrEqual(e.h * 0.82);
    }
  });

  it("retient, de ses huit essais, le plus loin des germes deja poses", () => {
    const germes = [{ x: 200, y: 150 }, { x: 700, y: 500 }];
    const e = cadre(800, 600, germes);
    vi.spyOn(Math, "random").mockImplementation(hasard(7));
    const choisi = placeLibre(e);

    const rejoue = hasard(7);
    let mieux = { x: 0, y: 0 }, mieuxD = -1;
    for (let i = 0; i < 8; i++) {
      const x = e.w * (0.18 + rejoue() * 0.64);
      const y = e.h * (0.18 + rejoue() * 0.64);
      const d = Math.min(...germes.map((g) => Math.hypot(g.x - x, g.y - y)));
      if (d > mieuxD) { mieuxD = d; mieux = { x, y }; }
    }
    expect(choisi).toEqual(mieux);
  });

  /* ═══ SANS GERMES, LES HUIT ESSAIS N EN FONT QU UN ═══
     La distance au germe le plus proche vaut alors l INFINI pour tous
     les candidats, et `d > mieuxD` est faux pour tous sauf le premier :
     les sept autres sont tires, puis jetes. Ce n est pas un defaut — un
     point en vaut un autre quand la toile est vide — mais c est ce que
     le code fait, et rien ne le disait. */
  it("garde le premier essai quand aucun germe n est pose", () => {
    const e = cadre(800, 600);
    vi.spyOn(Math, "random").mockImplementation(hasard(3));
    const choisi = placeLibre(e);
    const rejoue = hasard(3);
    expect(choisi.x).toBeCloseTo(e.w * (0.18 + rejoue() * 0.64));
    expect(choisi.y).toBeCloseTo(e.h * (0.18 + rejoue() * 0.64));
  });

  it("suit la classe du theme", () => {
    expect(palette()).toBe(PALETTE.sombre);
    document.documentElement.classList.remove("dark");
    expect(palette()).toBe(PALETTE.clair);
  });

  /* L OR N EST PAS LA MEME COULEUR DANS LES DEUX THEMES. Un jaune vif
     sur fond clair ne se voit pas : le jour, l or descend. */
  it("descend l or sur fond clair", () => {
    expect(PALETTE.sombre.or).toEqual([252, 238, 10]);
    expect(PALETTE.clair.or).toEqual([122, 92, 0]);
  });

  /* `dissipe` EST UN DEBUT DE CHAINE, PAS UNE COULEUR : le peintre lui
     colle l opacite et la parenthese fermante. C est fragile et c est
     voulu — l opacite change selon le peintre. */
  it("prepare la dissipation comme un debut de rgba", () => {
    expect(PALETTE.sombre.dissipe + "0.055)").toBe("rgba(4,6,10,0.055)");
    expect(PALETTE.clair.dissipe + "0.032)").toBe("rgba(231,229,224,0.032)");
  });
});

/* ═══════════════════════════════════════════════════════════════
   LA CONVERSION HSL → RVB, RELUE PAR UNE SECONDE IMPLEMENTATION.

   C est le seul calcul du fichier dont le resultat ne se lit pas :
   une teinte fausse de dix degres reste une couleur plausible. On la
   compare donc a une conversion ECRITE AUTREMENT — par chroma et
   teinte-prime, la ou le module travaille par tiers de roue. Deux
   copies du meme calcul ne prouveraient que la copie.
   ═══════════════════════════════════════════════════════════════ */
function temoin(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = l - c / 2;
  const t: number[] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  return [Math.round((t[0] + m) * 255), Math.round((t[1] + m) * 255), Math.round((t[2] + m) * 255)];
}

describe("le jeton de theme converti en canaux", () => {
  const poser = (v: string) => document.documentElement.style.setProperty("--essai", v);

  it("convertit un bleu connu", () => {
    poser("210 90% 50%");
    expect(jetonEnRvb("--essai", [0, 0, 0])).toEqual([13, 127, 242]);
  });

  it("s accorde avec une seconde implementation sur toute la roue", () => {
    let ecart = 0;
    for (let h = 0; h < 360; h += 7) {
      for (const s of [0, 17, 50, 83, 100]) {
        for (const l of [0, 12, 50, 88, 100]) {
          poser(`${h} ${s}% ${l}%`);
          const obtenu = jetonEnRvb("--essai", [0, 0, 0]);
          const attendu = temoin(h, s / 100, l / 100);
          for (let k = 0; k < 3; k++) ecart = Math.max(ecart, Math.abs(obtenu[k] - attendu[k]));
        }
      }
    }
    /* Un ecart d une unite subsiste sur onze canaux des 3 900 : les deux
       chemins n arrondissent pas le meme flottant. Au-dela, c est une
       teinte fausse. */
    expect(ecart).toBeLessThanOrEqual(1);
  });

  it("rend trois entiers dans les bornes du canal", () => {
    for (let h = 0; h < 360; h += 13) {
      for (const l of [0, 3, 50, 97, 100]) {
        poser(`${h} 100% ${l}%`);
        for (const c of jetonEnRvb("--essai", [0, 0, 0])) {
          expect(Number.isInteger(c)).toBe(true);
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(255);
        }
      }
    }
  });

  /* SANS SATURATION, LA TEINTE NE VEUT PLUS RIEN DIRE : le raccourci
     du gris evite de la faire tourner pour rien — et surtout, il evite
     la division par une chroma nulle. */
  it("prend le raccourci du gris quand la saturation est nulle", () => {
    poser("200 0% 40%");
    expect(jetonEnRvb("--essai", [1, 2, 3])).toEqual([102, 102, 102]);
    poser("0 0% 100%");
    expect(jetonEnRvb("--essai", [1, 2, 3])).toEqual([255, 255, 255]);
  });

  /* ═══ LE REPLI EST LE SEUL GARDE-FOU ═══
     Le jeton est lu dans une feuille de style. Le jour ou il cesse
     d etre un triplet HSL — un hexadecimal, une couleur nommee, un
     `oklch`, un jeton supprime — la conversion rendrait NaN, et
     `rgba(NaN,NaN,NaN,…)` ne leve rien : le canevas ignore le trace en
     silence, et le fond se troue. */
  it("retombe sur le repli quand le jeton n est pas un triplet HSL", () => {
    const repli: [number, number, number] = [9, 8, 7];
    for (const brut of ["#ff0000", "red", "oklch(0.7 0.1 200)", "210 90%", "  "]) {
      poser(brut);
      expect(jetonEnRvb("--essai", repli), brut).toEqual(repli);
    }
  });

  it("retombe sur le repli quand le jeton n existe pas", () => {
    expect(jetonEnRvb("--jamais-pose", [9, 8, 7])).toEqual([9, 8, 7]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   TROIS MUTATIONS QUE CES TESTS N ATTRAPENT PAS, ET POURQUOI.

   Balayage du 30/08/2026 : cinquante-quatre mutations, cinquante et une
   attrapees.

   1. `n >> 13` DEVENU `n >>> 13`, au milieu du hachage. Toutes les
      valeurs du champ changent, et AUCUNE propriete testee ne bouge :
      l intervalle tient, la moyenne tient, la continuite tient, les
      coins de maille tiennent. C est un autre champ de bruit, pas un
      champ faux — donc un autre fond, pas un fond casse. Epingler les
      valeurs exactes ferait de ces tests un detecteur de changement sur
      un choix de dessin ; on epingle les proprietes, pas les nombres.
      (Le decalage FINAL, lui, n est pas dans ce cas : il decidait de
      l intervalle, et il est teste.)

   2. LE RACCOURCI DU GRIS EST EXACTEMENT EQUIVALENT. A saturation
      nulle, le chemin general donne deja le meme resultat : `q` vaut
      `l` dans ses deux branches, `p = 2l - q` vaut `l`, et les quatre
      retours de `f` valent tous `l`. Le raccourci evite de faire
      tourner la roue pour rien ; il ne change pas une couleur.

   3. LE REPLI A DEUX CHEMINS, ET ON NE PEUT PAS LES DISTINGUER.
      Retirer `if (!m) return repli;` ne fait pas revenir NaN : la ligne
      suivante lit `m[1]` sur un `null`, ce qui leve — et le `try/catch`
      qui enveloppe toute la fonction rend le MEME repli. La garde
      explicite dit l intention au lieu de compter sur une exception ;
      le resultat observable est identique, et aucun test ne peut donc
      les separer.

   UN BALAYAGE QUI LIT LE CODE DE SORTIE SE TROMPE. Deux tours de ce
   meme balayage ont d abord annonce la 2 comme attrapee : un `npx` qui
   ne demarre pas sort en erreur, et l erreur se lit comme un test qui
   tombe. Le balayage lit desormais la ligne de resume de vitest, et
   redemande un tour quand elle manque.
   ═══════════════════════════════════════════════════════════════ */
