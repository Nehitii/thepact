import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  KeyRound, ShieldCheck, ShieldOff, UserMinus, UserPlus, ScrollText, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageShell } from "@/domaines/administration/composants/AdminPageShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useRosterAdmin, useChangerLeRole, useJournalAdmin, motDeLErreur,
  type LigneRoster,
} from "@/domaines/administration/hooks/useAdminServeur";

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
 * Il ne décide rien à votre place : il montre qui détient les clés,
 * depuis quand chacun n'est pas venu, et qui a posé un second facteur.
 * Retirer un rôle reste un geste, pas un effet de bord.
 *
 * Les deux verrous contre l'enfermement dehors sont dans la base, pas
 * ici : on ne retire pas son propre rôle, et jamais le dernier. Un
 * bouton grisé annonce la règle ; c'est le serveur qui la tient.
 * ═══════════════════════════════════════════════════════════════
 */

function depuisQuand(iso: string | null): string {
  if (!iso) return "jamais";
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr });
}

/** Une absence longue sur un compte à pouvoirs mérite d'être signalée. */
function dort(iso: string | null): boolean {
  if (!iso) return true;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000 > 60;
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
    <div className="ad-ligne">
      <span className="ad-apercu">
        {l.role === "admin" ? <ShieldCheck aria-hidden="true" /> : <ShieldOff aria-hidden="true" />}
      </span>

      <span className="ad-ligne-corps">
        <span className="ad-ligne-nom">
          {l.nom}
          {l.c_est_moi && <span className="ad-ligne-meta" style={{ marginLeft: 8 }}>vous</span>}
        </span>
        <span className="ad-ligne-meta">
          <span className="ad-etat" data-ton={l.a_un_second_facteur ? "actif" : "veille"}>
            <KeyRound aria-hidden="true" style={{ width: 10, height: 10 }} />
            {l.a_un_second_facteur ? "protégé" : "sans second facteur"}
          </span>
          <span className="ad-etat" data-ton={dort(l.derniere_connexion) ? "veille" : "dormant"}>
            vu {depuisQuand(l.derniere_connexion)}
          </span>
        </span>
      </span>

      <span className="ad-ligne-gestes">
        {l.role === "admin" ? (
          <button
            type="button" className="ad-geste" data-ton="danger"
            disabled={l.c_est_moi || changer.isPending}
            title={l.c_est_moi ? "On ne retire pas son propre rôle" : undefined}
            onClick={() => setCible(l)}
          >
            <UserMinus aria-hidden="true" /> Retirer
          </button>
        ) : (
          <button
            type="button" className="ad-geste"
            disabled={changer.isPending}
            onClick={() => appliquer(l, true)}
          >
            <UserPlus aria-hidden="true" /> Nommer
          </button>
        )}
      </span>
    </div>
  );

  return (
    <AdminPageShell
      titre="Accès"
      sous="Qui détient les clés, et depuis quand chacun n'est pas venu"
      icone={<ShieldCheck aria-hidden="true" />}
    >
      {dormants.length > 0 && (
        <p className="ad-avis">
          <AlertTriangle aria-hidden="true" />
          <span>
            <b>{dormants.length} compte{dormants.length > 1 ? "s" : ""} d'administrateur
            {dormants.length > 1 ? " dorment" : " dort"}</b> depuis plus de deux mois.
            Une clé à pouvoirs qui ne sert plus reste une clé en circulation : elle ouvre
            tout, et personne ne remarquerait son usage.
          </span>
        </p>
      )}

      <section className="ad-panneau">
        <header className="ad-panneau-tete">
          <h2 className="ad-panneau-titre">Administrateurs · {admins.length}</h2>
        </header>
        {isLoading ? (
          <div className="ad-liste" aria-busy="true">
            {[0, 1].map((i) => <span key={i} className="ad-os" style={{ height: 62 }} />)}
          </div>
        ) : (
          <div className="ad-liste">
            {admins.map((l) => <Ligne key={l.user_id + l.role} l={l} />)}
          </div>
        )}
      </section>

      {autres.length > 0 && (
        <section className="ad-panneau">
          <header className="ad-panneau-tete">
            <h2 className="ad-panneau-titre">Autres comptes · {autres.length}</h2>
          </header>
          <div className="ad-liste">
            {autres.map((l) => <Ligne key={l.user_id + l.role} l={l} />)}
          </div>
        </section>
      )}

      {/* LE JOURNAL, AU MÊME ENDROIT QUE LES ACCÈS.
          Voir qui détient les clés sans voir ce qui a été fait avec ne
          sert qu'à moitié. Chaque acte passé par le serveur s'écrit ici
          dans la même transaction que l'acte lui-même. */}
      <section className="ad-panneau">
        <header className="ad-panneau-tete">
          <h2 className="ad-panneau-titre">
            <ScrollText aria-hidden="true" style={{ width: 12, height: 12, display: "inline", marginRight: 6, verticalAlign: -1 }} />
            Journal d'administration
          </h2>
        </header>
        {journal.length === 0 ? (
          <p className="ad-aide">Aucun acte enregistré.</p>
        ) : (
          <div className="ad-liste">
            {journal.map((l) => (
              <div key={l.id} className="ad-ligne">
                <span className="ad-apercu"><ScrollText aria-hidden="true" /></span>
                <span className="ad-ligne-corps">
                  <span className="ad-ligne-nom">
                    {l.action} — {l.cible_type}
                    {l.details?.titre ? ` « ${String(l.details.titre)} »` : ""}
                  </span>
                  <span className="ad-ligne-meta">
                    {l.qui} · il y a {formatDistanceToNow(new Date(l.quand), { locale: fr })}
                    {typeof l.details?.envoyes === "number" && ` · ${l.details.envoyes} destinataire(s)`}
                    {typeof l.details?.ecartes === "number" && Number(l.details.ecartes) > 0
                      && ` · ${l.details.ecartes} écarté(s)`}
                  </span>
                </span>
                <span />
              </div>
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={!!cible} onOpenChange={(o) => !o && setCible(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le rôle d'administrateur à {cible?.nom} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce compte perdra l'accès à l'administration : diffusion, cosmétiques,
              modules, codes, et cette page. Son compte ordinaire et ses données ne
              changent pas, et le rôle se redonne d'un clic.
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
