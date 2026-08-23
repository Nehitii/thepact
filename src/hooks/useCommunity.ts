/* COMMUNITY — le point d entree.
 *
 * Ce fichier portait 961 lignes, seize hooks et six interfaces : les
 * publications, les videos et les objectifs, trois domaines qui n ont
 * en commun que la page qui les affiche. Ils vivent maintenant chacun
 * dans le sien.
 *
 * Ce point d entree existe pour que rien n ait a changer d import :
 * les composants continuent de demander « @/hooks/useCommunity », et
 * ceux qui veulent etre precis peuvent viser directement le module. */

export * from "./community/types";
export * from "./community/usePublications";
export * from "./community/useVideos";
export * from "./community/useContexte";
