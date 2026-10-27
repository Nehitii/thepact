/**
 * LE DEPOT D IMAGES DE LA WISHLIST.
 *
 * Un article peut porter deux sortes d image : une ADRESSE prise sur
 * une boutique, et un FICHIER depose depuis la machine. Les deux
 * vivent dans la meme colonne, image_url ; il faut donc les
 * distinguer sans ambiguite.
 *
 * POURQUOI PAS UNE URL SIGNEE EN BASE. Le depot est prive, et une
 * URL signee expire. L application le fait ailleurs avec un an de
 * validite — ce qui pose une date de peremption dans la base et
 * transforme, un an plus tard, une image en lien mort. On enregistre
 * donc le CHEMIN, et on le signe au moment de l afficher.
 *
 * POURQUOI CE PREFIXE. « depot: » n est pas un protocole que le
 * navigateur connaisse : une valeur qui le porte ne peut pas etre
 * prise pour une adresse et posee telle quelle dans un src.
 *
 * POURQUOI L IDENTIFIANT EN PREMIER. La regle de securite du depot
 * exige que le premier dossier soit celui de l utilisateur :
 * auth.uid() = (storage.foldername(name))[1]. Un chemin
 * « wishlist/<user>/… » serait refuse a l ecriture.
 */

export const DEPOT_WISHLIST = "goal-images";

const PREFIXE = "depot:";

/** Vrai quand la valeur designe un fichier depose, pas une adresse. */
export function estUnDepot(valeur: string | null | undefined): boolean {
  return typeof valeur === "string" && valeur.startsWith(PREFIXE);
}

/** Le chemin dans le depot, ou null si ce n en est pas un. */
export function cheminDuDepot(valeur: string | null | undefined): string | null {
  return estUnDepot(valeur) ? (valeur as string).slice(PREFIXE.length) : null;
}

/** La valeur a enregistrer en base pour un fichier depose. */
export function referenceDepot(chemin: string): string {
  return PREFIXE + chemin;
}

/** Le chemin ou ranger un nouveau fichier. */
export function cheminPourNouveauFichier(userId: string, extension: string): string {
  const jeton = Math.random().toString(36).slice(2, 9);
  return `${userId}/wishlist/${Date.now()}-${jeton}.${extension}`;
}
