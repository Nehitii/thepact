/* UNE LIGNE QUI SE DEPLACE.
 *
 * Le seul role de ce fichier est de brancher dnd-kit sur une ligne :
 * la page n a pas a savoir ce qu est un `useSortable`.
 */
import { useSortable } from "@dnd-kit/sortable";
import { TodoLigne } from "@/domaines/taches/composants/TodoLigne";
import type { TodoTask } from "@/domaines/taches/hooks/useTodoList";
export type LigneTriableProps = {
  task: TodoTask;
  variant: 'liste' | 'detaillee';
  onComplete: () => void;
  onPostpone: (d: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onFocus: () => void;
};

export function LigneTriable({ task, ...reste }: LigneTriableProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: task.id });
  /* La carte entiere portait la poignee, et devenait un role="button"
     contenant cinq boutons. La poignee descend dans la ligne. */
  return (
    <div ref={setNodeRef}>
      <TodoLigne {...reste} task={task} isDragging={isDragging} poignee={{ ...attributes, ...listeners }} />
    </div>
  );
}
