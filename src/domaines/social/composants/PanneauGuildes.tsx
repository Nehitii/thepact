import { useState } from "react";
import { Compass, Crown, KeyRound, Plus, Shield, Users } from "lucide-react";
import { BlasonGuilde } from "@/domaines/social/composants/BlasonGuilde";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { partRemplie, plafondAffiche } from "@/domaines/social/logique/guilde";
import { toast } from "sonner";
import { GuildCreateModal } from "@/domaines/social/composants/GuildCreateModal";
import { useGuilds } from "@/domaines/social/hooks/useGuilds";
import { useAuth } from "@/socle/contextes/AuthContext";
import type { Guild } from "@/domaines/social/hooks/useGuilds";

/* LES GUILDES.
 *
 * L ancienne version titrait ses sections « [ ACTIVE FACTIONS ] » et
 * « [ JACK_IN VIA CODE ] » — de l anglais entre crochets, sur une page
 * dont les onglets etaient en francais, et un bouton nomme JACK_IN.
 * Trois mots pour la meme chose : guildes, factions, alliances.
 *
 * Ici, un seul mot, et il vient du fichier de langue : changer de
 * langue renomme vraiment. */

/* UNE GUILDE, DANS LA LISTE.
 *
 * Elle montrait une couronne ou un bouclier dans un carre teinte —
 * c est-a-dire VOTRE role — alors que la guilde a un embleme et une
 * banniere. Les deux etaient enregistres et invisibles ici.
 *
 * Elle porte maintenant son vrai blason, dessine par le meme composant
 * que la page de guilde. */
function CarteGuilde({ guilde, estFondateur, onOuvrir }: { guilde: Guild; estFondateur: boolean; onOuvrir: () => void }) {
  const { t } = useTranslation();
  const membres = guilde.member_count ?? 0;
  const max = plafondAffiche(guilde.max_members);
  const part = partRemplie(membres, guilde.max_members);

  return (
    <div className="fr-guilde" role="button" tabIndex={0}
      onClick={onOuvrir}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOuvrir(); } }}
    >
      <BlasonGuilde
        guilde={guilde}
        taille="moyen"
        aDroite={estFondateur ? (
          <span className="gu-role" data-role="owner">
            <Crown aria-hidden="true" />
            {t("friends.owner", "Fondateur")}
          </span>
        ) : undefined}
        enfants={
          <>
            <div className="gu-faits">
              <span className="gu-fait">
                <Users aria-hidden="true" />
                {t("friends.membersOf", "{{n}} sur {{max}}", { n: membres, max })}
              </span>
            </div>
            <span className="co-jauge" style={{ marginTop: 8 }} aria-hidden="true">
              <i style={{ width: `${part}%` }} />
            </span>
          </>
        }
      />
    </div>
  );
}

export function PanneauGuildes() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [creation, setCreation] = useState(false);
  const [decouvrir, setDecouvrir] = useState(false);

  const { guilds, guildsLoading, publicGuilds, invites, createGuild, respondToInvite, joinViaCode } = useGuilds();

  const miennes = new Set(guilds.map((g) => g.id));
  const autres = publicGuilds.filter((g) => !miennes.has(g.id));

  const rejoindreParCode = async () => {
    const propre = code.trim().toUpperCase();
    if (!propre) return;
    try {
      await joinViaCode.mutateAsync(propre);
      toast.success(t("friends.guildJoined", "Guilde rejointe"));
      setCode("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error", "Erreur"));
    }
  };

  return (
    <>
      <div className="fr-barre">
        <button type="button" className="co-bouton" onClick={() => setCreation(true)}>
          <Plus aria-hidden="true" />
          {t("friends.createGuild", "Créer une guilde")}
        </button>
        <button
          type="button"
          className="co-puce"
          aria-pressed={decouvrir}
          onClick={() => setDecouvrir((v) => !v)}
        >
          <Compass aria-hidden="true" />
          {t("friends.discover", "Découvrir")}
        </button>
      </div>

      <div className="fr-chercher">
        <KeyRound aria-hidden="true" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") rejoindreParCode(); }}
          placeholder={t("friends.enterInviteCode", "Code d'invitation")}
          aria-label={t("friends.enterInviteCode", "Code d'invitation")}
        />
        <button type="button" className="co-puce" disabled={!code.trim() || joinViaCode.isPending} onClick={rejoindreParCode}>
          {t("friends.joinGuild", "Rejoindre")}
        </button>
      </div>

      {invites.length > 0 && (
        <>
          <h2 className="fr-section">{t("friends.guildInvites", "Invitations")}</h2>
          {invites.map((inv) => (
            <div className="co-post fr-ligne" key={inv.id}>
              <span className="fr-guilde-blason"><Shield aria-hidden="true" /></span>
              <div className="co-post-corps">
                <span className="co-nom">{inv.guild_name}</span>
                <div className="fr-mesures">
                  <span className="fr-mesure">
                    {t("friends.invitedBy", "Invité par {{nom}}", { nom: inv.inviter_name || "?" })}
                  </span>
                </div>
              </div>
              <div className="fr-actions">
                <button
                  type="button"
                  className="co-bouton"
                  onClick={() => respondToInvite.mutate({ inviteId: inv.id, guildId: inv.guild_id, accept: true })}
                >
                  {t("friends.accept", "Accepter")}
                </button>
                <button
                  type="button"
                  className="co-puce"
                  onClick={() => respondToInvite.mutate({ inviteId: inv.id, guildId: inv.guild_id, accept: false })}
                >
                  {t("friends.decline", "Refuser")}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {guildsLoading ? (
        <div aria-busy="true">
          {[0, 1].map((i) => (
            <div className="co-fantome" key={i}>
              <span className="co-os co-os--rond" />
              <span className="co-os" style={{ height: 14, alignSelf: "center" }} />
            </div>
          ))}
        </div>
      ) : guilds.length > 0 ? (
        <>
          <h2 className="fr-section">
            {t("friends.myGuilds", "Mes guildes")}
            <span className="fr-section-compte">{guilds.length}</span>
          </h2>
          {guilds.map((g) => (
            <CarteGuilde
              key={g.id}
              guilde={g}
              estFondateur={g.owner_id === user?.id}
              onOuvrir={() => navigate(`/guild/${g.id}`)}
            />
          ))}
        </>
      ) : (
        <div className="co-vide">
          <Shield aria-hidden="true" />
          <h3>{t("friends.noGuildsTitle", "Aucune guilde")}</h3>
          <p>{t("friends.noGuildsWhy", "Une guilde réunit plusieurs personnes autour d'objectifs communs. Créez la vôtre, ou entrez le code de quelqu'un.")}</p>
        </div>
      )}

      {decouvrir && (
        <>
          <h2 className="fr-section">
            {t("friends.discover", "Découvrir")}
            <span className="fr-section-compte">{autres.length}</span>
          </h2>
          {autres.length === 0 ? (
            <p className="co-choix-message">{t("friends.noPublicGuild", "Aucune guilde publique pour le moment")}</p>
          ) : (
            autres.map((g) => (
              <CarteGuilde key={g.id} guilde={g} estFondateur={false} onOuvrir={() => navigate(`/guild/${g.id}`)} />
            ))
          )}
        </>
      )}

      <GuildCreateModal
        open={creation}
        onClose={() => setCreation(false)}
        loading={createGuild.isPending}
        onCreate={async (donnees) => {
          await createGuild.mutateAsync(donnees);
          setCreation(false);
          toast.success(t("friends.guildCreated", "Guilde créée"));
        }}
      />
    </>
  );
}
