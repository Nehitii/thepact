/* LA CAMERA DU COEUR.
 *
 * Jusqu ici la toile filmait en plan fixe : le coeur au centre de la
 * prise, toujours a la meme taille, et une secousse faite de hasard pur
 * — un tirage neuf a chaque image, donc un grain, pas un choc. La table
 * de montage annoncait qu une camera la lirait un jour ; la voici, en
 * quatre gestes lus sur la meme partition :
 *
 *   LE TRAVELLING AVANT. La camera avance avec le rituel, acte par acte,
 *   recule d un pas au decentrage — le sujet est alors le systeme entier
 *   —, puis pousse jusqu au noyau dans l acte critique et l enflement.
 *   Le souffle la rejette en arriere : les jets se lisent plein cadre.
 *
 *   LE CADRAGE TACTILE. Sous un doigt, le centre de la prise est le seul
 *   endroit de l ecran qu on ne voit pas. Sur un ecran tactile, le sujet
 *   remonte au tiers superieur tant que le doigt tient, et redescend
 *   quand il lache ou quand la fin commence.
 *
 *   LA SECOUSSE « TRAUMA ». Un choc ajoute du trauma, qui retombe
 *   lineairement ; la camera tremble du CARRE du trauma — un petit choc
 *   frissonne, un gros cogne —, sur un bruit lisse en trois axes : deux
 *   decalages et un roulis. Des planchers la tiennent pendant la lutte de
 *   la fusion et la fin de la montee. Le temps mort est un vrai silence.
 *
 *   LES BANDES 2,39:1. Le cadre se resserre en cinemascope pendant tout
 *   le rituel, jusqu a l astre d apres. Sur un ecran en hauteur, ou ce
 *   rapport ne laisserait qu une fente, chaque bande s arrete a 14 % de
 *   la hauteur.
 *
 * Ce module ne dessine rien : il dit ou est l oeil, la toile s y plie.
 */
import { doux, lerp, type PhaseCoeur } from "./coeur";
import { DUREE_ENFLEMENT } from "./sequence";

/* ── LE TRAVELLING ──────────────────────────────────────────── */

/** Le grossissement a la fin de chaque acte — les bornes sont les seuils. */
export const TRAVELLING: readonly { p: number; z: number }[] = [
  { p: 0, z: 1 },
  { p: 0.25, z: 1.05 },
  { p: 0.5, z: 1.11 },
  { p: 0.75, z: 1.17 },
  { p: 0.9, z: 1.13 },
  { p: 1, z: 1.3 },
];
export const ZOOM_ENFLE = 1.4;
export const ZOOM_EFFONDRE = 1.48;

/* Entre deux reperes, une rampe douce : la camera marque un temps a
   chaque seuil, comme une coupe qu on n aurait pas faite. */
export function zoomDuTravelling(p: number): number {
  let i = 0;
  while (i < TRAVELLING.length - 2 && TRAVELLING[i + 1].p <= p) i++;
  const a = TRAVELLING[i], b = TRAVELLING[i + 1];
  return lerp(a.z, b.z, doux(a.p, b.p, p));
}

export function zoomVoulu(p: number, phase: PhaseCoeur, depuis: number): number {
  switch (phase) {
    case "enflement": return lerp(zoomDuTravelling(1), ZOOM_ENFLE, doux(0, DUREE_ENFLEMENT / 1000, depuis));
    case "effondrement":
    case "tempsMort": return ZOOM_EFFONDRE;
    case "projection":
    case "verrouille": return 1;
    default: return zoomDuTravelling(p);
  }
}

/** Le temps de reponse du zoom, en secondes : aspire a l effondrement, rejete au souffle. */
export function reponseDuZoom(phase: PhaseCoeur): number {
  if (phase === "effondrement") return 0.08;
  if (phase === "projection") return 0.32;
  if (phase === "verrouille") return 0.9;
  return 0.55;
}

/** Un pas de poursuite exponentielle : rapide loin de la cible, sans jamais la depasser. */
export const suivre = (valeur: number, cible: number, dt: number, reponse: number): number =>
  valeur + (cible - valeur) * (1 - Math.exp(-dt / Math.max(1e-3, reponse)));

/* ── LE CADRAGE TACTILE ─────────────────────────────────────── */

export const TIERS = 1 / 3;
const MONTEE: readonly PhaseCoeur[] = ["attente", "montee", "critique"];

/** Un, tant qu un doigt tient la montee — l avancement qui croit est le doigt. */
export const cadrageVoulu = (tactile: boolean, phase: PhaseCoeur, tient: boolean): number =>
  tactile && tient && MONTEE.includes(phase) ? 1 : 0;

/** De combien le sujet remonte : jusqu au tiers de la hauteur, jamais vers le bas. */
export const remonteeDuSujet = (cy: number, hauteur: number, cadrage: number): number =>
  Math.min(0, hauteur * TIERS - cy) * cadrage;

/* ── LA SECOUSSE ────────────────────────────────────────────── */

/** En pixels, au trauma plein ; le roulis en radians (1,6 degre). */
export const AMPLITUDE_DE_LA_SECOUSSE = 34;
export const ROULIS_MAX = 0.028;
/** Le trauma perdu par seconde. */
export const DECROISSANCE_DU_TRAUMA = 1.1;

/** Ce que chaque choc ajoute au trauma. */
export const COUPS = {
  seuil: 0.2, verrou: 0.22, faille: 0.4, union: 0.6, effondrement: 0.35, souffle: 1,
} as const;
export type Coup = keyof typeof COUPS;

/* Les planchers : la fin de la montee fremit, la lutte gronde. Le
   decentrage — l excentricite — l amplifie, comme il le faisait. */
export function plancherDuTrauma(p: number, puissanceDeLaFusion: number, excentrique: number): number {
  const montee = 0.42 * doux(0.55, 1, p) * Math.sqrt(1 + Math.max(0, excentrique));
  const lutte = 0.62 * puissanceDeLaFusion;
  return Math.min(1, Math.max(montee, lutte));
}

export function avancerLeTrauma(trauma: number, dt: number, coups: number, plancher: number): number {
  return Math.max(plancher, Math.min(1, trauma - dt * DECROISSANCE_DU_TRAUMA + coups));
}

/* UN BRUIT LISSE, PAS UN TIRAGE. Trois sinus de frequences
   incommensurables par axe : la somme ne repasse jamais par le meme
   chemin, et rien ne saute d une image a l autre. Entre six et treize
   battements par seconde : un choc, pas une vibration de moteur. */
const FREQUENCES = [[37, 59, 83], [41, 67, 89], [29, 47, 71]] as const;
const DEPHASAGES = [[0.3, 1.7, 4.1], [2.2, 0.9, 5.3], [1.1, 3.9, 0.4]] as const;

export function bruitLisse(t: number, axe: 0 | 1 | 2): number {
  const f = FREQUENCES[axe], d = DEPHASAGES[axe];
  return (Math.sin(t * f[0] + d[0]) + 0.6 * Math.sin(t * f[1] + d[1]) + 0.35 * Math.sin(t * f[2] + d[2])) / 1.95;
}

export function secousseDe(trauma: number, t: number): { x: number; y: number; roulis: number } {
  const k = trauma * trauma;
  return {
    x: k * AMPLITUDE_DE_LA_SECOUSSE * bruitLisse(t, 0),
    y: k * AMPLITUDE_DE_LA_SECOUSSE * bruitLisse(t, 1),
    roulis: k * ROULIS_MAX * bruitLisse(t, 2),
  };
}

/* ── LES BANDES ─────────────────────────────────────────────── */

export const RAPPORT_CINEMASCOPE = 2.39;
export const BANDE_MAX = 0.14;

export const hauteurDesBandes = (largeur: number, hauteur: number): number =>
  Math.max(0, Math.min((hauteur - largeur / RAPPORT_CINEMASCOPE) / 2, hauteur * BANDE_MAX));

/** Les bandes tiennent du premier instant de la montee a l astre d apres. */
export function bandesVoulues(phase: PhaseCoeur, p: number): number {
  if (phase === "verrouille") return 0;
  if (!MONTEE.includes(phase)) return 1;
  return p > 0.004 ? 1 : 0;
}

/* ── CE QUE L OEIL VOIT ─────────────────────────────────────── */

export interface Prise {
  /** Le sujet sur la scene — le centre de la prise. */
  cx: number;
  cy: number;
  /** Le sujet a l ecran, secousse comprise. */
  sx: number;
  sy: number;
  z: number;
  roulis: number;
}

export interface Vue { x0: number; y0: number; x1: number; y1: number }

/* LE CHAMP VISIBLE, en coordonnees de scene : les quatre coins de
   l ecran ramenes par la transformation inverse. Ce qui doit couvrir le
   cadre — la grille, un aplat — le couvre ainsi quels que soient le
   zoom, le cadrage et le roulis. */
export function champVisible(c: Prise, largeur: number, hauteur: number): Vue {
  const cos = Math.cos(-c.roulis), sin = Math.sin(-c.roulis);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [ex, ey] of [[0, 0], [largeur, 0], [0, hauteur], [largeur, hauteur]]) {
    const dx = (ex - c.sx) / c.z, dy = (ey - c.sy) / c.z;
    const x = c.cx + dx * cos - dy * sin;
    const y = c.cy + dx * sin + dy * cos;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}
