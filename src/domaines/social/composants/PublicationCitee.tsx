import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { Repeat2 } from "lucide-react";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { nomAffichable } from "@/domaines/social/logique/vocabulaire";
import { Pastille } from "@/domaines/social/composants/Pastille";
import type { CommunityPost } from "@/domaines/social/types";

interface Props {
  /** L originale, ou `undefined` si elle a ete supprimee. */
  citee?: CommunityPost;
  /** La marque : c etait un repartage, l originale est partie. */
  disparue: boolean;
}

/**
 * LA PUBLICATION CITEE.
 *
 * ELLE N EST PAS INTERACTIVE. Elle mene a l originale, elle ne la
 * commente pas : ni reactions, ni reponses, ni menu. Les compteurs
 * restent sur l originale, et les montrer ici ferait croire qu on peut
 * agir dessus — deux boutons pour un meme geste, dont l un ment.
 *
 * Un seul geste, donc : aller voir. Le cadre entier est cliquable et
 * mene au fil de l originale.
 *
 * QUAND L ORIGINALE A ETE SUPPRIMEE, ON LE DIT. Le repartage survit —
 * celui qui l a ecrit a ecrit quelque chose — mais sa citation ne
 * pointe plus nulle part. Ne rien afficher laisserait une carte
 * amputee sans que le lecteur comprenne pourquoi.
 */
export function PublicationCitee({ citee, disparue }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = useDateFnsLocale();

  if (disparue || !citee) {
    return (
      <p className="co-citee co-citee--partie">
        <Repeat2 aria-hidden="true" />
        {t("community.repartage.disparue", "La publication d’origine a été supprimée.")}
      </p>
    );
  }

  const decouvrable = citee.profile?.community_profile_discoverable ?? true;
  const anonyme = t("community.post.anonymous", "Anonyme");
  const nom = decouvrable ? nomAffichable(citee.profile?.display_name, anonyme) : anonyme;

  return (
    <button
      type="button"
      className="co-citee"
      onClick={(e) => { e.stopPropagation(); navigate(`/community?post=${citee.id}`); }}
      aria-label={t("community.repartage.ouvrir", "Voir la publication d’origine")}
    >
      <span className="co-citee-tete">
        <Pastille
          identifiant={decouvrable ? citee.user_id : nom}
          nom={nom}
          image={decouvrable ? citee.profile?.avatar_url : null}
          petite
        />
        <span className="co-nom">{nom}</span>
        <span className="co-sep" aria-hidden="true">·</span>
        <time className="co-quand" dateTime={citee.created_at}>
          {formatDistanceToNow(new Date(citee.created_at), { addSuffix: true, locale })}
        </time>
      </span>
      <span className="co-citee-texte">{citee.content}</span>
      {citee.image_url && (
        <img className="co-citee-image" src={citee.image_url} alt="" loading="lazy" />
      )}
    </button>
  );
}
