/* TRACER LE SIGIL, AU DOIGT.
 *
 * Au doigt, maintenir n a pas de sens : on tient le telephone, on ne
 * l appuie pas. Le geste juste est de TRACER — et ce qu on valide est
 * un PARCOURS, pas une calligraphie.
 *
 * LA TOLERANCE EST LARGE, ET C EST LE FOND DU SUJET. Demander de
 * reproduire le sigil ferait echouer la moitie des porteurs sur un
 * ecran de six centimetres, avec un doigt qui cache ce qu il dessine.
 * On compte donc la DISTANCE PARCOURUE a l interieur du cadre : un
 * geste franc et continu suffit, un effleurement ne suffit pas.
 *
 * C est du calcul, donc c est ici, et c est teste. Un seuil trop bas
 * signe par accident — et un engagement qu on donne par accident n en
 * est pas un ; trop haut, il epuise et on abandonne. Ni l un ni
 * l autre ne se voit en relisant un composant.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * La distance a parcourir, en multiples de la diagonale du cadre.
 *
 * Deux diagonales : de quoi traverser la zone en aller-retour, ou d y
 * dessiner une boucle franche. Mesure en pixels, le seuil suit donc la
 * taille reelle du cadre plutot qu un nombre absolu qui vaudrait trop
 * sur un petit ecran et rien sur une tablette.
 */
export const DIAGONALES_A_PARCOURIR = 2;

/** La distance cumulee d un parcours. */
export function distanceParcourue(points: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

/**
 * L avancement du trace, entre 0 et 1.
 *
 * `largeur` et `hauteur` sont celles du cadre : le seuil est relatif,
 * pour que le meme geste vaille autant sur un telephone que sur une
 * tablette.
 */
export function avancementDuTrace(
  points: readonly Point[], largeur: number, hauteur: number,
): number {
  const diagonale = Math.hypot(largeur, hauteur);
  if (!(diagonale > 0)) return 0;
  const cible = diagonale * DIAGONALES_A_PARCOURIR;
  return Math.min(1, distanceParcourue(points) / cible);
}

/**
 * Un point qui ne bouge pas assez ne compte pas.
 *
 * Un doigt pose tremble : sans ce filtre, une main immobile
 * accumulerait de la distance et finirait par signer toute seule. Deux
 * pixels sont sous le tremblement et au-dessus du bruit du capteur.
 */
export const SEUIL_DE_BOUGE = 2;

export function ajouterAuTrace(points: readonly Point[], p: Point): Point[] {
  const dernier = points[points.length - 1];
  if (dernier && Math.hypot(p.x - dernier.x, p.y - dernier.y) < SEUIL_DE_BOUGE) {
    return points as Point[];
  }
  return [...points, p];
}

/** Le trace est-il abouti ? */
export const traceAbouti = (
  points: readonly Point[], largeur: number, hauteur: number,
): boolean => avancementDuTrace(points, largeur, hauteur) >= 1;
