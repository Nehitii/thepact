import { useState } from "react";
import { Megaphone, Pin, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Pastille } from "@/domaines/social/composants/Pastille";
import { nomAffichable } from "@/domaines/social/logique/vocabulaire";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import {
  useAnnouncements,
  useGuildActivity,
  useGuilds,
  type Guild,
  type GuildActivity,
} from "@/domaines/social/hooks/useGuilds";

/* LA VUE D ENSEMBLE D UNE GUILDE : ce qu on annonce, ce qui s y passe.
 *
 * TROIS TITRES ETAIENT EN ANGLAIS, entre crochets, sur une page dont
 * tout le reste etait traduit : « [ POST ANNOUNCEMENT ] »,
 * « [ ANNOUNCEMENTS ] », « [ RECENT ACTIVITY ] ». Et l en-tete de
 * chaque annonce donnait « [ NEHITI · 5 MONTHS AGO ] » — le nom en
 * capitales et la date en anglais, juste au-dessus de lignes
 * d activite ecrites en francais.
 *
 * LES DATES ETAIENT SANS LOCALE. formatDistanceToNow rendait donc
 * « 5 months ago » a un lecteur francais, exactement comme le fil de
 * Community avant sa passe.
 *
 * ET UN CAS DU JOURNAL restait en dur : « X earned N XP » ecrit
 * directement dans le switch, entre cinq autres cas traduits.
 *
 * Les deux hooks de donnees etaient tires de useGuilds ; ils vivent
 * maintenant au niveau du module et s importent directement. */

interface Props {
  guild: Guild;
  userId: string;
  isOfficer: boolean;
}

const LIMITE = 500;

export function GuildOverview({ guild, userId, isOfficer }: Props) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { createAnnouncement, deleteAnnouncement } = useGuilds();
  const { data: annonces = [] } = useAnnouncements(guild.id);
  const { data: activite = [] } = useGuildActivity(guild.id);
  const [texte, setTexte] = useState("");

  const publier = async () => {
    const propre = texte.trim();
    if (!propre) return;
    try {
      await createAnnouncement.mutateAsync({ guildId: guild.id, content: propre, pinned: false });
      toast.success(t("friends.announcementPosted", "Annonce publiée"));
      setTexte("");
    } catch {
      toast.error(t("friends.announcementFailed", "La publication a échoué"));
    }
  };

  const libelleActivite = (a: GuildActivity) => {
    const nom = a.display_name || "?";
    const combien = (a.metadata as { amount?: number } | null)?.amount || 0;
    switch (a.action_type) {
      case "guild_created": return t("friends.activityCreated", { name: nom });
      case "member_joined": return t("friends.activityJoined", { name: nom });
      case "member_left": return t("friends.activityLeft", { name: nom });
      case "goal_contribution": return t("friends.activityContributed", { name: nom, amount: combien });
      case "xp_gained": return t("guild.xpGained", "{{name}} a gagné {{amount}} XP", { name: nom, amount: combien });
      default: return `${nom} · ${a.action_type}`;
    }
  };

  return (
    <>
      {isOfficer && (
        <div className="gu-ecrire">
          <textarea
            value={texte}
            maxLength={LIMITE}
            onChange={(e) => setTexte(e.target.value)}
            placeholder={t("guild.announcementHint", "Ce que la guilde doit savoir…")}
            aria-label={t("guild.postAnnouncement", "Publier une annonce")}
          />
          <div className="gu-ecrire-pied">
            <button
              type="button"
              className="co-bouton"
              onClick={publier}
              disabled={!texte.trim() || createAnnouncement.isPending}
            >
              <Send aria-hidden="true" />
              {t("guild.postAnnouncement", "Publier une annonce")}
            </button>
          </div>
        </div>
      )}

      <section className="gu-bloc">
        <div className="gu-bloc-tete">
          <h2 className="gu-bloc-titre">{t("guild.announcements", "Annonces")}</h2>
          {annonces.length > 0 && <span className="gu-bloc-compte">{annonces.length}</span>}
        </div>
        <div className="gu-corps">
          {annonces.length === 0 ? (
            <p className="co-choix-message" style={{ textAlign: "left", padding: "6px 0" }}>
              {t("guild.noAnnouncement", "Aucune annonce")}
            </p>
          ) : (
            annonces.map((a) => {
              const nom = nomAffichable(a.author_name, "?");
              return (
                <article className="gu-annonce" key={a.id}>
                  <Pastille identifiant={a.author_id} nom={nom} image={a.author_avatar} petite />
                  <div style={{ minWidth: 0 }}>
                    <div className="co-post-tete">
                      <span className="co-nom" style={{ fontSize: 14 }}>{nom}</span>
                      {a.pinned && <Pin aria-hidden="true" style={{ width: 12, height: 12, color: "var(--co-respect)" }} />}
                      <span className="co-sep" aria-hidden="true">·</span>
                      <time className="co-quand" style={{ fontSize: 13 }} dateTime={a.created_at}>
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale })}
                      </time>
                    </div>
                    <p className="gu-annonce-texte">{a.content}</p>
                  </div>
                  {(isOfficer || a.author_id === userId) && (
                    <button
                      type="button"
                      className="co-action"
                      data-reaction="more"
                      aria-label={t("guild.deleteAnnouncement", "Supprimer l'annonce")}
                      onClick={() => deleteAnnouncement.mutate({ id: a.id, guildId: guild.id })}
                    >
                      <i className="co-action-rond"><Trash2 aria-hidden="true" /></i>
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="gu-bloc">
        <div className="gu-bloc-tete">
          <Megaphone aria-hidden="true" style={{ width: 15, height: 15, color: "var(--co-texte-3)" }} />
          <h2 className="gu-bloc-titre">{t("guild.recentActivity", "Activité récente")}</h2>
        </div>
        <div className="gu-corps">
          {activite.length === 0 ? (
            <p className="co-choix-message" style={{ textAlign: "left", padding: "6px 0" }}>
              {t("guild.noActivity", "Aucune activité pour le moment")}
            </p>
          ) : (
            activite.map((a) => (
              <p className="gu-trace" key={a.id}>
                {libelleActivite(a)}
                <time dateTime={a.created_at}>
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale })}
                </time>
              </p>
            ))
          )}
        </div>
      </section>
    </>
  );
}
