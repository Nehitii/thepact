import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/socle/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";

/**
 * LA CONFIRMATION DE SUPPRESSION.
 *
 * Elle parlait anglais — « Delete item », « This action cannot be
 * undone » — dans une application française, et son déclencheur était
 * un bouton shadcn rouge qui ne ressemblait à aucun autre geste de
 * l'administration.
 *
 * Le TYPE de l'objet est repris tel quel dans le titre : « Supprimer
 * ce code promotionnel », « Supprimer ce cadre ». Un message qui dit
 * ce qu'on supprime vaut mieux qu'un message qui dit « cet élément ».
 */
export function AdminDeleteConfirm({
  onConfirm,
  itemName,
  itemType = "élément",
}: {
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="ad-icone"
          data-ton="danger"
          aria-label={`Supprimer ${itemName}`}
        >
          <Trash2 aria-hidden="true" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle aria-hidden="true" style={{ width: 18, height: 18, color: "hsl(var(--ds-accent-warning))" }} />
            Supprimer ce {itemType} ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <strong>« {itemName} »</strong> sera retiré définitivement. Cette action
            ne s'annule pas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
