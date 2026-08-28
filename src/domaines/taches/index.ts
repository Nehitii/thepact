/**
 * LA PORTE DU DOMAINE TACHES.
 *
 * Trois choses sortent, et l une d elles est la PREMIERE VRAIE FLECHE
 * ENTRE DEUX DOMAINES du depot :
 *
 *   useTodoList     — le prechargement, et l agenda qui lit les taches
 *   natureDe / …    — l agenda, pour savoir si une tache est un
 *                     rendez-vous ou une echeance
 *   useTodoReminders — l accueil
 *
 * L AGENDA DEPEND DES TACHES, PAS L INVERSE. `useCalendarEvents`
 * interroge `todo_tasks` et importe `natureDe` ; du cote des taches, le
 * seul « Calendar » qu on trouve est une icone de lucide et le
 * calendrier de shadcn. Deux domaines, une fleche — c est pour cela
 * qu ils ne sont PAS un seul domaine de quarante-trois fichiers.
 *
 * DEUX CHOSES ONT ETE ECARTEES SUR LEUR NOM.
 *
 * `hooks/usePointages.ts` — « pointage » evoque une liste a cocher.
 * C est une ligne par prelevement constate, avec son montant reel ; ses
 * deux appelants parlent d argent. Il est parti chez la finance.
 *
 * `useDailyQuests` et `DailyQuestsPanel` — les ordres du jour lisent
 * `daily_quests`, avec saison, statut et recompense en bonds. C est de
 * la gamification, pas une liste de taches. Ils partiront avec le
 * profil, qui tient deja les rangs, les succes et les saisons.
 */
export { useTodoList, fetchTodoTasks } from "./hooks/useTodoList";
export type { TodoTask, TodoTaskType } from "./hooks/useTodoList";
export { useTodoReminders } from "./hooks/useTodoReminders";
export { natureDe, estRendezVous } from "./logique/natures";
