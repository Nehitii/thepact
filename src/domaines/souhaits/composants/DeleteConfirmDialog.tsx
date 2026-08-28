import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/socle/ui/alert-dialog";
import { formatCurrency } from "@/socle/outils/currency";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  /** Renseigne quand l article vient d un objectif. */
  goalName?: string | null;
  /** Ce que la piece pese dans le cout de cet objectif. */
  cost?: number;
  currency?: string;
  onConfirm: () => void;
}

/**
 * LE GARDE-FOU.
 *
 * Cette fenetre annoncait « it may be re-created on next sync » : elle
 * s excusait d un defaut au lieu de le corriger. Supprimer un article
 * synchronise n effacait que la ligne de wishlist, et la
 * synchronisation le recreait au passage suivant.
 *
 * La suppression se propage maintenant jusqu a la piece de l objectif.
 * C est plus juste, et bien plus lourd de consequence : on ne retire
 * plus une ligne de liste, on RETIRE UNE LIGNE DE BUDGET. La fenetre
 * doit donc dire exactement ce qui va disparaitre et de ou — le nom de
 * l objectif et le montant qui quitte son cout.
 *
 * Un article libre, lui, n engage rien : sa confirmation reste breve.
 */
export function DeleteConfirmDialog({
  open, onOpenChange, itemName, goalName, cost = 0, currency = "EUR", onConfirm,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  const duPacte = Boolean(goalName);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border-destructive/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-orbitron text-destructive tracking-wider text-sm uppercase">
            {duPacte
              ? t("wishlist.delete.titlePact", "Retirer du pacte")
              : t("wishlist.delete.title", "Supprimer")}
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="font-rajdhani text-base text-muted-foreground space-y-3">
              <p>
                {t("wishlist.delete.question", "Supprimer")}{" "}
                <span className="font-semibold text-foreground">« {itemName} »</span>
                {duPacte ? "" : t("wishlist.delete.fromList", " de ta liste ?")}
              </p>

              {duPacte && (
                <div className="flex gap-3 rounded-md border border-amber-400/30 bg-amber-400/5 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                  <div className="space-y-1.5">
                    {/* Ce que la suppression fait vraiment, en toutes lettres. */}
                    <p className="text-foreground">
                      {t("wishlist.delete.alsoGoal", "Cette pièce vient de l’objectif")}{" "}
                      <span className="font-semibold">« {goalName} »</span>.{" "}
                      {t("wishlist.delete.alsoGoalEnd", "Elle en sera retirée aussi.")}
                    </p>
                    <p className="text-amber-400/90">
                      {t("wishlist.delete.costDrop", "Le coût de cet objectif baissera de")}{" "}
                      <span className="font-semibold">{formatCurrency(cost, currency)}</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="font-rajdhani">
            {t("common.cancel", "Annuler")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-rajdhani"
          >
            {duPacte
              ? t("wishlist.delete.confirmPact", "Retirer des deux")
              : t("wishlist.delete.confirm", "Supprimer")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
