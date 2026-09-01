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
  AlertDialogTrigger,
} from "@/socle/ui/alert-dialog";
import { useCurrency } from "@/socle/contextes/CurrencyContext";
import { formatCurrency } from "@/socle/outils/currency";
import { ceQuiPartAvecLObjectif } from "@/domaines/objectifs/logique/ceQuiPartAvecLObjectif";

interface Props {
  /** Le bouton qui l ouvre, rendu tel quel. */
  children: React.ReactNode;
  objectif: { name: string; estimated_cost?: number | null };
  etapes: readonly unknown[];
  onConfirmer: () => void;
}

/**
 * LE GARDE-FOU DE L OBJECTIF.
 *
 * La fenetre disait « L'objectif et toutes ses étapes seront
 * supprimés. Cette action est définitive. » Elle etait vraie, et elle
 * ne servait a rien : elle ne nommait pas l objectif — on pouvait la
 * confirmer sans savoir lequel on avait ouvert — ne disait pas combien
 * d etapes, et taisait la seule consequence qu on ne peut pas refaire
 * a la main.
 *
 * CAR SUPPRIMER UN OBJECTIF, C EST RETIRER UNE LIGNE DE BUDGET. Le
 * cout du pacte est la somme des montants estimes ; l objectif parti,
 * la somme baisse, et rien ne le disait. C est la meme lecon que la
 * fenetre des souhaits, qui a du apprendre a dire de quel objectif la
 * piece partait et ce que cela retirait au cout — cette fenetre-ci en
 * reprend la forme, et la doublure d avertissement avec.
 *
 * CE QU ELLE DIT SE CALCULE AILLEURS, dans
 * « logique/ceQuiPartAvecLObjectif.ts », avec ses tests : un compte
 * d etapes pris au mauvais endroit et un montant nul annonce comme une
 * baisse sont deux fautes qui ne cassent rien et se lisent comme du
 * texte correct.
 */
export function SupprimerObjectifDialog({
  children, objectif, etapes, onConfirmer,
}: Props) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { nom, etapes: combien, montant } = ceQuiPartAvecLObjectif(objectif, etapes);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border-destructive/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-orbitron text-destructive tracking-wider text-sm uppercase">
            {t("goals.detail.delete.title")}
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="font-rajdhani text-base text-muted-foreground space-y-3">
              <p>
                {t("goals.detail.delete.question")}{" "}
                <span className="font-semibold text-foreground">« {nom} »</span>
                {" — "}
                {combien > 0
                  ? t("goals.detail.delete.steps", { count: combien })
                  : t("goals.detail.delete.noSteps")}
              </p>

              {/* LE MONTANT NE PARAIT QUE S IL PART. « baissera de 0 € »
                  annoncerait une consequence qui n existe pas. */}
              {montant !== null && (
                <div className="flex gap-3 rounded-md border border-amber-400/30 bg-amber-400/5 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                  <p className="text-amber-400/90">
                    {t("goals.detail.delete.costDrop")}{" "}
                    <span className="font-semibold">{formatCurrency(montant, currency)}</span>.
                  </p>
                </div>
              )}

              <p>{t("goals.detail.delete.final")}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="font-rajdhani">{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmer}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-rajdhani"
          >
            {t("goals.detail.delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
