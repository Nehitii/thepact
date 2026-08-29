import { lazy } from "react";

/**
 * LA PORTE DU DOMAINE SUCCES.
 *
 * Elle est plus large que les autres, et c est SA FONCTION : le
 * compteur de gestes est appele par tout le monde. Onze fichiers de six
 * domaines lui disent « ceci vient d arriver » — une guilde rejointe,
 * une piece acquise, un mois valide, un objectif termine.
 *
 * Un domaine qui ecoute tous les autres n est pas mal borne ; il est
 * transversal PAR NATURE, comme un journal d evenements. Ce qui compte,
 * c est que la fleche aille toujours dans le meme sens : les domaines
 * lui PARLENT, il ne les interroge jamais.
 *
 * CE DOMAINE A ETE DECOUPE DANS UN PLUS GROS. Le releve annoncait
 * « profil, 55 fichiers » avec une porte de vingt et un exports — le
 * signe qu il y avait plus d un domaine dedans. En le lisant, deux
 * choses se separaient nettement : le COMPTE (reglages, second facteur,
 * portabilite, vie privee) et les SUCCES (compteurs, rangs, ordres du
 * jour, pantheon). Ils ne partagent qu une table, `profiles`, que la
 * moitie de l application lit de toute facon.
 */

/* ── Le compteur de gestes ───────────────────────────────── */
export {
  rarityColors,
  initializeAchievementTracking,
  trackLogin,
  resynchroniserCompteurs,
  trackGoalCreated,
  trackGoalCompleted,
  trackStepCompleted,
  trackPactCreated,
  trackPactEdited,
  trackTodoCompleted,
  trackPomodoroCompleted,
  trackJournalEntry,
  trackFriendAdded,
  trackGuildJoined,
  trackGuildMessageSent,
  trackCommunityPost,
  trackCalendarEventCreated,
  trackWishlistItemAdded,
  trackWishlistItemAcquired,
  trackModulePurchased,
  trackCosmeticPurchased,
  trackBondsSpent,
  trackTransactionLogged,
  trackFinanceMonthValidated,
} from "./logique/achievements";

export { useRankXP } from "./hooks/useRankXP";

/* ── LES TROIS COMPOSANTS SONT DERRIERE UN `lazy`, ET IL A FALLU
 *    MESURER POUR LE COMPRENDRE.
 *
 * `AuthContext` importe cette porte — il appelle `trackLogin` a chaque
 * connexion — et il vit dans le paquet de demarrage. Une porte qui
 * exporte STATIQUEMENT un composant y traine donc tout son arbre
 * d interface.
 *
 * Mesure faite : le paquet d entree est passe de 438 019 a 451 907
 * octets, +13 888. En comparant les deux versions litteral par
 * litteral, TREIZE morceaux avaient ete absorbes — alert-dialog,
 * input, select, switch, label, slider, textarea, scroll-area,
 * progress, console-ui et sa feuille, deux icones. Tous tires par
 * `RanksCard`, que personne ne rend au demarrage.
 *
 * C est exactement le piege de `MiaConsole` au premier domaine, et je
 * suis retombe dedans parce que la porte etait ecrite avant la mesure.
 * Le `lazy` vit donc ici : le domaine possede son propre decoupage.
 *
 * Leurs trois lecteurs — l accueil, la banniere, les reglages de
 * pacte — sont tous dans des pages chargees en differe, donc sous la
 * frontiere Suspense d `App.tsx`. */
export const RankCore = lazy(() =>
  import("./composants/RankCore").then((m) => ({ default: m.RankCore })),
);
export const RanksCard = lazy(() =>
  import("./composants/RanksCard").then((m) => ({ default: m.RanksCard })),
);
export const DailyQuestsPanel = lazy(() =>
  import("./composants/DailyQuestsPanel").then((m) => ({ default: m.DailyQuestsPanel })),
);

/* Le niveau est un rang dans une liste : deux domaines le lisent —
   l accueil pour son bandeau, le profil pour sa fiche publique. */
export { niveauDuRang } from "@/domaines/succes/logique/rang";
