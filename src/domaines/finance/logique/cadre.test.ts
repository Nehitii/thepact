/* CE QUE LE CADRAGE DECIDE SANS QUE PERSONNE NE LE RELISE.
 *
 * Trois decisions vivent ici, et aucune ne se voit a la lecture d une
 * fiche :
 *
 *   1. normaliserCadre est la SEULE porte entre une colonne jsonb —
 *      donc n importe quoi — et le rendu. Ce qu elle laisse passer,
 *      le navigateur l applique.
 *   2. styleDuCadre traduit quatre reglages en cinq proprietes CSS.
 *      Une erreur de signe y decale un logo ; une erreur de virgule y
 *      annule le decalage sans rien casser d autre.
 *   3. cadreAEnregistrer decide ce qui part en base. Un faux positif
 *      ecrit du bruit, un faux negatif perd le reglage.
 *
 * L EMPREINTE, PRISE AVANT D ECRIRE CE FICHIER (31 aout 2026, lecture
 * seule sur le compte reel) : quatorze cadres enregistres — douze sur
 * les charges, deux sur les revenus. Tous a la forme actuelle, aucun
 * a l ancienne (x/y). Aucun egal au reglage par defaut. Et surtout :
 *
 *   AUCUN NE PRODUIT DE DECALAGE PAR TRANSFORM.
 *
 * Les onze cadres en « remplir » passent par object-position, qui
 * ignore le transform ; les trois autres sont soit a zoom 100 — ou
 * l amplitude vaut zero — soit a dx = dy = 0. La branche que le
 * fichier passe vingt lignes a justifier rend donc « 0.00%, 0.00% »
 * sur la totalite des donnees existantes. Une faute y serait
 * invisible aujourd hui et apparaitrait au premier zoom glisse.
 * C est exactement ce qu un filet est cense tenir.
 */
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CADRE_PAR_DEFAUT, DECALAGE_MAX, FORMAT_PLAQUE, cadreAEnregistrer,
  estCadreParDefaut, normaliserCadre, styleDuCadre, type CadreImage,
} from "./cadre";

const cadre = (p: Partial<CadreImage> = {}): CadreImage => ({ ...CADRE_PAR_DEFAUT, ...p });
const style = (c: CadreImage, teinte = "#123456") =>
  styleDuCadre(c, teinte) as unknown as Record<string, string>;

/* Les quatorze cadres reellement enregistres, releves un a un. */
const REELS: { n: number; c: CadreImage }[] = [
  { n: 2, c: { dx: 0, dy: 0, fond: "clair", zoom: 125, ajustement: "remplir" } },
  { n: 2, c: { dx: 0, dy: 0, fond: "clair", zoom: 100, ajustement: "remplir" } },
  { n: 1, c: { dx: 4, dy: -41, fond: "clair", zoom: 105, ajustement: "remplir" } },
  { n: 1, c: { dx: 4, dy: -34, fond: "clair", zoom: 100, ajustement: "etirer" } },
  { n: 1, c: { dx: -13, dy: -6, fond: "clair", zoom: 240, ajustement: "remplir" } },
  { n: 1, c: { dx: 0, dy: 0, fond: "clair", zoom: 200, ajustement: "contenir" } },
  { n: 1, c: { dx: 1, dy: 1, fond: "clair", zoom: 115, ajustement: "remplir" } },
  { n: 1, c: { dx: 11, dy: 8, fond: "sombre", zoom: 100, ajustement: "etirer" } },
  { n: 1, c: { dx: 2, dy: -42, fond: "clair", zoom: 105, ajustement: "remplir" } },
  { n: 1, c: { dx: 0, dy: 0, fond: "clair", zoom: 120, ajustement: "remplir" } },
  { n: 1, c: { dx: 0, dy: 0, fond: "clair", zoom: 120, ajustement: "contenir" } },
  { n: 1, c: { dx: 0, dy: 0, fond: "clair", zoom: 100, ajustement: "etirer" } },
];

describe("normaliserCadre : la porte du jsonb", () => {
  it("rend le reglage par defaut a tout ce qui n est pas un objet", () => {
    for (const brut of [null, undefined, 0, 1, "", "remplir", true, NaN])
      expect(normaliserCadre(brut), String(brut)).toEqual(CADRE_PAR_DEFAUT);
  });

  it("rend une COPIE : le defaut partage ne peut pas etre corrompu", () => {
    const c = normaliserCadre(null);
    expect(c).not.toBe(CADRE_PAR_DEFAUT);
    c.zoom = 300;
    expect(CADRE_PAR_DEFAUT.zoom).toBe(100);
  });

  it("laisse intacts les quatorze cadres enregistres", () => {
    for (const { c } of REELS) expect(normaliserCadre({ ...c })).toEqual(c);
  });

  it("ne reconnait que les trois ajustements, et retombe sur contenir", () => {
    expect(normaliserCadre({ ajustement: "remplir" }).ajustement).toBe("remplir");
    expect(normaliserCadre({ ajustement: "etirer" }).ajustement).toBe("etirer");
    for (const a of ["contenir", "cover", "REMPLIR", 1, null, undefined, {}])
      expect(normaliserCadre({ ajustement: a }).ajustement, String(a)).toBe("contenir");
  });

  it("ne reconnait que les trois fonds, et retombe sur clair", () => {
    expect(normaliserCadre({ fond: "sombre" }).fond).toBe("sombre");
    expect(normaliserCadre({ fond: "teinte" }).fond).toBe("teinte");
    for (const f of ["clair", "#fff", "TEINTE", 0, null, undefined])
      expect(normaliserCadre({ fond: f }).fond, String(f)).toBe("clair");
  });

  it("borne le zoom entre cent et trois cents", () => {
    expect(normaliserCadre({ zoom: 4000 }).zoom).toBe(300);
    expect(normaliserCadre({ zoom: 300 }).zoom).toBe(300);
    expect(normaliserCadre({ zoom: 301 }).zoom).toBe(300);
    expect(normaliserCadre({ zoom: 99 }).zoom).toBe(100);
    expect(normaliserCadre({ zoom: -5 }).zoom).toBe(100);
    expect(normaliserCadre({ zoom: 0 }).zoom).toBe(100);
  });

  it("borne le decalage a plus ou moins cinquante, sur les deux axes", () => {
    expect(DECALAGE_MAX).toBe(50);
    expect(normaliserCadre({ dx: 999, dy: -999 })).toMatchObject({ dx: 50, dy: -50 });
    expect(normaliserCadre({ dx: -51, dy: 51 })).toMatchObject({ dx: -50, dy: 50 });
    expect(normaliserCadre({ dx: 50, dy: -50 })).toMatchObject({ dx: 50, dy: -50 });
  });

  it("arrondit AVANT de borner, et l arrondi n est pas symetrique", () => {
    /* Math.round penche vers le haut, y compris sur les negatifs :
       12,5 monte a 13, mais -12,5 monte a -12 et non a -13. Un
       glissement de souris tombe rarement sur un demi ; c est mesure,
       pas corrige — le comportement est celui de la plateforme.

       BALAYAGE : la mutation qui borne AVANT d arrondir survit, et
       elle est equivalente. Les quatre bornes posees ici (-50, 50,
       100, 300) sont entieres : arrondir une valeur deja bornee la
       laisse dans l intervalle, et borner une valeur deja arrondie
       aussi. Les deux ordres ne se separeraient que sur une borne
       fractionnaire, qu aucun appel ne passe. */
    expect(normaliserCadre({ dx: 12.5 }).dx).toBe(13);
    expect(normaliserCadre({ dx: -12.5 }).dx).toBe(-12);
    expect(normaliserCadre({ zoom: 150.7 }).zoom).toBe(151);
    /* Arrondi d abord : 50,4 redescend a 50 au lieu d etre coupe. */
    expect(normaliserCadre({ dx: 50.4 }).dx).toBe(50);
    expect(normaliserCadre({ zoom: 300.4 }).zoom).toBe(300);
  });

  it("rend la valeur par defaut a ce qui n est pas un nombre fini", () => {
    for (const v of [NaN, Infinity, -Infinity, "abc", {}, undefined]) {
      expect(normaliserCadre({ dx: v, dy: v }), String(v)).toMatchObject({ dx: 0, dy: 0 });
      expect(normaliserCadre({ zoom: v }).zoom, String(v)).toBe(100);
    }
  });

  it("laisse Number() convertir ce qui se convertit", () => {
    /* Un jsonb peut porter une chaine la ou le code attend un nombre.
       Number la lit ; null, "" et [] valent zero et retombent donc sur
       la borne basse, ce qui donne les memes valeurs que le defaut. */
    expect(normaliserCadre({ dx: "12", zoom: "180" })).toMatchObject({ dx: 12, zoom: 180 });
    for (const v of [null, "", [], false])
      expect(normaliserCadre({ zoom: v }).zoom, JSON.stringify(v)).toBe(100);
    expect(normaliserCadre({ dx: null }).dx).toBe(0);
  });
});

describe("normaliserCadre : les cadres de la premiere version", () => {
  /* Aucune ligne du compte ne porte plus la forme x/y : cette
     conversion n a AUCUN temoin en base. C est la seule branche du
     fichier dont rien ne prouverait la disparition. */
  it("convertit un point d ancrage en decalage de signe inverse", () => {
    /* « garde le bord gauche » (x = 0) revient a pousser vers la
       droite : dx = 50 - x. */
    expect(normaliserCadre({ x: 0, y: 50 })).toMatchObject({ dx: 50, dy: 0 });
    expect(normaliserCadre({ x: 100, y: 100 })).toMatchObject({ dx: -50, dy: -50 });
    expect(normaliserCadre({ x: 50, y: 50 })).toMatchObject({ dx: 0, dy: 0 });
    expect(normaliserCadre({ x: 25, y: 75 })).toMatchObject({ dx: 25, dy: -25 });
  });

  it("centre l axe absent au lieu de le decaler de cinquante", () => {
    expect(normaliserCadre({ x: 0 })).toMatchObject({ dx: 50, dy: 0 });
    expect(normaliserCadre({ y: 0 })).toMatchObject({ dx: 0, dy: 50 });
    expect(normaliserCadre({ x: 0, y: null })).toMatchObject({ dx: 50, dy: 0 });
  });

  it("garde le reste du cadre ancien : ajustement, zoom et fond", () => {
    expect(normaliserCadre({ x: 0, zoom: 150, fond: "sombre", ajustement: "remplir" }))
      .toEqual({ ajustement: "remplir", dx: 50, dy: 0, zoom: 150, fond: "sombre" });
  });

  it("ne se declenche que si dx et dy manquent tous les deux", () => {
    /* Un cadre actuel qui porterait aussi un x residuel ne doit pas
       etre relu comme un ancien. */
    expect(normaliserCadre({ dx: 0, dy: 0, x: 0, y: 0 })).toMatchObject({ dx: 0, dy: 0 });
    expect(normaliserCadre({ dx: 7, x: 0 })).toMatchObject({ dx: 7, dy: 0 });
    /* Et un x qui n est pas un nombre n est pas un ancrage. */
    expect(normaliserCadre({ x: "0" })).toMatchObject({ dx: 0, dy: 0 });
  });
});

describe("estCadreParDefaut et cadreAEnregistrer", () => {
  it("reconnait le reglage par defaut", () => {
    expect(estCadreParDefaut({ ...CADRE_PAR_DEFAUT })).toBe(true);
    expect(estCadreParDefaut(normaliserCadre(null))).toBe(true);
  });

  it("distingue le defaut sur CHACUN des cinq champs", () => {
    const ecarts: Partial<CadreImage>[] = [
      { ajustement: "remplir" }, { ajustement: "etirer" },
      { dx: 1 }, { dx: -1 }, { dy: 1 }, { dy: -1 },
      { zoom: 101 }, { zoom: 300 }, { fond: "sombre" }, { fond: "teinte" },
    ];
    for (const e of ecarts) expect(estCadreParDefaut(cadre(e)), JSON.stringify(e)).toBe(false);
  });

  it("n enregistre rien quand rien n a ete choisi", () => {
    expect(cadreAEnregistrer({ ...CADRE_PAR_DEFAUT })).toBeNull();
  });

  it("enregistre le cadre lui-meme des qu un champ bouge", () => {
    const c = cadre({ zoom: 125 });
    expect(cadreAEnregistrer(c)).toBe(c);
  });

  it("aucun des quatorze cadres enregistres n est du bruit", () => {
    /* Verifie sur le compte : zero ligne porte un cadre egal au
       defaut. La regle tient donc sur les donnees existantes. */
    for (const { c } of REELS) {
      expect(estCadreParDefaut(c), JSON.stringify(c)).toBe(false);
      expect(cadreAEnregistrer(c)).not.toBeNull();
    }
  });
});

describe("styleDuCadre : les cinq proprietes", () => {
  it("traduit les trois ajustements en object-fit", () => {
    expect(style(cadre({ ajustement: "remplir" }))["--cadre-ajuste"]).toBe("cover");
    expect(style(cadre({ ajustement: "etirer" }))["--cadre-ajuste"]).toBe("fill");
    expect(style(cadre({ ajustement: "contenir" }))["--cadre-ajuste"]).toBe("contain");
  });

  it("ne laisse respirer que le logo contenu", () => {
    expect(style(cadre({ ajustement: "contenir" }))["--cadre-marge"]).toBe("8px");
    expect(style(cadre({ ajustement: "remplir" }))["--cadre-marge"]).toBe("0px");
    expect(style(cadre({ ajustement: "etirer" }))["--cadre-marge"]).toBe("0px");
  });

  it("passe le zoom en facteur, sans unite", () => {
    expect(style(cadre({ zoom: 100 }))["--cadre-zoom"]).toBe("1");
    expect(style(cadre({ zoom: 105 }))["--cadre-zoom"]).toBe("1.05");
    expect(style(cadre({ zoom: 240 }))["--cadre-zoom"]).toBe("2.4");
    expect(style(cadre({ zoom: 300 }))["--cadre-zoom"]).toBe("3");
  });

  it("choisit le fond, et ne passe la teinte que sur demande", () => {
    expect(style(cadre({ fond: "clair" })).background).toBe("#ffffff");
    expect(style(cadre({ fond: "sombre" })).background).toBe("#0b1018");
    expect(style(cadre({ fond: "teinte" }), "#ff8800").background).toBe("#ff8800");
  });
});

describe("styleDuCadre : les deux mecaniques de decalage", () => {
  it("en remplissage, tout passe par object-position et rien par transform", () => {
    const s = style(cadre({ ajustement: "remplir", dx: 20, dy: -30, zoom: 250 }));
    expect(s["--cadre-pos"]).toBe("30% 80%");
    expect(s["--cadre-decale"]).toBe("0%, 0%");
  });

  it("en remplissage, le signe est inverse pour que le geste suive l image", () => {
    expect(style(cadre({ ajustement: "remplir", dx: 50, dy: 50 }))["--cadre-pos"]).toBe("0% 0%");
    expect(style(cadre({ ajustement: "remplir", dx: -50, dy: -50 }))["--cadre-pos"]).toBe("100% 100%");
  });

  it("en remplissage, la position reste dans [0,100] sur tout le domaine borne", () => {
    /* C EST LA PREUVE QUE LE REMPLISSAGE NE PEUT PAS DECOUVRIR DE VIDE.
       object-position ne sort jamais l image tant que ses pourcentages
       tiennent entre bord et bord ; et ils y tiennent parce que
       normaliserCadre borne le decalage a cinquante. Les deux faits
       sont lies : desserrer DECALAGE_MAX casserait le remplissage. */
    let hors = 0;
    for (let dx = -DECALAGE_MAX; dx <= DECALAGE_MAX; dx++)
      for (let dy = -DECALAGE_MAX; dy <= DECALAGE_MAX; dy++) {
        const m = /^(-?[\d.]+)% (-?[\d.]+)%$/.exec(
          style(cadre({ ajustement: "remplir", dx, dy }))["--cadre-pos"],
        );
        if (!m) { hors++; continue; }
        if (+m[1] < 0 || +m[1] > 100 || +m[2] < 0 || +m[2] > 100) hors++;
      }
    expect(hors).toBe(0);
  });

  it("hors remplissage, la position est centree et le transform travaille", () => {
    for (const a of ["contenir", "etirer"] as const) {
      const s = style(cadre({ ajustement: a, dx: 20, dy: -30, zoom: 200 }));
      expect(s["--cadre-pos"], a).toBe("50% 50%");
      expect(s["--cadre-decale"], a).toBe("20.00%, -30.00%");
    }
  });

  it("hors remplissage, l amplitude est proportionnelle a (zoom - 1)", () => {
    const decale = (zoom: number) =>
      style(cadre({ ajustement: "contenir", dx: 50, dy: 50, zoom }))["--cadre-decale"];
    expect(decale(100)).toBe("0.00%, 0.00%");   /* a zoom 1, rien ne bouge */
    expect(decale(150)).toBe("25.00%, 25.00%");
    expect(decale(200)).toBe("50.00%, 50.00%");
    expect(decale(300)).toBe("100.00%, 100.00%");
  });

  it("a zoom cent, aucun decalage ne bouge quoi que ce soit", () => {
    for (const dx of [-50, -13, 0, 4, 50])
      expect(style(cadre({ ajustement: "etirer", dx, dy: dx, zoom: 100 }))["--cadre-decale"])
        .toBe("0.00%, 0.00%");
  });

  it("porte DEUX valeurs separees par une virgule", () => {
    /* La feuille de style ecrit translate(var(--cadre-decale)) : la
       variable porte les deux arguments. Sans la virgule, la regle
       entiere devient invalide et le decalage disparait en silence —
       sans erreur, sans trace. */
    for (const { c } of REELS) {
      const d = style(c)["--cadre-decale"];
      expect(d.split(",").map((p) => p.trim()), JSON.stringify(c)).toHaveLength(2);
      for (const p of d.split(",")) expect(p.trim()).toMatch(/^-?\d+(\.\d+)?%$/);
    }
  });

  it("rend « 0.00%, 0.00% » sur la totalite des cadres enregistres", () => {
    /* L empreinte du 31 aout 2026, telle quelle. Le jour ou ce test
       tombe, c est qu un cadre a enfin ete zoome puis glisse — et
       alors la branche transform compte vraiment. */
    const bouge = REELS.filter(({ c }) => {
      const d = style(c)["--cadre-decale"];
      return d !== "0%, 0%" && d !== "0.00%, 0.00%";
    });
    expect(bouge).toEqual([]);
  });
});

describe("l oracle geometrique : ou tombe le bord de l image", () => {
  /* Un modele independant du code, ecrit d apres les regles CSS et non
     d apres le fichier : object-fit pose l image dans la boite de
     CONTENU (donc marge deduite), scale l agrandit, et translate la
     deplace d un pourcentage de la boite de BORDURE. On mesure le vide
     decouvert au bord gauche d une plaque de 320 px au format 16/7,
     pour un logo qui a exactement le format de sa boite — le cas le
     plus tendu, celui ou il y a le moins de vide a decouvrir. */
  const PLAQUE = 320;
  const videAGauche = (c: CadreImage) => {
    const s = style(c);
    const marge = Number.parseFloat(s["--cadre-marge"]);
    const zoom = Number(s["--cadre-zoom"]);
    const [dx] = s["--cadre-decale"].split(",").map((p) => Number.parseFloat(p));
    const largeurImage = zoom * (PLAQUE - 2 * marge);
    return PLAQUE / 2 - largeurImage / 2 + (dx / 100) * PLAQUE;
  };

  it("en etirement, le decalage maximal pose le bord PILE sur celui de la plaque", () => {
    for (const zoom of [150, 200, 250, 300])
      expect(videAGauche(cadre({ ajustement: "etirer", dx: DECALAGE_MAX, zoom })), String(zoom))
        .toBeCloseTo(0, 10);
  });

  it("en contenance, il s arrete a la marge — huit pixels multiplies par le zoom", () => {
    /* Mesure, pas corrige : en « contenir » le vide est le sujet, pas
       l accident. L amplitude reste juste — l image ne derive jamais
       PLUS LOIN que sa propre marge, quel que soit le zoom. */
    for (const zoom of [101, 150, 200, 300])
      expect(videAGauche(cadre({ ajustement: "contenir", dx: DECALAGE_MAX, zoom })), String(zoom))
        .toBeCloseTo(8 * (zoom / 100), 6);
  });

  it("en remplissage, le transform ne deplace jamais rien", () => {
    for (const zoom of [100, 200, 300])
      expect(videAGauche(cadre({ ajustement: "remplir", dx: DECALAGE_MAX, zoom })))
        .toBeCloseTo(PLAQUE / 2 - (zoom / 100) * PLAQUE / 2, 10);
  });
});

describe("FORMAT_PLAQUE : l apercu comme promesse", () => {
  const feuille = fs.readFileSync("src/domaines/finance/finance-cyber.css", "utf8");

  /* CE QUE LA CONSTANTE EST, ET CE QU ELLE N EST PAS.
     Le fichier annonce un format « defini une seule fois ». Il l est
     en intention, pas en fait : FORMAT_PLAQUE n est importe nulle
     part, et le rapport est ecrit deux fois dans la feuille de style —
     une fois pour la plaque d une fiche, une fois pour celle de
     l apercu. Rien dans le code ne les tient egaux.
     Ce test EST ce qui les tient egaux. Changer l un des deux sans
     l autre casse la promesse de l apercu ; changer les deux sans la
     constante fait mentir la documentation. */
  it("la feuille de style ne porte que deux formats de plaque", () => {
    const rapports = [...feuille.matchAll(/aspect-ratio:\s*(\d+)\s*\/\s*(\d+)/g)];
    expect(rapports).toHaveLength(2);
    for (const r of rapports) expect(Number(r[1]) / Number(r[2])).toBeCloseTo(FORMAT_PLAQUE, 12);
  });

  it("les deux plaques que le cadreur promet d accorder sont bien celles-la", () => {
    for (const regle of [".cy-fiche-portrait", ".cy-cadreur-plaque"])
      expect(feuille, regle).toMatch(
        new RegExp(regle.replace(".", "\\.") + "[^}]*aspect-ratio:\\s*16\\s*/\\s*7"),
      );
  });

  it("vaut seize septiemes, et non les 203 sur 92 de l ancien apercu", () => {
    expect(FORMAT_PLAQUE).toBeCloseTo(16 / 7, 12);
    expect(FORMAT_PLAQUE).not.toBeCloseTo(203 / 92, 2);
  });
});
