import type { TodoPriority, TodoTask, ReminderFrequency } from "@/domaines/taches/hooks/useTodoList";
import { TodoFormulaire } from "./TodoFormulaire";
import { versEntree } from "@/domaines/taches/logique/valeursTache";

/* Meme terminal que la creation, avec la tache pre-remplie et son
   identifiant rendu au dessus. */

export interface UpdateTaskInput {
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
}

interface TodoEditFormProps {
  task: TodoTask;
  onSubmit: (input: UpdateTaskInput) => void;
  onCancel: () => void;
  isLoading: boolean;
  corpsRef?: (node: HTMLDivElement | null) => void;
  entier?: boolean;
}

export function TodoEditForm({ task, onSubmit, onCancel, isLoading, corpsRef, entier }: TodoEditFormProps) {
  return (
    <TodoFormulaire
      tache={task}
      onValider={(v) => onSubmit({ id: task.id, ...versEntree(v) })}
      onAnnuler={onCancel}
      isLoading={isLoading}
      corpsRef={corpsRef}
      entier={entier}
    />
  );
}
