/* L EMBLEME D UN PALIER : LE DEPOT, ET CE QU ON PEUT EN RETIRER.
 *
 * `ranks.logo_url` etait un champ ou l on COLLAIT une adresse. Coller
 * une adresse suppose que l image existe deja quelque part et qu elle y
 * restera : ce n est pas un televersement, c est un pari sur
 * l hebergement de quelqu un d autre.
 *
 * Le depot `rank-images` est public, comme `finance-icons` : la colonne
 * garde donc une ADRESSE, et non un chemin prefixe. C est ce qui permet
 * a l ancien usage — coller un lien exterieur — de continuer a marcher
 * sans conversion.
 *
 * ═══ ET C EST CE QUI REND LA SUPPRESSION DELICATE ═══
 *
 * Supprimer un palier doit emporter son image, sinon chaque essai
 * laisse un fichier que personne ne nettoiera jamais. Mais la colonne
 * porte indifferemment une image A NOUS et une adresse EXTERIEURE : il
 * faut savoir distinguer les deux avant d appeler la suppression.
 *
 * `cheminDeLEmbleme` est cette distinction, et elle est pure : elle
 * rend un chemin quand l adresse designe un objet de NOTRE depot, et
 * `null` pour tout le reste — une image de Wikipedia, un autre depot du
 * projet, une adresse tordue. On ne supprime que ce qu on a ecrit.
 */

export const DEPOT_EMBLEMES = "rank-images";

/** Ce que le depot public intercale avant le chemin de l objet. */
const MARQUEUR = "/storage/v1/object/public/" + DEPOT_EMBLEMES + "/";

/**
 * Le chemin dans le depot, ou `null` si l adresse n en vient pas.
 *
 * Deux gardes, et chacune a sa raison :
 *
 *   LE MARQUEUR COMPLET, prefixe du depot compris. Chercher seulement
 *   « rank-images » attraperait une adresse exterieure qui contiendrait
 *   ce mot, et un autre depot dont le nom commencerait pareil.
 *
 *   UN CHEMIN NON VIDE APRES LUI. Une adresse qui s arrete sur le
 *   marqueur ne designe aucun objet ; demander sa suppression viserait
 *   la racine du depot.
 */
export function cheminDeLEmbleme(adresse: string | null | undefined): string | null {
  if (typeof adresse !== "string") return null;
  const i = adresse.indexOf(MARQUEUR);
  if (i < 0) return null;
  /* La chaine de requete d une adresse signee ou versionnee ne fait pas
     partie du chemin de l objet. */
  const chemin = adresse.slice(i + MARQUEUR.length).split(/[?#]/)[0];
  return chemin ? decodeURIComponent(chemin) : null;
}

/**
 * Le chemin ou ranger un nouvel embleme.
 *
 * L IDENTIFIANT EN PREMIER, PARCE QUE LA REGLE DU DEPOT L EXIGE :
 * `auth.uid()::text = (storage.foldername(name))[1]`. Un chemin qui
 * commencerait autrement serait refuse a l ecriture.
 *
 * L HORODATAGE ENSUITE, et c est ce qui autorise un an de cache : une
 * image remplacee a une nouvelle adresse, donc un cache d un an ne peut
 * jamais servir une version perimee.
 */
export function cheminPourNouvelEmbleme(userId: string, extension: string): string {
  return `${userId}/${Date.now()}.${extension}`;
}

/** Un an, en secondes — la valeur passee a `cacheControl`. */
export const CACHE_UN_AN = "31536000";

/** Le plafond accepte a l entree, avant optimisation. */
export const TAILLE_MAX = 2 * 1024 * 1024;
