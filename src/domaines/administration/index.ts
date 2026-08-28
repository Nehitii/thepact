/**
 * LA PORTE DU DOMAINE ADMINISTRATION.
 *
 * Deux choses sortent, et toutes deux pour `app/AdminRoute.tsx` :
 *
 *   PorteAdmin           l ecran qui demande le second facteur avant
 *                        de laisser entrer
 *   useServerAdminCheck  la verification cote serveur du role
 *
 * `AdminRoute` RESTE DANS `app/`, ET C EST DELIBERE : il compose la
 * coquille — AppSidebar, MobileBottomNav, ProtectedRoute — et un
 * domaine n a pas a importer la coquille. Il prend donc ses trois
 * pieces par cette porte, comme n importe quel autre lecteur.
 *
 * (Une premiere version exportait aussi `useAdminMode` — le fichier
 * porte ce nom mais n exporte pas cette fonction : il tient
 * `useIsAdmin` et les cinq forcages de l administrateur. Le
 * compilateur l a dit tout de suite.)
 *
 * Les huit pages ne sont pas ici : `app/prefetchRoutes` et `App.tsx`
 * les chargent en differe, une par route.
 *
 * CE DOMAINE N ETAIT PAS AU PLAN. Il est apparu en rangeant la
 * boutique : `AdminCosmeticsManager` (812 lignes) gere les parures mais
 * n importe RIEN de la boutique — il parle a la base directement. En le
 * suivant on a trouve sept autres pages d administration, quatre
 * composants et quatre hooks, tous entre eux. Un domaine complet que le
 * releve par nom de dossier n avait pas vu, parce qu il etait deja
 * range par audience et non par sujet.
 */
export { PorteAdmin } from "./composants/PorteAdmin";
export { useServerAdminCheck } from "./hooks/useServerAdminCheck";
