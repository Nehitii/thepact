/* LE DEDANS DU NEXUS : LA MATIERE ET LES ECLAIRS.
 *
 * LA MATIERE EST UN VRAI CHAMP DE METABOULES, calcule hors ecran puis
 * etire dans la coquille. Une bande de seuil ETROITE fait la peau des
 * masses, un lisere gaussien centre sur l isovaleur fait leur tension de
 * surface. Etale, le champ ne rend qu un flou.
 *
 * UN ECLAIR EST UN EVENEMENT, PAS UN OBJET. C etait un arbre tire une
 * fois pour toutes, qu une onde de seve parcourait : un squelette
 * visible n est pas un eclair, c est une nervure. Un eclair nait, dure
 * un dixieme de seconde, et disparait entierement — c est le rien entre
 * deux qui fait l eclair. Et sa forme ne se promene pas, elle se
 * SUBDIVISE : on coupe le segment en deux, on pousse le milieu de cote,
 * et on recommence avec un ecart plus petit. La meme statistique a
 * toutes les echelles — c est ca qu on reconnait.
 */
import { TAU, doux, lerp, type Couleur } from "@/domaines/appel/logique/coeur";
import { CYAN_DU_DEPART, MAGENTA_DE_LA_FIN } from "@/domaines/appel/logique/fusion";

/* Les cinq masses. La premiere est au centre et ne bouge pas : sans
   elle, le noyau se viderait par moments. */
const MASSES = [
  { d: 0.0, q: 0.4, w: 0.0, v: 0.0, ph: 0.0 },
  { d: 0.28, q: 0.26, w: 0.62, v: 0.51, ph: 0.9 },
  { d: 0.36, q: 0.22, w: -0.47, v: 0.73, ph: 2.4 },
  { d: 0.24, q: 0.24, w: 0.81, v: -0.39, ph: 4.1 },
  { d: 0.4, q: 0.18, w: -0.71, v: -0.58, ph: 5.6 },
];
const COTE_DU_CHAMP = 112;

interface Point { x: number; y: number }

export interface Eclair {
  branches: Point[][];
  vie: number;
  duree: number;
  epaisseur: number;
  graine: number;
  /** L angle ou il frappe la coquille. */
  chute: number;
  eclat: number;
}

const MAX_ECLAIRS = 7;
const NIVEAUX_DE_SUBDIVISION = 5;
/* LA CADENCE SE COMPTE EN DECHARGES PAR SECONDE. Interpoler le delai
   donnait un repos deja nerveux et une fin a peine plus dense : c est la
   FREQUENCE qui doit croitre, et de facon quadratique — un quart de
   decharge par seconde au repos, dix-huit a la fin. Tiree au sort a
   chaque fois : un intervalle fixe se lit comme une horloge. */
const cadenceDesEclairs = (p: number) => 1000 / lerp(0.26, 18, p * p);
const ECART_DU_HASARD = [0.55, 1.5];
/* L ANCRAGE : sous ce rayon, le zigzag se tait. Le canal sort droit du
   point, puis se dechaine — sans quoi il quittait le noyau par un coude,
   et l oeil lisait un depart flottant plutot qu une racine. */
const ANCRAGE_DES_ECLAIRS = 0.26;

function subdiviser(a: Point, b: Point, ecart: number): Point[] {
  let pts = [a, b];
  let e = ecart;
  for (let n = 0; n < NIVEAUX_DE_SUBDIVISION; n++) {
    const suivant = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i], p1 = pts[i + 1];
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      const longueur = Math.hypot(dx, dy) || 1e-6;
      const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
      const pousse = (Math.random() - 0.5) * e * longueur * doux(0, ANCRAGE_DES_ECLAIRS, Math.hypot(mx, my));
      suivant.push({ x: mx - (dy / longueur) * pousse, y: my + (dx / longueur) * pousse });
      suivant.push(p1);
    }
    pts = suivant;
    /* L ecart decroit moins vite que la longueur : c est ce rapport qui
       donne la rugosite, pas le nombre de niveaux. */
    e *= 0.62;
  }
  return pts;
}

/* Les coordonnees sont normalisees au rayon du coeur : l eclair suit le
   souffle, la contraction et l effondrement sans rien savoir d eux. TOUS
   PARTENT D UN NOYAU — le centre, ou l un des deux a la scission : le
   corps ne se divise pas en surface pour rester indivis en dedans. */
function allumerUnEclair(ecart: number): Eclair {
  const arrivee = Math.random() * TAU;
  const r1 = 0.86 + Math.random() * 0.12;
  const cote = ecart > 0.01 ? (Math.random() < 0.5 ? -ecart : ecart) : 0;
  const principal = subdiviser(
    { x: cote, y: 0 }, { x: Math.cos(arrivee) * r1, y: Math.sin(arrivee) * r1 }, 0.5 + Math.random() * 0.35,
  );
  const branches = [principal];
  /* LES FOURCHES PARTENT DU MILIEU, JAMAIS DU BOUT : posee pres de
     l arrivee, une fourche se lit comme deux eclairs distincts. */
  const nb = Math.random() < 0.65 ? 2 : 1;
  for (let k = 0; k < nb; k++) {
    const pied = principal[Math.floor(principal.length * (0.3 + Math.random() * 0.35))];
    const ang = Math.atan2(pied.y, pied.x) + (Math.random() - 0.5) * 1.5;
    const portee = (1 - Math.hypot(pied.x, pied.y)) * (0.4 + Math.random() * 0.5);
    branches.push(subdiviser(pied, { x: pied.x + Math.cos(ang) * portee, y: pied.y + Math.sin(ang) * portee }, 0.6));
  }
  return {
    branches, vie: 0,
    duree: 70 + Math.random() * 110,
    epaisseur: 0.7 + Math.random() * 0.8,
    graine: Math.random() * 100,
    chute: arrivee,
    eclat: 0.6 + Math.random() * 0.4,
  };
}

export function creerLeChamp() {
  const toile = document.createElement("canvas");
  toile.width = toile.height = COTE_DU_CHAMP;
  const ctxChamp = toile.getContext("2d", { willReadFrequently: true });
  const image = ctxChamp?.createImageData(COTE_DU_CHAMP, COTE_DU_CHAMP);
  const eclairs: Eclair[] = [];
  /* Le premier n arrive pas des l ouverture : le repos commence par du repos. */
  let dernierEclair = 0;
  let prochainEclair = 1400;
  let images = 0;

  /* `tour` en secondes ; `ecart` la separation des noyaux dans l unite du
     champ ; `purete` celle du script couleur. */
  function peindre(c: Couleur, p: number, tour: number, ecart: number, purete: number) {
    if (!ctxChamp || !image) return;
    const bx: number[] = [], by: number[] = [], bq: number[] = [], bc: number[] = [];
    const agitation = 0.5 + p * 0.8;
    for (let i = 0; i < MASSES.length; i++) {
      const m = MASSES[i];
      /* LA MATIERE AUSSI SE DIVISE : les masses paires partent d un cote,
         les impaires de l autre ; la centrale reste et fait le pont qui se
         rompt. */
      const versUnLobe = i === 0 ? 0 : i % 2 === 0 ? 1 : -1;
      let mx = Math.cos(tour * m.w + m.ph) * m.d * agitation + versUnLobe * ecart;
      let my = Math.sin(tour * m.v + m.ph) * m.d * agitation * 0.85;
      /* LE CISAILLEMENT. Chaque masse tourne d autant plus vite qu elle
         est pres du centre : c est la loi d un fluide en rotation
         differentielle, et c est ce DECALAGE entre le dedans et le dehors
         qui se lit, pas la vitesse absolue. */
      const vrille = tour * (0.45 / (Math.hypot(mx, my) + 0.3));
      const cs = Math.cos(vrille), sn = Math.sin(vrille);
      const tx = mx * cs - my * sn;
      my = mx * sn + my * cs;
      mx = tx;
      bx.push(mx); by.push(my); bq.push(m.q * m.q * (1 + p * 0.25)); bc.push(versUnLobe);
    }
    const px = image.data;
    /* LE CHAMP NE MONTE PAS AVEC L AVANCEMENT, IL DESCEND. Tout le reste
       s allume avec `p` : si la matiere s allumait aussi, la sphere serait
       blanche des la moitie du rituel. Elle cede la place au limbe. */
    const blanc = 0.46 - p * 0.12;
    for (let j = 0; j < COTE_DU_CHAMP; j++) {
      const y = (j / (COTE_DU_CHAMP - 1)) * 2.4 - 1.2;
      for (let i = 0; i < COTE_DU_CHAMP; i++) {
        const x = (i / (COTE_DU_CHAMP - 1)) * 2.4 - 1.2;
        let f = 0, fG = 0, fD = 0;
        for (let k = 0; k < bx.length; k++) {
          const dx = x - bx[k], dy = y - by[k];
          const v = bq[k] / (dx * dx + dy * dy + 0.0009);
          f += v;
          if (bc[k] < 0) fG += v; else if (bc[k] > 0) fD += v;
        }
        /* Chaque pixel prend la couleur du lobe qui le domine, en
           proportion de sa domination : la frontiere est un degrade. */
        let tr = c[0], tv = c[1], tb = c[2];
        if (purete > 0) {
          const w = ((fD - fG) / (f + 1e-6)) * purete;
          const vers = w < 0 ? CYAN_DU_DEPART : MAGENTA_DE_LA_FIN;
          const k = Math.abs(w);
          tr = lerp(c[0], vers[0], k); tv = lerp(c[1], vers[1], k); tb = lerp(c[2], vers[2], k);
        }
        const a = doux(0.98, 1.32, f);
        const peau = Math.exp(-Math.pow((f - 1.22) / 0.2, 2));
        /* Le champ reste sous le blanc : c est de la matiere vue par
           transparence, pas une source. Pendant la scission il blanchit
           moins — c est lui qui lavait les deux couleurs. */
        const feu = Math.min(1, doux(2.4, 7.5, f) * blanc * 0.7 + peau * 0.55) * (1 - 0.45 * purete);
        const o = (j * COTE_DU_CHAMP + i) * 4;
        px[o] = lerp(tr, 255, feu);
        px[o + 1] = lerp(tv, 255, feu);
        px[o + 2] = lerp(tb, 255, feu);
        px[o + 3] = Math.round(Math.min(1, a * 0.42 + peau * 0.34) * 255);
      }
    }
    ctxChamp.putImageData(image, 0, 0);
  }

  return {
    toile,
    eclairs,
    /* UNE IMAGE SUR DEUX. Seize mille pixels et un televersement de
       texture pour des masses qui bougent de moins d un pixel entre deux :
       la toile hors ecran garde son contenu, l image sautee reutilise la
       precedente. */
    peindreUneImageSurDeux(c: Couleur, p: number, tour: number, ecart: number, purete: number) {
      images++;
      if (images % 2 === 0) peindre(c, p, tour, ecart, purete);
    },
    avancerLesEclairs(dt: number, p: number, maintenant: number, ecart: number, immobile: boolean) {
      if (!immobile && maintenant - dernierEclair > prochainEclair) {
        dernierEclair = maintenant;
        prochainEclair = cadenceDesEclairs(p) * lerp(ECART_DU_HASARD[0], ECART_DU_HASARD[1], Math.random());
        eclairs.push(allumerUnEclair(ecart));
        if (eclairs.length > MAX_ECLAIRS) eclairs.shift();
      }
      for (let i = eclairs.length - 1; i >= 0; i--) {
        eclairs[i].vie += dt * 1000;
        if (eclairs[i].vie >= eclairs[i].duree) eclairs.splice(i, 1);
      }
    },
    eteindre() {
      eclairs.length = 0;
    },
  };
}
