import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoStatus = 'active' | 'completed' | 'postponed';

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
}

export interface CreateTaskInput {
  name: string;
  deadline?: string | null;
  priority: TodoPriority;
  is_urgent: boolean;
  category?: string;
  task_type?: string;
}

const MAX_ACTIVE_TASKS = 30;

export function useTodoList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch active tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['todo-tasks', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('todo_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('is_urgent', { ascending: false })
        .order('priority', { ascending: false })
        .order('deadline', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as TodoTask[];
    },
    enabled: !!userId,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['todo-stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // First try to get existing stats
      let { data, error } = await supabase
        .from('todo_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no stats exist, create them
      if (!data) {
        const { data: newStats, error: insertError } = await supabase
          .from('todo_stats')
          .insert({ user_id: userId })
          .select()
          .single();
        
        if (insertError) throw insertError;
        data = newStats;
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
      
      // Check limit
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
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
      toast.success('Task created');
    },
    onError: (error: Error) => {
      if (error.message === 'LIMIT_REACHED') {
        toast.error('You\'ve reached the maximum number of active tasks. Complete existing tasks before adding new ones.');
      } else {
        toast.error('Failed to create task');
      }
    },
  });

  // Complete task mutation
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!userId) throw new Error('Not authenticated');
      
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Update task status
      const { error: taskError } = await supabase
        .from('todo_tasks')
        .update({ 
          status: 'completed' as TodoStatus,
          completed_at: now.toISOString()
        })
        .eq('id', taskId);
      
      if (taskError) throw taskError;

      // Add to history
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
        });
      
      if (historyError) throw historyError;

      // Update stats
      if (stats) {
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        let newMonthCount = stats.tasks_completed_month;
        let newYearCount = stats.tasks_completed_year;
        
        // Reset counters if month/year changed
        if (stats.current_month !== currentMonth) {
          newMonthCount = 0;
        }
        if (stats.current_year !== currentYear) {
          newYearCount = 0;
        }
        
        // Calculate streak
        let newStreak = stats.current_streak;
        const lastDate = stats.last_completion_date;
        
        if (!lastDate || lastDate !== today) {
          // Check if last completion was yesterday
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastDate === yesterdayStr) {
            newStreak = stats.current_streak + 1;
          } else if (lastDate !== today) {
            newStreak = 1; // Reset streak
          }
        }
        
        const newLongestStreak = Math.max(stats.longest_streak, newStreak);

        const { error: statsError } = await supabase
          .from('todo_stats')
          .update({
            score: stats.score + 10,
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_completion_date: today,
            tasks_completed_month: newMonthCount + 1,
            tasks_completed_year: newYearCount + 1,
            current_month: currentMonth,
            current_year: currentYear,
          })
          .eq('user_id', userId);
        
        if (statsError) throw statsError;
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats', userId] });
      queryClient.invalidateQueries({ queryKey: ['todo-history', userId] });
      toast.success('Task completed! +10 points');
    },
    onError: () => {
      toast.error('Failed to complete task');
    },
  });

  // Postpone task mutation
  const postponeTask = useMutation({
    mutationFn: async ({ taskId, newDeadline }: { taskId: string; newDeadline: string }) => {
      if (!userId) throw new Error('Not authenticated');

      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const { error } = await supabase
        .from('todo_tasks')
        .update({
          deadline: newDeadline,
          postpone_count: task.postpone_count + 1,
        })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
      toast.success('Task postponed');
    },
    onError: () => {
      toast.error('Failed to postpone task');
    },
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('todo_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
      toast.success('Task deleted');
    },
    onError: () => {
      toast.error('Failed to delete task');
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
        })
        .eq('id', input.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-tasks', userId] });
      toast.success('Task updated');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  // Clear history mutation
  const clearHistory = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('todo_history')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-history', userId] });
      toast.success('History cleared');
    },
    onError: () => {
      toast.error('Failed to clear history');
    },
  });

  // Generate insights based on history
  const insights = generateInsights(history, tasks);

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
  };
}

function generateInsights(history: TodoHistory[], activeTasks: TodoTask[]): string[] {
  const insights: string[] = [];
  
  if (history.length < 5) return insights;

  // Analyze completion times
  const completionHours = history.map(h => new Date(h.completed_at).getHours());
  const morningCount = completionHours.filter(h => h >= 6 && h < 12).length;
  const afternoonCount = completionHours.filter(h => h >= 12 && h < 18).length;
  const eveningCount = completionHours.filter(h => h >= 18 || h < 6).length;
  
  const total = morningCount + afternoonCount + eveningCount;
  if (total > 0) {
    if (morningCount / total > 0.5) {
      insights.push('You tend to complete most tasks in the morning.');
    } else if (afternoonCount / total > 0.5) {
      insights.push('You usually complete tasks better in the afternoon.');
    } else if (eveningCount / total > 0.5) {
      insights.push('You often finish tasks in the evening hours.');
    }
  }

  // Analyze postponements
  const frequentlyPostponed = activeTasks.filter(t => t.postpone_count >= 3);
  if (frequentlyPostponed.length > 0) {
    insights.push(`${frequentlyPostponed.length} task(s) have been postponed 3+ times.`);
  }

  // High priority analysis
  const highPriorityCompleted = history.filter(h => h.priority === 'high').length;
  const totalCompleted = history.length;
  if (highPriorityCompleted > 0 && totalCompleted > 10) {
    const ratio = highPriorityCompleted / totalCompleted;
    if (ratio < 0.2) {
      insights.push('High-priority tasks make up a small portion of your completions.');
    }
  }

  return insights.slice(0, 3); // Max 3 insights
}
