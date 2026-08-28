/* Une source d evenement peut etre une tache : la nature vient donc
   du domaine taches, par sa porte. C est la fleche agenda → taches,
   la meme qu au niveau des hooks, ici au niveau des types. */
import type { TodoTaskType } from "@/domaines/taches";

/* LES TYPES DU DOMAINE AGENDA.
 *
 * Ils etaient declares au milieu de `hooks/useCalendarEvents.ts`, entre
 * l expansion des recurrences et les requetes, et `logique/sources.ts`
 * importait donc un hook React pour connaitre la forme d un evenement.
 *
 * CINQUIEME FOIS LE MEME MOTIF — apres ExpressionMia, ObjetClause,
 * FinanceCategory et les neuf types des taches. Un type declare la ou il
 * sert d abord finit toujours par tirer sa couche derriere lui.
 * `useCalendarEvents` les reexporte.
 */

export interface RecurrenceRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  byDay?: string[];
  bySetPos?: number[];
  count?: number;
  until?: string;
}

export type CalendarSourceType = "event" | "todo" | "goal" | "step";

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  color: string;
  category: string;
  recurrence_rule: RecurrenceRule | null;
  recurrence_parent_id: string | null;
  recurrence_exception: boolean;
  reminders: { type: string; minutes_before: number }[];
  is_busy: boolean;
  linked_goal_id: string | null;
  linked_todo_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  _virtual?: boolean;
  _originalStart?: string;
  _source?: CalendarSourceType;
  _sourceId?: string; // original ID from the source table
  /* CE QU EST l entree, quand sa source ne suffit pas a le dire.
     Une tache importee arrivait indifferenciee : rendez-vous,
     echeance ou tache souple avaient la meme couleur et la meme
     icone. La source dit D OU ca vient ; la nature dit ce que c est. */
  _nature?: TodoTaskType;
}

/* LES CHAMPS EN « _ » N'ONT PAS DE COLONNE : ce sont des marqueurs posés
   par l'application pour se souvenir d'où vient une entrée et de ce
   qu'elle est. « _nature » manquait à cette liste — il pouvait donc partir
   dans un insert, où PostgREST l'aurait refusé (« column _nature does not
   exist »). Le cast « as any » sur l'insert rendait ce départ muet. */
export type CalendarEventInsert = Omit<
  CalendarEvent,
  "id" | "user_id" | "created_at" | "updated_at" | "_virtual" | "_originalStart" | "_source" | "_sourceId" | "_nature"
>;
