import { useMemo, useState } from "react";
import { Crown, Gem, MoreHorizontal, Search, Shield, User, UserMinus, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Pastille } from "@/components/community/Pastille";
import { nomAffichable } from "@/components/community/vocabulaire";
import { useCadres } from "@/hooks/community/useCadres";
import { useFriends } from "@/hooks/useFriends";
import { useRangs } from "@/hooks/useRangs";
import { useGuildMembers, useGuilds, type Guild, type GuildMember } from "@/hooks/useGuilds";

/* LES MEMBRES D UNE GUILDE.
 *
 * LE CLASSEMENT A FUSIONNE ICI, et pour une raison simple : il n en
 * etait pas un. GuildLeaderboard triait les membres par ROLE — le
 * fondateur, puis les officiers, puis les autres — et collait un
 * numero devant. Aucun score, aucune progression : la meme liste, avec
 * un rang decoratif. Il occupait une septieme entree de menu pour une
 * guilde qui compte un membre.
 *
 * Il affichait aussi le role brut de la base — « owner », « officer »,
 * « member » — en anglais, sur une page traduite. Les trois passent
 * par le fichier de langue.
 *
 * Et son podium etait un emoji tronque, « "🏆".slice(0, 1) », la ou
 * une icone dessinee dit la meme chose sans dependre du systeme qui
 * l affiche. */

const ICONE: Record<string, typeof Crown> = { owner: Crown, officer: Shield, member: User };

interface Props {
  guild: Guild;
  userId: string;
  isOfficer: boolean;
  isOwner: boolean;
}

export function GuildMembersPanel({ guild, userId, isOfficer, isOwner }: Props) {
  const { t } = useTranslation();
  const { data: membres = [] } = useGuildMembers(guild.id);
  const { friends } = useFriends();
  const { removeMember, updateMemberRole, inviteMember } = useGuilds();

  const [recherche, setRecherche] = useState("");
  const [inviter, setInviter] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);

  const { data: cadres } = useCadres(membres.map((m) => m.user_id));
  const { data: rangs } = useRangs(membres.map((m) => m.user_id));

  const libelleRole = (role: string) =>
    t(`guild.role.${role}`, role === "owner" ? "Fondateur" : role === "officer" ? "Officier" : "Membre");

  /* CE PANNEAU EST AUSSI LE CLASSEMENT DE LA GUILDE — le vrai
     classement y a fusionne, faute d en etre un : il triait par role
     et collait un numero devant. Il triait donc encore par role, parce
     qu il n avait aucun autre chiffre a proposer.
     Maintenant qu il en a un, il classe par XP. Le fondateur reste
     reconnaissable a sa couronne ; il n a plus a etre premier pour
     cela. */
  const listee = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return membres
      .filter((m) => !q || (m.display_name || "").toLowerCase().includes(q))
      .sort((a, b) => (rangs?.get(b.user_id)?.xp ?? 0) - (rangs?.get(a.user_id)?.xp ?? 0));
  }, [membres, recherche, rangs]);

  const dejaMembres = new Set(membres.map((m) => m.user_id));
  const invitables = friends.filter((f) => !dejaMembres.has(f.friend_id));

  const changerRole = async (m: GuildMember, role: string) => {
    setMenu(null);
    try {
      await updateMemberRole.mutateAsync({ memberId: m.id, role });
      toast.success(role === "officer" ? t("friends.promoted", "Promu officier") : t("friends.demoted", "Rétrogradé"));
    } catch {
      toast.error(t("friends.roleFailed", "Le changement de rôle a échoué"));
    }
  };

  const exclure = async (m: GuildMember) => {
    setMenu(null);
    try {
      await removeMember.mutateAsync({ memberId: m.id });
      toast.success(t("friends.memberRemoved", "Membre retiré"));
    } catch {
      toast.error(t("friends.memberRemoveFailed", "Le retrait a échoué"));
    }
  };

  return (
    <>
      <div className="gu-chercher">
        <Search aria-hidden="true" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t("guild.searchMember", "Chercher un membre…")}
          aria-label={t("guild.searchMember", "Chercher un membre…")}
        />
        {isOfficer && (
          <button type="button" className="co-puce" aria-pressed={inviter} onClick={() => setInviter((v) => !v)}>
            <UserPlus aria-hidden="true" />
            {t("friends.invite", "Inviter")}
          </button>
        )}
      </div>

      {inviter && (
        <section className="gu-bloc">
          <div className="gu-bloc-tete">
            <h2 className="gu-bloc-titre">{t("guild.inviteAlly", "Inviter un allié")}</h2>
          </div>
          <div className="gu-corps">
            {invitables.length === 0 ? (
              <p className="co-choix-message" style={{ textAlign: "left", padding: "6px 0" }}>
                {t("friends.noFriendsToInvite", "Aucun allié à inviter — ils sont déjà membres, ou vous n'en avez pas encore.")}
              </p>
            ) : (
              invitables.map((f) => (
                <div
                  className="gu-annonce"
                  key={f.friend_id}
                  style={{ gridTemplateColumns: "32px 1fr auto", alignItems: "center" }}
                >
                  <Pastille identifiant={f.friend_id} nom={f.display_name} image={f.avatar_url} petite />
                  <span className="co-nom" style={{ fontSize: 14 }}>
                    {nomAffichable(f.display_name, t("friends.unknownAgent", "Agent Inconnu"))}
                  </span>
                  <button
                    type="button"
                    className="co-bouton"
                    disabled={inviteMember.isPending}
                    onClick={async () => {
                      try {
                        await inviteMember.mutateAsync({ guildId: guild.id, inviteeId: f.friend_id });
                        toast.success(t("friends.inviteSent", "Invitation envoyée"));
                      } catch {
                        toast.error(t("friends.inviteFailed", "L'invitation a échoué"));
                      }
                    }}
                  >
                    {t("friends.invite", "Inviter")}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {listee.length === 0 ? (
        <div className="co-vide">
          <User aria-hidden="true" />
          <h3>
            {recherche
              ? t("guild.noMemberFound", "Aucun membre de ce nom")
              : t("friends.noMembers", "Aucun membre")}
          </h3>
        </div>
      ) : (
        listee.map((m) => {
          const Icone = ICONE[m.role] || User;
          const nom = nomAffichable(m.display_name, t("friends.unknownAgent", "Agent Inconnu"));
          const cestMoi = m.user_id === userId;
          const modifiable = isOfficer && !cestMoi && m.role !== "owner";
          const rang = rangs?.get(m.user_id);

          return (
            <div className="co-post gu-ligne" key={m.id}>
              <Pastille identifiant={m.user_id} nom={nom} image={m.avatar_url} cadre={cadres?.get(m.user_id)} />

              <div className="co-post-corps">
                <div className="co-post-tete">
                  <span className="co-nom">{nom}</span>
                  {cestMoi && <span className="gu-grade">{t("leaderboard.you", "(TOI)")}</span>}
                </div>
                <div className="gu-mesures">
                  <span className="gu-mesure">
                    <Icone aria-hidden="true" />
                    {libelleRole(m.role)}
                  </span>
                  {/* Le rang porte la couleur que la personne a choisie
                      pour son propre palier — chacun definit ses dix. */}
                  {rang?.nom && (
                    <span
                      className="gu-mesure"
                      data-teinte={rang.couleur ? "" : undefined}
                      style={{ color: rang.couleur || undefined }}
                    >
                      <Gem aria-hidden="true" />
                      {rang.nom}
                    </span>
                  )}
                  {rang && rang.xp > 0 && (
                    <span className="gu-mesure gu-chiffre">
                      {rang.xp.toLocaleString()} {t("leaderboard.xp", "XP")}
                    </span>
                  )}
                </div>
              </div>

              <div className="gu-actions">
                {modifiable && menu === m.id ? (
                  <>
                    {m.role === "member" ? (
                      <button type="button" className="co-puce" onClick={() => changerRole(m, "officer")}>
                        {t("guild.promote", "Promouvoir officier")}
                      </button>
                    ) : (
                      <button type="button" className="co-puce" onClick={() => changerRole(m, "member")}>
                        {t("guild.demote", "Rétrograder")}
                      </button>
                    )}
                    {isOwner && (
                      <button
                        type="button"
                        className="co-puce"
                        onClick={() => exclure(m)}
                        aria-label={t("guild.kick", "Exclure de la guilde")}
                      >
                        <UserMinus aria-hidden="true" />
                      </button>
                    )}
                  </>
                ) : modifiable ? (
                  <button
                    type="button"
                    className="co-action"
                    data-reaction="more"
                    aria-label={t("community.post.actions", "Actions")}
                    onClick={() => setMenu(m.id)}
                  >
                    <i className="co-action-rond"><MoreHorizontal aria-hidden="true" /></i>
                  </button>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
