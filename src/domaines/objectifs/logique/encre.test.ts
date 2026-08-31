import { afterEach, describe, expect, it } from "vitest";
import { encreSurFond } from "./encre";

const SOMBRE = "#0a0a00";
const CLAIRE = "#f2f8ff";

/* ── LA MESURE, TENUE DE LA NORME ──
   Le module calcule une luminance pour CHOISIR ; ces lignes la
   recalculent pour VERIFIER, depuis la formule WCAG 2.1. */
const lineaire = (v: number) => {
  const x = v / 255;
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * lineaire(r) + 0.7152 * lineaire(g) + 0.0722 * lineaire(b);
const canauxHex = (h: string) =>
  [1, 2, 3].map((i) => parseInt(/^#(..)(..)(..)$/.exec(h)![i], 16)) as [number, number, number];
const rapport = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const contraste = (fond: [number, number, number], encre: string) =>
  rapport(luminance(fond), luminance(canauxHex(encre)));

function hslEnRvb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}

afterEach(() => { document.documentElement.style.removeProperty("--succes-papier"); });

describe("les formes d une couleur", () => {
  it("lit un hexadecimal a six chiffres, a trois, et sans egard pour la casse", () => {
    expect(encreSurFond("#ffffff")).toBe(SOMBRE);
    expect(encreSurFond("#FFF")).toBe(SOMBRE);
    expect(encreSurFond("#000000")).toBe(CLAIRE);
    expect(encreSurFond("#000")).toBe(CLAIRE);
    /* TROIS CHIFFRES SE DOUBLENT UN A UN : `#00f` vaut `#0000ff`, un
       bleu profond qui demande l encre claire. Doubler la chaine
       entiere donnerait `00f00f`, soit un vert clair — et l encre
       sombre. */
    expect(encreSurFond("#00f")).toBe(CLAIRE);
    expect(encreSurFond("#00f")).toBe(encreSurFond("#0000ff"));
    expect(encreSurFond("#ff0")).toBe(encreSurFond("#ffff00"));
  });

  /* ═══ L ORDRE DES CANAUX COMPTE, ET IL NE SE VOIT QUE SUR UNE
     COULEUR QUI N EST PAS GRISE ═══
     Le rouge pese trois fois le bleu dans la luminance. `#ff0033` est
     donc clair — encre sombre — et `#3300ff`, ses canaux echanges, est
     sombre — encre claire. Sur du blanc, du noir ou un gris, la meme
     erreur serait invisible. */
  it("distingue le rouge du bleu, en hexadecimal comme en rgb", () => {
    expect(encreSurFond("#ff0033")).toBe(SOMBRE);
    expect(encreSurFond("#3300ff")).toBe(CLAIRE);
    expect(encreSurFond("rgb(255, 0, 51)")).toBe(SOMBRE);
    expect(encreSurFond("rgb(51, 0, 255)")).toBe(CLAIRE);
  });

  /* ═══ LA COURBE DE LINEARISATION A UN COUDE, ET IL EST A SA PLACE ═══
     Sous 0,03928, un canal se divise par 12,92 ; au-dessus, il passe
     par une puissance. Deplacer ce coude d une decimale change la
     luminance de tout ce qui est sombre : MESURE, dix-sept mille neuf
     cent dix couleurs du cube changeraient d encre. `rgb(0,135,81)` est
     l une d elles — un vert moyen que le coude deplace de part et
     d autre de la bascule. */
  it("place le coude de la linearisation au bon centieme", () => {
    expect(encreSurFond("rgb(0, 135, 81)")).toBe(SOMBRE);
    expect(encreSurFond("rgb(0, 90, 54)")).toBe(CLAIRE);
  });

  it("lit un hsl et un hsla, avec virgules ou espaces", () => {
    for (const c of ["hsl(0 0% 100%)", "hsl(0, 0%, 100%)", "hsla(0 0% 100% / 0.5)"]) {
      expect(encreSurFond(c), c).toBe(SOMBRE);
    }
    expect(encreSurFond("hsl(0 0% 0%)")).toBe(CLAIRE);
  });

  it("lit un rgb et un rgba", () => {
    expect(encreSurFond("rgb(255, 255, 255)")).toBe(SOMBRE);
    expect(encreSurFond("rgb(255 255 255)")).toBe(SOMBRE);
    expect(encreSurFond("rgba(0, 0, 0, 0.4)")).toBe(CLAIRE);
  });

  /* ═══ CONSTATE : L OPACITE EST IGNOREE ═══
     Un fond a moitie transparent est traite comme opaque. Ce qui se
     voit derriere lui ne peut pas etre connu d ici — et l ignorer est
     le seul choix qui ne demande pas de le deviner. */
  it("ne tient pas compte de l opacite du fond", () => {
    expect(encreSurFond("rgba(255, 255, 255, 0)")).toBe(encreSurFond("rgb(255, 255, 255)"));
    expect(encreSurFond("hsla(0 0% 0% / 0.05)")).toBe(encreSurFond("hsl(0 0% 0%)"));
  });

  /* SANS SATURATION, LA TEINTE NE VEUT PLUS RIEN DIRE : le raccourci du
     gris evite de faire tourner la roue pour rien. */
  it("prend le raccourci du gris quand la saturation est nulle", () => {
    expect(encreSurFond("hsl(200 0% 40%)")).toBe(encreSurFond("rgb(102, 102, 102)"));
  });
});

/* ═══════════════════════════════════════════════════════════════
   UNE COULEUR PEUT ETRE UN JETON DE THEME.

   Deux entrees de la palette des objectifs s ecrivent
   `var(--succes-papier, hsl(142 70% 50%))` — l etiquette « sante » et
   la difficulte « facile ». Le navigateur peint le fond avec la vraie
   valeur de la variable ; si le module ne la lit pas, il choisit
   l encre sur une chaine qu il ne comprend pas.

   MESURE DU 31/08/2026 : sans resolution, l encre etait SOMBRE dans les
   deux themes. En sombre la variable n existe pas, le repli du `var`
   s applique — un vert moyen — et l encre sombre y tient a 10,61:1. En
   CLAIR la variable vaut `hsl(152 100% 20%)`, un vert profond : l encre
   sombre y tombait a 2,80:1, quand l encre claire y vaut 6,65.
   ═══════════════════════════════════════════════════════════════ */
describe("les jetons de theme", () => {
  const JETON = "var(--succes-papier, hsl(142 70% 50%))";

  it("prend le repli du var quand la variable n est pas posee", () => {
    expect(encreSurFond(JETON)).toBe(encreSurFond("hsl(142 70% 50%)"));
    expect(encreSurFond(JETON)).toBe(SOMBRE);
    expect(contraste(hslEnRvb(142, 70, 50), SOMBRE)).toBeGreaterThan(10);
  });

  it("prend la variable quand elle est posee, et change d encre avec elle", () => {
    document.documentElement.style.setProperty("--succes-papier", "hsl(152 100% 20%)");
    expect(encreSurFond(JETON)).toBe(CLAIRE);
    expect(contraste(hslEnRvb(152, 100, 20), CLAIRE)).toBeGreaterThan(6);
    /* C est le contraste qu on evitait : sombre sur ce vert-la. */
    expect(contraste(hslEnRvb(152, 100, 20), SOMBRE)).toBeLessThan(3);
  });

  it("suit la variable jusque dans un var imbrique", () => {
    expect(encreSurFond("var(--absent, var(--aussi-absent, #ffffff))")).toBe(SOMBRE);
    expect(encreSurFond("var(--absent, var(--aussi-absent, #000000))")).toBe(CLAIRE);
  });

  /* UN VAR SANS REPLI NE DIT RIEN. On ne devine pas : on retombe sur
     l encre sombre, comme pour tout ce qui n est pas lisible. */
  it("retombe sur l encre sombre pour un var sans repli", () => {
    expect(encreSurFond("var(--absent)")).toBe(SOMBRE);
  });

  /* ═══ UNE VARIABLE QUI SE DESIGNE ELLE-MEME NE DOIT PAS TOURNER SANS
     FIN ═══
     `--boucle: var(--boucle)` est du CSS valide — le moteur de style
     l ignore, mais `getComputedStyle` le rend tel quel. Sans le
     compteur de profondeur, la resolution s appellerait indefiniment et
     l onglet se figerait sur une etiquette de palier. */
  it("s arrete sur une variable qui se designe elle-meme", () => {
    document.documentElement.style.setProperty("--boucle", "var(--boucle)");
    try {
      expect(encreSurFond("var(--boucle, #ffffff)")).toBe(SOMBRE);
    } finally {
      document.documentElement.style.removeProperty("--boucle");
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   CONSTATE, NON CORRIGE : LE REPLI EST SOMBRE, QUOI QUE CACHE LE FOND.

   Une couleur qu on ne sait pas lire rend l encre SOMBRE. Sur un fond
   clair c est le bon choix ; sur un fond sombre, c est illisible. Les
   mots-clefs CSS en sont l exemple : `black` n est pas reconnu, et
   l encre sombre y vaut 1,00:1.

   AUCUN APPELANT N EN PASSE. Les six sites d appel passent une couleur
   de `GOAL_TAGS` ou de `DIFFICULTY_OPTIONS` — des `hsl(...)` ecrits en
   toutes lettres, plus les deux jetons resolus ci-dessus — ou une
   couleur de profil, qui est un hexadecimal. Le trou existe et n est
   pas atteint.
   ═══════════════════════════════════════════════════════════════ */
describe("ce qu on ne sait pas lire", () => {
  it("retombe sur l encre sombre", () => {
    for (const c of ["currentColor", "transparent", "", "   ", "#12345", "#gggggg", "oklch(0.7 0.1 200)"]) {
      expect(encreSurFond(c), JSON.stringify(c)).toBe(SOMBRE);
    }
  });

  it("rend donc du sombre sur du noir, pour un mot-clef CSS", () => {
    expect(encreSurFond("black")).toBe(SOMBRE);
    expect(contraste([0, 0, 0], SOMBRE)).toBeLessThan(1.1);
    /* Ecrit en hexadecimal, le meme noir donne la bonne encre. */
    expect(encreSurFond("#000000")).toBe(CLAIRE);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE MODULE CHOISIT, IL NE CORRIGE PAS.

   `encrePapier`, dans le socle, DESCEND une couleur jusqu a ce qu elle
   porte 4,5:1. Ici on ne touche pas au fond : on prend la meilleure de
   DEUX encres. Sur un fond de demi-teinte, la meilleure des deux ne
   suffit pas — et c est une limite de principe, pas un defaut de
   reglage.
   ═══════════════════════════════════════════════════════════════ */
describe("ce que le choix garantit, et ce qu il ne garantit pas", () => {
  const gris = (n: number): [number, number, number] => [n, n, n];

  it("choisit toujours la meilleure des deux encres", () => {
    let desaccords = 0, pire = 0;
    for (let n = 0; n <= 255; n++) {
      const choisie = encreSurFond(`rgb(${n}, ${n}, ${n})`);
      const cS = contraste(gris(n), SOMBRE), cC = contraste(gris(n), CLAIRE);
      const meilleure = cS >= cC ? SOMBRE : CLAIRE;
      if (choisie !== meilleure) { desaccords++; pire = Math.max(pire, Math.abs(cS - cC)); }
    }
    /* ═══ UN SEUL DESACCORD, ET IL NE COUTE RIEN ═══
       Le module compare `(L + 0,05) / 0,05` a `1,05 / (L + 0,05)` :
       il calcule COMME SI les deux encres etaient du noir et du blanc
       purs. Elles ne le sont pas — #0a0a00 vaut 0,0028 de luminance et
       #f2f8ff 0,932. L approximation deplace la bascule d un cheveu :
       un gris sur 256 change de camp, et l ecart entre les deux encres
       y vaut quatre millieme. */
    expect(desaccords).toBe(1);
    expect(pire).toBeLessThan(0.01);
  });

  /* ═══ CONSTATE : LE SEUIL AA N EST PAS GARANTI ═══
     Sur les demi-teintes, la meilleure des deux encres plafonne a
     4,315:1 — sous les 4,5 du seuil AA. Ce n est pas un reglage rate :
     deux encres fixes ne peuvent pas mieux faire.

     Le plancher depend du COUPLE choisi. Du noir et du blanc PURS
     donneraient 4,608 — au-dessus du seuil. Les encres actuelles sont
     adoucies a dessein ; ce que cette douceur coute, le voici : 0,29
     de plancher, soit la difference entre garantir AA et ne pas le
     garantir. */
  it("plafonne a 4,3 sur les demi-teintes, la ou du noir et du blanc purs donneraient 4,6", () => {
    let plancher = 99, ou = -1;
    for (let n = 0; n <= 255; n++) {
      const q = contraste(gris(n), encreSurFond(`rgb(${n}, ${n}, ${n})`));
      if (q < plancher) { plancher = q; ou = n; }
    }
    expect(plancher).toBeCloseTo(4.315, 2);
    expect(plancher).toBeLessThan(4.5);
    expect(ou).toBeGreaterThan(110);
    expect(ou).toBeLessThan(130);

    const purs = (n: number) => Math.max(rapport(luminance(gris(n)), 0), rapport(luminance(gris(n)), 1));
    let plancherPur = 99;
    for (let n = 0; n <= 255; n++) plancherPur = Math.min(plancherPur, purs(n));
    expect(plancherPur).toBeCloseTo(4.608, 2);
    expect(plancherPur).toBeGreaterThan(4.5);
  });

  /* LE FOND EXTREME EST TOUJOURS TRES LISIBLE : c est au milieu que ca
     se joue, pas aux bords. */
  it("porte tres large sur les fonds extremes", () => {
    expect(contraste([255, 255, 255], encreSurFond("#ffffff"))).toBeGreaterThan(18);
    expect(contraste([0, 0, 0], encreSurFond("#000000"))).toBeGreaterThan(17);
  });
});

/* ═══════════════════════════════════════════════════════════════
   LE CAS QUI A FAIT ECRIRE CE FICHIER.

   L en-tete dit que l encre noire fixe « tombe a 3,19:1 sur le violet
   d impossible ». On le verifie, et on verifie que le module le
   corrige.
   ═══════════════════════════════════════════════════════════════ */
describe("les six couleurs de difficulte", () => {
  const DIFFICULTES: [string, number, number, number][] = [
    ["easy", 142, 70, 50], ["medium", 45, 95, 55], ["hard", 25, 100, 60],
    ["extreme", 0, 90, 65], ["impossible", 280, 75, 45],
  ];

  it("retrouve le 3,19 du violet, et le corrige", () => {
    const violet = hslEnRvb(280, 75, 45);
    /* Une encre noire FIXE, celle d avant ce fichier. */
    expect(rapport(luminance(violet), 0)).toBeCloseTo(3.19, 2);
    const encre = encreSurFond("hsl(280 75% 45%)");
    expect(encre).toBe(CLAIRE);
    expect(contraste(violet, encre)).toBeGreaterThan(6);
  });

  it("porte le seuil AA sur les cinq difficultes", () => {
    for (const [nom, h, s, l] of DIFFICULTES) {
      const encre = encreSurFond(`hsl(${h} ${s}% ${l}%)`);
      expect(contraste(hslEnRvb(h, s, l), encre), nom).toBeGreaterThanOrEqual(4.5);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   DEUX MUTATIONS QUE CES TESTS N ATTRAPENT PAS, ET POURQUOI.

   Balayage du 31/08/2026 : vingt-cinq mutations, vingt-trois
   attrapees.

   1. LE RACCOURCI DU GRIS EST EXACTEMENT EQUIVALENT. A saturation
      nulle, le chemin general donne deja le meme resultat : `q` vaut
      `l` dans ses deux branches, `p = 2l - q` vaut `l`, et les quatre
      retours de `canal` valent tous `l`. Le raccourci evite de faire
      tourner la roue pour rien ; il ne change pas une couleur. C est la
      TROISIEME fois que cette meme mutation survit dans ce depot —
      `jetonEnRvb` et `encrePapier` portent le meme raccourci, avec la
      meme conclusion.

   2. `>=` DEVENU `>` DANS LE DEPART D EGALITE. Il faudrait que les deux
      contrastes soient EXACTEMENT egaux, c est-a-dire que la luminance
      du fond tombe pile sur la bascule. MESURE : sur un balayage de
      plus d un million de couleurs, zero egalite exacte — deux
      flottants issus de deux formules differentes ne se rencontrent
      pas. La preference pour l encre sombre en cas d egalite est donc
      une intention ecrite, pas un comportement observable.
   ═══════════════════════════════════════════════════════════════ */
