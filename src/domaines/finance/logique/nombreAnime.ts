/* UN NOMBRE QUI MONTE — EN HUIT CENTS MILLISECONDES, PAS EN CINQUANTE
   TOURS.
 *
 * Le solde du mois mettait TRENTE-TROIS SECONDES a s afficher, et
 * pendant ces trente-trois secondes il montrait des chiffres qui n
 * etaient pas les siens : on choisissait octobre, et le solde annoncait
 * 829,73 € — celui de septembre — puis 561,71 €, puis 230,21 €, avant
 * d arriver, une demi-minute plus tard, au vrai : -11,70 €.
 *
 * L animation comptait des PAS et non du TEMPS. Cinquante pas de seize
 * millisecondes font huit cents millisecondes — a condition que chaque
 * pas arrive a l heure. Il n arrive jamais a l heure : au moment
 * precis ou l on change de mois, la page recalcule douze mois, refait
 * ses requetes, et redessine. Chaque pas retarde ne se rattrapait pas,
 * il S AJOUTAIT — cinquante pas a six cent soixante millisecondes de
 * retard font trente-trois secondes.
 *
 * Le remede tient dans ce module : on ne demande plus « combien de
 * pas ai-je faits », mais « quelle heure est-il ». Les images sautees
 * sont alors rattrapees au lieu d etre attendues, et l animation dure
 * huit cents millisecondes qu elle en dessine cinquante ou trois.
 *
 * C EST DU CALCUL, DONC CA SE TESTE. Un nombre faux qui converge vers
 * le bon est le pire des defauts a relire : a la fin il a raison, et
 * rien dans le code ne dit combien de temps il a eu tort.
 */

/** La duree d une montee, en millisecondes. */
export const DUREE_MS = 800;

/**
 * L avancement adouci, entre 0 et 1.
 *
 * Cubique sortant : vif au depart, pose a l arrivee. Borne aux deux
 * bouts — un temps negatif (horloge qui recule) ou un temps depasse ne
 * doivent pas produire un nombre hors de l intervalle.
 */
export function avancement(ecoule: number, duree: number = DUREE_MS): number {
  if (!(duree > 0)) return 1;
  const t = Math.min(1, Math.max(0, ecoule / duree));
  return 1 - Math.pow(1 - t, 3);
}

/**
 * La valeur a afficher apres « ecoule » millisecondes.
 *
 * L ARRIVEE EST EXACTE, PAS APPROCHEE. Passe la duree, on rend la
 * cible elle-meme et non le resultat de l interpolation : un solde qui
 * finit a -11,699999999 est un solde faux, meme arrondi a l affichage.
 */
export function valeurALInstant(
  depart: number, cible: number, ecoule: number, duree: number = DUREE_MS,
): number {
  if (ecoule >= duree) return cible;
  return depart + (cible - depart) * avancement(ecoule, duree);
}

/** La montee est-elle finie ? */
export const estArrivee = (ecoule: number, duree: number = DUREE_MS): boolean => ecoule >= duree;
