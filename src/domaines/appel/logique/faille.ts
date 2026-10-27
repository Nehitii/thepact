/* LA DECHIRURE DU DECENTRAGE (acte IV).
 *
 * A cinq secondes le systeme perd son axe : les orbites se decentrent,
 * le tremblement double. La grille — c est elle qui dessine la gravite —
 * restait intacte, comme si l espace n avait rien senti. Elle se DECHIRE :
 * une faille la traverse, les deux bords glissent en sens contraire et
 * s ecartent, et la fente brule.
 *
 * ET LA FAILLE SUIT LE TRACE EXACT QUE LES JETS PRENDRONT. Meme axe, meme
 * laterale, meme cambrure, meme pied, a pleine force. L espace se fend a
 * cinq secondes ; a deux secondes, les jets sortent de la fente. Le
 * spectateur ne sait pas qu il regarde une annonce — il le comprend quand
 * elle se realise.
 *
 * LE CHOC PUIS LA BRAISE. La fissure court du noyau vers les bords en un
 * tiers de seconde ; le cisaillement depasse, revient, et se pose a un peu
 * moins de la moitie de son pic : le systeme reste casse.
 *
 * Tout est ecrit dans des tableaux tires une fois : chaque point de la
 * grille parcourt tous les segments, mille cinq cents fois par image.
 */
import { clamp01 } from "./coeur";
import { pointDuJet, repereDuJet, type PointDuJet } from "./nervure";

export const SEGMENTS_DE_LA_FAILLE = 10;
/** Deux bras de onze points, plus le centre. */
export const POINTS_DE_LA_FAILLE = 2 * (SEGMENTS_DE_LA_FAILLE + 1) + 1;
/** Le temps que la fissure met a courir du noyau jusqu aux bords, en secondes. */
export const DUREE_DE_LA_PROPAGATION = 0.32;

export interface Faille {
  /** L instant ou elle s est ouverte, sur l horloge de la toile ; -1 si fermee. */
  debut: number;
  ouverture: number;
  propagation: number;
  cisaillement: number;
  bouche: number;
  portee: number;
  n: number;
  /** Ce que `deplacerParLaFaille` laisse au trace : le cote du dernier point, et s il est devoile. */
  cote: number;
  devoile: number;
  x: Float64Array;
  y: Float64Array;
  /** L abscisse le long de la faille, de -1 (bout d un bras) a 1 (bout de l autre). */
  u: Float64Array;
  vx: Float64Array;
  vy: Float64Array;
  inv: Float64Array;
  tx: Float64Array;
  ty: Float64Array;
}

export function failleNeuve(): Faille {
  const tableau = () => new Float64Array(POINTS_DE_LA_FAILLE);
  return {
    debut: -1, ouverture: 0, propagation: 0, cisaillement: 0, bouche: 0, portee: 1,
    n: 0, cote: 0, devoile: 0,
    x: tableau(), y: tableau(), u: tableau(),
    vx: tableau(), vy: tableau(), inv: tableau(), tx: tableau(), ty: tableau(),
  };
}

/* `armee` : le recit a franchi le troisieme seuil, en mouvement non reduit. */
export function avancerLaFaille(
  f: Faille, dt: number, maintenant: number, base: number, armee: boolean,
): void {
  if (armee && f.debut < 0) f.debut = maintenant;
  if (!armee) f.debut = -1;
  f.ouverture = armee ? 1 : Math.max(0, f.ouverture - dt * 3);
  const age = f.debut >= 0 ? (maintenant - f.debut) / 1000 : 10;
  if (armee) f.propagation = Math.min(1.15, (age / DUREE_DE_LA_PROPAGATION) * 1.15);
  /* Le choc : un a-coup qui depasse, revient, et se pose. Une maille de
     grille fait 46 px : le pic en couvre une entiere, la pose un peu
     moins de la moitie — assez pour qu une ligne rompue se voie rompue,
     meme sur une image fixe. */
  const choc = Math.exp(-age * 4.5) * Math.cos(age * 17);
  f.cisaillement = base * (0.22 + 0.3 * choc) * f.ouverture;
  f.bouche = base * (0.06 + 0.1 * Math.exp(-age * 6)) * f.ouverture;
  f.portee = base * 1.1;
}

/* LA NERVURE A PLEINE FORCE, parcourue du bout du bras oppose jusqu au
   bout du bras direct en passant par le centre. Les deux bras sont
   symetriques par demi-tour : la faille est un S, comme le moulinet
   qu elle annonce. Elle a besoin du rayon du coeur pour poser son pied. */
export function construireLaFaille(f: Faille, cx: number, cy: number, base: number, rc: number): void {
  const nervure = { cx, cy, base, pied: rc * 0.88, longueur: base * 9.7 };
  const bout = nervure.pied + nervure.longueur;
  const reperes = { [1]: repereDuJet(1), [-1]: repereDuJet(-1) };
  const q: PointDuJet = { x: 0, y: 0, k: 0, z: 0 };
  let n = 0;
  const poser = (sens: 1 | -1, t: number) => {
    pointDuJet(reperes[sens], nervure, t, 0, 0, 1, q);
    f.x[n] = q.x;
    f.y[n] = q.y;
    f.u[n] = (sens * (nervure.pied + nervure.longueur * t)) / bout;
    n++;
  };
  for (let i = SEGMENTS_DE_LA_FAILLE; i >= 0; i--) poser(-1, i / SEGMENTS_DE_LA_FAILLE);
  f.x[n] = cx; f.y[n] = cy; f.u[n] = 0; n++;
  for (let i = 0; i <= SEGMENTS_DE_LA_FAILLE; i++) poser(1, i / SEGMENTS_DE_LA_FAILLE);
  f.n = n;
  for (let i = 0; i < n - 1; i++) {
    const vx = f.x[i + 1] - f.x[i], vy = f.y[i + 1] - f.y[i];
    const l2 = vx * vx + vy * vy || 1;
    const l = Math.sqrt(l2);
    f.vx[i] = vx; f.vy[i] = vy; f.inv[i] = 1 / l2;
    f.tx[i] = vx / l; f.ty[i] = vy / l;
  }
}

/* Deplace un point de la grille — deja courbe par la gravite — selon son
   cote de la faille, et laisse dans `cote` et `devoile` de quoi rompre le
   trace au passage. Le cisaillement glisse le long de la faille, en sens
   contraire de part et d autre ; l ecartement pousse chaque bord hors de
   la fente. Les deux s eteignent en s eloignant : c est une fracture, pas
   un glissement du decor. */
export function deplacerParLaFaille(f: Faille, point: [number, number]): void {
  const x = point[0], y = point[1];
  let meilleur = Infinity, distance = 0, u = 0, tx = 1, ty = 0;
  for (let i = 0; i < f.n - 1; i++) {
    const ax = f.x[i], ay = f.y[i];
    const vx = f.vx[i], vy = f.vy[i];
    let t = ((x - ax) * vx + (y - ay) * vy) * f.inv[i];
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = x - (ax + vx * t), dy = y - (ay + vy * t);
    const d2 = dx * dx + dy * dy;
    if (d2 < meilleur) {
      meilleur = d2;
      const croix = vx * (y - ay) - vy * (x - ax);
      distance = croix >= 0 ? Math.sqrt(d2) : -Math.sqrt(d2);
      u = f.u[i] + (f.u[i + 1] - f.u[i]) * t;
      tx = f.tx[i]; ty = f.ty[i];
    }
  }
  const signe = distance >= 0 ? 1 : -1;
  const devoile = clamp01((f.propagation - Math.abs(u)) / 0.12);
  f.cote = signe;
  f.devoile = devoile;
  if (devoile <= 0) return;
  const d = Math.abs(distance);
  const glisse = f.cisaillement * Math.exp(-d / f.portee) * devoile;
  const ecarte = f.bouche * Math.exp(-d / (f.portee * 0.35)) * devoile;
  point[0] += signe * (tx * glisse - ty * ecarte);
  point[1] += signe * (ty * glisse + tx * ecarte);
}
