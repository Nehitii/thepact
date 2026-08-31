import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { encrePapier, selonTheme } from "./encrePapier";

/* CE QU EST L ENCRE — sa clarte percue, la charge de son pigment, la
   cible qu on peut lui demander et le plafond qu elle ne franchit pas.
   Ce qu elle GARANTIT — le seuil de lisibilite — est eprouve dans
   `encrePapier.test.ts`.

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
      for (const cible of [7, 10, 12, 15, 17, 18, 19]) {
        expect(contraste(encrePapier(c, cible)), c + " a " + cible).toBeGreaterThanOrEqual(cible);
      }
    }
  });

  /* ═══ CONSTATE, NON CORRIGE : AU-DELA DE DIX-NEUF, LA BOUCLE
     ABANDONNE SANS LE DIRE ═══
     Le noir pur sur ce papier vaut 19,15 : au-dela, aucune couleur ne
     peut satisfaire la demande. Et la fonction descend la clarte par
     crans d un centieme, quarante fois au plus, ce qui ne l amene meme
     pas au noir — elle rend #000100, qui vaut 19,06, et ne signale
     rien.

     Ce n est pas atteignable aujourd hui : AUCUN appelant ne passe de
     cible — les six sites d appel emploient tous `selonTheme(couleur,
     sombre)` a deux arguments. Corriger demanderait de choisir ce que
     fait la fonction quand elle n y arrive pas : rendre le noir, lever,
     ou rendre son meilleur essai comme aujourd hui. */
  it("s arrete sous le plafond quand on lui demande l impossible", () => {
    for (const cible of [19.1, 21]) {
      const e = encrePapier("#00ff88", cible);
      expect(contraste(e), String(cible)).toBeLessThan(cible);
      expect(contraste(e), String(cible)).toBeGreaterThan(19);
      expect(e).not.toBe("#000000");
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUI FAIT UNE FAMILLE : UNE SEULE CLARTE, UNE CHARGE PLAFONNEE.

   C est l argument central du fichier — viser un CONTRASTE identique
   ne donne pas un POIDS identique, et deux encres au meme contraste
   n ont pas l air d appartenir a la meme palette. La clarte PERCUE,
   elle, se voit. On la mesure donc directement, en OKLCH, plutot que
   par le contraste qu elle produit.
   ═══════════════════════════════════════════════════════════════ */
function oklchDe(hexa: string) {
  const [r, g, b] = canaux(hexa).map(lineaire);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, C: Math.hypot(A, B) };
}

describe("la famille des encres", () => {
  /* TOUTES A LA MEME CLARTE PERCUE, au millieme pres. Mesure : de
     0,4589 a 0,4607 pour une visee a 0,46. Le rouge, le vert et le
     violet pesent donc pareil sur la page tout en restant
     parfaitement distincts — c est ce qu on ne pouvait pas obtenir en
     visant un contraste. */
  it("pose toutes les encres a la meme clarte percue", () => {
    for (const c of [...DU_CODE, ...DE_LA_BASE]) {
      expect(oklchDe(encrePapier(c)).L, c).toBeGreaterThan(0.455);
      expect(oklchDe(encrePapier(c)).L, c).toBeLessThan(0.465);
    }
  });

  /* LA CHARGE EST PLAFONNEE, ET LE PLAFOND EST ATTEINT. Une encre
     d imprimerie n est pas un pastel : on monte jusqu au bord de ce
     que le sRVB tient a cette clarte. Les violets y touchent —
     0,1994 et 0,2008 pour un plafond a 0,2 — et rien ne le depasse.
     Le second chiffre dit aussi que la recherche du bord converge :
     une dichotomie trop courte s arreterait bien en dessous. */
  it("plafonne la charge du pigment, et va jusqu au plafond", () => {
    for (const c of [...DU_CODE, ...DE_LA_BASE]) {
      expect(oklchDe(encrePapier(c)).C, c).toBeLessThan(0.205);
    }
    for (const c of ["#a855f7", "#6366f1", "#8b5cf6"]) {
      expect(oklchDe(encrePapier(c)).C, c).toBeGreaterThan(0.195);
    }
  });

  /* ═══ ET QUAND LE PLAFOND NE TIENT PAS, ON VA CHERCHER LE BORD ═══
     Les cyans et les jaunes ne peuvent pas porter 0,2 de charge a
     cette clarte : le sRVB ne va pas jusque-la. La dichotomie descend
     alors jusqu au bord exact du gamut — 0,0802 pour ce cyan, 0,0946
     pour cet or. Une recherche trop courte s arreterait a un huitieme
     de l intervalle, soit 0,05, et rendrait des encres visiblement
     plus ternes. */
  it("descend jusqu au bord du gamut quand le plafond ne tient pas", () => {
    for (const [c, bord] of [["#22d3ee", 0.0802], ["#00d4ff", 0.0837], ["#ffd700", 0.0946]] as const) {
      const obtenu = oklchDe(encrePapier(c)).C;
      expect(obtenu, c).toBeLessThan(0.2);
      expect(obtenu, c).toBeGreaterThan(bord - 0.002);
    }
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
   TROIS MUTATIONS QUE CES TESTS N ATTRAPENT PAS, ET POURQUOI.

   Balayage du 30/08/2026 : trente-cinq mutations, trente-deux
   attrapees. Les trois restantes tournent toutes autour du meme
   theme — la precision au-dela de ce qu un ecran peut montrer.

   1. LE BORNAGE DES CANAUX DANS `versHex` EST HORS D ATTEINTE.
      `ramenerDansLeGamut` rend deja des canaux entre -0,5 et 255,5 ;
      le `Math.min/max` qui suit ne peut donc pas se declencher. Ce
      n est pas du code mort, c est l autre moitie d une paire : la
      tolerance du gamut s autorise un demi-canal PARCE QUE l ecriture
      le rattrape. Retirer l un des deux seuls ne se voit pas ; retirer
      les deux se verrait.

   2. LA TEINTE NEGATIVE RAMENEE DANS LE TOUR EST SANS EFFET ICI. `H`
      ne sert qu a nourrir un cosinus et un sinus, pour qui -30 degres
      et 330 degres sont le meme angle. La normalisation est ecrite
      pour qui LIT la valeur, pas pour le calcul qui la consomme.

   3. LA TOLERANCE D UN DEMI-CANAL SUR LE GAMUT est un reglage de
      precision : la resserrer a zero deplace le resultat de moins
      d un pas sur 255. Aucun test ne devrait epingler ca — ce serait
      un detecteur de changement sur un arrondi.

   QUATRE AUTRES ONT SURVECU A UN TOUR ET NE SURVIVENT PLUS. Trois ont
   ete attrapees en mesurant les CIBLES EXIGEANTES : la borne haute de
   la dichotomie, la verification du seuil AVANT arrondi, et le papier
   blanc. Les deux dernieres — le plafond de charge et la longueur de
   la dichotomie — ont ete attrapees en mesurant l ENCRE ELLE-MEME, en
   OKLCH, plutot que le contraste qu elle produit : c est la que ces
   deux reglages agissent, et le contraste les cachait.

   J AVAIS FAILLI ARBITRER LA BORNE HAUTE COMME EQUIVALENTE — vingt
   divisions par deux ramenent l ecart bien sous le pas d un canal.
   Elle ne l est pas : a cible haute elle rend une couleur hors gamut
   que l ecriture rabote, et le contraste passe sous la cible. On
   n arbitre pas ce qu on peut encore mesurer.
   ═══════════════════════════════════════════════════════════════ */
