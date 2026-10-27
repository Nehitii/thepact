/* LE CADRAGE D UN EMBLEME.
 *
 * L embleme d un palier est une image que l utilisateur a choisie, et
 * presque toutes portent une marge transparente — un ecusson de 96 px
 * au milieu d un carre de 128. Posee « en entier » dans une boite, elle
 * y parait petite : la boite cadre la marge autant que le dessin.
 *
 * On cherche donc la BOITE OPAQUE — le plus petit rectangle qui
 * contient tous les pixels visibles — et on pose l image pour que ce
 * rectangle-la remplisse la boite. La marge deborde, invisible ; le
 * dessin prend toute la place.
 *
 * Tout est en fractions et en pourcentages : le calcul ne connait pas
 * la taille a l ecran, et la boite peut changer de taille sans qu on
 * le refasse. */

/** Le rectangle des pixels visibles, en fractions de l image (0 a 1). */
export interface BoiteOpaque {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * La boite opaque d une image, lue dans ses pixels RGBA ; `null` si
 * l image est entierement transparente.
 *
 * Le seuil ecarte la poussiere : un pixel a 3 % d opacite, reste d un
 * detourage, ne doit pas agrandir le cadre de tout un cote.
 */
export function boiteOpaque(
  pixels: ArrayLike<number>,
  largeur: number,
  hauteur: number,
  seuil = 12,
): BoiteOpaque | null {
  let x0 = largeur;
  let y0 = hauteur;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      if (pixels[(y * largeur + x) * 4 + 3] <= seuil) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  return { x0: x0 / largeur, y0: y0 / hauteur, x1: (x1 + 1) / largeur, y1: (y1 + 1) / hauteur };
}

/** Ou poser l image dans sa boite, en pourcentages de la boite. */
export interface Placement {
  largeur: number;
  hauteur: number;
  gauche: number;
  haut: number;
}

/**
 * Le placement qui fait remplir la boite par la partie visible.
 *
 * `aspect` est celui de la boite (largeur sur hauteur) ; `remplissage`
 * la part de la boite que le dessin occupe, pour lui laisser un souffle.
 * Le dessin est centre sur SON centre, pas sur celui de l image : un
 * embleme decale dans son fichier retombe au milieu.
 */
export function placement(
  boite: BoiteOpaque,
  largeurImage: number,
  hauteurImage: number,
  aspect = 1,
  remplissage = 1,
): Placement {
  const fw = Math.max(1e-6, boite.x1 - boite.x0);
  const fh = Math.max(1e-6, boite.y1 - boite.y0);
  const dessin = (fw * largeurImage) / (fh * hauteurImage);
  let largeur: number;
  let hauteur: number;
  if (dessin >= aspect) {
    /* Borne par la largeur. */
    largeur = 100 / fw;
    hauteur = (aspect * hauteurImage * 100) / (fw * largeurImage);
  } else {
    /* Borne par la hauteur. */
    hauteur = 100 / fh;
    largeur = (largeurImage * 100) / (aspect * fh * hauteurImage);
  }
  largeur *= remplissage;
  hauteur *= remplissage;
  return {
    largeur,
    hauteur,
    gauche: 50 - ((boite.x0 + boite.x1) / 2) * largeur,
    haut: 50 - ((boite.y0 + boite.y1) / 2) * hauteur,
  };
}
