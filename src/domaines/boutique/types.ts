/* LES TYPES DU FILTRE DE LA BOUTIQUE.
 *
 * Ils etaient declares dans `composants/ShopFilters.tsx`, et
 * `logique/appliquerFiltres.ts` importait donc un composant React pour
 * connaitre la forme d un filtre.
 *
 * L IRONIE VAUT D ETRE NOTEE : `appliquerFiltres.ts` s ouvre sur « LE
 * FILTRE DE LA BOUTIQUE, SORTI DU FICHIER DE SON PANNEAU ». Quelqu un
 * avait deja sorti la FONCTION ; les TYPES etaient restes derriere, et
 * ils suffisaient a maintenir la dependance.
 *
 * Sixieme fois le meme motif, apres ExpressionMia, ObjetClause,
 * FinanceCategory, les neuf des taches et les quatre de l agenda.
 */
export type SortOption = "price-asc" | "price-desc" | "name-asc" | "name-desc" | "rarity";
export type RarityFilter = "all" | "common" | "rare" | "epic" | "legendary";

export interface ShopFilterState {
  search: string;
  sort: SortOption;
  rarity: RarityFilter;
  hideOwned: boolean;
}
