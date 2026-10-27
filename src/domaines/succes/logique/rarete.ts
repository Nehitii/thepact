/* L ECHELLE DES RARETES.
 *
 * Sortie du hook parce que la couche logique en a besoin : un fichier
 * de rang 1 ne peut pas remonter vers un hook. Le hook la reexporte,
 * donc aucun appelant ne bouge.
 */
/* L ordre des raretes, du plus commun au plus rare. La base les rend
   en desordre alphabetique, ce qui ferait passer « common » avant
   « rare » mais aussi « epic » avant « legendary ». */
export const RARETES = ["common", "uncommon", "rare", "epic", "mythic", "legendary"] as const;
export type Rarete = (typeof RARETES)[number];

export function rangDeRarete(r: string): number {
  const i = RARETES.indexOf(r as Rarete);
  return i < 0 ? 0 : i;
}
