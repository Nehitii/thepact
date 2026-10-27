/**
 * LA PORTE DU DOMAINE SOUHAITS.
 *
 * Une seule chose sort : `useCreatePactWishlistItem`, que la fiche
 * d objectif appelle pour poser un souhait depuis une piece.
 *
 * ═══════════════════════════════════════════════════════════════
 * IL Y A DEUX LISTES DE SOUHAITS DANS CETTE APPLICATION, ET LE HOOK
 * QUI PORTE LE NOM GENERIQUE EST CELUI DE L AUTRE.
 *
 *   CELLE-CI            `wishlist_items`, `wishlist_lists`
 *                       Des choses reelles a acquerir. Elle n est
 *                       jamais ecrite par un geste : useWishlistGoalSync
 *                       la fabrique a partir des pieces d objectif.
 *                       Hooks : usePactWishlist, useWishlistGoalSync,
 *                       useWishlistLists, useWishlistPieces.
 *
 *   CELLE DE LA BOUTIQUE `shop_wishlist`
 *                       Les parures qu on convoite, payables en bonds.
 *                       Hook : `hooks/useWishlist.ts` — le nom le plus
 *                       court pour le concept le moins central. Il
 *                       n est appele que par WishlistButton,
 *                       WishlistPanel et pages/Shop, tous de la
 *                       boutique, et il partira avec elle.
 *
 * C est pourquoi souhaits et boutique sont DEUX domaines : elles ne
 * partagent ni table, ni hook, ni composant — seulement un mot.
 *
 * `lib/wishlistDepot.ts` n est pas entre non plus. Son nom dit
 * « wishlist » mais ses cinq exports sont des aides de stockage, et le
 * compartiment s appelle `goal-images` ; `hooks/useDepotImages` n en
 * prend qu une constante, et sert aussi les videos de la communaute.
 * Le faire entrer rendrait la communaute dependante des souhaits.
 */
export { useCreatePactWishlistItem } from "./hooks/usePactWishlist";
