import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/socle/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/socle/ui/alert-dialog";
import { Bouton } from "@/socle/ds/console-ui";
import { useResetPact } from "@/domaines/objectifs";

/**
 * LA REINITIALISATION DU PACTE A REJOINT LES DEUX AUTRES DESTRUCTIONS.
 *
 * Elle vivait dans « Regles du pacte », sous un panneau nomme « Zone
 * sensible » — un nom que « Mes donnees » portait deja, avec un contenu
 * different. Le rail affichait donc deux zones sensibles, et il fallait
 * connaitre les deux pour savoir ce qu on pouvait detruire.
 *
 * Les trois tiennent maintenant ensemble, du moins grave au pire :
 * le pacte, puis les donnees, puis le compte. On voit l echelle et l on
 * choisit son barreau.
 *
 * Le dialogue etait par ailleurs entierement en anglais — « Reset
 * Pact », « Type your pact name to confirm », « RESET EVERYTHING ». Il
 * ne s affichait qu ouvert, donc aucun releve de l ecran ne le voyait.
 */
export function ReinitialiserLePacte({
  pactId, pactName,
}: { pactId: string | undefined; pactName: string }) {
  const resetPact = useResetPact();
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  if (!pactId) return null;

  /* ON REPASSE PAR LE RITE, ET C EST CETTE PORTE QUE LA SPEC DESIGNE :
     « ReinitialiserLePacte.tsx existe : quelqu un repassera par la, et
     la deuxieme fois n est jamais la premiere. »

     Elle ne menait nulle part. Le rite abrege se declenche sur
     « ?abrege », personne n y envoyait, et « Home » ne route vers le
     rite que si le porteur n a AUCUN pacte — or celui-ci survit a la
     reinitialisation. Six ecrans et une branche testee que personne ne
     pouvait atteindre.

     Le rite abrege part de ce qui etait deja jure : on revoit ses
     declarations, on les change si l on veut, et l on signe de
     nouveau. Voir « usePacteJure ». */
  const lancer = async () => {
    try {
      await resetPact.mutateAsync(pactId);
      setConfirmation("");
      setOuvert(false);
      navigate("/onboarding?abrege");
    } catch {
      /* La mutation affiche son propre message. */
    }
  };

  return (
    <div
      className="border border-destructive/20 bg-destructive/5 p-4"
      style={{ clipPath: "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)" }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive/60 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-xs font-mono text-destructive/80 tracking-wider uppercase font-bold">
            Réinitialiser le pacte
          </p>
          <p className="ds-t-label text-destructive/50 font-mono leading-relaxed">
            Efface les objectifs, les étapes, les missions et les compteurs de
            progression de « {pactName} », puis te ramène au rite pour que tu
            jures de nouveau.
          </p>

          <AlertDialog
            open={ouvert}
            onOpenChange={(o) => { setOuvert(o); if (!o) setConfirmation(""); }}
          >
            <AlertDialogTrigger asChild>
              <Bouton role="danger">
                <AlertTriangle />
                Réinitialiser le pacte
              </Bouton>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser « {pactName} » ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est sans retour. Tous tes objectifs, étapes,
                  missions et compteurs de progression seront effacés. Tu
                  repasseras ensuite par le rite : tes déclarations te seront
                  présentées telles quelles, et tu signeras de nouveau.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-2 py-2">
                <label htmlFor="confirmer-pacte" className="text-sm text-muted-foreground">
                  Tape le nom de ton pacte pour confirmer :{" "}
                  <strong className="text-foreground">{pactName}</strong>
                </label>
                <Input
                  id="confirmer-pacte"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder={pactName}
                  autoComplete="off"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirmation !== pactName || resetPact.isPending}
                  onClick={(e) => { e.preventDefault(); void lancer(); }}
                  className="bg-destructive/25 border border-destructive/50 text-destructive hover:bg-destructive/40"
                >
                  {resetPact.isPending ? "Réinitialisation…" : "Tout effacer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
