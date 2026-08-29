import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTodoTasks, MAX_TACHES_ACTIVES } from "@/domaines/taches/logique/lectureDesTaches";
import { genererAnalyses } from "@/domaines/taches/logique/analyses";
import { avancerLaSerie, cleDuJour } from "@/domaines/taches/logique/serie";
import { supabase } from '@/socle/supabase/client';
import { useAuth } from '@/socle/contextes/AuthContext';
import { toast } from 'sonner';
import i18n from '@/socle/i18n/i18n';
import { trackTodoCompleted } from '@/domaines/succes';

// Types — voir `../types.ts`. Reexportes ici : quarante fichiers les
// importaient deja depuis ce hook, et les renommer tous n aurait rien
// rendu plus clair.
import type {
  TodoPriority, TodoStatus, TodoTaskType, ReminderFrequency,
  TodoTask, TodoStats, TodoHistory, CreateTaskInput, TodoInsight,
} from "@/domaines/taches/types";
export type {
  TodoPriority, TodoStatus, TodoTaskType, ReminderFrequency,
  TodoTask, TodoStats, TodoHistory, CreateTaskInput, TodoInsight,
};

/* CE CROCHET NE PARLAIT QU ANGLAIS
 *
 * Il contenait dix-neuf phrases destinees a l utilisateur — les quatorze
 * messages de confirmation et d erreur, et les analyses d habitudes — et
 * pas un seul appel de traduction. Elles seraient restees en anglais
 * quelle que soit la langue choisie.
 *
 * Un crochet n est pas un composant : il n a pas acces au « t » de
 * react-i18next. Il s adresse donc directement a l instance, qui est la
 * meme et qui est initialisee avant le premier rendu.
 */
const tr = (cle: string, params?: Record<string, unknown>) => i18n.t(cle, params) as string;

export { fetchTodoTasks };

export function useTodoList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch active tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['todo-tasks', userId],
    queryFn: () => fetchTodoTasks(userId),
    enabled: !!userId,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['todo-stats', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: existantes, error } = await supabase
        .from('todo_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      let data = existantes;

      // If no stats exist, create them via SECURITY DEFINER RPC
      if (!data) {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('init_todo_stats');
        if (rpcError) throw rpcError;
        /* La fonction rend la ligne qu'elle vient de créer, typée Json
           côté client. Le `as TodoStats` juste dessous est le seul endroit
           où l'on affirme sa forme, et il ne bouge pas. */
        data = rpcResult as unknown as typeof existantes;
      }

      return data as TodoStats;
    },
    enabled: !!userId,
  });

  // Fetch history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['todo-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('todo_history')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as TodoHistory[];
    },
    enabled: !!userId,
  });

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      if (!userId) throw new Error('Not authenticated');

      if (tasks.length >= MAX_TACHES_ACTIVES) {
        throw new Error('LIMIT_REACHED');
      }

      const { data, error } = await supabase
        .from('todo_tasks')
        .insert({
          user_id: userId,
          name: input.name,
          deadline: input.deadline || null,
          priority: input.priority,
          is_urgent: input.is_urgent,
          category: input.category || 'general',
          task_type: input.task_type || 'flexible',
          reminder_enabled: input.reminder_enabled || false,
          reminder_frequency: input.reminder_frequency || null,
          location: input.location || null,
          appointment_time: input.appointment_time || null,
          /* Une tache nouvelle se pose en tete du rangement manuel, pas
             au fond d une liste ou personne ne la verra. */
          position: tasks.reduce((min, t) => Math.min(min, t.position ?? 0), 0) - 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
      toast.success(tr('todo.toasts.created'));
    },
    onError: (error: Error) => {
      toast.error(error.message === 'LIMIT_REACHED' ? tr('todo.toasts.limitReached') : tr('todo.toasts.createFailed'));
    },
  });

  // Complete task mutation
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!userId) throw new Error('Not authenticated');

      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const now = new Date();
      const today = cleDuJour(now);

      const { error: taskError } = await supabase
        .from('todo_tasks')
        .update({ status: 'completed' as TodoStatus, completed_at: now.toISOString() })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (taskError) throw taskError;

      /* Trois ecritures se suivent sans transaction : si la deuxieme
         echoue, la tache serait terminee et introuvable dans
         l historique. A defaut d une procedure unique cote serveur, on
         defait ce qu on vient de faire. */
      const { error: historyError } = await supabase
        .from('todo_history')
        .insert({
          user_id: userId,
          task_name: task.name,
          priority: task.priority,
          was_urgent: task.is_urgent,
          postpone_count: task.postpone_count,
          category: task.category || 'general',
          task_type: task.task_type || 'flexible',
          reminder_frequency: task.reminder_frequency,
          location: task.location,
        });

      if (historyError) {
        await supabase
          .from('todo_tasks')
          .update({ status: 'active' as TodoStatus, completed_at: null })
          .eq('id', taskId)
          .eq('user_id', userId);
        throw historyError;
      }

      /* La serie et les compteurs se calculent dans
         `logique/serie.ts` : ils ne dependent que des compteurs d hier
         et de l heure qu il est, et une serie fausse affiche un nombre
         plausible. */
      if (stats) {
        const a = avancerLaSerie(stats, now);
        const { error: statsError } = await supabase.rpc('record_todo_completion', {
          p_score_increment: 10,
          p_new_streak: a.serie,
          p_longest_streak: a.plusLongueSerie,
          p_completion_date: a.jour,
          p_month_count: a.compteDuMois,
          p_year_count: a.compteDeLAnnee,
          p_current_month: a.mois,
          p_current_year: a.annee,
        });

        if (statsError) throw statsError;
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats', userId] });
      queryClient.invalidateQueries({ queryKey: ['todo-history', userId] });
      /* Voir useTheCall : le pouls de la barre systeme compte ce geste. */
      queryClient.invalidateQueries({ queryKey: ['pouls-du-jour'] });
      toast.success(tr('todo.toasts.completed', { points: 10 }));
      if (userId) trackTodoCompleted(userId);
    },
    onError: () => {
      toast.error(tr('todo.toasts.completeFailed'));
    },
  });

  // Postpone task mutation
  const postponeTask = useMutation({
    mutationFn: async ({ taskId, newDeadline }: { taskId: string; newDeadline: string }) => {
      if (!userId) throw new Error('Not authenticated');

      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const { error } = await supabase
        .from('todo_tasks')
        .update({ deadline: newDeadline, postpone_count: task.postpone_count + 1 })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
      toast.success(tr('todo.toasts.postponed'));
    },
    onError: () => {
      toast.error(tr('todo.toasts.postponeFailed'));
    },
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('todo_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
      toast.success(tr('todo.toasts.deleted'));
    },
    onError: () => {
      toast.error(tr('todo.toasts.deleteFailed'));
    },
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      deadline: string | null;
      priority: TodoPriority;
      is_urgent: boolean;
      category: string;
      task_type: string;
      reminder_enabled?: boolean;
      reminder_frequency?: ReminderFrequency | null;
      location?: string | null;
      appointment_time?: string | null;
    }) => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('todo_tasks')
        .update({
          name: input.name,
          deadline: input.deadline,
          priority: input.priority,
          is_urgent: input.is_urgent,
          category: input.category,
          task_type: input.task_type,
          reminder_enabled: input.reminder_enabled ?? false,
          reminder_frequency: input.reminder_frequency ?? null,
          location: input.location ?? null,
          appointment_time: input.appointment_time ?? null,
        })
        .eq('id', input.id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
      toast.success(tr('todo.toasts.updated'));
    },
    onError: () => {
      toast.error(tr('todo.toasts.updateFailed'));
    },
  });

  // Clear history mutation
  const clearHistory = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase.from('todo_history').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-history', userId] });
      /* Voir useTheCall : le pouls de la barre systeme compte ce geste. */
      queryClient.invalidateQueries({ queryKey: ['pouls-du-jour'] });
      toast.success(tr('todo.toasts.historyCleared'));
    },
    onError: () => {
      toast.error(tr('todo.toasts.historyClearFailed'));
    },
  });

  // Reorder tasks mutation (for drag & drop)
  const reorderTasks = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      if (!userId) throw new Error('Not authenticated');

      /* Une requete par tache — trente pour un seul geste — et pas une
         seule dont on regardait le resultat : la mutation se declarait
         reussie meme si tout avait echoue. Un seul appel, verifie. */
      const parId = new Map(tasks.map((t) => [t.id, t]));
      const lignes = orderedIds
        .map((id, index) => {
          const t = parId.get(id);
          return t ? { id, user_id: userId, name: t.name, position: index } : null;
        })
        .filter(Boolean) as { id: string; user_id: string; name: string; position: number }[];

      if (lignes.length === 0) return;

      const { error } = await supabase.from('todo_tasks').upsert(lignes, { onConflict: 'id' });
      if (error) throw error;
    },
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['todo-tasks', userId] });
      const previous = queryClient.getQueryData<TodoTask[]>(['todo-tasks', userId]);
      if (previous) {
        const ordered = orderedIds
          .map((id, i) => {
            const task = previous.find((t) => t.id === id);
            return task ? { ...task, position: i } : null;
          })
          .filter(Boolean) as TodoTask[];
        queryClient.setQueryData(['todo-tasks', userId], ordered);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['todo-tasks', userId], context.previous);
      }
      toast.error(tr('todo.toasts.reorderFailed'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
    },
  });

  // Les analyses etaient recalculees a chaque rendu.
  const insights = useMemo(() => genererAnalyses(history, tasks), [history, tasks]);

  return {
    tasks,
    stats,
    history,
    insights,
    isLoading: tasksLoading || statsLoading,
    historyLoading,
    activeTaskCount: tasks.length,
    maxTasks: MAX_TACHES_ACTIVES,
    canAddTask: tasks.length < MAX_TACHES_ACTIVES,
    createTask,
    completeTask,
    postponeTask,
    deleteTask,
    updateTask,
    clearHistory,
    reorderTasks,
  };
}

/* Les analyses rendaient des phrases anglaises toutes faites. Elles
   rendent maintenant des cles : c est la page qui les traduit. */
