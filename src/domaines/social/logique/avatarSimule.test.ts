import { describe, expect, it } from "vitest";
import { avatarSimule } from "./avatarSimule";

const PREFIXE = "data:image/svg+xml;charset=utf-8,";
const svgDe = (cle: string) => decodeURIComponent(avatarSimule(cle).slice(PREFIXE.length));

const hsl = (s: string) => {
  const m = /hsl\((\d+) (\d+)% (\d+)%\)/.exec(s);
  if (!m) throw new Error("pas un hsl : " + s);
  return { h: +m[1], s: +m[2], l: +m[3] };
};
const teintes = (svg: string) =>
  [...svg.matchAll(/stop-color="(hsl\([^"]+\))"/g)].map((m) => hsl(m[1]));
const cercles = (svg: string) =>
  [...svg.matchAll(/<circle cx="(\d+)" cy="(\d+)" r="(\d+)" fill="rgb\((\d+),(\d+),(\d+)\)" opacity="([\d.]+)"\/>/g)]
    .map((m) => ({ cx: +m[1], cy: +m[2], r: +m[3], gris: +m[4], vert: +m[5], bleu: +m[6], opacite: +m[7] }));

const CLEFS = Array.from({ length: 300 }, (_, i) => "membre-" + i);

/* ═══════════════════════════════════════════════════════════════
   LE CONTRAT TIENT EN DEUX MOTS : STABLE ET PERSONNEL.

   Stable, parce qu un avatar qui change entre deux rendus n est plus
   une identite. Personnel, parce que deux grimpeurs qui se
   ressembleraient ne serviraient a rien.
   ═══════════════════════════════════════════════════════════════ */
describe("le contrat", () => {
  it("rend exactement la meme image pour la meme clef", () => {
    for (const c of ["alice", "", "Zoé", "u-0000-1111"]) {
      expect(avatarSimule(c), c).toBe(avatarSimule(c));
    }
  });

  /* ═══ STABLE D UNE VERSION A L AUTRE, PAS SEULEMENT D UN APPEL AU
     SUIVANT ═══
     Un avatar est une identite : celui qui reconnait un grimpeur a sa
     figure ne doit pas le perdre parce qu on a touche au melange. Or
     TOUT ce qui precede la couleur decide de cette figure — la graine
     de depart, le nombre premier, chacun des trois decalages du
     tirage. Aucune propriete statistique ne les distingue : changer le
     premier de deux unites donne un hachage tout aussi bon, et un
     trombinoscope entierement neuf.

     Ces trois reperes sont donc des temoins, releves le 31/08/2026. Ils
     tombent si l une de ces constantes bouge — et c est exactement ce
     qu on veut savoir. */
  it("rend les memes figures qu au jour ou elles ont ete relevees", () => {
    const repere = (cle: string) => {
      const [a, b] = teintes(svgDe(cle));
      const f = cercles(svgDe(cle));
      return [`${a.h}/${a.s}/${a.l}`, `${b.h}/${b.s}/${b.l}`,
        ...f.map((x) => `${x.cx},${x.cy} r${x.r} g${x.gris} o${x.opacite}`)];
    };
    expect(repere("alice")).toEqual([
      "155/55/39", "189/55/19",
      "37,68 r57 g255 o0.29", "54,16 r39 g0 o0.33", "62,40 r46 g0 o0.32",
    ]);
    expect(repere("membre-0")).toEqual([
      "254/75/46", "281/75/26",
      "10,21 r41 g0 o0.24", "91,92 r47 g255 o0.24", "16,25 r37 g0 o0.34",
    ]);
    /* La clef vide part de la graine de Fowler-Noll-Vo elle-meme. */
    expect(repere("")).toEqual([
      "98/69/38", "136/69/18",
      "79,34 r38 g255 o0.36", "47,67 r39 g255 o0.33", "40,83 r43 g255 o0.24",
    ]);
  });

  it("rend trois cents images distinctes pour trois cents clefs", () => {
    expect(new Set(CLEFS.map(avatarSimule)).size).toBe(CLEFS.length);
  });

  /* ═══ CE QUE LE MELANGE APPORTE SUR UNE SOMME DE CODES ═══
     Le fichier affirme que « deux noms proches donnent deux figures
     franchement differentes, ce qui n est pas le cas d une simple somme
     de codes ». On le PROUVE en calculant les deux : une liste de
     « membre-0 », « membre-1 », « membre-2 » passee dans une somme de
     codes donne un degre d ecart moyen — un degrade, litteralement.
     Fowler-Noll-Vo en donne quatre-vingts.

     MESURE DU 31/08/2026 sur cinq cents clefs consecutives : 81,6
     degres de moyenne contre 1,9. Le seuil est pose loin des deux. */
  it("ecarte les clefs voisines la ou une somme de codes les colle", () => {
    const ecart = (a: number, b: number) => {
      const d = Math.abs(a - b) % 360;
      return d > 180 ? 360 - d : d;
    };
    const sommeDeCodes = (s: string) => {
      let h = 0;
      for (const c of s) h += c.charCodeAt(0);
      return h % 360;
    };

    const melange: number[] = [], naif: number[] = [];
    for (let i = 0; i < 500; i++) {
      const a = "membre-" + i, b = "membre-" + (i + 1);
      melange.push(ecart(teintes(svgDe(a))[0].h, teintes(svgDe(b))[0].h));
      naif.push(ecart(sommeDeCodes(a), sommeDeCodes(b)));
    }
    const moyenne = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
    expect(moyenne(naif)).toBeLessThan(10);
    expect(moyenne(melange)).toBeGreaterThan(60);
  });

  /* ═══ MAIS UNE PAIRE ISOLEE PEUT TOMBER PRES ═══
     La teinte n est qu un tirage sur trois cent soixante : trente-cinq
     paires voisines sur cinq cents tombent a moins de quinze degres, et
     certaines a zero. Ce n est pas un defaut du melange — c est ce que
     fait n importe quel hachage. Ce qui doit tenir, et qui tient, c est
     que les IMAGES different : la teinte n est qu une des huit valeurs
     tirees. */
  it("rend des images differentes meme quand les teintes se frolent", () => {
    for (const [x, y] of [["alice", "alicf"], ["a", "b"], ["Zoe", "Zoé"], ["membre-1", "membre-2"]]) {
      expect(avatarSimule(x), x + " / " + y).not.toBe(avatarSimule(y));
    }
  });

  /* ET LES TEINTES SE REPARTISSENT SUR TOUT LE CERCLE : douze secteurs
     de trente degres, tous habites. Un generateur qui se serait
     effondre sur une plage — ce qui arrive vite avec un decalage mal
     signe — laisserait des secteurs vides. */
  it("repartit les teintes sur tout le cercle", () => {
    const secteurs = new Array(12).fill(0);
    for (const c of CLEFS) secteurs[Math.floor(teintes(svgDe(c))[0].h / 30)]++;
    expect(Math.min(...secteurs)).toBeGreaterThan(5);
  });
});

/* ═══════════════════════════════════════════════════════════════
   RIEN NE SORT DU NAVIGATEUR.

   C est la raison d etre du fichier : pas de visage emprunte, pas de
   service tiers, pas de requete. Le seul « http » du document est
   l espace de noms SVG, qui n est pas une adresse a joindre.
   ═══════════════════════════════════════════════════════════════ */
describe("ce que l image contient", () => {
  it("ne cite aucune adresse a joindre", () => {
    for (const c of CLEFS.slice(0, 40)) {
      const svg = svgDe(c);
      const adresses = [...svg.matchAll(/https?:\/\/[^"' ]+/g)].map((m) => m[0]);
      expect(adresses, c).toEqual(["http://www.w3.org/2000/svg"]);
      expect(svg).not.toMatch(/<image|href=|url\((?!#g)/);
    }
  });

  it("s annonce en SVG encode, et se relit", () => {
    const uri = avatarSimule("alice");
    expect(uri.startsWith(PREFIXE)).toBe(true);
    const svg = decodeURIComponent(uri.slice(PREFIXE.length));
    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain('viewBox="0 0 100 100"');
  });

  /* ═══ UN NOM ACCENTUE PASSERAIT UN JOUR DEDANS ═══
     `btoa` leve sur tout caractere hors latin-1 : « Zoé » aurait suffi a
     casser l avatar. `encodeURIComponent` le porte, et le pourcentage
     qu il produit est exactement ce que l attribut `src` attend. */
  it("porte un nom accentue sans se casser", () => {
    for (const c of ["Zoé", "Ægir", "日本", "emoji 🧗"]) {
      const uri = avatarSimule(c);
      expect(() => decodeURIComponent(uri.slice(PREFIXE.length)), c).not.toThrow();
      expect(uri, c).not.toMatch(/[^\x20-\x7E]/);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   LES BORNES DES COULEURS, ET POURQUOI ELLES SONT CE QU ELLES SONT.
   ═══════════════════════════════════════════════════════════════ */
describe("le degrade du fond", () => {
  it("pose deux arrets, et rien de plus", () => {
    for (const c of CLEFS.slice(0, 50)) expect(teintes(svgDe(c)), c).toHaveLength(2);
  });

  /* ═══ DEUX TEINTES VOISINES, JAMAIS OPPOSEES ═══
     De vingt-quatre a soixante-neuf degres d ecart. Un degrade entre
     deux couleurs opposees vire au gris sale la ou elles se melangent ;
     un ecart trop faible ne se voit pas. */
  it("garde la seconde teinte a portee de la premiere", () => {
    for (const c of CLEFS) {
      const [a, b] = teintes(svgDe(c));
      const ecart = (b.h - a.h + 360) % 360;
      expect(ecart, c).toBeGreaterThanOrEqual(24);
      expect(ecart, c).toBeLessThanOrEqual(69);
    }
  });

  /* LA SATURATION ET LA CLARTE RESTENT DANS UNE PLAGE ETROITE : un
     avatar trop pale disparait sur le fond de la page, un avatar trop
     vif se dispute avec l interface. */
  it("tient la saturation et la clarte dans leur plage", () => {
    for (const c of CLEFS) {
      const [a, b] = teintes(svgDe(c));
      expect(a.h, c).toBeGreaterThanOrEqual(0);
      expect(a.h, c).toBeLessThanOrEqual(359);
      expect(a.s, c).toBeGreaterThanOrEqual(52);
      expect(a.s, c).toBeLessThanOrEqual(77);
      expect(a.l, c).toBeGreaterThanOrEqual(38);
      expect(a.l, c).toBeLessThanOrEqual(51);
      /* Le second arret partage la saturation et descend de vingt. */
      expect(b.s, c).toBe(a.s);
      expect(b.l, c).toBe(Math.max(16, a.l - 20));
    }
  });

  /* LE PLANCHER A SEIZE N EST JAMAIS ATTEINT : la clarte part de
     trente-huit, donc le second arret ne descend pas sous dix-huit. Ce
     n est pas du code mort — c est ce qui rend le plancher inutile
     TANT QUE la plage de clarte reste ou elle est. */
  it("ne descend jamais jusqu au plancher de seize", () => {
    const bas = CLEFS.map((c) => teintes(svgDe(c))[1].l);
    expect(Math.min(...bas)).toBe(18);
    expect(Math.max(...bas)).toBe(31);
  });
});

describe("les trois formes", () => {
  it("en pose exactement trois", () => {
    for (const c of CLEFS.slice(0, 50)) expect(cercles(svgDe(c)), c).toHaveLength(3);
  });

  /* ═══ DES RAYONS LARGES, ET COUPES PAR LE CADRE ═══
     L avatar s affiche a quarante pixels : une forme de rayon dix y
     disparait. Les centres balaient tout le carre — souvent hors des
     bords — pour que le cadre en coupe une partie et que la figure ne
     soit pas trois pastilles centrees. */
  it("garde des rayons larges et des centres sur tout le carre", () => {
    let cxMin = 999, cxMax = -1, rMin = 999, rMax = -1;
    for (const c of CLEFS) {
      for (const f of cercles(svgDe(c))) {
        expect(f.cx, c).toBeGreaterThanOrEqual(0);
        expect(f.cx, c).toBeLessThanOrEqual(100);
        expect(f.r, c).toBeGreaterThanOrEqual(26);
        expect(f.r, c).toBeLessThanOrEqual(64);
        cxMin = Math.min(cxMin, f.cx); cxMax = Math.max(cxMax, f.cx);
        rMin = Math.min(rMin, f.r); rMax = Math.max(rMax, f.r);
      }
    }
    /* Le balayage est reel : les centres vont d un bord a l autre et
       les rayons emploient toute leur plage. */
    expect(cxMin).toBeLessThan(3);
    expect(cxMax).toBeGreaterThan(97);
    expect(rMin).toBe(26);
    expect(rMax).toBe(64);
  });

  /* CHAQUE FORME EST BLANCHE OU NOIRE, jamais colorée : c est ce qui
     eclaircit ou assombrit le degrade sans le salir. Et l opacite reste
     basse — de quatorze a trente-six centiemes — pour que la figure
     reste un relief, pas un dessin. */
  it("n emploie que du blanc et du noir, en voile", () => {
    const gris = new Set<number>();
    let oMin = 9, oMax = -1;
    for (const c of CLEFS) {
      for (const f of cercles(svgDe(c))) {
        /* LES TROIS CANAUX SONT EGAUX : un voile colore teinterait le
           degrade au lieu de l eclaircir ou de l assombrir, et il
           suffirait d un canal fige pour que ca arrive sans qu aucune
           borne ne bouge. */
        expect([f.gris, f.vert, f.bleu], c).toEqual([f.gris, f.gris, f.gris]);
        gris.add(f.gris);
        oMin = Math.min(oMin, f.opacite); oMax = Math.max(oMax, f.opacite);
      }
    }
    expect([...gris].sort((a, b) => a - b)).toEqual([0, 255]);
    expect(oMin).toBeGreaterThanOrEqual(0.14);
    expect(oMax).toBeLessThanOrEqual(0.36);
  });

  /* LES DEUX TEINTES DE FORME SE PARTAGENT LE TIRAGE. Si le generateur
     penchait, tous les avatars seraient eclaircis ou tous assombris. */
  it("tire le blanc et le noir a parts comparables", () => {
    let blancs = 0, total = 0;
    for (const c of CLEFS) {
      for (const f of cercles(svgDe(c))) { total++; if (f.gris === 255) blancs++; }
    }
    expect(blancs / total).toBeGreaterThan(0.4);
    expect(blancs / total).toBeLessThan(0.6);
  });
});

/* ═══════════════════════════════════════════════════════════════
   LE GENERATEUR COUVRE TOUT SON INTERVALLE — CE QUI N ALLAIT PAS DE SOI.

   Le tirage porte `x ^= x >> 17` : un decalage SIGNE, comme celui qui,
   dans le champ de bruit du fond de focus, plafonnait les valeurs a la
   moitie de leur intervalle. Ici il ne casse rien, et la raison tient
   au `x ^= x << 5` qui le suit : il redistribue le bit de tete avant le
   `>>> 0` final.

   MESURE DU 31/08/2026, douze mille tirages : de 0,00005 a 0,99990, de
   moyenne 0,506, et les dix deciles habites. Ce test est ce qui
   distingue le hasard du bruit plafonne — on ne l aurait pas vu dans
   les couleurs seules.
   ═══════════════════════════════════════════════════════════════ */
describe("l etendue du tirage", () => {
  it("emploie toute la plage de chaque grandeur, pas une moitie", () => {
    const teinte: number[] = [], sat: number[] = [], lum: number[] = [];
    for (const c of CLEFS) {
      const [a] = teintes(svgDe(c));
      teinte.push(a.h); sat.push(a.s); lum.push(a.l);
    }
    /* Chaque plage est parcourue de bout en bout : une valeur bornee a
       sa moitie basse laisserait la borne haute inatteinte. */
    expect(Math.min(...teinte)).toBeLessThan(20);
    expect(Math.max(...teinte)).toBeGreaterThan(340);
    expect(Math.min(...sat)).toBe(52);
    expect(Math.max(...sat)).toBe(77);
    expect(Math.min(...lum)).toBe(38);
    expect(Math.max(...lum)).toBe(51);
  });
});

/* ═══════════════════════════════════════════════════════════════
   DEUX MUTATIONS QUE CES TESTS N ATTRAPENT PAS, ET POURQUOI.

   Balayage du 31/08/2026 : vingt-sept mutations, vingt-cinq attrapees.
   Les deux restantes portent sur des bits qui ne sortent jamais.

   1. `return h >>> 0` DEVENU `return h`. Le melange rendrait alors un
      entier signe. Ca ne change RIEN : le tirage commence par
      `x ^= x << 13; x >>>= 0`, et le decalage a gauche opere sur le
      meme motif de bits qu il lise l entier comme signe ou non. La
      suite d etats est identique au bit pres — les reperes du haut,
      qui epinglent trois figures entieres, ne bougent pas d un
      chiffre. Mutation equivalente.

   2. `let x = etat || 1` DEVENU `let x = etat`. Une graine nulle
      figerait le tirage pour toujours : zero decale reste zero, et
      tous les avatars deviendraient la meme figure. La garde est donc
      loin d etre decorative — elle est simplement INATTEINTE. MESURE :
      sur deux cent mille clefs, le melange n a jamais rendu zero, ce
      qui est attendu d un hachage sur trente-deux bits. Le test ne
      peut pas atteindre `suite`, qui n est pas exportee ; l exporter
      pour le seul plaisir de la toucher couterait plus que ca ne
      rapporte.
   ═══════════════════════════════════════════════════════════════ */
