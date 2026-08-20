import type { TodoPriority, TodoTaskType, ReminderFrequency } from "@/hooks/useTodoList";

/* Ce que le terminal de saisie tient, et ce que la base attend. La
   conversion se faisait deux fois — une par formulaire — avec les
   memes regles recopiees. */

export interface ValeursTache {
  name: string;
  deadline: Date | undefined;
  appointmentTime: string;
  priority: TodoPriority;
  category: string;
  taskType: TodoTaskType;
  isUrgent: boolean;
  location: string;
  reminderEnabled: boolean;
  reminderFrequency: ReminderFrequency;
}

export function versEntree(v: ValeursTache) {
  return {
    name: v.name,
    deadline: v.deadline?.toISOString() ?? null,
    priority: v.priority,
    is_urgent: v.isUrgent,
    category: v.category,
    task_type: v.taskType,
    /* Un rappel n a de sens que pour ce qu on attend de quelqu un
       d autre ; un lieu et une heure, que pour un rendez-vous. */
    reminder_enabled: v.taskType === "waiting" ? v.reminderEnabled : false,
    reminder_frequency: v.taskType === "waiting" && v.reminderEnabled ? v.reminderFrequency : null,
    location: v.taskType === "rendezvous" ? v.location || null : null,
    appointment_time: v.taskType === "rendezvous" && v.appointmentTime ? v.appointmentTime : null,
  };
}
