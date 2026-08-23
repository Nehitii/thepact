import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, CalendarDays, Crown, Home, LogOut,
  MessageSquare, Settings, Shield, Target, Users,
} from "lucide-react";
import { toast } from "sonner";
import "@/styles/community.css";
import "@/styles/guild.css";
import { useAuth } from "@/contexts/AuthContext";
import { useGuild, useGuildMembers, useGuilds } from "@/hooks/useGuilds";
import { GuildOverview } from "@/components/guild/GuildOverview";
import { GuildMembersPanel } from "@/components/guild/GuildMembersPanel";
import { GuildChat } from "@/components/guild/GuildChat";
import { GuildGoalsPanel } from "@/components/friends/GuildGoalsPanel";
import { GuildEventsPanel } from "@/components/guild/GuildEventsPanel";
import { GuildSettingsPage } from "@/components/guild/GuildSettingsPage";

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

type Section = "apercu" | "membres" | "discussion" | "objectifs" | "evenements" | "reglages";

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
    { cle: "objectifs", libelle: t("guild.goals", "Objectifs"), Icone: Target },
    { cle: "evenements", libelle: t("guild.events", "Événements"), Icone: CalendarDays },
    { cle: "reglages", libelle: t("common.settings", "Réglages"), Icone: Settings, officier: true },
  ];
  const sections = TOUTES.filter((s) => !s.officier || estOfficier);

  const max = guilde.max_members || 25;
  const xp = guilde.total_xp || 0;
  const niveau = Math.floor(xp / 100);
  const dansLeNiveau = xp % 100;

  return (
    <div className="co">
      <div className="co-grille">
        <main className="co-colonne">
          <div style={{ padding: "10px var(--co-gouttiere) 0" }}>
            <button type="button" className="co-puce" onClick={() => navigate("/friends")}>
              <ArrowLeft aria-hidden="true" />
              {t("friends.tabGuilds", "Guildes")}
            </button>
          </div>

          <header className="gu-tete">
            <span className="gu-blason" style={{ color: guilde.color || "var(--co-accent)" }}>
              {estFondateur ? <Crown aria-hidden="true" /> : <Shield aria-hidden="true" />}
            </span>

            <div style={{ minWidth: 0 }}>
              <h1 className="gu-nom">{guilde.name}</h1>
              {guilde.description && <p className="gu-mot">{guilde.description}</p>}
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
            </div>

            {estMembre && !estFondateur && (
              <button type="button" className="co-puce" onClick={quitter} disabled={leaveGuild.isPending}>
                <LogOut aria-hidden="true" />
                {t("friends.leaveGuild", "Quitter")}
              </button>
            )}
          </header>

          <div className="gu-xp">
            <span className="gu-xp-niveau">{t("guild.level", "Niveau {{n}}", { n: niveau })}</span>
            <span className="co-jauge" style={{ flex: 1 }} aria-hidden="true">
              <i style={{ width: `${dansLeNiveau}%` }} />
            </span>
            <span className="gu-xp-chiffre">{dansLeNiveau} / 100 XP</span>
          </div>

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
            {section === "objectifs" && <GuildGoalsPanel guildId={guilde.id} canManage={estOfficier} />}
            {section === "evenements" && (
              <GuildEventsPanel guildId={guilde.id} userId={user.id} isOfficer={estOfficier} />
            )}
            {section === "reglages" && (
              <GuildSettingsPage guild={guilde} userId={user.id} isOwner={estFondateur} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
