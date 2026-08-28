import { useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, CalendarDays, Crown, Home, LogOut,
  MessageSquare, Settings, Shield, Swords, Users,
} from "lucide-react";
import { toast } from "sonner";
import "@/domaines/social/community.css";
import "@/domaines/social/guild.css";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useGuild, useGuildMembers, useGuilds } from "@/domaines/social/hooks/useGuilds";
import { emblemeDe, teinteDe } from "@/domaines/social/logique/blason";
/* BlasonGuilde, et non « Blason » : blason.ts porte deja les emblemes
   et les teintes. Deux fichiers qui ne different que par une majuscule
   sont le meme fichier sur Windows et deux fichiers ailleurs — le
   genre de piege qui ne se voit qu au deploiement. */
import { BlasonGuilde } from "@/domaines/social/composants/BlasonGuilde";
import { RailGuilde } from "@/domaines/social/composants/RailGuilde";
import { GuildOverview } from "@/domaines/social/composants/GuildOverview";
import { GuildMembersPanel } from "@/domaines/social/composants/GuildMembersPanel";
import { GuildChat } from "@/domaines/social/composants/GuildChat";
import { GuildRaidsPanel } from "@/domaines/social/composants/GuildRaidsPanel";
import { GuildEventsPanel } from "@/domaines/social/composants/GuildEventsPanel";
import { GuildSettingsPage } from "@/domaines/social/composants/GuildSettingsPage";

/* LA PAGE D UNE GUILDE.
 *
 * UN DEFAUT DE FOND, D ABORD. La guilde etait cherchee dans « mes
 * guildes » — guilds.find((g) => g.id === id). Une guilde trouvee par
 * la decouverte s affichait donc « introuvable » : on pouvait la voir
 * dans la liste, jamais la consulter. Elle est maintenant demandee a
 * la base, et c est RLS qui tranche.
 *
 * LE FAUX TERMINAL EST PARTI. « SEQ.7B3 » en haut de page,
 * « [ FACTION · C723C109 ] » — un mot anglais suivi des huit premiers
 * caracteres de l identifiant technique —, « MBR · 1/25 », et un menu
 * dont chaque entree portait son numero de console, NAV.01 a NAV.07.
 * Rien de tout cela ne disait quoi que ce soit sur la guilde.
 *
 * SEPT SECTIONS DEVIENNENT SIX. Le classement etait la liste des
 * membres, triee. C est la meme liste : elle a rejoint l onglet
 * Membres plutot que d occuper une septieme entree pour une guilde
 * qui en compte un.
 *
 * Le vocabulaire est celui de Friends — guilde, jamais faction — et
 * il vient du fichier de langue. */

type Section = "apercu" | "membres" | "discussion" | "raids" | "evenements" | "reglages";

export default function GuildPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: guilde, isLoading: chargement } = useGuild(id);
  const { data: membres = [], isLoading: membresEnCours } = useGuildMembers(id || "");
  const { leaveGuild } = useGuilds();
  const [section, setSection] = useState<Section>("apercu");

  if (chargement || membresEnCours) {
    return (
      <div className="co">
        <div className="co-grille">
          <main className="co-colonne" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div className="co-fantome" key={i}>
                <span className="co-os co-os--rond" />
                <span className="co-os" style={{ height: 14, alignSelf: "center" }} />
              </div>
            ))}
          </main>
        </div>
      </div>
    );
  }

  if (!guilde || !user) {
    return (
      <div className="co">
        <div className="co-grille">
          <main className="co-colonne">
            <div className="co-vide">
              <Shield aria-hidden="true" />
              <h3>{t("guild.notFound", "Cette guilde est introuvable")}</h3>
              <p>{t("guild.notFoundWhy", "Elle a peut-être été dissoute, ou elle est privée et vous n'en êtes pas membre.")}</p>
              <button type="button" className="co-bouton co-bouton--discret" onClick={() => navigate("/friends")}>
                <ArrowLeft aria-hidden="true" />
                {t("common.back", "Retour")}
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const monRole = membres.find((m) => m.user_id === user.id);
  const estFondateur = guilde.owner_id === user.id;
  const estOfficier = estFondateur || monRole?.role === "officer";
  const estMembre = !!monRole;

  const quitter = async () => {
    if (estFondateur) {
      toast.error(t("guild.ownerCantLeave", "Un fondateur ne peut pas quitter sa guilde"));
      return;
    }
    try {
      await leaveGuild.mutateAsync(guilde.id);
      toast.success(t("friends.leftGuild", "Guilde quittée"));
      navigate("/friends");
    } catch {
      toast.error(t("friends.leaveFailed", "Impossible de quitter la guilde"));
    }
  };

  const TOUTES: { cle: Section; libelle: string; Icone: typeof Home; officier?: boolean }[] = [
    { cle: "apercu", libelle: t("guild.overview", "Vue d'ensemble"), Icone: Home },
    { cle: "membres", libelle: t("guild.members", "Membres"), Icone: Users },
    { cle: "discussion", libelle: t("guild.chat", "Discussion"), Icone: MessageSquare },
    { cle: "raids", libelle: t("guild.raids", "Raids"), Icone: Swords },
    { cle: "evenements", libelle: t("guild.events", "Événements"), Icone: CalendarDays },
    { cle: "reglages", libelle: t("common.settings", "Réglages"), Icone: Settings, officier: true },
  ];
  const sections = TOUTES.filter((s) => !s.officier || estOfficier);

  const max = guilde.max_members || 25;
  /* L embleme et la teinte servent au mot du jour ; le niveau, lui,
     vit dans le rail, qui le tire de la meme colonne. */
  const Embleme = emblemeDe(guilde.icon);
  const teinte = teinteDe(guilde.color);

  return (
    <div className="co">
      <div className="co-grille">
        <main className="co-colonne">
          {/* LE RETOUR.
              Il etait une petite puce grise posee au-dessus de la
              banniere, dans dix pixels de marge — a l endroit exact ou
              l oeil ne va pas, et de la meme taille que les puces de
              filtre qui, elles, ne naviguent pas. Il devient une barre
              a part entiere, qui dit d ou l on vient. */}
          <div className="gu-retour">
            <button type="button" className="gu-retour-bouton" onClick={() => navigate("/friends")}>
              <ArrowLeft aria-hidden="true" />
              {t("friends.tabGuilds", "Guildes")}
            </button>
            <span className="gu-retour-fil" aria-hidden="true" />
            <span className="gu-retour-ici">{guilde.name}</span>
          </div>

          {/* L identite est dessinee par Blason, en un seul endroit :
              la page, la liste des guildes, l apercu des reglages et la
              modale de fondation la partagent. */}
          <BlasonGuilde
            guilde={guilde}
            aDroite={estMembre && !estFondateur ? (
              <button type="button" className="co-puce" onClick={quitter} disabled={leaveGuild.isPending}>
                <LogOut aria-hidden="true" />
                {t("friends.leaveGuild", "Quitter")}
              </button>
            ) : undefined}
            enfants={
              <div className="gu-faits">
                <span className="gu-fait">
                  <Users aria-hidden="true" />
                  {t("guild.membersOf", { count: membres.length, max, defaultValue: "{{count}} membres sur {{max}}" })}
                </span>
                {estFondateur && (
                  <span className="gu-fait">
                    <Crown aria-hidden="true" />
                    {t("friends.owner", "Fondateur")}
                  </span>
                )}
              </div>
            }
          />

          {/* Le mot du jour. Il etait rendu comme une note de bas de
              page — treize pixels et demi, gris — c est-a-dire le
              traitement qu on reserve a ce qu on ne veut pas faire
              lire. C est pourtant la seule phrase que la guilde
              adresse aux siens. */}
          {guilde.motd && (
            <blockquote className="gu-motd" style={{ "--gu-teinte": teinte } as CSSProperties}>
              <span className="gu-motd-signe" aria-hidden="true">
                {guilde.emblem_url
                  ? <img src={guilde.emblem_url} alt="" />
                  : <Embleme />}
              </span>
              {guilde.motd}
              <cite className="gu-motd-qui">{guilde.name}</cite>
            </blockquote>
          )}

          <nav className="gu-sections" aria-label={t("guild.sections", "Sections de la guilde")}>
            {sections.map(({ cle, libelle, Icone }) => (
              <button
                key={cle}
                type="button"
                className="co-puce"
                aria-pressed={section === cle}
                onClick={() => setSection(cle)}
              >
                <Icone aria-hidden="true" />
                {libelle}
              </button>
            ))}
          </nav>

          <div>
            {section === "apercu" && <GuildOverview guild={guilde} userId={user.id} isOfficer={estOfficier} />}
            {section === "membres" && (
              <GuildMembersPanel guild={guilde} userId={user.id} isOfficer={estOfficier} isOwner={estFondateur} />
            )}
            {section === "discussion" && <GuildChat guildId={guilde.id} userId={user.id} />}
            {section === "raids" && <GuildRaidsPanel guildId={guilde.id} canManage={estOfficier} />}
            {section === "evenements" && (
              <GuildEventsPanel guildId={guilde.id} userId={user.id} isOfficer={estOfficier} />
            )}
            {section === "reglages" && (
              <GuildSettingsPage
                guild={guilde}
                userId={user.id}
                isOwner={estFondateur}
                onFini={() => setSection("apercu")}
              />
            )}
          </div>
        </main>

        {/* LA GRILLE DECLARE DEUX COLONNES — six cents pixels et un rail
            de trois cent vingt — et cette page ne remplissait que la
            premiere. Le rail etait donc trois cent vingt pixels de vide
            a droite de chaque ecran. */}
        <RailGuilde
          guilde={guilde}
          membres={membres}
          estFondateur={estFondateur}
          onSection={setSection}
        />
      </div>
    </div>
  );
}
