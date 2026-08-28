/* LES TYPES DU DOMAINE TACHES.
 *
 * Ils etaient declares en tete de `hooks/useTodoList.ts`, et deux
 * fichiers de logique — `natures.ts`, `valeursTache.ts` — importaient
 * donc un hook React pour connaitre la forme d une tache. La garde des
 * couches l a signale deux fois de plus, apres ExpressionMia,
 * ObjetClause et FinanceCategory.
 *
 * QUATRIEME FOIS LE MEME MOTIF, DONC ON LE TRAITE EN ENTIER : ce ne
 * sont pas les deux types genants qui descendent, ce sont les 9.
 * `useTodoList` les reexporte, pour ne casser aucun appelant.
 */

export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoStatus = 'active' | 'completed' | 'postponed';
export type TodoTaskType = 'flexible' | 'waiting' | 'rendezvous' | 'deadline';
export type ReminderFrequency = 'weekly' | 'monthly' | 'bimonthly' | 'semiannual' | 'yearly';

export interface TodoTask {
  id: string;
  user_id: string;
  name: string;
  deadline: string | null;
  priority: TodoPriority;
  is_urgent: boolean;
  status: TodoStatus;
  postpone_count: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  category: string | null;
  task_type: string | null;
  position: number;
  reminder_enabled: boolean;
  reminder_frequency: ReminderFrequency | null;
  reminder_last_sent: string | null;
  location: string | null;
  appointment_time: string | null;
}

export interface TodoStats {
  id: string;
  user_id: string;
  score: number;
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
  tasks_completed_month: number;
  tasks_completed_year: number;
  current_month: number;
  current_year: number;
}

export interface TodoHistory {
  id: string;
  user_id: string;
  task_name: string;
  priority: TodoPriority;
  was_urgent: boolean;
  completed_at: string;
  postpone_count: number;
  category: string | null;
  task_type: string | null;
  reminder_frequency: string | null;
  location: string | null;
}

export interface CreateTaskInput {
  name: string;
  deadline?: string | null;
  priority: TodoPriority;
  is_urgent: boolean;
  category?: string;
  task_type?: TodoTaskType;
  reminder_enabled?: boolean;
  reminder_frequency?: ReminderFrequency | null;
  location?: string | null;
  appointment_time?: string | null;
}

/** Une analyse d habitude : une cle et ses valeurs, traduites a l affichage. */
export interface TodoInsight {
  cle: string;
  params?: Record<string, unknown>;
}
