/* L ESPACE DE LA TOILE.
 *
 * Tout ce que le coeur peint en volume — les orbites, la sphere, la
 * matiere, les protuberances, les jets, l explosion — se calcule en
 * trois dimensions PUIS se projette. C est ce qui fait qu un corps passe
 * derriere la sphere au lieu de glisser dessus, et qu un jet qui vient
 * vers nous ne se lit pas comme celui qui s eloigne.
 *
 * Ce module porte les outils que tous partagent : le hasard a graine,
 * les directions sur la sphere, les cercles sur un axe, le point d une
 * orbite, et le plan d accretion dont la normale donne l axe des jets.
 * Il ne dessine rien.
 */
import { TAU, lerp } from "./coeur";

export interface Vecteur {
  x: number;
  y: number;
  z: number;
}

/* CE QUI EST TIRE A LA GRAINE NE CHANGE JAMAIS. Les brins des jets, le
   disque de matiere, les rayons de l union sont tires une fois et pour
   toujours : un brin qui change de place d une image a l autre n est pas
   un brin, c est du bruit. Un generateur congruentiel suffit — on ne lui
   demande que de rendre la meme suite pour la meme graine. */
export function graine(depart: number): () => number {
  let s = depart;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* LA PERSPECTIVE EST A ZERO, ET C EST UN CHOIX. A zero, `pointDOrbite`
   rend exactement l ellipse orthographique : les orbites gardent leur
   inclinaison et leur noeud, mais rien ne grossit en s approchant. C est
   l etat retenu sur le banc. Les formules gardent le parametre : c est
   d ici qu on la rouvrirait. */
export const PERSPECTIVE = 0;

export const NOEUDS_BASE = [0.0, 1.25, 2.4, 0.62, 1.95];
export const POINTS_PAR_ORBITE = 48;

export interface PointDOrbite {
  x: number;
  y: number;
  /** Le grossissement de la perspective : un, tant qu elle est nulle. */
  k: number;
  /** De zero, le fond de l orbite, a un, le point le plus proche. */
  profondeur: number;
}

/* `aplati` est le rapport ry/rx que `geometrieDUnAnneau` rend deja, donc
   le cosinus de l inclinaison reelle. Le point est pose dans le plan de
   l orbite, incline, puis tourne de son noeud.
   UN RAYON NUL NE S ECHANTILLONNE PAS : la perspective divise par lui. */
export function pointDOrbite(
  u: number, rayon: number, aplati: number, noeud: number, persp: number,
): PointDOrbite {
  const sinI = Math.sqrt(Math.max(0, 1 - aplati * aplati));
  const x0 = Math.cos(u) * rayon, y0 = Math.sin(u) * rayon;
  const y1 = y0 * aplati, z = y0 * sinI;
  const k = 1 / (1 - (z / rayon) * persp);
  const cn = Math.cos(noeud), sn = Math.sin(noeud);
  return {
    x: (x0 * cn - y1 * sn) * k,
    y: (x0 * sn + y1 * cn) * k,
    k,
    profondeur: (Math.sin(u) + 1) / 2,
  };
}

/* Ce qui passe derriere palit et s affine ; ce qui passe devant
   s eclaire et s epaissit. Deux rampes, et c est tout le volume. */
export const eclatSelonProfondeur = (prof: number) => lerp(0.28, 1.05, prof);
export const traitSelonProfondeur = (prof: number) => lerp(0.6, 1.4, prof);

export function produitVectoriel(a: Vecteur, b: Vecteur): Vecteur {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/* UNE DIRECTION TIREE UNIFORMEMENT SUR LA SPHERE. Tirer les deux angles
   a plat entasserait tout aux poles : la colatitude se tire en arc
   cosinus, pas en lineaire. */
export function directionSurLaSphere(hasard: () => number = Math.random): Vecteur {
  const longitude = hasard() * TAU;
  const colatitude = Math.acos(1 - 2 * hasard());
  const s = Math.sin(colatitude);
  return { x: s * Math.cos(longitude), y: s * Math.sin(longitude), z: Math.cos(colatitude) };
}

/* Le produit vectoriel avec l axe vertical degenere quand la direction
   EST verticale : on bascule alors sur un autre axe. */
export function perpendiculaire(v: Vecteur): Vecteur {
  const axe = Math.abs(v.z) > 0.92 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 };
  const w = produitVectoriel(v, axe);
  const n = Math.hypot(w.x, w.y, w.z) || 1;
  return { x: w.x / n, y: w.y / n, z: w.z / n };
}

export const POINTS_DU_CERCLE = 26;

/* Le cercle des directions a distance angulaire `theta` d un axe, vu
   comme un parallele sur un globe dont `axe` serait le pole. Quatre
   calques s en servent : l onde de rupture d une protuberance, l onde
   de l appui, les paralleles qui montrent la rotation, et les
   meridiens de l explosion. */
export function cercleSurUnAxe(axe: Vecteur, u1: Vecteur, u2: Vecteur, theta: number): Vecteur[] {
  const ct = Math.cos(theta), st = Math.sin(theta);
  const pts: Vecteur[] = [];
  for (let i = 0; i <= POINTS_DU_CERCLE; i++) {
    const a = (i / POINTS_DU_CERCLE) * TAU;
    const ca = Math.cos(a) * st, sa = Math.sin(a) * st;
    pts.push({
      x: axe.x * ct + u1.x * ca + u2.x * sa,
      y: axe.y * ct + u1.y * ca + u2.y * sa,
      z: axe.z * ct + u1.z * ca + u2.z * sa,
    });
  }
  return pts;
}

/* LE PLAN D ACCRETION. La matiere qui tombe s aplatit dans un plan, et
   ce plan est le meme pour le disque, les grains et les jets. */
export const PLAN_DE_MATIERE = { aplati: 0.3, noeud: 0.75 };

/* POURQUOI LES JETS SONT LA : un disque qui tombe sur un objet compact
   evacue par ses poles ce qu il ne peut pas avaler. L axe des jets n est
   donc pas a choisir — c est la NORMALE AU PLAN D ACCRETION, dans la
   meme convention que `pointDOrbite` : le plan contient (1, 0, 0) et
   (0, aplati, sinI). Le plan est incline, donc un jet vient vers nous et
   l autre s eloigne. */
export function axeDesJets(): Vecteur {
  const aplati = PLAN_DE_MATIERE.aplati;
  const sinI = Math.sqrt(Math.max(0, 1 - aplati * aplati));
  const n = { x: 0, y: -sinI, z: aplati };
  const cn = Math.cos(PLAN_DE_MATIERE.noeud), sn = Math.sin(PLAN_DE_MATIERE.noeud);
  return { x: n.x * cn - n.y * sn, y: n.x * sn + n.y * cn, z: n.z };
}
