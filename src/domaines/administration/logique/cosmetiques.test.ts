import { describe, expect, it } from "vitest";
import {
  DECIMALES, decalageAjuste, filtrerLesArticles, PRIX_PAR_DEFAUT,
  prixAffiche, prixSaisi, RARETE_PAR_DEFAUT,
} from "./cosmetiques";

describe("les valeurs par defaut, une seule fois", () => {
  /* Ils etaient poses en clair DEUX FOIS chacun : dans le champ, et
     dans ce qui part en base. Les deux pouvaient diverger. */
  it("porte les trois prix", () => {
    expect(PRIX_PAR_DEFAUT).toEqual({ cadre: 450, banniere: 650, titre: 450 });
  });

  it("porte la rarete la plus basse", () => {
    expect(RARETE_PAR_DEFAUT).toBe("common");
  });
});

/* ═══════════════════════════════════════════════════════════════
   VIDER LE CHAMP DE PRIX ECRIT « NaN ».

   Ces tests constatent le trou, ils ne l approuvent pas.
   ═══════════════════════════════════════════════════════════════ */
describe("prixSaisi — sans aucun repli", () => {
  it("lit un prix ordinaire", () => {
    expect(prixSaisi("450")).toBe(450);
    expect(prixSaisi("0")).toBe(0);
  });

  /* EFFACER LE CHAMP DONNE NaN, qui part tel quel dans l etat — et de
     la en base, ou la colonne est un entier. */
  it.each(["", "   ", "abc"])("rend NaN pour « %s »", (saisie) => {
    expect(Number.isNaN(prixSaisi(saisie))).toBe(true);
  });

  /* LE PIEGE EST QUE L ECRAN N EN MONTRE RIEN : la valeur affichee est
     `prix || 450`, et NaN est faux. Le champ affiche donc 450 pendant
     que l etat vaut NaN. On croit enregistrer 450 ; on enregistre
     autre chose. */
  it("affiche le defaut alors que l etat porte NaN", () => {
    const etat = prixSaisi("");
    expect(Number.isNaN(etat)).toBe(true);
    expect(prixAffiche(etat, PRIX_PAR_DEFAUT.cadre)).toBe(450);
  });

  it("s arrete au premier caractere non chiffre", () => {
    expect(prixSaisi("450 Bonds")).toBe(450);
  });

  it("accepte un prix negatif", () => {
    expect(prixSaisi("-100")).toBe(-100);
  });

  it("tronque un prix decimal", () => {
    expect(prixSaisi("450.9")).toBe(450);
  });
});

describe("prixAffiche", () => {
  it("montre le prix quand il y en a un", () => {
    expect(prixAffiche(200, PRIX_PAR_DEFAUT.cadre)).toBe(200);
  });

  /* ZERO EST FAUX : un cosmetique GRATUIT s affiche a 450. C est la
     meme cause que le NaN, et le meme effet — l ecran ment sur ce que
     l etat porte. Constate, non corrige. */
  it("montre le defaut pour un prix a zero", () => {
    expect(prixAffiche(0, PRIX_PAR_DEFAUT.cadre)).toBe(450);
  });

  it.each([null, undefined, NaN])("montre le defaut pour %s", (v) => {
    expect(prixAffiche(v as number | null, PRIX_PAR_DEFAUT.banniere)).toBe(650);
  });

  it("distingue les trois defauts", () => {
    expect(prixAffiche(null, PRIX_PAR_DEFAUT.cadre)).toBe(450);
    expect(prixAffiche(null, PRIX_PAR_DEFAUT.banniere)).toBe(650);
    expect(prixAffiche(null, PRIX_PAR_DEFAUT.titre)).toBe(450);
  });
});

describe("decalageAjuste — l arrondi au dixieme n est pas decoratif", () => {
  it("avance et recule d un cran", () => {
    expect(decalageAjuste(0, 1)).toBe(1);
    expect(decalageAjuste(3, -1)).toBe(2);
  });

  it("traite un decalage absent comme zero", () => {
    expect(decalageAjuste(null, 1)).toBe(1);
    expect(decalageAjuste(undefined, -1)).toBe(-1);
  });

  /* LE DECALAGE SE REGLE AUSSI A LA MAIN, ou il peut valoir 3,7.
     Ajouter un sans arrondir donnerait 4,699999999999999 apres
     quelques pas — la virgule flottante s accumule — et le champ
     afficherait cela. */
  it("garde un dixieme propre sur une valeur decimale", () => {
    expect(decalageAjuste(3.7, 1)).toBe(4.7);
    expect(decalageAjuste(0.1, 0.2)).toBe(0.3);
  });

  it("ne laisse pas la virgule flottante s accumuler", () => {
    /* On releve a CHAQUE pas : la derive apparait des le troisieme,
       meme si certaines sommes retombent juste par la suite — c est
       precisement ce qui la rend difficile a voir sans arrondi. */
    let arrondi = 0.1;
    let brut = 0.1;
    const derives: number[] = [];
    for (let i = 0; i < 12; i++) {
      arrondi = decalageAjuste(arrondi, 0.1);
      brut = brut + 0.1;
      if (brut !== arrondi) derives.push(i + 1);
      /* L arrondi, lui, tombe toujours sur un dixieme propre. */
      expect(Math.round(arrondi * 10) / 10).toBe(arrondi);
    }
    expect(arrondi).toBe(1.3);
    /* La preuve du piege : la somme brute s ecarte, et pas qu une fois. */
    expect(derives.length).toBeGreaterThan(0);
    expect(0.1 + 0.1 + 0.1).not.toBe(0.3);
  });

  it("garde un pas de zero sans rien changer", () => {
    expect(decalageAjuste(4.7, 0)).toBe(4.7);
  });

  /* L ARRONDI EST AU DIXIEME : un centieme est perdu. C est voulu —
     le reglage se fait au dixieme de pixel. */
  it("arrondit au dixieme, pas plus fin", () => {
    expect(DECIMALES).toBe(10);
    expect(decalageAjuste(0, 0.04)).toBe(0);
    expect(decalageAjuste(0, 0.05)).toBe(0.1);
  });

  it("rend un nombre negatif quand on descend sous zero", () => {
    expect(decalageAjuste(0, -1)).toBe(-1);
    expect(decalageAjuste(-4.9, -1)).toBe(-5.9);
  });
});

describe("filtrerLesArticles — deux colonnes, pas une", () => {
  const articles = [
    { name: "Fire" },
    { name: "Default" },
    { title_text: "Le Patient" },
    { name: "Aurore", title_text: undefined },
  ];

  it("rend tout sur une recherche vide", () => {
    expect(filtrerLesArticles(articles, "")).toHaveLength(4);
  });

  it("trouve par le nom", () => {
    expect(filtrerLesArticles(articles, "fir")).toEqual([{ name: "Fire" }]);
  });

  /* LES TROIS SORTES DE COSMETIQUES NE NOMMENT PAS LEUR NOM PAREIL :
     un cadre et une banniere ont un `name`, un TITRE a un
     `title_text`. Chercher dans une seule colonne rendrait la
     recherche muette sur un tiers du catalogue. */
  it("trouve un titre par son texte", () => {
    expect(filtrerLesArticles(articles, "patient")).toEqual([{ title_text: "Le Patient" }]);
  });

  it("ignore la casse", () => {
    expect(filtrerLesArticles(articles, "FIRE")).toHaveLength(1);
    expect(filtrerLesArticles(articles, "PATIENT")).toHaveLength(1);
  });

  it("cherche n importe ou dans le mot, pas seulement au debut", () => {
    expect(filtrerLesArticles(articles, "aul")).toEqual([{ name: "Default" }]);
  });

  it("rend une liste vide quand rien ne correspond", () => {
    expect(filtrerLesArticles(articles, "chimere")).toEqual([]);
  });

  it("supporte un article sans nom ni titre", () => {
    expect(filtrerLesArticles([{}], "x")).toEqual([]);
    expect(filtrerLesArticles([{}], "")).toHaveLength(1);
  });

  it("ne modifie pas la liste qu on lui donne", () => {
    const origine = [...articles];
    filtrerLesArticles(articles, "fir");
    expect(articles).toEqual(origine);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUE LE BALAYAGE A LAISSE PASSER, ET POURQUOI.
   ═══════════════════════════════════════════════════════════════ */
describe("la base dix, et le repli du decalage", () => {
  /* TROU — comme pour le plafond des guildes, la base dix ne se voit
     que sur une saisie hexadecimale. « 0x1F » vaut zero en base dix
     (parseInt s arrete au « x ») et trente et un sans elle. Le
     balayage l a montre en laissant survivre son retrait. */
  it("lit « 0x1F » comme zero, pas comme trente et un", () => {
    expect(prixSaisi("0x1F")).toBe(0);
    expect(parseInt("0x1F")).toBe(31);
  });

  it.each(["450", "08", "010", "  30", "-5"])(
    "donne la meme chose avec ou sans base dix pour « %s »",
    (saisi) => {
      expect(Object.is(parseInt(saisi, 10), parseInt(saisi))).toBe(true);
    },
  );

  /* DOMINE — dans decalageAjuste, « ?? 0 » et « || 0 » ne different
     que sur NaN : zero, null et undefined donnent zero des deux
     cotes. Or le champ de decalage lit `parseFloat(v) || 0`, donc un
     champ vide y devient ZERO et jamais NaN ; et la colonne est
     numerique en base, qui ne peut pas porter NaN. Le cas qui les
     separerait est donc inatteignable.

     LE CONTRASTE VAUT D ETRE DIT : dans le MEME fichier, le champ de
     DECALAGE a ce repli et le champ de PRIX ne l a pas. C est
     exactement pour cela que le prix, lui, peut valoir NaN. */
  it("ne peut pas recevoir NaN, faute de chemin qui en produise", () => {
    /* Ce que le champ de decalage fait d une saisie vide. */
    expect(parseFloat("") || 0).toBe(0);
    expect(parseFloat("abc") || 0).toBe(0);
    /* Ce que le champ de PRIX fait de la meme saisie. */
    expect(Number.isNaN(prixSaisi(""))).toBe(true);
  });

  it("donne la meme chose avec les deux operateurs sur tout ce qui l atteint", () => {
    for (const v of [0, 1, -3, 4.7, null, undefined]) {
      const parNullish = (v ?? 0) + 1;
      const parFalsy = (v || 0) + 1;
      expect(parNullish).toBe(parFalsy);
      expect(decalageAjuste(v, 1)).toBe(parNullish);
    }
  });
});
