import { useTranslation } from "react-i18next";
import { AlertCircle, AlertTriangle, Loader2, RotateCcw, Trash2, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/socle/ui/dialog";
import { Input } from "@/socle/ui/input";
import { Bouton, Panneau } from "@/socle/ds/console-ui";
import { ReinitialiserLePacte } from "@/domaines/profil/composants/ReinitialiserLePacte";
import { cn } from "@/socle/outils/utils";
import { MOT_REINIT, MOT_SUPPRESSION, peutProceder } from "@/domaines/profil/logique/zoneSensible";

/* CE QUI NE SE DEFAIT PAS.
 *
 * Un panneau et deux dialogues de recopie. Ils n ont rien a voir avec
 * exporter ou importer : ceux-la se refont, ceux-ci non.
 *
 * LA RECOPIE EST LE SEUL GARDE-FOU, et c est pour cela qu il vit dans
 * `logique/zoneSensible.ts` avec ses tests : une comparaison qui passe
 * toujours n a l air de rien.
 */
export interface ZoneSensibleProps {
  resetConfirm: string;
  setResetConfirm: (v: string) => void;
  showResetModal: boolean;
  setShowResetModal: (v: boolean) => void;
  isResetting: boolean;
  onReinitialiser: () => void | Promise<void>;
  deleteConfirm: string;
  setDeleteConfirm: (v: string) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  isDeleting: boolean;
  onSupprimerLeCompte: () => void | Promise<void>;
  /* Deux champs du pacte, pas tout le bloc de statistiques : ce
     composant n a pas besoin de savoir combien d etapes sont faites. */
  pactId?: string;
  pactName: string;
}

export function ZoneSensible({
  resetConfirm, setResetConfirm, showResetModal, setShowResetModal, isResetting, onReinitialiser,
  deleteConfirm, setDeleteConfirm, showDeleteModal, setShowDeleteModal, isDeleting, onSupprimerLeCompte,
  pactId, pactName,
}: ZoneSensibleProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* ── Danger Zone ── */}
      {/* LES TROIS DESTRUCTIONS, DU MOINS GRAVE AU PIRE.
           La reinitialisation du pacte vivait dans « Regles du pacte »,
           sous un panneau nomme « Zone sensible » — le meme nom que
           celui-ci, avec un contenu different. Le rail en affichait deux,
           et il fallait connaitre les deux pour savoir ce qu on pouvait
           detruire. Ensemble, on voit l echelle et l on choisit son
           barreau. */}
      <Panneau code="Zone sensible" etat={t("settings.data.danger", "irréversible")} ton="danger" taille="pleine">
        <ReinitialiserLePacte pactId={pactId} pactName={pactName} />

        <div className="border border-destructive/20 bg-destructive/5 p-4" style={{ clipPath: "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)" }}>
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-destructive/60 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-mono text-destructive/80 tracking-wider uppercase font-bold">Supprimer toutes les données</p>
              <p className="ds-t-label text-destructive/50 font-mono leading-relaxed">Supprime tous tes objectifs, pacts, journal, finances et historiques. Ton compte reste actif mais vide.</p>
              <Bouton role="danger" onClick={() => setShowResetModal(true)}>
                <Trash2 />
                Réinitialiser mes données
              </Bouton>
            </div>
          </div>
        </div>

        <div className="border border-destructive/30 bg-destructive/10 p-4 mt-3" style={{ clipPath: "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)" }}>
          <div className="flex items-start gap-3">
            <UserX className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-mono text-destructive tracking-wider uppercase font-bold">Supprimer mon compte</p>
              <p className="ds-t-label text-destructive/60 font-mono leading-relaxed">Efface le compte lui-même, et tout ce qu’il contient. Tu ne pourras plus te reconnecter avec cette adresse. Aucun retour possible.</p>
              <Bouton role="danger" onClick={() => setShowDeleteModal(true)}>
                <UserX />
                Supprimer mon compte
              </Bouton>
            </div>
          </div>
        </div>
      </Panneau>

      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="bg-card border-destructive/30 max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="text-destructive font-orbitron tracking-wider flex items-center gap-2"><AlertCircle className="h-5 w-5" /> RÉINITIALISATION</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-mono">Tape <span className="text-destructive font-bold">{MOT_REINIT}</span> pour confirmer la suppression de toutes tes données.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} placeholder={`Tape « ${MOT_REINIT} » pour confirmer`} className="font-mono text-sm border-destructive/25 bg-destructive/5 text-destructive rounded-none" />
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => { setShowResetModal(false); setResetConfirm(""); }} className="px-4 py-2 border border-primary/12 text-primary/35 hover:text-primary/65 font-mono ds-t-label tracking-[0.22em] uppercase transition-all">ANNULER</button>
            <button onClick={onReinitialiser} disabled={!peutProceder(resetConfirm, MOT_REINIT, isResetting)} className={cn("px-4 py-2 border border-destructive/40 bg-destructive/20 text-destructive", "hover:bg-destructive/30 hover:border-destructive/60", "font-mono ds-t-label tracking-[0.2em] uppercase transition-colors", "disabled:opacity-30 disabled:cursor-not-allowed")}>
              {isResetting ? <><Loader2 className="inline h-3 w-3 animate-spin mr-1.5" /> SUPPRESSION...</> : "CONFIRMER"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={(o) => { setShowDeleteModal(o); if (!o) setDeleteConfirm(""); }}>
        <DialogContent className="bg-card border-destructive/40 max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="text-destructive font-orbitron tracking-wider flex items-center gap-2">
              <UserX className="h-5 w-5" /> SUPPRESSION DU COMPTE
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-mono leading-relaxed">
              Ton compte, tes objectifs, ton journal, tes finances, tes cosmétiques : tout part.
              Tape <span className="text-destructive font-bold">{MOT_SUPPRESSION}</span> pour confirmer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`Tape « ${MOT_SUPPRESSION} » pour confirmer`}
              className="font-mono text-sm border-destructive/30 bg-destructive/5 text-destructive rounded-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }} className="px-4 py-2 border border-primary/12 text-primary/35 hover:text-primary/65 font-mono ds-t-label tracking-[0.22em] uppercase transition-all">ANNULER</button>
            <button onClick={onSupprimerLeCompte} disabled={!peutProceder(deleteConfirm, MOT_SUPPRESSION, isDeleting)} className={cn("px-4 py-2 border border-destructive/50 bg-destructive/25 text-destructive", "hover:bg-destructive/40 hover:border-destructive/70", "font-mono ds-t-label tracking-[0.2em] uppercase transition-colors", "disabled:opacity-30 disabled:cursor-not-allowed")}>
              {isDeleting ? <><Loader2 className="inline h-3 w-3 animate-spin mr-1.5" /> SUPPRESSION...</> : "SUPPRIMER DÉFINITIVEMENT"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
