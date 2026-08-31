import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRarity, rarityConfig, type RarityKey } from "./shopRarity";

/* La feuille est lue sur le disque : vitest neutralise les imports CSS,
   `?raw` compris — il rend une chaine vide, et le test aurait mesure
   contre un fond imaginaire sans rien dire. */
const feuilleDeStyle = fs.readFileSync("src/index.css", "utf8");

const RARETES: RarityKey[] = ["common", "rare", "epic", "legendary"];

/* ── LA MESURE, TENUE DE LA NORME ──
   Comme pour l encre du theme clair : la formule WCAG 2.1 n a qu une
   ecriture, et c est elle qui juge — pas le module. */
const lineaire = (canal: number) => {
  const v = canal / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
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
const luminance = (r: number, g: number, b: number) =>
  0.2126 * lineaire(r) + 0.7152 * lineaire(g) + 0.0722 * lineaire(b);
const TRIPLET = /hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/;
const lireHsl = (s: string) => {
  const m = TRIPLET.exec(s);
  if (!m) throw new Error("pas un hsl : " + s);
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])] as [number, number, number];
};
const luminanceDe = (s: string) => luminance(...hslEnRvb(...lireHsl(s)));
const rapport = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const alpha = (s: string) => {
  const m = /\/\s*([\d.]+)\)/.exec(s);
  return m ? parseFloat(m[1]) : 1;
};

/* ═══ LES DEUX FONDS SONT LUS DANS LA FEUILLE, PAS RECOPIES ═══
   Un fond qu on recopie ici se desaccorde du jour ou quelqu un change
   `--background` — et le test continuerait de dire que tout va bien
   pour un fond qui n existe plus. */
function fondDeclare(bloc: "clair" | "sombre"): [number, number, number] {
  const debut = bloc === "clair"
    ? feuilleDeStyle.indexOf("Light Mode")
    : feuilleDeStyle.indexOf("Dark Mode");
  const m = /--background:\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/.exec(feuilleDeStyle.slice(debut));
  if (!m) throw new Error("fond introuvable dans index.css : " + bloc);
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}
const L_CLAIR = luminance(...hslEnRvb(...fondDeclare("clair")));
const L_SOMBRE = luminance(...hslEnRvb(...fondDeclare("sombre")));

beforeEach(() => { document.documentElement.classList.remove("dark"); });
afterEach(() => { document.documentElement.classList.remove("dark"); });

const sombre = (r: RarityKey) => {
  document.documentElement.classList.add("dark");
  const v = getRarity(r);
  document.documentElement.classList.remove("dark");
  return v;
};
const clair = (r: RarityKey) => getRarity(r);

describe("les deux fonds du theme", () => {
  /* Ce que la feuille declare aujourd hui : un bleu-noir presque pur
     d un cote, un blanc CASSE de l autre — pas un blanc. */
  it("lit les deux fonds dans index.css", () => {
    expect(fondDeclare("sombre")).toEqual([210, 100, 2]);
    expect(fondDeclare("clair")).toEqual([210, 50, 96]);
    expect(L_SOMBRE).toBeCloseTo(0.0013, 4);
    expect(L_CLAIR).toBeCloseTo(0.9073, 4);
  });
});

describe("quelle rarete on obtient", () => {
  it("rend la rarete demandee", () => {
    for (const r of RARETES) expect(clair(r)).toEqual(getRarity(r));
    expect(sombre("epic").accent).toBe(rarityConfig.epic.accent);
  });

  /* ═══ CONSTATE : LE MEME APPEL NE REND PAS LE MEME OBJET SELON LE
     THEME ═══
     En sombre, la fonction rend la table elle-meme — toujours la meme
     reference. En clair, elle fabrique `{ ...base, ...clair }`, donc un
     OBJET NEUF a chaque appel. Un appelant qui comparerait par
     identite — une dependance de `useMemo`, un `React.memo` — verrait
     la valeur changer a chaque rendu en theme clair, et jamais en
     sombre. Aucun des dix appelants ne le fait aujourd hui : tous
     lisent des champs. */
  it("rend la table elle-meme en sombre, une copie neuve en clair", () => {
    document.documentElement.classList.add("dark");
    expect(getRarity("epic")).toBe(getRarity("epic"));
    expect(getRarity("epic")).toBe(rarityConfig.epic);
    document.documentElement.classList.remove("dark");
    expect(getRarity("epic")).not.toBe(getRarity("epic"));
    expect(getRarity("epic")).toEqual(getRarity("epic"));
  });

  /* UNE RARETE INCONNUE DEVIENT COMMUNE. La colonne vient de la base
     et n est pas un enum : une valeur inattendue ne doit pas rendre la
     carte incolore. */
  it("retombe sur « commun » pour tout ce qu elle ne connait pas", () => {
    for (const brut of ["zzz", "", "COMMON", "mythic"]) {
      expect(getRarity(brut), brut).toEqual(getRarity("common"));
    }
  });

  /* LE THEME EST LU A L APPEL, pas passe en argument : basculer le
     theme rejoue le rendu, donc la couleur suit sans que les dix
     appelants aient a s en occuper. */
  it("suit le theme au moment ou on l interroge", () => {
    expect(clair("legendary").accent).not.toBe(sombre("legendary").accent);
    expect(sombre("legendary").accent).toBe(rarityConfig.legendary.accent);
  });

  /* SANS DOCUMENT, ON SUPPOSE LE SOMBRE. Il n y a pas de rendu serveur
     ici, mais la garde evite qu un appel hors navigateur — un test, un
     outil, un futur pre-rendu — leve sur `document.documentElement`.
     Le sombre est le bon defaut : c est le theme par defaut de
     l application. */
  it("suppose le theme sombre quand il n y a pas de document", () => {
    vi.stubGlobal("document", undefined);
    try {
      expect(getRarity("legendary")).toBe(rarityConfig.legendary);
      expect(getRarity("zzz")).toBe(rarityConfig.common);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  /* ═══ LA VERSION CLAIRE NE REMPLACE QUE QUATRE CHAMPS ═══
     Accent, lavis, lavis fort, lisere. Tout le reste — les classes
     Tailwind du fond, du texte et de la pastille — vient de la table
     sombre, PARCE QUE ces classes sont deja rattachees aux signaux du
     theme dans index.css. Les redefinir ici les ferait diverger. */
  it("ne remplace que ce qui est pose en style inline", () => {
    for (const r of RARETES) {
      const s = sombre(r), c = clair(r);
      for (const champ of ["accent", "glow", "glowStrong", "border"] as const) {
        expect(c[champ], r + "." + champ).not.toBe(s[champ]);
      }
      for (const champ of ["bg", "text", "badgeBg", "badgeText", "badgeBorder"] as const) {
        expect(c[champ], r + "." + champ).toBe(s[champ]);
      }
      expect(c.animated).toBe(s.animated);
    }
  });

  it("n anime que les deux raretes hautes", () => {
    expect(RARETES.map((r) => rarityConfig[r].animated)).toEqual([false, false, true, true]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUE CES COULEURS ECRIVENT.

   L accent n est pas une decoration : c est lui qui porte les prix,
   les etiquettes de rarete et le libelle du bouton d achat. Un accent
   qui ne contraste pas rend la boutique illisible, pas terne.
   ═══════════════════════════════════════════════════════════════ */
describe("la lisibilite des accents", () => {
  const surClair = (r: RarityKey) => rapport(luminanceDe(clair(r).accent), L_CLAIR);
  const surSombre = (r: RarityKey) => rapport(luminanceDe(sombre(r).accent), L_SOMBRE);

  /* LES QUATRE ENCRES CLAIRES PASSENT LARGEMENT. Mesure du 30/08/2026
     sur le fond reel : 6,81 / 8,11 / 7,89 / 6,82 — au-dela meme du
     seuil AAA. C est le travail que la table claire a ete ecrite pour
     faire. */
  it("porte le seuil AA en theme clair, sur le vrai fond", () => {
    for (const r of RARETES) expect(surClair(r), r).toBeGreaterThanOrEqual(4.5);
    expect(Math.min(...RARETES.map(surClair))).toBeGreaterThan(6.5);
  });

  /* ═══ CONSTATE, NON CORRIGE : L EPIQUE NE PASSE PAS EN THEME SOMBRE ═══
     Le thème sombre est le thème par defaut, et personne ne l avait
     mesure — le commentaire du fichier ne s inquiete que du papier.

     MESURE DU 30/08/2026, accents sur le fond `hsl(210 100% 2%)` :

       commun      5,66
       rare        5,59
       epique      4,34   <- sous les 4,5 du seuil AA
       legendaire  13,58

     L ecart est mince et l epique reste parfaitement visible ; ce qui
     manque, c est la marge pour qui lit mal. Corriger demande de
     choisir un autre violet, ce qui change ce que l ecran affiche. */
  it("laisse l epique sous le seuil en theme sombre, et lui seul", () => {
    expect(surSombre("epic")).toBeLessThan(4.5);
    expect(surSombre("epic")).toBeGreaterThan(4.2);
    for (const r of ["common", "rare", "legendary"] as const) {
      expect(surSombre(r), r).toBeGreaterThanOrEqual(4.5);
    }
  });

  /* ═══ POURQUOI LA TABLE CLAIRE EXISTE ═══
     L or du legendaire vaut 13,58 sur le fond sombre et 1,51 sur du
     papier — c est lui qui ecrit les prix. Aucun des quatre accents
     d ecran ne passe le seuil sur du papier ; c est la mesure qui
     justifie la seconde table, pas une preference. */
  it("montre que les accents d ecran sont illisibles sur le papier", () => {
    for (const r of RARETES) {
      expect(rapport(luminanceDe(sombre(r).accent), L_CLAIR), r).toBeLessThan(4.5);
    }
    expect(rapport(luminanceDe(rarityConfig.legendary.accent), 1)).toBeCloseTo(1.51, 2);
  });
});

describe("ce qui est conserve d une table a l autre", () => {
  /* LA TEINTE RESTE LA TEINTE : commun reste ardoise, rare reste bleu,
     epique reste violet, legendaire reste or. Mesure : trois degres
     d ecart au plus, et le rare ne bouge pas du tout. (Le commun bouge
     de trois degres et tombe, ce faisant, sur la teinte du rare — voir
     plus bas.) */
  it("garde la teinte de chaque rarete a trois degres pres", () => {
    for (const r of RARETES) {
      const [hs] = lireHsl(sombre(r).accent);
      const [hc] = lireHsl(clair(r).accent);
      const d = Math.abs(hs - hc) % 360;
      expect(Math.min(d, 360 - d), r).toBeLessThanOrEqual(3);
    }
    expect(lireHsl(clair("rare").accent)[0]).toBe(lireHsl(sombre("rare").accent)[0]);
  });

  it("descend la clarte de chaque accent", () => {
    for (const r of RARETES) {
      expect(lireHsl(clair(r).accent)[2], r).toBeLessThan(lireHsl(sombre(r).accent)[2]);
    }
  });

  /* ═══ LES LISERES MONTENT, LES LAVIS DESCENDENT ═══
     Le commentaire du fichier annonce « les alphas des lavis et des
     liseres qui montent ». Mesure : seuls les LISERES montent
     (0,30→0,42, 0,35→0,50, 0,40→0,52, 0,45→0,55). Les deux lavis
     DESCENDENT, tous les quatre.

     Ce n est pas une contradiction du dessin, c est le raisonnement du
     commentaire qui est trop court : l encre claire est bien plus
     SOMBRE que l accent d ecran, donc un voile de la meme opacite s y
     voit davantage. Il faut moins d alpha pour le meme effet. Le
     commentaire est corrige ; les valeurs, elles, ne bougent pas. */
  it("monte les liseres et descend les lavis", () => {
    for (const r of RARETES) {
      const s = sombre(r), c = clair(r);
      expect(alpha(c.border), r + " lisere").toBeGreaterThan(alpha(s.border));
      expect(alpha(c.glow), r + " lavis").toBeLessThan(alpha(s.glow));
      expect(alpha(c.glowStrong), r + " lavis fort").toBeLessThan(alpha(s.glowStrong));
    }
  });

  it("garde le lavis fort plus dense que le lavis, dans les deux themes", () => {
    for (const r of RARETES) {
      for (const table of [sombre(r), clair(r)]) {
        expect(alpha(table.glowStrong)).toBeGreaterThan(alpha(table.glow));
      }
    }
  });

  /* ═══ LA TABLE CLAIRE N A QUE TROIS TEINTES, PAS QUATRE ═══
     En sombre, les quatre raretes ont quatre teintes : 215, 212, 270,
     45. En clair, le commun descend a 212 et rejoint le rare — les
     deux se distinguent alors par la SATURATION seule : 12 % pour
     l ardoise contre 100 % pour le bleu. C est un ecart tres lisible,
     mais ce n est plus une difference de teinte, et la regle « la
     teinte est conservee au degre pres » se lit autrement pour ces
     deux-la. */
  it("donne quatre teintes en sombre et trois en clair", () => {
    expect(new Set(RARETES.map((r) => lireHsl(sombre(r).accent)[0])).size).toBe(4);
    expect(new Set(RARETES.map((r) => lireHsl(clair(r).accent)[0])).size).toBe(3);
    expect(lireHsl(clair("common").accent)[0]).toBe(lireHsl(clair("rare").accent)[0]);
    /* Ce qui les separe alors : l intensite, et de loin. */
    expect(lireHsl(clair("rare").accent)[1] - lireHsl(clair("common").accent)[1])
      .toBeGreaterThan(80);
  });

  /* LES QUATRE RESTENT DISTINCTES DANS LES DEUX THEMES : c est ce que
     la couleur doit dire en premier, teinte ou pas. */
  it("ne rend jamais deux raretes de la meme couleur", () => {
    for (const table of [sombre, clair]) {
      const accents = RARETES.map((r) => table(r).accent);
      expect(new Set(accents).size).toBe(4);
    }
  });
});
