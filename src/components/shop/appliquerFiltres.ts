import type { ShopFilterState } from "./ShopFilters";

/**
 * LE FILTRE DE LA BOUTIQUE, SORTI DU FICHIER DE SON PANNEAU.
 *
 * Le panneau est un composant ; le filtre est une fonction pure. Les
 * garder ensemble faisait retomber Fast Refresh sur un rechargement
 * complet a chaque retouche du panneau.
 */
export function applyShopFilters<T extends { name: string; rarity?: string; price?: number; is_default?: boolean }>(
  items: T[],
  filters: ShopFilterState,
  isOwned: (item: T) => boolean
): T[] {
  let filtered = [...items];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(searchLower)
    );
  }

  // Rarity filter
  if (filters.rarity !== "all") {
    filtered = filtered.filter(item => item.rarity === filters.rarity);
  }

  // Hide owned filter
  if (filters.hideOwned) {
    filtered = filtered.filter(item => !isOwned(item) && !item.is_default);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (filters.sort) {
      case "price-asc":
        return (a.price || 0) - (b.price || 0);
      case "price-desc":
        return (b.price || 0) - (a.price || 0);
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "rarity": {
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
        return (rarityOrder[a.rarity as keyof typeof rarityOrder] ?? 4) - 
               (rarityOrder[b.rarity as keyof typeof rarityOrder] ?? 4);
      }
      default:
        return 0;
    }
  });

  return filtered;
}
