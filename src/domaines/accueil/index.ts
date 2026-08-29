/* L ACCUEIL — la premiere page, et le seul domaine qui les lit tous.
 *
 * UNE PORTE VIDE, POUR LA MEME RAISON QUE L ANALYTIQUE : l accueil
 * CONSOMME huit domaines — objectifs, taches, sante, finance, succes,
 * boutique, profil, M.I.A. — et n est consomme par personne. Il n a
 * donc rien a exposer. Sa page entre par le routage, qui a le droit de
 * charger une page en differe sans passer par ici.
 *
 * C EST LE DOMAINE LE PLUS EXPOSE AU DEFAUT INVERSE : comme il affiche
 * un morceau de chaque module, la tentation est d aller chercher le
 * detail chez le voisin. Les huit fleches passent par les portes, et
 * la garde des domaines le verifie a chaque passage.
 *
 * SES FEUILLES SONT ENCORE GLOBALES, ET C EST UNE DETTE NOMMEE.
 * Aucun de ses quatorze fichiers n importe de CSS : tout vient de
 * main.tsx. Le releve du 29/08 a mesure ce qui lui revient dans
 * « styles/singularity.css » (615 lignes, chargee globalement) :
 *
 *     .singularity-*  (9 classes)  ->  NexusHeroBanner, ici
 *     .space-*       (10 classes)  ->  socle/ds/SpaceBackdrop
 *     .rank-core-*    (6 classes)  ->  domaines/succes/RankCore
 *     .singularity-nebula          ->  personne, morte
 *
 * La feuille se coupe donc en trois, plus une regle a supprimer. On ne
 * le fait pas ici : « theme-clair.css » redefinit seize de ces classes
 * et l ordre de chargement decide qui gagne. Domanialiser une feuille
 * globale change cet ordre, et cela se verifie a l ecran, en theme
 * clair — c est l instrument de l etape 4, pas celui du rangement.
 *
 * LE FOND STELLAIRE N ETAIT PAS D ICI. La carte des imports ne voyait
 * qu un appelant exterieur — la page Home, par le routage — et la
 * garde des domaines en a trouve trois de plus au premier passage :
 * Analytics, Goals et GoalsGraph importaient SpaceBackdrop. Un fond
 * partage par quatre pages de trois domaines n appartient a aucun : il
 * est parti au socle, hors du baril, comme Telemetrie — un composant
 * qu on met dans le baril, tout le monde le traine.
 */
export {};
