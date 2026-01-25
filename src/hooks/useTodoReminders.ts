import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Frequency mapping in days
const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  bimonthly: 60,
  semiannual: 180,
  yearly: 365,
};

export function useTodoReminders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch waiting tasks with reminders enabled
  const { data: waitingTasks = [] } = useQuery({
    queryKey: ['todo-waiting-reminders', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('todo_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('task_type', 'waiting')
        .eq('reminder_enabled', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });

  // Process reminders mutation
  const processReminders = useMutation({
    mutationFn: async () => {
      if (!userId || waitingTasks.length === 0) return { sent: 0 };

      const now = new Date();
      let sentCount = 0;

      for (const task of waitingTasks) {
        if (!task.reminder_frequency) continue;

        const frequencyDays = FREQUENCY_DAYS[task.reminder_frequency];
        if (!frequencyDays) continue;

        // Check if reminder should be sent
        let shouldSend = false;
        
        if (!task.reminder_last_sent) {
          // Never sent before, check if enough time passed since creation
          const createdAt = new Date(task.created_at);
          const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          shouldSend = daysSinceCreation >= frequencyDays;
        } else {
          // Check time since last reminder
          const lastSent = new Date(task.reminder_last_sent);
          const daysSinceLastSent = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));
          shouldSend = daysSinceLastSent >= frequencyDays;
        }

        if (shouldSend) {
          // Create notification
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              title: 'Waiting Task Reminder',
              description: `Your task "${task.name}" is still waiting. Follow up or mark it complete.`,
              category: 'progress',
              priority: 'informational',
              icon_key: 'clock',
              module_key: 'todo',
              cta_label: 'View Task',
              cta_url: '/todo',
            });

          if (!notifError) {
            // Update reminder_last_sent
            await supabase
              .from('todo_tasks')
              .update({ reminder_last_sent: now.toISOString() })
              .eq('id', task.id);
            
            sentCount++;
          }
        }
      }

      return { sent: sentCount };
    },
    onSuccess: (result) => {
      if (result.sent > 0) {
        queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        queryClient.invalidateQueries({ queryKey: ['todo-waiting-reminders', userId] });
      }
    },
  });

  // Auto-process reminders on mount and when waiting tasks change
  useEffect(() => {
    if (userId && waitingTasks.length > 0) {
      // Small delay to avoid running on every render
      const timeoutId = setTimeout(() => {
        processReminders.mutate();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [userId, waitingTasks.length]);

  return {
    waitingTasksWithReminders: waitingTasks,
    processReminders,
  };
}
