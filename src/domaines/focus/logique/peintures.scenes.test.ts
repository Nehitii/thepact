import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  initAurores, initMaillage, initMaree, initMycelium,
  peindreAurores, peindreMaillage, peindreMaree, peindreMycelium,
  segmentBase, semer, SIGNES,
} from "./peintures";
import type { Etat } from "@/domaines/focus/types";

/* LES QUATRE SCENES — ce qu elles installent, et ce qu elles posent
   image apres image. Les outils qu elles emploient (le champ de bruit,
   les couleurs, la conversion HSL) sont eprouves dans `peintures.test.ts`. */

interface Toile { nombres: number[]; chaines: string[]; textes: string[] }

function toile() {
  const t: Toile = { nombres: [], chaines: [], textes: [] };
  const n = (...v: number[]) => { for (const x of v) t.nombres.push(x); };
  const s = (v: unknown) => { if (typeof v === "string") t.chaines.push(v); };
  let couleur: unknown = "";
  const ctx = {
    beginPath() {}, stroke() {}, fill() {},
    fillRect: n, moveTo: n, lineTo: n, arc: n,
    fillText(txt: string, x: number, y: number) { t.textes.push(txt); n(x, y); },
    createLinearGradient(...v: number[]) { n(...v); return { addColorStop(o: number, c: string) { n(o); s(c); } }; },
    get fillStyle(): unknown { return couleur; },
    set fillStyle(v: unknown) { couleur = v; s(v); },
    get strokeStyle(): unknown { return couleur; },
    set strokeStyle(v: unknown) { couleur = v; s(v); },
    set lineWidth(v: number) { n(v); },
    set font(v: string) { s(v); },
    set lineCap(v: string) { s(v); },
    set textAlign(v: string) { s(v); },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, t };
}

function scene(p: Partial<Etat> = {}) {
  const { ctx, t } = toile();
  const e: Etat = { w: 800, h: 600, dpr: 1, ctx, teinte: [92, 182, 255], or: [252, 238, 10],
    temps: 0, dissipe: 0, impulsion: 0, ...p };
  return { e, t };
}

/** Un tirage reproductible, pour que « il choisit le plus loin » veuille dire quelque chose. */
function hasard(graine: number) {
  let s = graine >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

beforeEach(() => { document.documentElement.classList.add("dark"); });
afterEach(() => { document.documentElement.classList.remove("dark"); vi.restoreAllMocks(); });

describe("semer une colonie", () => {
  it("pose trois hyphes au meme point, et un germe", () => {
    const { e } = scene({ pointes: [], germes: [] });
    semer(e, 100, 200);
    expect(e.pointes).toHaveLength(3);
    expect(e.germes).toEqual([{ x: 100, y: 200 }]);
    for (const p of e.pointes!) {
      expect([p.x, p.y]).toEqual([100, 200]);
      expect([p.gen, p.v, p.vie]).toEqual([0, 1, 0]);
      expect(p.seg).toBeCloseTo(96);
      /* Six generations de segments qui retrecissent : la colonie
         atteint environ 3,4 fois son premier segment, puis s arrete. */
      expect(p.reste).toBeCloseTo(96 * 3.4);
    }
  });

  /* L EVENTAIL COUVRE LE TOUR COMPLET : trois hyphes a cent vingt
     degres, plus un tremblement de plus ou moins trois dixiemes de
     radian. Sans l ecart de base, les trois partiraient dans la meme
     direction et la colonie serait un trait. */
  it("ouvre les trois hyphes en eventail", () => {
    const { e } = scene({ pointes: [], germes: [] });
    semer(e, 0, 0);
    const [a, b, c] = e.pointes!.map((p) => p.a);
    expect(Math.abs((b - a) - 6.283 / 3)).toBeLessThanOrEqual(0.6);
    expect(Math.abs((c - b) - 6.283 / 3)).toBeLessThanOrEqual(0.6);
  });

  it("ouvre deux colonies au demarrage, soit six hyphes", () => {
    const { e } = scene();
    initMycelium(e);
    expect(e.germes).toHaveLength(2);
    expect(e.pointes).toHaveLength(6);
    expect(e.dissipe).toBe(0);
  });
});

describe("les colonnes de la maree", () => {
  it("en pose au moins vingt-quatre, meme sur un cadre etroit", () => {
    const { e } = scene({ w: 300 });
    initMaree(e);
    expect(e.cols).toHaveLength(24);
  });

  it("en pose une par vingt-six pixels sur un cadre large", () => {
    const { e } = scene({ w: 1560 });
    initMaree(e);
    expect(e.cols).toHaveLength(60);
  });

  /* AUCUNE COLONNE NE TOMBE SUR UN BORD : chacune est au milieu de sa
     tranche. Poser la premiere a zero collerait un fil au cadre. */
  it("centre chaque colonne dans sa tranche", () => {
    const { e } = scene({ w: 800 });
    initMaree(e);
    const pas = e.w / e.cols!.length;
    e.cols!.forEach((c, i) => expect(c.x).toBeCloseTo((i + 0.5) * pas));
    expect(e.cols![0].x).toBeGreaterThan(0);
    expect(e.cols!.at(-1)!.x).toBeLessThan(e.w);
  });

  /* TROIS PLANS DE PROFONDEUR, ET LE PLUS PROCHE VA LE PLUS VITE : la
     vitesse est ce qui fait lire la profondeur, la taille suit. */
  it("repartit les colonnes sur trois plans, du plus lent au plus rapide", () => {
    const { e } = scene({ w: 800 });
    initMaree(e);
    expect(new Set(e.cols!.map((c) => c.plan))).toEqual(new Set([0, 1, 2]));
    for (const c of e.cols!) {
      expect(c.v).toBeGreaterThanOrEqual(0.35 + c.plan * 0.28);
      expect(c.v).toBeLessThan(0.35 + c.plan * 0.28 + 0.2);
      expect(c.lg).toBeGreaterThanOrEqual(5);
      expect(c.lg).toBeLessThanOrEqual(11);
    }
  });
});

/* LES DEUX DUREES DE VIE DOIVENT SE TENIR. La premiere generation vit
   0 a 260 images ; le recyclage en redonne 160 a 380. La premiere
   s eteint donc de facon ETALEE et PLUS TOT — si les deux plages
   etaient les memes, les six cent vingt particules mourraient dans la
   meme poignee d images et le champ clignoterait. Ces deux nombres
   vivaient jusqu ici dans deux fichiers differents. */
describe("le champ des aurores", () => {
  it("pose six cent vingt particules dans le cadre, de vies etalees", () => {
    const { e } = scene();
    initAurores(e);
    expect(e.parts).toHaveLength(620);
    for (const p of e.parts!) {
      expect(p.x >= 0 && p.x <= e.w).toBe(true);
      expect(p.y >= 0 && p.y <= e.h).toBe(true);
      expect(p.vie >= 0 && p.vie < 260).toBe(true);
    }
    const vies = e.parts!.map((p) => p.vie);
    expect(Math.min(...vies)).toBeLessThan(30);
    expect(Math.max(...vies)).toBeGreaterThan(230);
  });

  /* LE RECYCLAGE REPLACE LA PARTICULE DANS LE CADRE. Sans lui, une
     particule sortie par un bord ne reviendrait jamais et le champ se
     viderait image apres image. */
  it("garde ses six cent vingt particules dans le cadre, quatre cents images plus tard", () => {
    const { e } = scene();
    initAurores(e);
    for (let i = 0; i < 400; i++) peindreAurores(e, 16.7, 1, 0.5);
    expect(e.parts).toHaveLength(620);
    for (const p of e.parts!) {
      expect(p.x >= 0 && p.x <= e.w, `x=${p.x}`).toBe(true);
      expect(p.y >= 0 && p.y <= e.h, `y=${p.y}`).toBe(true);
      expect(p.vie).toBeLessThanOrEqual(380);
    }
    /* Toutes les vies initiales — 260 images au plus — sont epuisees
       depuis longtemps : celles qu on trouve viennent du recyclage,
       donc de la plage HAUTE. Mesure : 1,4 a 364,6. Si les deux plages
       etaient identiques, ce maximum tomberait sous 260. */
    expect(Math.max(...e.parts!.map((p) => p.vie))).toBeGreaterThan(300);
  });
});

describe("le maillage", () => {
  /* L ONDE DE CHOC EST L EVEIL LUI-MEME. Tant qu on s eveille, elle
     suit l eveil ; une fois eveille, elle s eteint. Le maillage n a
     donc pas de « secousse » separee a declencher : la mise en route
     EST la secousse. */
  it("fait de l eveil une onde de choc qui s eteint une fois eveille", () => {
    const { e } = scene();
    initMaillage(e);
    expect([e.temps, e.impulsion]).toEqual([0, 0]);
    peindreMaillage(e, 16.7, 0.6, 0.5);
    expect(e.impulsion).toBe(0.6);
    /* Quinze images a cinquante millisecondes suffisent a l eteindre ;
       on en passe quatre cents pour qu elle n ait aucune excuse. */
    for (let i = 0; i < 400; i++) peindreMaillage(e, 50, 1, 0.5);
    expect(e.impulsion).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   LE MYCELIUM EST BORNE PAR LE HAUT ET RELANCE PAR LE BAS.

   Cent dix pointes au plus — au-dela on cesse de diviser — et sous
   huit, un germe neuf s installe. Le fond ne peut donc ni exploser ni
   s eteindre.

   CONSTATE : sur un cadre de 800 x 600 et mille cinq cents images, la
   colonie oscille entre 3 et 63 pointes. LE PLAFOND DE 110 N EST
   JAMAIS ATTEINT — ce qui borne, en pratique, c est la mort des
   pointes qui sortent du cadre ou epuisent leur reserve. Le plafond
   est un garde-fou, pas un regulateur.
   ═══════════════════════════════════════════════════════════════ */
describe("le mycelium", () => {
  it("garde sa colonie vivante et bornee sur mille cinq cents images", () => {
    vi.spyOn(Math, "random").mockImplementation(hasard(7));
    const { e } = scene();
    initMycelium(e);
    let mini = Infinity, maxi = 0, germesMax = 0;
    for (let i = 0; i < 1500; i++) {
      peindreMycelium(e, 16.7, 1, 0.5);
      mini = Math.min(mini, e.pointes!.length);
      maxi = Math.max(maxi, e.pointes!.length);
      germesMax = Math.max(germesMax, e.germes!.length);
    }
    expect(mini).toBeGreaterThan(0);
    /* Elle POUSSE : sans ce plancher, un plafond descendu par megarde
       — ou une division qui ne se declenche plus — laisserait une
       colonie de trois brins, et le test du haut passerait quand meme.
       Mesure sur trois tirages : 63, 63, 66 pointes au plus. */
    expect(maxi).toBeGreaterThan(40);
    expect(maxi).toBeLessThanOrEqual(112);
    /* Les germes sont ramenes a huit des qu ils depassent quatorze :
       sans ce menage, la recherche d une place libre couterait de plus
       en plus cher a chaque colonie. */
    expect(germesMax).toBeLessThanOrEqual(15);
  });

  /* LE TRACE S ACCUMULE : on ne repeint jamais ce qui existe deja.
     C est ce qui rend ce fond huit fois moins cher que les autres, et
     le seul dont l ecran garde une memoire de la seance. Un voile ne
     passe qu une fois toutes les neuf cents millisecondes. */
  /* ═══ CINQ GENERATIONS, PAS UNE DE PLUS ═══
     L epaisseur vient de la GENERATION : `0.62^gen`, plafonnee par le
     bas a 0,4 pixel. A la sixieme, le trait ne s affine plus — diviser
     encore n ajouterait que des fils identiques, et la hierarchie qu on
     lit comme « vivant » se perdrait dans le bruit.

     On pose huit pointes a bout de segment pour qu elles soient toutes
     candidates a la division, et assez nombreuses pour que la relance
     d une colonie ne vienne pas brouiller le compte. */
  it("cesse de diviser a la cinquieme generation, et pas a la quatrieme", () => {
    const aBoutDeSegment = (gen: number) => Array.from({ length: 8 }, (_, i) =>
      ({ x: 300 + i * 10, y: 300, a: i, v: 1, vie: 0, gen, reste: 500, seg: -1 }));
    const unTour = (gen: number) => {
      const { e } = scene({ pointes: aBoutDeSegment(gen), germes: [{ x: 0, y: 0 }] });
      peindreMycelium(e, 16.7, 1, 0.5);
      return e.pointes!;
    };
    expect(unTour(5)).toHaveLength(8);
    expect(unTour(4).length).toBeGreaterThan(8);
    expect(unTour(4).every((p) => p.gen <= 5)).toBe(true);
  });

  it("ne dissipe qu une fois toutes les neuf cents millisecondes", () => {
    const { e, t } = scene({ pointes: [], germes: [] });
    for (let i = 0; i < 53; i++) peindreMycelium(e, 16.7, 0, 0);
    expect(e.dissipe).toBeCloseTo(53 * 16.7);
    expect(t.chaines).toEqual([]);

    peindreMycelium(e, 16.7, 0, 0);
    expect(e.dissipe).toBe(0);
    expect(t.chaines).toEqual(["rgba(4,6,10,0.055)"]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   RIEN DE NaN NE DOIT ATTEINDRE LE CANEVAS.

   Un `NaN` dans une coordonnee, une epaisseur ou une couleur ne leve
   RIEN : le navigateur ignore le trace, en silence. Le fond se troue
   et aucun journal ne le dit. C est le seul mode de panne que ces
   quatre fonctions peuvent avoir, et donc celui qu on epingle — plutot
   que les constantes de dessin, qui sont des choix et non des faits.
   ═══════════════════════════════════════════════════════════════ */
const SCENES = [
  { nom: "mycelium", init: initMycelium, peindre: peindreMycelium },
  { nom: "aurores", init: initAurores, peindre: peindreAurores },
  { nom: "maillage", init: initMaillage, peindre: peindreMaillage },
  { nom: "maree", init: initMaree, peindre: peindreMaree },
];

describe("ce que les quatre peintres posent sur la toile", () => {
  const propre = (t: Toile) => {
    expect(t.nombres.filter((v) => !Number.isFinite(v))).toEqual([]);
    expect(t.chaines.filter((c) => c.includes("NaN") || c.includes("undefined"))).toEqual([]);
  };

  for (const s of SCENES) {
    /* Deux cent vingt images : c est exactement ce que le composant
       peint d un coup avant de montrer la scene. */
    it(`${s.nom} ne pose rien d illisible sur les deux cent vingt images d amorcage`, () => {
      const { e, t } = scene();
      s.init(e);
      for (let i = 0; i < 220; i++) s.peindre(e, 16.7, 1, i / 220);
      expect(t.nombres.length).toBeGreaterThan(200);
      propre(t);
    });

    /* LES BORNES QUE L APPELANT GARANTIT : le cadre ne descend jamais
       sous un pixel, `dt` est plafonne a cinquante millisecondes,
       `eveil` monte de zero a un, `prog` va de zero a un. On les prend
       aux bords, la ou une division se ferait par rien. */
    it(`${s.nom} tient aussi aux bornes de ses arguments`, () => {
      const { e, t } = scene({ w: 1, h: 1 });
      s.init(e);
      for (const dt of [0, 0.001, 50]) {
        for (const eveil of [0, 0.019, 0.02, 1]) {
          for (const prog of [0, 1]) s.peindre(e, dt, eveil, prog);
        }
      }
      propre(t);
    });

    /* LE SEUIL D EVEIL EST LE MEME POUR LES QUATRE : sous deux pour
       cent, plus rien de vivant n est peint — mais le sol, lui, est
       deja pose. C est ce qui rend l extinction progressive au lieu
       d etre un interrupteur. */
    it(`${s.nom} ne peint rien de vivant sous deux pour cent d eveil`, () => {
      const { e, t } = scene();
      s.init(e);
      t.nombres.length = 0;
      s.peindre(e, 16.7, 0.019, 1);
      /* AU PLUS UN `fillRect` — le sol, et rien d autre. Se contenter
         de « moins qu eveille » laisserait passer un peintre qui
         dessine dejà : les aurores, par exemple, ont un rayon
         proportionnel a l eveil, donc a deux pour cent elles peindraient
         quand meme les quelques particules du centre. */
      expect(t.nombres.length, s.nom).toBeLessThanOrEqual(4);
      t.nombres.length = 0;
      s.peindre(e, 16.7, 1, 1);
      /* Eveille, il pose STRICTEMENT plus que le sol. C est peu — une
         scene qui vient de s installer n a pas encore grand-chose a
         montrer — mais c est la difference que le seuil produit. */
      expect(t.nombres.length, s.nom).toBeGreaterThan(4);
    });
  }

  /* ═══ LE SIGNE TIRE NE PEUT PAS SORTIR DE LA TABLE ═══
     L index est un modulo pris DEUX FOIS : `((n % L) + L) % L`. Le
     premier peut rendre un negatif — `e.temps` est un compteur que
     rien n empeche de l etre — et `SIGNES[-3]` vaut `undefined`, qui
     se peindrait comme le mot « undefined ». */
  /* ═══ DEUX PLAGES DE DEPART, COMME POUR LES AURORES ═══
     A l installation, une colonne part de `h` a `2h` — six cents
     pixels de dispersion, pour que la pluie ne tombe pas d un bloc. Au
     recyclage, elle repart de `h` a `h + 160` seulement : la pluie est
     lancee, il ne s agit plus que de l entretenir. Deux plages, deux
     roles, et rien ne le disait. */
  it("garde ses colonnes dans leur bande, six cents images plus tard", () => {
    const { e } = scene();
    initMaree(e);
    for (const c of e.cols!) {
      expect(c.y).toBeGreaterThanOrEqual(e.h);
      expect(c.y).toBeLessThanOrEqual(2 * e.h);
    }
    /* ET LA DISPERSION DU DEPART EST BIEN CELLE D UN CADRE ENTIER. Se
       contenter de la borne haute laisserait passer un depart resserre
       sur les cent soixante pixels du recyclage — les colonnes
       entreraient alors toutes ensemble, en rideau. */
    const ys = e.cols!.map((c) => c.y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(e.h / 2);
    /* Huit cents images a pleine vitesse : de quoi vider le cadre deux
       fois. Tirage fixe pour que « il en reste » ne soit pas un coup de
       chance. */
    vi.spyOn(Math, "random").mockImplementation(hasard(11));
    for (let i = 0; i < 800; i++) peindreMaree(e, 50, 1, 1);
    for (const c of e.cols!) {
      /* Sous ce seuil, la colonne est entierement sortie par le haut et
         doit avoir ete relancee. */
      expect(c.y, `y=${c.y}`).toBeGreaterThanOrEqual(-c.lg * 20);
      expect(c.y).toBeLessThanOrEqual(2 * e.h);
    }
    /* ET IL EN EST VRAIMENT REVENU. Une colonne ne remonte jamais toute
       seule : en trouver une SOUS le bas du cadre apres huit cents
       images de descente, c est la preuve que la relance a joue. Sans
       elle, elles seraient toutes sorties par le haut. */
    expect(Math.max(...e.cols!.map((c) => c.y))).toBeGreaterThan(e.h);
  });

  it("la maree ne peint que des signes de sa table, meme avec un temps negatif", () => {
    /* Tirage fixe : le nombre de signes peints depend de la hauteur ou
       les colonnes sont nees, et cette assertion doit dire « il en a
       vraiment peint », pas jouer aux des. */
    vi.spyOn(Math, "random").mockImplementation(hasard(5));
    const { e, t } = scene();
    initMaree(e);
    e.temps = -8_000_000;
    for (let i = 0; i < 200; i++) peindreMaree(e, 16.7, 1, 0.5);
    expect(t.textes.length).toBeGreaterThan(1000);
    expect(SIGNES).toHaveLength(37);
    expect(t.textes.filter((c) => c.length !== 1 || !SIGNES.includes(c))).toEqual([]);
  });
});

