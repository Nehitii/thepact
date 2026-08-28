import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/socle/supabase/client';
import { useAuth } from '@/socle/contextes/AuthContext';
import { toast } from 'sonner';
import i18n from '@/socle/i18n/i18n';
import { trackTodoCompleted } from '@/domaines/succes';

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

const MAX_ACTIVE_TASKS = 30;

/* « Aujourd hui » se lit dans le fuseau de l utilisateur, pas a
   Greenwich. toISOString() renvoie la date UTC : une tache terminee a
   00 h 30 a Paris comptait pour la veille, et cassait une serie qui
   aurait du tenir. */
const cleDuJour = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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

      if (tasks.length >= MAX_ACTIVE_TASKS) {
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

      // Update stats
      if (stats) {
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        let newMonthCount = stats.tasks_completed_month;
        let newYearCount = stats.tasks_completed_year;

        if (stats.current_month !== currentMonth) newMonthCount = 0;
        if (stats.current_year !== currentYear) newYearCount = 0;

        let newStreak = stats.current_streak;
        const lastDate = stats.last_completion_date;

        if (!lastDate || lastDate !== today) {
          const hier = new Date(now);
          hier.setDate(hier.getDate() - 1);
          if (lastDate === cleDuJour(hier)) {
            newStreak = stats.current_streak + 1;
          } else {
            newStreak = 1;
          }
        }

        const newLongestStreak = Math.max(stats.longest_streak, newStreak);

        const { error: statsError } = await supabase.rpc('record_todo_completion', {
          p_score_increment: 10,
          p_new_streak: newStreak,
          p_longest_streak: newLongestStreak,
          p_completion_date: today,
          p_month_count: newMonthCount + 1,
          p_year_count: newYearCount + 1,
          p_current_month: currentMonth,
          p_current_year: currentYear,
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
    maxTasks: MAX_ACTIVE_TASKS,
    canAddTask: tasks.length < MAX_ACTIVE_TASKS,
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
function genererAnalyses(history: TodoHistory[], activeTasks: TodoTask[]): TodoInsight[] {
  const analyses: TodoInsight[] = [];

  if (history.length < 5) return analyses;

  const heures = history.map((h) => new Date(h.completed_at).getHours());
  const matin = heures.filter((h) => h >= 6 && h < 12).length;
  const apresMidi = heures.filter((h) => h >= 12 && h < 18).length;
  const soir = heures.filter((h) => h >= 18 || h < 6).length;

  const total = matin + apresMidi + soir;
  if (total > 0) {
    if (matin / total > 0.5) analyses.push({ cle: 'todo.insights.morning' });
    else if (apresMidi / total > 0.5) analyses.push({ cle: 'todo.insights.afternoon' });
    else if (soir / total > 0.5) analyses.push({ cle: 'todo.insights.evening' });
  }

  const souventReportees = activeTasks.filter((t) => t.postpone_count >= 3);
  if (souventReportees.length > 0) {
    analyses.push({ cle: 'todo.insights.postponed', params: { count: souventReportees.length } });
  }

  const hautesTerminees = history.filter((h) => h.priority === 'high').length;
  if (hautesTerminees > 0 && history.length > 10 && hautesTerminees / history.length < 0.2) {
    analyses.push({ cle: 'todo.insights.fewHighPriority' });
  }

  return analyses.slice(0, 3);
}
