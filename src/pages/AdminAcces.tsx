import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { KeyRound, ShieldCheck, ShieldOff, Loader2, UserMinus, UserPlus, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useRosterAdmin, useChangerLeRole, useJournalAdmin, motDeLErreur,
  type LigneRoster,
} from "@/hooks/useAdminServeur";

/**
 * LES ACCÈS.
 *
 * ═══════════════════════════════════════════════════════════════
 * POURQUOI CET ÉCRAN N'EXISTAIT PAS, ET AURAIT DÛ
 *
 * RELEVÉ à l'audit : TROIS administrateurs sur quatre comptes. Deux
 * d'entre eux ne s'étaient pas connectés depuis sept et neuf mois.
 *
 * Un identifiant d'administrateur dormant est ce qu'on compromet le
 * plus facilement, et il contourne tout le reste — politiques,
 * vérifications serveur, second facteur — puisqu'il est légitime.
 * C'était le plus gros risque pratique de l'application, et rien dans
 * le produit ne permettait de le VOIR : `profiles` ne rend qu'une
 * ligne au client, et `last_sign_in_at` n'est pas lisible de là.
 *
 * D'où cet écran. Il ne décide rien à votre place : il montre qui
 * détient les clés, depuis quand chacun n'est pas venu, et qui a posé
 * un second facteur. Retirer un rôle reste un geste, pas un effet de
 * bord.
 *
 * Les deux verrous contre l'enfermement dehors sont dans la base, pas
 * ici : on ne retire pas son propre rôle, et jamais le dernier. Un
 * bouton grisé annonce la règle ; c'est le serveur qui la tient.
 * ═══════════════════════════════════════════════════════════════
 */

const jamais = "jamais";

function depuisQuand(iso: string | null): string {
  if (!iso) return jamais;
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr });
}

/** Une absence longue sur un compte à pouvoirs mérite d'être signalée. */
function dort(iso: string | null): boolean {
  if (!iso) return true;
  const jours = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return jours > 60;
}

export default function AdminAcces() {
  const { data: roster = [], isLoading } = useRosterAdmin();
  const { data: journal = [] } = useJournalAdmin(30);
  const changer = useChangerLeRole();
  const [cible, setCible] = useState<LigneRoster | null>(null);

  const admins = roster.filter((l) => l.role === "admin");
  const autres = roster.filter((l) => l.role !== "admin");
  const dormants = admins.filter((a) => dort(a.derniere_connexion) && !a.c_est_moi);

  const appliquer = (l: LigneRoster, admin: boolean) => {
    changer.mutate(
      { userId: l.user_id, admin },
      {
        onSuccess: () => {
          toast.success(admin ? `${l.nom} est administrateur` : `${l.nom} ne l'est plus`);
          setCible(null);
        },
        onError: (e) => toast.error("Refusé", { description: motDeLErreur(e) }),
      },
    );
  };

  const Ligne = ({ l }: { l: LigneRoster }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/15 bg-card/40">
      <span
        className={`grid place-items-center h-9 w-9 rounded-lg shrink-0 ${
          l.role === "admin" ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"
        }`}
      >
        {l.role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground truncate">{l.nom}</span>
          {l.c_est_moi && <span className="text-[10px] uppercase tracking-wider text-primary/70">vous</span>}
          {l.a_un_second_facteur ? (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400">
              <KeyRound className="h-3 w-3" /> protégé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-400">
              <KeyRound className="h-3 w-3" /> sans second facteur
            </span>
          )}
        </div>
        <p className={`text-xs font-rajdhani ${dort(l.derniere_connexion) ? "text-amber-400" : "text-muted-foreground"}`}>
          Dernière connexion {depuisQuand(l.derniere_connexion)}
        </p>
      </div>

      {l.role === "admin" ? (
        <Button
          size="sm" variant="outline"
          disabled={l.c_est_moi || changer.isPending}
          title={l.c_est_moi ? "On ne retire pas son propre rôle" : undefined}
          onClick={() => setCible(l)}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0"
        >
          <UserMinus className="h-3.5 w-3.5 mr-1.5" /> Retirer
        </Button>
      ) : (
        <Button
          size="sm" variant="outline" disabled={changer.isPending}
          onClick={() => appliquer(l, true)}
          className="shrink-0"
        >
          <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Nommer
        </Button>
      )}
    </div>
  );

  return (
    <AdminPageShell
      title="Accès"
      subtitle="Qui détient les clés, et depuis quand chacun n'est pas venu"
      icon={<ShieldCheck className="h-6 w-6" />}
      maxWidth="max-w-3xl"
    >
      {dormants.length > 0 && (
        <Card className="p-4 mb-5 border-amber-500/40 bg-amber-500/5">
          <p className="text-sm text-amber-300 font-rajdhani leading-relaxed">
            <b>{dormants.length} compte{dormants.length > 1 ? "s" : ""} d'administrateur dorment</b> depuis plus de
            deux mois. Un identifiant à pouvoirs qui ne sert plus reste une clé
            en circulation : il ouvre tout, et personne ne remarquerait son usage.
          </p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <h2 className="text-xs uppercase tracking-widest text-primary/60 font-mono mb-2">
            Administrateurs ({admins.length})
          </h2>
          <div className="flex flex-col gap-2 mb-6">
            {admins.map((l) => <Ligne key={l.user_id + l.role} l={l} />)}
          </div>

          {autres.length > 0 && (
            <>
              <h2 className="text-xs uppercase tracking-widest text-primary/60 font-mono mb-2">
                Autres rôles ({autres.length})
              </h2>
              <div className="flex flex-col gap-2 mb-6">
                {autres.map((l) => <Ligne key={l.user_id + l.role} l={l} />)}
              </div>
            </>
          )}
        </>
      )}

      {/* LE JOURNAL, AU MÊME ENDROIT QUE LES ACCÈS.
          Voir qui détient les clés sans voir ce qui a été fait avec ne
          sert qu'à moitié. Chaque acte passé par le serveur s'écrit ici
          dans la même transaction que l'acte lui-même. */}
      <h2 className="text-xs uppercase tracking-widest text-primary/60 font-mono mb-2 flex items-center gap-2">
        <ScrollText className="h-3.5 w-3.5" /> Journal d'administration
      </h2>
      {journal.length === 0 ? (
        <p className="text-sm text-muted-foreground font-rajdhani">Aucun acte enregistré.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {journal.map((l) => (
            <div key={l.id} className="flex items-baseline gap-3 text-sm px-3 py-2 rounded border border-primary/10 bg-card/30">
              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {depuisQuand(l.quand)}
              </span>
              <span className="text-foreground truncate">
                <b>{l.qui}</b> — {l.action} <span className="text-muted-foreground">{l.cible_type}</span>
                {l.details?.titre ? ` « ${String(l.details.titre)} »` : ""}
                {typeof l.details?.envoyes === "number" ? ` · ${l.details.envoyes} destinataire(s)` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!cible} onOpenChange={(o) => !o && setCible(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le rôle d'administrateur à {cible?.nom} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce compte perdra l'accès à l'administration : diffusion, cosmétiques,
              modules, codes promotionnels, et cette page. Son compte ordinaire et
              ses données ne changent pas, et le rôle se redonne d'un clic.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => cible && appliquer(cible, false)}>
              Retirer le rôle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
