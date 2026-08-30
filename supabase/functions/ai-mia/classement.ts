import { TOOLS } from "./outils.ts";

/* ═══ CE QUI ÉCRIT, ET CE QUI SE CONTENTE DE LIRE ═══

   Le drapeau `mia_write_tools` (`coach_write_tools` jusqu'au 27/08)
   existe depuis mai et disait « Permet au coach IA de créer
   todos/journal/decisions ». Personne ne le lisait :
   M.I.A écrivait quoi qu'il arrive, y compris quand le réglage disait non.
   Un interrupteur qui ne coupe rien est pire que pas d'interrupteur — on
   croit la porte fermée.

   Les outils qui écrivent sont NOMMÉS UN PAR UN. Une règle par préfixe
   serait plus courte et moins sûre : le jour où quelqu'un ajoute
   `set_…` ou `archive_…`, elle le rangerait en lecture sans un mot. Le
   contrôle juste en dessous refuse de démarrer si un outil échappe aux
   deux colonnes — c'est la seule façon qu'un ajout ne passe pas en
   silence du mauvais côté. */
export const OUTILS_QUI_ECRIVENT = new Set([
  "create_todo", "create_journal_entry", "create_goal", "create_habit_goal",
  "create_calendar_event", "add_step", "add_wishlist_item",
  "complete_step", "complete_todo", "reschedule_step", "reschedule_todo",
]);

export const OUTILS_QUI_LISENT = new Set([
  "list_active_goals", "list_recent_journal", "list_user_values", "search_memory",
  "list_pacts", "list_steps", "list_todos", "list_calendar_events", "list_wishlist",
  "focus_summary", "health_summary", "finance_summary",
]);

/* LES OUTILS QU AUCUNE DES DEUX COLONNES NE RECLAME.

   La liste des noms est un PARAMETRE, avec les outils reels pour
   defaut : sans cela, le controle ne pourrait jamais etre vu
   ECHOUER, puisque la classification reelle est juste. Un balayage
   de mutations l a montre en laissant survivre « ne plus signaler
   les outils non classes » — la branche d erreur n etait atteinte
   par rien. */
export function outilsNonClasses(noms: string[] = TOOLS.map((o) => o.function.name)): string[] {
  return noms.filter((n) => !OUTILS_QUI_ECRIVENT.has(n) && !OUTILS_QUI_LISENT.has(n));
}

/* CE CONTROLE REFUSE DE DEMARRER si un outil echappe aux deux
   colonnes — c est la seule facon qu un ajout ne passe pas en
   silence du mauvais cote. */
export function verifierLaClassification(noms?: string[]): void {
  const inconnus = outilsNonClasses(noms);
  if (inconnus.length) {
    throw new Error(
      `Outils non classes (lecture ou ecriture ?) : ${inconnus.join(", ")}. ` +
      "Ajoute-les a OUTILS_QUI_ECRIVENT ou OUTILS_QUI_LISENT.",
    );
  }
}

export const OUTILS_LECTURE_SEULE = TOOLS.filter((o) => !OUTILS_QUI_ECRIVENT.has(o.function.name));
