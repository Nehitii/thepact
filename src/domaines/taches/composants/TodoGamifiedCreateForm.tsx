import type { CreateTaskInput, TodoTaskType } from "@/domaines/taches/hooks/useTodoList";
import { TodoFormulaire } from "./TodoFormulaire";
import { versEntree } from "@/domaines/taches/logique/valeursTache";

/* La creation et l edition partageaient quatre cents lignes identiques
   a la virgule pres — la seconde avec ses libelles anglais en dur. Il
   ne reste ici que le branchement. */

interface TodoGamifiedCreateFormProps {
  onSubmit: (input: CreateTaskInput & { category: string; task_type: TodoTaskType }) => void;
  onCancel: () => void;
  isLoading: boolean;
  corpsRef?: (node: HTMLDivElement | null) => void;
  entier?: boolean;
}

export function TodoGamifiedCreateForm({
  onSubmit, onCancel, isLoading, corpsRef, entier,
}: TodoGamifiedCreateFormProps) {
  return (
    <TodoFormulaire
      onValider={(v) => onSubmit(versEntree(v) as CreateTaskInput & { category: string; task_type: TodoTaskType })}
      onAnnuler={onCancel}
      isLoading={isLoading}
      corpsRef={corpsRef}
      entier={entier}
    />
  );
}
