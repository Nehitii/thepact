import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, CheckCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import "@/domaines/social/community.css";
import "@/domaines/social/inbox.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/domaines/social/hooks/useMessages";
import { useFriends } from "@/domaines/social/hooks/useFriends";
import { useCadres } from "@/domaines/social/hooks/useCadres";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { chargerProfilsPublics } from "@/domaines/profil";
import { Pastille } from "@/domaines/social/composants/Pastille";
import { nomAffichable } from "@/domaines/social/logique/vocabulaire";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * UNE CONVERSATION.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI ÉTAIT FAUX ICI
 *
 * — « ENCRYPTED CHANNEL », sous le nom de l'interlocuteur. Les
 *   messages sont stockés en clair dans Postgres. C'était faux, et
 *   faux sur le seul sujet où une application n'a pas le droit de se
 *   vanter. Remplacé par le dernier signe de vie, qui est vrai.
 *
 * — LE PROFIL D'EN FACE ÉTAIT TOUJOURS NUL. La page lisait
 *   `profiles` en direct pour l'autre personne. Cette table n'a
 *   qu'une politique de lecture : « auth.uid() = id ». La requête
 *   rendait donc null à tous les coups, et l'en-tête affichait
 *   « Unknown User » avec un « ? » — pour tout le monde, toujours.
 *
 * — RIEN N'ÉTAIT TRADUIT. « Unknown User », « No messages yet. Start
 *   the conversation. », « Type a message... », « Yesterday ». Dans
 *   une application française.
 *
 * — L'ABONNEMENT TEMPS RÉEL ÉCOUTAIT LE VIDE. private_messages ne
 *   figurait pas dans la publication `supabase_realtime`. La
 *   migration l'y a ajoutée, et l'abonnement vit maintenant dans le
 *   hook, une seule fois pour toute l'application.
 *
 * — « h-screen » DANS UNE MISE EN PAGE QUI A DÉJÀ SA HAUTEUR : la
 *   page dépassait de la fenêtre d'exactement ce qui la précède.
 *
 * — ON POUVAIT ÉCRIRE À N'IMPORTE QUEL IDENTIFIANT. La politique
 *   d'insertion ne vérifiait que l'expéditeur. Elle exige désormais
 *   une alliance acceptée et l'absence de blocage ; l'écran le dit
 *   avant, plutôt que de laisser partir un message qui sera refusé.
 * ═══════════════════════════════════════════════════════════════
 */

export default function InboxThread() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const locale = useDateFnsLocale();
  const queryClient = useQueryClient();

  const { messages, envoyer, marquerLuLaConversation } = useMessages();
  const { mutate: marquerLu } = marquerLuLaConversation;
  const { getFriendshipStatus, friendsLoading } = useFriends();

  const [brouillon, setBrouillon] = useState("");
  const [blocageDemande, setBlocageDemande] = useState(false);
  const bas = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLTextAreaElement>(null);

  const { data: profil } = useQuery({
    queryKey: ["profil-fil", userId],
    queryFn: async () => (userId ? (await chargerProfilsPublics([userId])).get(userId) ?? null : null),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
  const { data: cadres } = useCadres(userId ? [userId] : []);

  const fil = useMemo(
    () =>
      messages
        .filter(
          (m) =>
            (m.sender_id === userId && m.receiver_id === user?.id) ||
            (m.sender_id === user?.id && m.receiver_id === userId),
        )
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages, userId, user?.id],
  );

  const allie = userId ? getFriendshipStatus(userId) === "accepted" : false;
  const nom = nomAffichable(profil?.display_name, t("friends.unknownAgent", "Agent Inconnu"));

  /* Marquer lu à l'ouverture, et à chaque message reçu ensuite : le
     hook invalide le fil, ce qui rejoue cet effet. */
  useEffect(() => {
    if (userId) marquerLu(userId);
  }, [userId, marquerLu, fil.length]);

  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: fil.length > 1 ? "smooth" : "auto" });
  }, [fil.length]);

  const grandir = () => {
    const el = champ.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const partir = async () => {
    const texte = brouillon.trim();
    if (!texte || !userId || envoyer.isPending) return;
    setBrouillon("");
    if (champ.current) champ.current.style.height = "auto";
    try {
      await envoyer.mutateAsync({ destinataire: userId, contenu: texte });
    } catch {
      /* Le refus vient presque toujours de la politique d'insertion.
         On ne dit pas « vous êtes bloqué » : l'ignorer fait partie de
         ce qu'un blocage protège. On rend le texte, plutôt que de le
         perdre. */
      setBrouillon(texte);
      toast.error(t("thread.sendFailed", "Le message n'a pas pu être envoyé"), {
        description: allie
          ? t("thread.sendFailedWhy", "Réessayez dans un instant.")
          : t("thread.sendFailedNoAlly", "On écrit à ses alliés. Cette personne n'en est pas un."),
      });
    }
  };

  const bloquer = async () => {
    if (!user?.id || !userId) return;
    const { error } = await supabase
      .from("blocked_users")
      .insert({ user_id: user.id, blocked_user_id: userId });
    if (error) {
      toast.error(t("thread.blockFailed", "Le blocage a échoué"));
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["blocked-users", user.id] });
    toast.success(t("thread.blocked", "{{nom}} est bloqué·e", { nom }));
    navigate("/inbox");
  };

  const jourDe = (iso: string) => {
    const d = new Date(iso);
    if (isToday(d)) return t("inbox.notifications.today", "Aujourd'hui");
    if (isYesterday(d)) return t("inbox.notifications.yesterday", "Hier");
    return format(d, "d MMMM yyyy", { locale });
  };

  if (!user) return null;

  let dernierJour = "";

  return (
    <div className="bxf page-px">
      <header className="bxf-tete">
        <button
          type="button" className="bxf-retour"
          onClick={() => navigate("/inbox")}
          aria-label={t("common.back", "Retour")}
        >
          <ArrowLeft aria-hidden="true" />
        </button>

        <Pastille
          identifiant={userId} nom={profil?.display_name} image={profil?.avatar_url}
          cadre={cadres?.get(userId ?? "")} petite
        />

        <div className="bxf-qui">
          <h1 className="bxf-nom">{nom}</h1>
          {/* Le dernier signe de vie n'apparaît que si la personne
              accepte de le montrer : le serveur ne l'envoie pas sinon. */}
          {profil?.last_seen_at && (
            <p className="bxf-vu">
              {t("thread.lastSeen", "Vu·e {{quand}}", {
                quand: formatDistanceToNow(new Date(profil.last_seen_at), { addSuffix: true, locale }),
              })}
            </p>
          )}
        </div>

        <div className="bxf-outils">
          <button
            type="button" className="bxf-retour"
            onClick={() => setBlocageDemande(true)}
            aria-label={t("thread.block", "Bloquer")}
            title={t("thread.block", "Bloquer")}
          >
            <UserX aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="bxf-corps">
        <div className="bxf-messages">
          {fil.length === 0 ? (
            <div className="bx-vide">
              <Send aria-hidden="true" />
              <h3>{t("thread.emptyTitle", "Rien encore")}</h3>
              <p>
                {allie
                  ? t("thread.emptyAlly", "Écrivez le premier message. Il partira tout de suite.")
                  : t("thread.emptyNoAlly", "On écrit à ses alliés. Ajoutez cette personne pour ouvrir la conversation.")}
              </p>
            </div>
          ) : (
            fil.map((m) => {
              const jour = jourDe(m.created_at);
              const nouveauJour = jour !== dernierJour;
              dernierJour = jour;
              const deMoi = m.sender_id === user.id;
              return (
                <div key={m.id} style={{ display: "contents" }}>
                  {nouveauJour && <span className="bxf-date">{jour}</span>}
                  <div
                    className="bxf-bulle"
                    data-de={deMoi ? "moi" : "lui"}
                    data-vol={m.id.startsWith("provisoire-") ? "oui" : "non"}
                  >
                    <p>{m.content}</p>
                    <div className="bxf-bulle-pied">
                      <span>{format(new Date(m.created_at), "HH:mm")}</span>
                      {deMoi && m.is_read && <CheckCheck aria-hidden="true" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bas} />
        </div>
      </div>

      <div className="bxf-pied">
        {allie || friendsLoading ? (
          <form className="bxf-champ" onSubmit={(e) => { e.preventDefault(); partir(); }}>
            <textarea
              ref={champ}
              value={brouillon}
              rows={1}
              maxLength={2000}
              placeholder={t("inbox.messages.typePlaceholder", "Écrire un message…")}
              aria-label={t("inbox.messages.typePlaceholder", "Écrire un message…")}
              onChange={(e) => { setBrouillon(e.target.value); grandir(); }}
              /* Entrée envoie, Maj+Entrée passe à la ligne : c'est ce
                 que fait toute messagerie, et l'ancien champ à une
                 ligne ne permettait pas le retour du tout. */
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); partir(); }
              }}
            />
            <button
              type="submit" className="bxf-envoi"
              disabled={!brouillon.trim() || envoyer.isPending}
              aria-label={t("inbox.messages.sendMessage", "Envoyer")}
            >
              <Send aria-hidden="true" />
            </button>
          </form>
        ) : (
          <p className="bxf-note">
            {t("thread.notAlly", "On écrit à ses alliés. Cette personne n'en est pas un — la demande se fait depuis la page Alliés.")}
          </p>
        )}
      </div>

      <AlertDialog open={blocageDemande} onOpenChange={setBlocageDemande}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("thread.blockTitle", "Bloquer {{nom}} ?", { nom })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("thread.blockWhy", "Vous ne recevrez plus ses messages et ne pourrez plus lui écrire. Les messages déjà échangés restent lisibles. Le blocage se retire depuis Confidentialité.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Annuler")}</AlertDialogCancel>
            <AlertDialogAction onClick={bloquer}>{t("thread.block", "Bloquer")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
