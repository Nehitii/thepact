import { memo, useState } from "react";
import {
  Check,
  Flag,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Repeat2,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReactionButton } from "@/domaines/social/composants/ReactionButton";
import { PostTypeTag } from "@/domaines/social/composants/PostTypeTag";
import { ReportModal } from "@/domaines/social/composants/ReportModal";
import { FilDesReponses } from "@/domaines/social/composants/FilDesReponses";
import { PublicationCitee } from "@/domaines/social/composants/PublicationCitee";
import { RepartagerDialog } from "@/domaines/social/composants/RepartagerDialog";
import { etatDeLaCitation, peutEtreRepartagee } from "@/domaines/social/logique/repartage";
import { nomAffichable, REACTIONS, type TypeReaction } from "@/domaines/social/logique/vocabulaire";
import { Pastille } from "@/domaines/social/composants/Pastille";
import type { Cadre } from "@/domaines/social/hooks/useCadres";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import {
  CommunityPost,
  useAddReaction,
  useRemoveReaction,
  usePostReplies,
  useAddReply,
  useDeleteReply,
  useUpdatePost,
  useDeletePost,
} from "@/domaines/social/hooks/useCommunity";
import { useAuth } from "@/socle/contextes/AuthContext";
import { urlEstUneVideo } from "@/domaines/social/logique/communityMedia";

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
  const [repartageOuvert, setRepartageOuvert] = useState(false);
  /* Trois etats, pas deux : une originale supprimee laisse une
     reference nulle et se confondrait avec « rien de cite ». */
  const citation = etatDeLaCitation(post);

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

        {post.image_url && (
          /* Le rapport est libre : un GIF est souvent large et court,
             une capture est haute. On borne la hauteur pour qu une
             image ne pousse pas le reste du fil hors de l ecran.

             UNE VIDEO SE RECONNAIT A SON EXTENSION. La publication ne
             retient qu une adresse, pas un type : plutot qu ajouter une
             colonne pour distinguer deux cas, on lit la fin de l URL.

             Elle porte ses commandes et ne demarre pas toute seule : un
             fil ou quatre videos se lancent en meme temps est
             insupportable. « playsInline » evite le plein ecran force
             sur iPhone, et « preload=metadata » ne tire que la premiere
             image plutot que le fichier entier. */
          urlEstUneVideo(post.image_url) ? (
            <video
              className="co-post-image"
              src={post.image_url}
              controls
              playsInline
              preload="metadata"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              className="co-post-image"
              src={post.image_url}
              alt=""
              loading="lazy"
              onClick={(e) => e.stopPropagation()}
            />
          )
        )}

        {/* L originale citee. Elle n est pas interactive : elle mene
            a l originale, elle ne la commente pas. */}
        {citation !== "aucune" && (
          <PublicationCitee
            citee={post.shared_post}
            disparue={citation === "disparue"}
          />
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
          {/* LE REPARTAGE NE PARAIT QUE S IL EST POSSIBLE. Un bouton
              grise poserait la question sans y repondre ; un bouton qui
              mene a un refus est pire. Les trois raisons de se taire
              sont dans « logique/repartage.ts », et la base les tient
              une seconde fois. */}
          {peutEtreRepartagee(post, user?.id) && (
            <button
              type="button"
              className="co-action"
              data-reaction="repartage"
              aria-label={t("community.repartage.action", "Repartager")}
              onClick={() => setRepartageOuvert(true)}
            >
              <i className="co-action-rond"><Repeat2 aria-hidden="true" /></i>
            </button>
          )}
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

        {reponsesOuvertes && <FilDesReponses postId={post.id} />}
      </div>

      <ReportModal
        isOpen={signalement}
        onClose={() => setSignalement(false)}
        postId={post.id}
      />

      {repartageOuvert && (
        <RepartagerDialog
          ouvert={repartageOuvert}
          onFermer={() => setRepartageOuvert(false)}
          originale={post}
        />
      )}
    </article>
  );
});
