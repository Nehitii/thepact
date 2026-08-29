import { supabase } from "@/socle/supabase/client";
import type { TodoTask } from "@/domaines/taches/types";

/* LA LECTURE DES TACHES ACTIVES.
 *
 * Sortie du hook parce qu elle sert AUSSI au prechargement de fond,
 * qui n a pas de composant et ne peut donc pas appeler un hook.
 * Trente taches au plus : au-dela, une liste cesse d etre une liste.
 */
export const MAX_TACHES_ACTIVES = 30;
// Reusable fetcher — used by useTodoList and by background prefetch.
export async function fetchTodoTasks(userId: string | undefined): Promise<TodoTask[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('todo_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as TodoTask[];
}
