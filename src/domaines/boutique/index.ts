/**
 * LA PORTE DU DOMAINE BOUTIQUE.
 *
 * Six hooks sortent, pour quatre lecteurs :
 *
 *   useShopModules / useUserModulePurchases  la barre laterale, qui
 *       grise les modules non debloques ; l ecran d administration
 *   useBondBalance                           la barre neurale
 *   useUserShop                              l accueil et la fiche
 *       d objectif, pour la parure portee
 *   useShopFrames / useShopBanners /
 *   useUserCosmetics                         l ecran d administration
 *
 * Les vingt-cinq composants, les quatre modules de filtrage, l achat,
 * l essayage, les offres du jour : rien de tout cela ne sort.
 *
 * `hooks/useWishlist.ts` EST ICI, ET C EST TOUT LE POINT. Il porte le
 * nom le plus court du depot pour le concept le moins central : il lit
 * `shop_wishlist`, les parures qu on convoite, et non `wishlist_items`,
 * la liste du pacte. Ses trois appelants sont dans ce domaine. Ranger
 * n a rien renomme — l ADRESSE suffit desormais a lever l ambiguite.
 *
 * DEUX CHOSES SONT RESTEES DEHORS.
 *
 * `components/ui/bond-icon.tsx` est une primitive : trois ecrans hors
 * boutique affichent le symbole des bonds. Il ira au socle.
 *
 * `pages/AdminCosmeticsManager.tsx` (812 lignes) gere les parures, mais
 * il n importe RIEN de la boutique — il parle a la base directement, et
 * il vit avec sept autres pages d administration. Ce groupe est un
 * domaine que le plan n avait pas prevu ; on ne l entame pas par un
 * bout.
 */
export {
  useShopModules,
  useUserModulePurchases,
  useBondBalance,
  useUserShop,
  useShopFrames,
  useShopBanners,
  useUserCosmetics,
} from "./hooks/useShop";

/* LES CODES PROMO. Ils se creent a l administration et se consomment
   a la boutique : un seul module, deux audiences. Le concept est
   commercial, donc il vit ici, et l administration passe par la
   porte comme tout le monde. */
export {
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
} from "./hooks/usePromoCodes";
export type { PromoCode } from "./hooks/usePromoCodes";
