import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTodoList } from "@/domaines/taches";
import type { Geste } from "@/domaines/mia/logique/gestes";

/**
 * FAIRE CE QUE LE GESTE A DEJA DECIDE.
 *
 * Le geste est reconnu ailleurs — « logique/gestes.ts » — et il arrive
 * ici tout decide : il ne reste qu a l executer. On reutilise les
 * crochets de l application, les MEMES que ceux des boutons, plutot que
 * de reecrire les requetes une deuxieme fois : une tache cochee par
 * M.I.A. doit l etre exactement comme une tache cochee a la main.
 *
 * Sorti de « MiaConsole.tsx » : la console tenait quatre requetes de
 * taches et le routeur pour cinq lignes de branchement, et le cliquet
 * de taille l a signale au premier ajout. Un composant n a pas a porter
 * ce qu il ne dessine pas.
 */
export function useGesteDeMia(onClose: () => void) {
  const navigate = useNavigate();
  const { completeTask, createTask, postponeTask } = useTodoList();

  return useCallback(
    async (g: Geste) => {
      const a = g.action;
      if (!a) return;
      try {
        if (a.type === "naviguer") {
          navigate(a.vers);
          onClose();
        } else if (a.type === "focus") {
          navigate("/focus");
          onClose();
        } else if (a.type === "cocher") {
          await completeTask.mutateAsync(a.id);
        } else if (a.type === "ajouter") {
          await createTask.mutateAsync({ name: a.nom, priority: "medium", is_urgent: false });
        } else if (a.type === "reporter") {
          await postponeTask.mutateAsync({ taskId: a.id, newDeadline: a.a });
        }
      } catch {
        /* le message d echec est porte par le crochet ; on ne double pas */
      }
    },
    [navigate, onClose, completeTask, createTask, postponeTask],
  );
}
