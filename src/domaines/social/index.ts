/**
 * LA PORTE DU DOMAINE SOCIAL.
 *
 * Cinquante-huit fichiers, quatorze mille lignes — le plus gros du
 * depot — et une porte de SEPT exports. Ce n est pas une contradiction :
 * ce qui se passe entre deux personnes ne concerne que les ecrans qui
 * montrent deux personnes. Le reste de l application n en veut que des
 * COMPTEURS.
 *
 *   useMessagesEnDirect / useMessagesNonLus  la coquille, la barre
 *       laterale, la barre du bas — pour la pastille de messages
 *   usePendingFriendCount                    la pastille d alliances
 *   useNotifications                         la pastille d avis
 *   useNotificationSettings                  l ecran de notifications
 *   useFriends                               les contrats d objectif et
 *       le partage : ils demandent qui peut etre temoin
 *   OnlineStatusPing                         monte dans AppProviders
 *
 * POURQUOI UN SEUL DOMAINE, ET NON QUATRE.
 *
 * Le releve du 28/08 comptait guildes, allies, communaute, classement
 * et messagerie comme cinq modules. On a mesure le couplage AVANT de
 * decouper, comme pour l agenda et les souhaits — et cette fois la
 * reponse est l inverse :
 *
 *   guildes  → allies      2 fichiers      allies → guildes    3
 *   guildes  → communaute  5 fichiers      allies → communaute 1
 *
 * Bidirectionnel et dense. L agenda lisait les taches sans que les
 * taches sachent qu un calendrier existe ; ici les trois se citent
 * mutuellement. Les separer aurait produit trois portes qui se
 * renvoient la balle, ce qui n est pas une frontiere mais un couloir.
 *
 * `usePushNotifications` N EST PAS ICI : c est l abonnement Web Push du
 * navigateur, et son seul appelant est l ecran de notifications du
 * profil. Il y est parti.
 */
export { useMessagesEnDirect, useMessagesNonLus } from "./hooks/useMessages";
export { usePendingFriendCount } from "./hooks/usePendingFriendCount";
export { useNotifications, useNotificationSettings } from "./hooks/useNotifications";
export { useFriends } from "./hooks/useFriends";
export { OnlineStatusPing } from "./composants/OnlineStatusPing";
