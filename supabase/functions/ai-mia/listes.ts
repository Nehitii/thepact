/* ═══════════════════════════════════════════════════════════════
   UNE LISTE COUPEE DOIT LE DIRE.

   Cinq outils rendent une liste bornee. Ils rendaient un TABLEAU NU :
   le modele recevait trente lignes et n avait aucun moyen de savoir
   s il y en avait trente ou trois cents. Il repondait donc sur ce
   qu il voyait, avec l assurance de qui a tout vu.

   MESURE LE 30/08/2026, sonde tiree sur la vraie base :

     list_wishlist     plafond 30, QUATRE-VINGT-TROIS articles — coupe
     list_active_goals plafond 20, VINGT-QUATRE objectifs — coupe
     list_recent_journal plafond 10, sept entrees — entiere
     list_todos        plafond 30, QUATRE taches actives — entiere

   Deux outils sur quatre coupaient au moment de la mesure, et aucun ne
   le disait. « Tu as trente souhaits » etait faux de cinquante-trois.

   LIST_TODOS MERITE SA NUANCE, parce que je l ai d abord comptee de
   travers : la table porte soixante-quinze taches, mais l outil filtre
   sur les ACTIVES sauf demande contraire, et il n y en a que quatre.
   La coupe l attend derriere « include_done » — soixante et onze
   taches terminees s ajoutent alors, et le plafond de trente mord.

   LA SONDE : on demande UNE LIGNE DE PLUS que le plafond. Si elle
   arrive, c est qu il y en a au moins une au-dela — on la jette et on
   leve le drapeau. Une requete, pas deux ; pas de `count` separe qui
   pourrait desaccorder avec les lignes rendues.
   ═══════════════════════════════════════════════════════════════ */

/** Ce qu un outil de liste rend desormais, coupe ou non. */
export interface ListeRendue<T> {
  lignes: T[];
  /** Vrai s il existe au moins une ligne au-dela du plafond. */
  coupe: boolean;
  /** Le plafond applique — ce que redemander avec un `limit` plus grand. */
  plafond: number;
}

/* CE QU IL FAUT DEMANDER A LA BASE pour savoir si l on coupe. */
export function pourSonder(plafond: number): number {
  return plafond + 1;
}

/* ON REND AU PLUS `plafond` LIGNES, et on dit si la sonde a mordu.
 *
 * `lues` est ce que la requete a rapporte quand on lui a demande
 * `pourSonder(plafond)`. Trois cas :
 *   moins que le plafond   la liste est entiere
 *   exactement le plafond  entiere aussi — la sonde n a rien ramene
 *   plafond + 1            il y en a plus ; on jette la sonde
 */
export function listeRendue<T>(lues: readonly T[] | null | undefined, plafond: number): ListeRendue<T> {
  const toutes = lues ?? [];
  const coupe = toutes.length > plafond;
  return { lignes: coupe ? toutes.slice(0, plafond) : [...toutes], coupe, plafond };
}
