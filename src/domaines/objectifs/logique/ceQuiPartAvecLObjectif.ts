/* CE QUE LA SUPPRESSION EMPORTE, DIT AVANT DE LA FAIRE.
 *
 * La fenetre annoncait « L'objectif et toutes ses étapes seront
 * supprimés. Cette action est définitive. » — une phrase qui ne
 * designe rien. Elle ne nommait pas l objectif, ne disait pas combien
 * d etapes, et surtout taisait la seule consequence qu on ne peut pas
 * refaire a la main : LE COUT DU PACTE BAISSE.
 *
 * Un objectif porte un montant estime, et c est ce montant — lui seul
 * — qui entre dans le cout du pacte ; « finance/logique/comptePacte.ts »
 * fait la somme des « estimated_cost ». Supprimer l objectif, c est
 * donc retirer cette somme du budget, silencieusement.
 *
 * Ce module ne rend pas de texte : il rend les trois faits que la
 * fenetre doit dire. Le comptage se trompe sans bruit — un objectif
 * sans etape, un montant a zero, un montant absent ne sont pas la
 * meme chose et ne se disent pas pareil.
 */

/** Ce qu il faut annoncer avant de supprimer. */
export interface CeQuiPart {
  /** Le nom de l objectif, tel qu on le lit a l ecran. */
  nom: string;
  /** Combien d etapes disparaissent avec lui. */
  etapes: number;
  /** Ce qui quitte le cout du pacte, ou `null` si rien n en part. */
  montant: number | null;
}

interface ObjectifSupprimable {
  name: string;
  estimated_cost?: number | null;
}

/**
 * Les trois faits, a partir de l objectif et de ses etapes.
 *
 * LE MONTANT EST `null`, PAS ZERO, QUAND IL N Y EN A PAS. « Le coût
 * du pacte baissera de 0 € » est une phrase qui inquiete pour rien :
 * elle annonce une consequence qui n existe pas. Un objectif sans
 * montant ne doit pas la voir du tout, et c est `null` qui le dit —
 * zero ne le dirait pas, puisqu il se formate comme un montant.
 *
 * Un montant negatif n existe pas en base, mais s il y en avait un, il
 * ne « baisserait » rien : on le traite comme absent plutot que
 * d annoncer une hausse sous un titre de suppression.
 */
export function ceQuiPartAvecLObjectif(
  objectif: ObjectifSupprimable,
  etapes: readonly unknown[],
): CeQuiPart {
  const cout = objectif.estimated_cost ?? 0;
  return {
    nom: objectif.name,
    etapes: etapes.length,
    montant: cout > 0 ? cout : null,
  };
}
