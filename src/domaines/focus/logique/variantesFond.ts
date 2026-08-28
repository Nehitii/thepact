/**
 * LES FONDS DISPONIBLES, SORTIS DU FICHIER DU COMPOSANT.
 *
 * `FocusFond.tsx` fait 639 lignes de rendu : c'est précisément le
 * fichier qu'on veut voir se rafraîchir sans recharger la page. Il ne
 * peut pas, tant qu'il exporte aussi cette liste.
 */
export type VarianteFond = "mycelium" | "aurores" | "maillage" | "maree" | "aucun";

export const VARIANTES_FOND: VarianteFond[] = ["mycelium", "aurores", "maillage", "maree", "aucun"];
