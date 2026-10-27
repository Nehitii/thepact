import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { encrePapier } from "./encrePapier";

/* CE QUE L ENCRE GARANTIT — le contraste, le papier sur lequel il est
   pris, la teinte qui ne bouge pas, et ce qui ne doit pas etre touche.
   Ce qu elle EST — sa clarte, sa charge, son plafond de cible — est
   eprouve dans `encrePapier.encre.test.ts`.

   ── LA MESURE, REFAITE ICI ──
   Le module calcule le contraste pour DECIDER ; ces lignes le
   recalculent pour VERIFIER. Deux copies du meme code ne prouveraient
   rien — mais la formule WCAG 2.1 n a qu une ecriture, et c est la
   reference exterieure : le test la tient de la norme, pas du module. */
const lineaire = (canal: number) => {
  const v = canal / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const HEXA = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
const canaux = (hex: string) => {
  const m = HEXA.exec(hex.trim());
  if (!m) throw new Error("pas un hexadecimal : " + hex);
  return [1, 2, 3].map((i) => parseInt(m[i], 16)) as [number, number, number];
};
const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * lineaire(r) + 0.7152 * lineaire(g) + 0.0722 * lineaire(b);

/* ═══ LE PAPIER EST LU DANS LA FEUILLE, PAS RECOPIE ═══
   Le module porte ses trois octets en dur ; ce test va chercher
   `--background` du bloc clair dans `index.css` et verifie qu ils lui
   repondent encore. Un papier recopie des deux cotes se desaccorderait
   en silence le jour ou le theme bouge — et c est precisement ce qui
   etait arrive : le module mesurait sur du blanc pur quand le theme
   posait un blanc casse. */
const feuilleDeStyle = fs.readFileSync("src/index.css", "utf8");
function fondClairDeclare(): [number, number, number] {
  const debut = feuilleDeStyle.indexOf("Light Mode");
  const m = /--background:\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/.exec(feuilleDeStyle.slice(debut));
  if (!m) throw new Error("fond clair introuvable dans index.css");
  const h = parseFloat(m[1]) / 360, s = parseFloat(m[2]) / 100, l = parseFloat(m[3]) / 100;
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
const L_PAPIER = luminance(fondClairDeclare());
const contraste = (hex: string) => {
  const l = luminance(canaux(hex));
  return (Math.max(l, L_PAPIER) + 0.05) / (Math.min(l, L_PAPIER) + 0.05);
};
const teinte = (hex: string) => {
  const [r, g, b] = canaux(hex).map(lineaire);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { H, C: Math.hypot(A, B) };
};
const ecartDeTeinte = (a: string, b: string) => {
  const d = Math.abs(teinte(a).H - teinte(b).H) % 360;
  return d > 180 ? 360 - d : d;
};

/* ── LES COULEURS QUI PASSENT VRAIMENT PAR LA ──
   Relevees le 30/08/2026. Douze sont ecrites dans le code — les
   raccourcis de l accueil, la barre neurale, les cinq difficultes du
   tirage. Huit viennent de la BASE : cadres de rang, accent de profil,
   couleur de la difficulte sur mesure. Ces huit-la n ont ete relues par
   personne, et c est pour elles que la garantie compte. */
const DU_CODE = ["#ff8c00", "#ffcc00", "#00d4ff", "#aa44ff", "#00ff88", "#ffd700", "#818cf8",
  "#22c55e", "#eab308", "#f97316", "#ef4444", "#ec4899"];
const DE_LA_BASE = ["#10b981", "#6366f1", "#f43f5e", "#fbbf24", "#5bb4ff", "#8b5cf6",
  "#a855f7", "#b4b8ee"];

/** Une grille reguliere du cube sRGB : mille trois cent trente et une couleurs. */
function grille(pas = 25) {
  const out: string[] = [];
  for (let r = 0; r < 256; r += pas) {
    for (let g = 0; g < 256; g += pas) {
      for (let b = 0; b < 256; b += pas) {
        out.push("#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join(""));
      }
    }
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════
   LA SEULE PROMESSE QUI COMPTE : CE QUI SORT SE LIT SUR DU PAPIER.

   Tout le reste du fichier — OKLCH, le gamut, la recherche par
   dichotomie — n existe que pour tenir cette ligne-la. Et c est
   exactement le genre de nombre qui peut etre faux sans que personne
   ne le voie : une couleur a 3,8:1 au lieu de 4,5 parait tres bien a
   l oeil qui l a choisie, et disparait pour celui qui lit mal.
   ═══════════════════════════════════════════════════════════════ */
describe("le contraste garanti", () => {
  it("porte le seuil AA sur toute la grille du cube sRVB", () => {
    const sous: string[] = [];
    for (const c of grille()) {
      if (contraste(encrePapier(c)) < 4.5) sous.push(c + " -> " + encrePapier(c));
    }
    expect(sous).toEqual([]);
  });

  it("porte le seuil sur les vingt couleurs que le projet emploie", () => {
    for (const c of [...DU_CODE, ...DE_LA_BASE]) {
      expect(contraste(encrePapier(c)), c).toBeGreaterThanOrEqual(4.5);
    }
  });

  /* AUCUNE DES VINGT NE PASSE LE SEUIL TELLE QUELLE : ce sont des
     neons, de 1,22 a 4,07 sur le fond clair. Toutes sont donc
     descendues, et elles atterrissent entre 6,10 et 7,26 — bien au-dela
     des 4,5 demandes, parce que la clarte percue visee (0,46) est la
     meme pour toute la famille et qu elle vaut, elle, environ six et
     demi. */
  it("descend les vingt, et les pose toutes au meme poids", () => {
    for (const c of [...DU_CODE, ...DE_LA_BASE]) {
      expect(contraste(c), c).toBeLessThan(4.5);
      expect(encrePapier(c), c).not.toBe(c);
      expect(contraste(encrePapier(c)), c).toBeGreaterThan(6);
      expect(contraste(encrePapier(c)), c).toBeLessThan(7.5);
    }
  });

  /* UNE COULEUR QUI PASSE DEJA LE SEUIL N EST PAS TOUCHEE : les fonds
     sombres traversent sans etre eclaircis, ce qui serait le contraire
     du but. */
  it("laisse passer ce qui porte deja", () => {
    for (const c of ["#0c1a4f", "#002b1a", "#000000", "#333333"]) {
      expect(contraste(c), c).toBeGreaterThanOrEqual(4.5);
      expect(encrePapier(c), c).toBe(c);
    }
  });

  /* ═══ LE PAPIER EST CELUI DU THEME, ET UNE COULEUR LE PROUVE ═══
     `#0069fc` vaut 4,744 sur du BLANC PUR — il y passerait, tout
     juste. Sur le fond que le theme pose vraiment il tombe a 4,326, et
     doit donc etre descendu. C est la seule facon de verifier de
     l exterieur SUR QUOI la mesure est prise : une couleur dont la
     reponse depend du fond choisi.

     C EST EXACTEMENT LE TROU QUI VIENT D ETRE BOUCHE. Tant que le
     module mesurait sur du blanc, cette couleur-la ressortait intacte
     et illisible. */
  it("prend la mesure sur le fond du theme, pas sur du blanc pur", () => {
    expect(contraste("#0069fc")).toBeLessThan(4.5);
    expect(contraste("#0069fc")).toBeGreaterThan(4.2);
    expect(encrePapier("#0069fc")).not.toBe("#0069fc");
    expect(contraste(encrePapier("#0069fc"))).toBeGreaterThanOrEqual(4.5);
  });

  /* LE PAPIER DU MODULE REPOND A CELUI DE LA FEUILLE. Le module porte
     ses trois octets en dur pour rester sans dependance ; c est ici
     qu on verifie qu ils disent la meme chose que `--background`. */
  it("porte le meme papier que le theme declare", () => {
    expect(fondClairDeclare()).toEqual([240, 245, 250]);
    expect(L_PAPIER).toBeCloseTo(0.9073, 4);
    /* Le blanc pur, lui, vaut un : on mesurait donc 1,097 fois trop. */
    expect(1.05 / (L_PAPIER + 0.05)).toBeCloseTo(1.0968, 4);
  });

  /* ═══ LES BORNES DE L ECHELLE, ET CE QUE LE PAPIER LEUR FAIT ═══
     Du noir sur du BLANC PUR vaut vingt et un : c est la borne de la
     norme, et elle verifie la formule.

     Sur le papier reel, la meme encre noire ne vaut plus que 19,15 :
     un fond qui n est pas blanc plafonne ce qu on peut atteindre. Une
     cible au-dela est donc impossible par construction, pas seulement
     hors de portee de l algorithme. */
  it("retrouve la borne de la norme, et le plafond du vrai papier", () => {
    const surBlanc = (l: number) => 1.05 / (l + 0.05);
    expect(surBlanc(luminance([0, 0, 0]))).toBeCloseTo(21, 5);
    expect(surBlanc(1)).toBeCloseTo(1, 5);

    expect(contraste("#000000")).toBeCloseTo(19.15, 2);
    expect(contraste("#f0f5fa")).toBeCloseTo(1, 5);
  });
});

/* ═══════════════════════════════════════════════════════════════
   LA TEINTE NE BOUGE PAS — C EST CE QUI DISTINGUE UNE ENCRE D UNE
   AUTRE COULEUR.

   Le vert reste vert, le rose reste rose : une action garde son
   identite d un theme a l autre. Mesure du 30/08/2026 : au plus 1,1
   degre d ecart sur les vingt couleurs reelles, et 2,6 sur toute la
   grille — les pires cas y sont des quasi-gris, dont la teinte n a
   presque pas de sens.
   ═══════════════════════════════════════════════════════════════ */
describe("la teinte conservee", () => {
  it("garde la teinte au degre pres sur les couleurs reelles", () => {
    for (const c of [...DU_CODE, ...DE_LA_BASE]) {
      expect(ecartDeTeinte(c, encrePapier(c)), c).toBeLessThan(1.5);
    }
  });

  /* LA DERIVE SUIT L INTENSITE, EN SENS INVERSE : moins il y a de
     couleur, moins la teinte veut dire quelque chose, et plus elle
     bouge. Mesure sur les 830 couleurs de la grille qui descendent :

       toutes intensites   1,89 deg au pire
       chroma > 0,06       1,32
       chroma > 0,10       1,03
       chroma > 0,15       0,70

     Les seuils ci-dessous sont poses au-dessus de ces mesures, pas a
     leur ras. */
  it("ne la fait deriver que la ou il n y a presque plus de couleur", () => {
    let global = 0, colore = 0;
    for (const c of grille()) {
      const e = encrePapier(c);
      if (e === c) continue;
      const d = ecartDeTeinte(c, e);
      global = Math.max(global, d);
      if (teinte(c).C > 0.1) colore = Math.max(colore, d);
    }
    expect(global).toBeLessThan(3);
    expect(colore).toBeLessThan(1.5);
    expect(colore).toBeLessThan(global);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUI N EST PAS UN HEXADECIMAL RESSORT INTACT.

   Ce n est pas une politesse, c est ce qui empeche la fonction
   d abimer trois formes bien reelles :

     `var(--succes-papier, hsl(142 70% 50%))`  deux couleurs des
       objectifs passent par une variable de theme ;
     `rgba(16,185,129,0.5)`                    c est ce que la table
       `ranks` stocke dans `glow_color`, en base, aujourd hui ;
     `hsl(45 100% 60%)`                        toute la boutique.

   Une de ces chaines rendue vide ou tronquee eteindrait la couleur sans
   rien signaler.
   ═══════════════════════════════════════════════════════════════ */
describe("ce qui n est pas un hexadecimal", () => {
  it("ressort tel quel", () => {
    for (const brut of [
      "var(--succes-papier, hsl(142 70% 50%))",
      "rgba(16,185,129,0.5)",
      "hsl(45 100% 60%)",
      "currentColor", "transparent", "", "   ",
      "#abc", "#00ff8", "#00ff888", "#00ff8g",
    ]) {
      expect(encrePapier(brut), JSON.stringify(brut)).toBe(brut);
    }
  });
});

describe("les formes acceptees d un hexadecimal", () => {
  it("ignore la casse et les espaces autour", () => {
    expect(encrePapier("#00FF88")).toBe(encrePapier("#00ff88"));
    expect(encrePapier(" #00ff88 ")).toBe(encrePapier("#00ff88"));
    expect(encrePapier("00ff88")).toBe(encrePapier("#00ff88"));
  });

  /* ═══ CONSTATE, NON CORRIGE : LA SORTIE N A PAS TOUJOURS SON DIESE ═══
     Une couleur DESCENDUE est reecrite par la fonction, donc toujours
     avec son diese. Une couleur qui passe deja le seuil est rendue
     TELLE QU ELLE EST ARRIVEE — sans diese si elle n en avait pas, avec
     ses majuscules si elle en avait. Deux couleurs voisines peuvent
     donc sortir sous deux formes differentes. Aucun appelant ne passe
     d hexadecimal nu aujourd hui : les vingt releves ont tous leur
     diese. */
  it("rend intacte une couleur qu elle ne touche pas, diese ou non", () => {
    expect(encrePapier("0c1a4f")).toBe("0c1a4f");
    expect(encrePapier("#0C1A4F")).toBe("#0C1A4F");
    expect(encrePapier("00ff88")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

