import { describe, expect, it } from "vitest";
import { encrePapier, selonTheme } from "./encrePapier";

/* ── LA MESURE, REFAITE ICI ──
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
const contraste = (hex: string) => {
  const [r, g, b] = canaux(hex);
  const l = 0.2126 * lineaire(r) + 0.7152 * lineaire(g) + 0.0722 * lineaire(b);
  /* Le papier est blanc, donc sa luminance vaut un. */
  return 1.05 / (l + 0.05);
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
     neons, de 1,34 a 4,47 sur du blanc. Toutes sont donc descendues, et
     elles atterrissent entre 6,69 et 7,96 — bien au-dela des 4,5
     demandes, parce que la clarte percue visee (0,46) est la meme pour
     toute la famille et qu elle vaut, elle, environ sept. */
  it("descend les vingt, et les pose toutes au meme poids", () => {
    for (const c of [...DU_CODE, ...DE_LA_BASE]) {
      expect(contraste(c), c).toBeLessThan(4.5);
      expect(encrePapier(c), c).not.toBe(c);
      expect(contraste(encrePapier(c)), c).toBeGreaterThan(6.6);
      expect(contraste(encrePapier(c)), c).toBeLessThan(8);
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

  /* ═══ LE PAPIER EST BLANC, ET LA FRONTIERE LE PROUVE ═══
     `#0069fc` vaut 4,744 sur du blanc — il passe donc, tout juste. Sur
     un papier a peine plus gris (#f0f0f0) il tomberait a 4,163 et
     devrait etre descendu. C est la seule facon de verifier de
     l exterieur SUR QUOI la mesure est prise : une couleur qui n a la
     bonne reponse que pour un blanc pur. */
  it("prend la mesure sur du blanc pur, pas sur un blanc casse", () => {
    expect(contraste("#0069fc")).toBeGreaterThan(4.5);
    expect(contraste("#0069fc")).toBeLessThan(4.8);
    expect(encrePapier("#0069fc")).toBe("#0069fc");
  });

  /* LA MESURE DE REFERENCE : du noir sur du blanc vaut vingt et un, du
     blanc sur du blanc vaut un. Si ces deux-la sont justes, la formule
     l est. */
  it("retrouve les deux bornes de l echelle WCAG", () => {
    expect(contraste("#000000")).toBeCloseTo(21, 5);
    expect(contraste("#ffffff")).toBeCloseTo(1, 5);
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

/* ═══════════════════════════════════════════════════════════════
   LA BOUCLE DE RATTRAPAGE N A JAMAIS SERVI.

   Apres avoir pose la clarte nominale, la fonction verifie le
   contraste sur les canaux ARRONDIS et, s il manque quelque chose,
   redescend d un centieme — quarante fois au plus.

   MESURE : sur les huit cent trente couleurs de la grille qui sont
   effectivement descendues, AUCUNE n a demande ce cran de plus. La
   clarte percue de 0,46 vaut a elle seule environ sept de contraste,
   soit une marge de deux et demi sur les 4,5 demandes. La boucle est un
   filet, pas un rouage — mais elle n est pas morte pour autant : une
   cible plus haute la reveille.
   ═══════════════════════════════════════════════════════════════ */
describe("la cible, et son plafond", () => {
  it("n a pas besoin de son rattrapage au seuil par defaut", () => {
    let descendues = 0, auRas = 0;
    for (const c of grille()) {
      const e = encrePapier(c);
      if (e === c) continue;
      descendues++;
      /* Un resultat qui frole 4,5 est le signe que la boucle a du
         travailler ; tous depassent 6,6. */
      if (contraste(e) < 6) auRas++;
    }
    expect(descendues).toBeGreaterThan(500);
    expect(auRas).toBe(0);
  });

  /* ═══ C EST LA QUE LE RATTRAPAGE TRAVAILLE, ET AU CENTIEME PRES ═══
     A cible haute la clarte nominale ne suffit plus : la boucle
     redescend cran par cran, et elle verifie le contraste sur les
     canaux ARRONDIS — ceux que l hexadecimal portera vraiment. Les
     marges obtenues sont minces, deux centiemes parfois (#ffd700 a 15
     rend 15,02), et c est exactement ce que la verification avant
     arrondi laisserait filer sous la cible. */
  it("honore une cible exigeante, sur plusieurs teintes", () => {
    for (const c of ["#00ff88", "#ef4444", "#ffd700", "#6366f1", "#22d3ee"]) {
      for (const cible of [7, 10, 12, 15, 18, 20, 20.5]) {
        expect(contraste(encrePapier(c, cible)), c + " a " + cible).toBeGreaterThanOrEqual(cible);
      }
    }
  });

  /* ═══ CONSTATE, NON CORRIGE : A VINGT ET UN, LA BOUCLE ABANDONNE
     SANS LE DIRE ═══
     Vingt et un est le contraste du noir pur sur du blanc — la borne
     absolue de l echelle. La fonction descend la clarte par crans d un
     centieme, quarante fois au plus, ce qui ne l amene jamais au noir :
     elle rend #000100, qui vaut 20,909, et ne signale rien.

     Ce n est pas atteignable aujourd hui : AUCUN appelant ne passe de
     cible — les six sites d appel emploient tous `selonTheme(couleur,
     sombre)` a deux arguments. Corriger demanderait de choisir ce que
     fait la fonction quand elle n y arrive pas : rendre le noir, lever,
     ou rendre son meilleur essai comme aujourd hui. */
  it("s arrete a vingt virgule neuf quand on lui demande vingt et un", () => {
    const e = encrePapier("#00ff88", 21);
    expect(contraste(e)).toBeLessThan(21);
    expect(contraste(e)).toBeGreaterThan(20.9);
    expect(e).not.toBe("#000000");
  });
});

describe("la memoire et le theme", () => {
  it("rend deux fois le meme resultat", () => {
    expect(encrePapier("#22c55e")).toBe(encrePapier("#22c55e"));
  });

  /* LA CIBLE FAIT PARTIE DE LA CLE : sans elle, la premiere demande
     figerait la couleur pour toutes les suivantes, quelle que soit
     l exigence. */
  it("ne confond pas deux cibles differentes pour la meme couleur", () => {
    expect(encrePapier("#00ff88", 4.5)).not.toBe(encrePapier("#00ff88", 12));
    expect(encrePapier("#00ff88")).toBe(encrePapier("#00ff88", 4.5));
  });

  it("ne touche a rien en theme sombre", () => {
    expect(selonTheme("#00ff88", true)).toBe("#00ff88");
    expect(selonTheme("#00ff88", false)).toBe(encrePapier("#00ff88"));
    expect(selonTheme("#00ff88", false, 12)).toBe(encrePapier("#00ff88", 12));
  });
});

/* ═══════════════════════════════════════════════════════════════
   QUATRE MUTATIONS QUE CES TESTS N ATTRAPENT PAS, ET POURQUOI.

   Balayage du 30/08/2026 : trente-six mutations, trente-deux
   attrapees. Les quatre restantes tournent toutes autour du meme
   theme — la precision au-dela de ce qu un ecran peut montrer.

   1. LE PAPIER DESCENDU D UN CHEVEU (#ffffff -> #fbfbfb). Le test de
      frontiere prouve que la mesure est prise sur du blanc a quelques
      pour cent pres ; il ne pince pas le dernier bit. Le pincer
      demanderait une couleur dont le contraste tombe dans une fenetre
      de trois centiemes, et ne dirait rien de plus a personne. Un
      papier a un pour cent pres ne change aucune decision.

   2. LE BORNAGE DES CANAUX DANS `versHex` EST HORS D ATTEINTE.
      `ramenerDansLeGamut` rend deja des canaux entre -0,5 et 255,5 ;
      le `Math.min/max` qui suit ne peut donc pas se declencher. Ce
      n est pas du code mort, c est l autre moitie d une paire : la
      tolerance du gamut s autorise un demi-canal PARCE QUE l ecriture
      le rattrape. Retirer l un des deux seuls ne se voit pas ; retirer
      les deux se verrait.

   3. LA TEINTE NEGATIVE RAMENEE DANS LE TOUR EST SANS EFFET ICI. `H`
      ne sert qu a nourrir un cosinus et un sinus, pour qui -30 degres
      et 330 degres sont le meme angle. La normalisation est ecrite
      pour qui LIT la valeur, pas pour le calcul qui la consomme.

   4. LA TOLERANCE D UN DEMI-CANAL SUR LE GAMUT est un reglage de
      precision : la resserrer a zero deplace le resultat de moins
      d un pas sur 255. Aucun test ne devrait epingler ca — ce serait
      un detecteur de changement sur un arrondi.

   TROIS AUTRES ONT SURVECU AU PREMIER TOUR ET NE SURVIVENT PLUS : le
   papier grisatre, la borne haute de la dichotomie et la verification
   du seuil AVANT arrondi. J allais arbitrer la deuxieme comme
   numeriquement equivalente — vingt divisions par deux ramenent
   pourtant l ecart sous le pas d un canal. Elle ne l est pas : a cible
   haute, elle rend une couleur hors gamut que l ecriture rabote, et le
   contraste passe sous la cible. Le test des cibles exigeantes l a
   trouvee. On n arbitre pas ce qu on peut encore mesurer.
   ═══════════════════════════════════════════════════════════════ */
