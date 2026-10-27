import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { Heart, Trash2 } from "lucide-react";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { nomAffichable } from "@/domaines/social/logique/vocabulaire";
import { compteAMontrer, gesteAttendu } from "@/domaines/social/logique/reponseAimee";
import { usePostReplies, useAddReply, useDeleteReply } from "@/domaines/social/hooks/useReponses";
import { useAimerUneReponse } from "@/domaines/social/hooks/useAimerUneReponse";
import { Pastille } from "@/domaines/social/composants/Pastille";

/**
 * LE FIL DES REPONSES.
 *
 * Sorti de « CommunityPostCard », qui dessinait la publication, ses
 * reactions, son menu, sa fenetre de signalement ET ses commentaires.
 * Le cliquet de taille l a demande au premier ajout ; c etait de toute
 * facon deux choses distinctes, et seule la seconde a besoin de savoir
 * ce qu on a aime.
 *
 * ON PEUT AIMER UN COMMENTAIRE — et rien de plus. Les trois reactions
 * repondent a une publication, qui raconte quelque chose ; un
 * commentaire n appelle qu un acquiescement. La base tient la regle,
 * pas seulement ce bouton.
 *
 * LE ZERO NE SE MONTRE PAS. Un « 0 » a cote de chaque commentaire est
 * du bruit : il occupe la place, se lit comme une note, et ne rapporte
 * rien. Le premier qui aime fait paraitre le chiffre.
 */
export function FilDesReponses({ postId }: { postId: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const locale = useDateFnsLocale();
  const [texte, setTexte] = useState("");

  const { data: reponses, isLoading } = usePostReplies(postId);
  const ajouter = useAddReply();
  const supprimer = useDeleteReply();
  const { aimer, retirer, connecte } = useAimerUneReponse(postId);

  const anonyme = t("community.post.anonymous", "Anonyme");

  const envoyer = () => {
    if (!texte.trim() || !user) return;
    ajouter.mutate({ post_id: postId, content: texte }, { onSuccess: () => setTexte("") });
  };

  return (
    <div className="co-reponses" onClick={(e) => e.stopPropagation()}>
      {isLoading ? (
        <p className="co-quand" style={{ padding: "4px 0" }}>
          {t("community.post.loadingReplies", "Chargement des réponses…")}
        </p>
      ) : (reponses || []).length === 0 ? (
        <p className="co-quand" style={{ padding: "4px 0" }}>
          {t("community.post.noComments", "Pas encore de réponses")}
        </p>
      ) : (
        (reponses || []).map((r) => {
          const decouvrable = r.profile?.community_profile_discoverable ?? true;
          const rNom = decouvrable ? nomAffichable(r.profile?.display_name, anonyme) : anonyme;
          const aime = !gesteAttendu(r);
          const combien = compteAMontrer(r);
          return (
            <div className="co-reponse" key={r.id}>
              <Pastille
                identifiant={decouvrable ? r.user_id : rNom}
                nom={rNom}
                image={decouvrable ? r.profile?.avatar_url : null}
                petite
              />
              <div style={{ minWidth: 0 }}>
                <div className="co-post-tete" style={{ marginBottom: 0 }}>
                  <span className="co-nom" style={{ fontSize: 14 }}>{rNom}</span>
                  <span className="co-sep" aria-hidden="true">·</span>
                  <time className="co-quand" style={{ fontSize: 13 }} dateTime={r.created_at}>
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale })}
                  </time>
                  {user?.id === r.user_id && (
                    <button
                      type="button"
                      className="co-action"
                      data-reaction="more"
                      style={{ marginLeft: "auto", height: 24 }}
                      aria-label={t("community.post.delete", "Supprimer")}
                      onClick={() => supprimer.mutate({ replyId: r.id, postId })}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className="co-reponse-texte">{r.content}</p>

                {/* Le bouton ne parait pas pour qui n est pas connecte :
                    il ne mene qu a un refus. */}
                {connecte && (
                  <button
                    type="button"
                    className="co-aime"
                    aria-pressed={aime}
                    aria-label={aime
                      ? t("community.reply.unlike", "Ne plus aimer")
                      : t("community.reply.like", "Aimer")}
                    onClick={() => (aime ? retirer.mutate(r.id) : aimer.mutate(r.id))}
                  >
                    <Heart aria-hidden="true" />
                    {combien !== null && <span>{combien}</span>}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {user && (
        <div className="co-repondre">
          <Pastille identifiant={user.id} nom={user.email} petite />
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); envoyer(); } }}
            placeholder={t("community.post.addComment", "Répondre…")}
            aria-label={t("community.post.addComment", "Répondre…")}
          />
          <button
            type="button"
            className="co-bouton"
            style={{ height: 30, padding: "0 14px", fontSize: 13 }}
            onClick={envoyer}
            disabled={!texte.trim() || ajouter.isPending}
          >
            {t("community.post.postComment", "Publier")}
          </button>
        </div>
      )}
    </div>
  );
}
