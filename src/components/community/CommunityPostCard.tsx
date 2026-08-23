import { memo, useState } from "react";
import {
  Check,
  Flag,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReactionButton } from "./ReactionButton";
import { PostTypeTag } from "./PostTypeTag";
import { ReportModal } from "./ReportModal";
import { nomAffichable, REACTIONS, type TypeReaction } from "./vocabulaire";
import { Pastille } from "./Pastille";
import type { Cadre } from "@/hooks/community/useCadres";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import {
  CommunityPost,
  useAddReaction,
  useRemoveReaction,
  usePostReplies,
  useAddReply,
  useDeleteReply,
  useUpdatePost,
  useDeletePost,
} from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";

/* UN POST — une ligne du fil, pas une carte.
 *
 * L ancienne version etait une carte de 20px de rayon, posee sur un
 * fond, avec une bande de couleur de 3px sur son flanc gauche, une
 * bordure qui virait au violet au survol, un deplacement de 2px vers
 * le haut, et trois ombres superposees dont un halo colore. Six
 * couches de decor pour porter un nom, une date et un texte.
 *
 * Un fil de discussion n est pas une collection de cartes. X,
 * Instagram et Snapchat n en posent aucune : une suite de lignes
 * separees par un filet d un pixel, avec un fond qui s eclaire
 * legerement au survol. Ce qui reste apres le decor, c est ce qu on
 * etait venu lire.
 *
 * La table de couleurs — six natures x six valeurs, trente-six
 * litteraux — a disparu avec la bande. La teinte de la nature vit
 * dans community.css, a un seul endroit, et ne sert plus qu au point
 * de l etiquette.
 *
 * La date etait formatee sans locale : formatDistanceToNow rendait
 * « 6 months ago » a un lecteur francais. */

const CORPS_MAX = 4;

/* MEMOISEE.
 *
 * Aucun composant du module ne l etait. Le fil se recharge a chaque
 * publication et a chaque arrivee en direct ; sans memoisation, les
 * vingt cartes se redessinent entierement — listes de reponses
 * comprises — meme quand une seule publication a change.
 *
 * La comparaison par defaut suffit : le hook rend un nouvel objet
 * seulement pour les publications reellement modifiees, les autres
 * gardent leur reference. C est aussi ce qui rend la reaction
 * optimiste bon marche : une seule carte se redessine. */
export const CommunityPostCard = memo(function CommunityPostCard({ post, cadre }: { post: CommunityPost; cadre?: Cadre | null }) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { user } = useAuth();

  const [reponsesOuvertes, setReponsesOuvertes] = useState(false);
  const [texteReponse, setTexteReponse] = useState("");
  const [signalement, setSignalement] = useState(false);
  const [enEdition, setEnEdition] = useState(false);
  const [texteEdite, setTexteEdite] = useState(post.content);
  const [menu, setMenu] = useState(false);

  const { data: reponses, isLoading: reponsesEnCours } = usePostReplies(
    reponsesOuvertes ? post.id : undefined,
  );
  const poserReaction = useAddReaction();
  const retirerReaction = useRemoveReaction();
  const ajouterReponse = useAddReply();
  const supprimerReponse = useDeleteReply();
  const modifier = useUpdatePost();
  const supprimer = useDeletePost();

  const estAuteur = user?.id === post.user_id;

  /* Les deux reglages de confidentialite du profil. Ils etaient deja
     respectes, et le restent : un profil non decouvrable perd son nom
     et son avatar, un profil qui ne partage pas sa progression perd
     l objectif rattache. */
  const decouvrable = post.profile?.community_profile_discoverable ?? true;
  const objectifVisible = post.profile?.share_goals_progress ?? true;
  const anonyme = t("community.post.anonymous", "Anonyme");
  const nom = decouvrable ? nomAffichable(post.profile?.display_name, anonyme) : anonyme;
  const avatar = decouvrable ? post.profile?.avatar_url || undefined : undefined;

  const basculerReaction = (type: TypeReaction) => {
    if (!user) return;
    if (post.user_reactions?.includes(type)) {
      retirerReaction.mutate({ post_id: post.id, reaction_type: type });
    } else {
      poserReaction.mutate({ post_id: post.id, reaction_type: type });
    }
  };

  const envoyerReponse = () => {
    if (!texteReponse.trim() || !user) return;
    ajouterReponse.mutate(
      { post_id: post.id, content: texteReponse },
      { onSuccess: () => setTexteReponse("") },
    );
  };

  const enregistrer = () => {
    if (!texteEdite.trim()) return;
    modifier.mutate(
      { id: post.id, content: texteEdite.trim() },
      {
        onSuccess: () => {
          setEnEdition(false);
          toast.success(t("community.post.updated", "Publication modifiée"));
        },
        onError: () => toast.error(t("community.post.updateFailed", "La modification a échoué")),
      },
    );
  };

  const compte = (type: TypeReaction) =>
    post.reactions_count?.[type] ??
    (type === "support" ? post.support_count : type === "respect" ? post.respect_count : post.inspired_count) ??
    0;

  return (
    <article className="co-post" onClick={() => !enEdition && setReponsesOuvertes((v) => !v)}>
      <Pastille identifiant={decouvrable ? post.user_id : nom} nom={nom} image={avatar} cadre={decouvrable ? cadre : null} />

      <div className="co-post-corps">
        <div className="co-post-tete">
          <span className="co-nom">{nom}</span>
          {/* La nature remonte sur la ligne d en-tete : le lecteur sait
              de quoi il s agit AVANT de lire, au lieu de l apprendre
              une fois le texte parcouru. */}
          <PostTypeTag type={post.post_type} />
          <span className="co-sep" aria-hidden="true">·</span>
          <time className="co-quand" dateTime={post.created_at}>
            <span className="co-quand--relatif">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale })}
            </span>
            <span className="co-quand--exact">
              {format(new Date(post.created_at), "d MMMM yyyy, HH:mm", { locale })}
            </span>
          </time>
          {post.updated_at !== post.created_at && (
            <span className="co-edite">{t("community.post.edited", "modifié")}</span>
          )}

          <span style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
            {(estAuteur || user) && (
              <button
                type="button"
                className="co-action"
                data-reaction="more"
                aria-label={t("community.post.actions", "Actions")}
                aria-expanded={menu}
                onClick={(e) => { e.stopPropagation(); setMenu((v) => !v); }}
              >
                <i className="co-action-rond"><MoreHorizontal aria-hidden="true" /></i>
              </button>
            )}
          </span>
        </div>

        {menu && (
          <div
            style={{ display: "flex", gap: 4, margin: "4px 0 6px", flexWrap: "wrap" }}
            onClick={(e) => e.stopPropagation()}
          >
            {estAuteur && (
              <>
                <button type="button" className="co-puce" onClick={() => { setEnEdition(true); setMenu(false); }}>
                  <Pencil aria-hidden="true" />
                  {t("community.post.edit", "Modifier")}
                </button>
                <button
                  type="button"
                  className="co-puce"
                  onClick={() => {
                    supprimer.mutate(post.id, {
                      onSuccess: () => toast.success(t("community.post.deleted", "Publication supprimée")),
                      onError: () => toast.error(t("community.post.deleteFailed", "La suppression a échoué")),
                    });
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  {t("community.post.delete", "Supprimer")}
                </button>
              </>
            )}
            {!estAuteur && (
              <button type="button" className="co-puce" onClick={() => { setSignalement(true); setMenu(false); }}>
                <Flag aria-hidden="true" />
                {t("community.post.report", "Signaler")}
              </button>
            )}
          </div>
        )}

        {enEdition ? (
          <div onClick={(e) => e.stopPropagation()}>
            <textarea
              className="co-composeur-champ"
              style={{ fontSize: 15 }}
              value={texteEdite}
              onChange={(e) => setTexteEdite(e.target.value)}
              rows={CORPS_MAX}
              autoFocus
            />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button type="button" className="co-bouton" onClick={enregistrer} disabled={!texteEdite.trim()}>
                <Check aria-hidden="true" />
                {t("community.post.save", "Enregistrer")}
              </button>
              <button
                type="button"
                className="co-bouton co-bouton--discret"
                onClick={() => { setEnEdition(false); setTexteEdite(post.content); }}
              >
                <X aria-hidden="true" />
                {t("community.post.cancel", "Annuler")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="co-post-texte">{post.content}</p>
          </>
        )}

        {post.goal_name && objectifVisible && (
          <span className="co-objectif">
            <Target aria-hidden="true" />
            <b>{post.goal_name}</b>
          </span>
        )}

        <div className="co-actions" onClick={(e) => e.stopPropagation()}>
          {REACTIONS.map((type) => (
            <ReactionButton
              key={type}
              type={type}
              count={compte(type)}
              isActive={!!post.user_reactions?.includes(type)}
              onToggle={() => basculerReaction(type)}
            />
          ))}
          <button
            type="button"
            className="co-action"
            data-reaction="reply"
            aria-expanded={reponsesOuvertes}
            aria-label={t("community.post.comments", "Réponses")}
            onClick={() => setReponsesOuvertes((v) => !v)}
          >
            <i className="co-action-rond"><MessageCircle aria-hidden="true" /></i>
            <span>{post.replies_count || ""}</span>
          </button>
        </div>

        {reponsesOuvertes && (
          <div className="co-reponses" onClick={(e) => e.stopPropagation()}>
            {reponsesEnCours ? (
              <p className="co-quand" style={{ padding: "4px 0" }}>
                {t("community.post.loadingReplies", "Chargement des réponses…")}
              </p>
            ) : (reponses || []).length === 0 ? (
              <p className="co-quand" style={{ padding: "4px 0" }}>
                {t("community.post.noComments", "Pas encore de réponses")}
              </p>
            ) : (
              (reponses || []).map((r) => {
                const rDecouvrable = r.profile?.community_profile_discoverable ?? true;
                const rNom = rDecouvrable ? nomAffichable(r.profile?.display_name, anonyme) : anonyme;
                return (
                  <div className="co-reponse" key={r.id}>
                    <Pastille
                      identifiant={rDecouvrable ? r.user_id : rNom}
                      nom={rNom}
                      image={rDecouvrable ? r.profile?.avatar_url : null}
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
                            onClick={() => supprimerReponse.mutate({ replyId: r.id, postId: post.id })}
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      <p className="co-reponse-texte">{r.content}</p>
                    </div>
                  </div>
                );
              })
            )}

            {user && (
              <div className="co-repondre">
                <Pastille identifiant={user.id} nom={user.email} petite />
                <input
                  value={texteReponse}
                  onChange={(e) => setTexteReponse(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); envoyerReponse(); } }}
                  placeholder={t("community.post.addComment", "Répondre…")}
                  aria-label={t("community.post.addComment", "Répondre…")}
                />
                <button
                  type="button"
                  className="co-bouton"
                  style={{ height: 30, padding: "0 14px", fontSize: 13 }}
                  onClick={envoyerReponse}
                  disabled={!texteReponse.trim() || ajouterReponse.isPending}
                >
                  {t("community.post.postComment", "Publier")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ReportModal
        isOpen={signalement}
        onClose={() => setSignalement(false)}
        postId={post.id}
      />
    </article>
  );
});
