import { useMemo, type CSSProperties } from "react";
import { Crown, Gem, Shield, Swords, Trophy, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNowStrict } from "date-fns";
import { Pastille } from "@/domaines/social/composants/Pastille";
import { nomAffichable } from "@/domaines/social/logique/vocabulaire";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { useRangs } from "@/domaines/social/hooks/useRangs";
import { partFranchie, useAvancementRaid, useRaids, type Raid } from "@/domaines/social/hooks/useRaids";
import { teinteDe } from "@/domaines/social/logique/blason";
import type { Guild, GuildMember } from "@/domaines/social/hooks/useGuilds";

/* LE RAIL DE LA PAGE DE GUILDE.
 *
 * La grille de ce monde declare DEUX colonnes — six cents pixels pour
 * le contenu, trois cent vingt pour un rail — et la page de guilde ne
 * remplissait que la premiere. Le rail restait vide : trois cent vingt
 * pixels de rien a droite de chaque ecran, sur toutes les sections.
 *
 * Il porte maintenant ce qu on veut savoir sans quitter la section ou
 * l on est : ou en est la guilde, quel raid court, qui la porte. */

const ICONE: Record<string, typeof Crown> = { owner: Crown, officer: Shield, member: User };

function RaidEnBref({ raid, onVoir }: { raid: Raid; onVoir: () => void }) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { data: av } = useAvancementRaid(raid.id);
  const part = partFranchie(raid, av?.totaux ?? { etapes: 0, objectifs: 0, taches: 0, journal: 0 });
  const fin = new Date(raid.finit_le);
  const urgent = fin.getTime() - Date.now() < 24 * 3600 * 1000;

  return (
    <button type="button" className="gu-rail-raid" onClick={onVoir}>
      <span className="gu-rail-raid-tete">
        <span className="gu-rail-raid-nom">{raid.titre}</span>
        <span className="gu-rail-raid-temps" data-urgent={urgent}>
          {formatDistanceToNowStrict(fin, { locale })}
        </span>
      </span>
      <span className="gu-rail-jauge" aria-hidden="true">
        <i style={{ width: `${Math.round(part * 100)}%` }} />
      </span>
      <span className="gu-rail-raid-part">
        {t("guild.raidDone", "{{n}} % franchi", { n: Math.round(part * 100) })}
      </span>
    </button>
  );
}

interface Props {
  guilde: Guild;
  membres: GuildMember[];
  estFondateur: boolean;
  onSection: (s: "apercu" | "membres" | "discussion" | "raids" | "evenements" | "reglages") => void;
}

export function RailGuilde({ guilde, membres, onSection }: Props) {
  const { t } = useTranslation();
  const { data: raids = [] } = useRaids(guilde.id);
  const { data: rangs } = useRangs(membres.map((m) => m.user_id));

  const teinte = teinteDe(guilde.color);
  const xp = guilde.total_xp || 0;
  const niveau = Math.floor(xp / 100);
  const dansLeNiveau = xp % 100;

  const enCours = raids.filter((r) => r.etat === "en_cours");
  const gagnes = raids.filter((r) => r.etat === "reussi").length;

  /* Les trois premiers, par XP. La liste des membres est deja triee
     ainsi dans son panneau : on refait le tri ici plutot que de le
     faire remonter, pour que le rail reste vrai quelle que soit la
     section ouverte. */
  const premiers = useMemo(
    () => [...membres]
      .sort((a, b) => (rangs?.get(b.user_id)?.xp ?? 0) - (rangs?.get(a.user_id)?.xp ?? 0))
      .slice(0, 3),
    [membres, rangs],
  );

  return (
    <aside className="co-rail">
      {/* ── Ou en est la guilde ── */}
      <section className="co-bloc" style={{ "--gu-teinte": teinte } as CSSProperties}>
        <h2 className="co-bloc-titre">{t("guild.standing", "Où en est la guilde")}</h2>

        {/* LE BLOC NE PORTE AUCUN RETRAIT : chacun de ses enfants porte
            le sien, comme le titre et les mesures. Sans ce corps, le
            niveau et la jauge se collaient au bord de la carte pendant
            que le titre restait en retrait — deux alignements
            differents dans quatorze pixels. */}
        <div className="gu-rail-corps">
          <div className="gu-rail-niveau">
            <span className="gu-rail-niveau-chiffre">{niveau}</span>
            <span className="gu-rail-niveau-mot">{t("guild.levelWord", "niveau")}</span>
          </div>

          {/* .co-jauge est faite pour vivre dans une rangee flexible —
              « flex: 1 » et rien d autre. Posee seule, elle mesurait
              zero par zero : la barre d XP etait tout simplement
              invisible. */}
          <span className="gu-rail-jauge" aria-hidden="true">
            <i style={{ width: `${dansLeNiveau}%` }} />
          </span>

          <p className="gu-rail-reste">
            {t("guild.toNextLevel", "{{n}} XP avant le niveau {{niveau}}", {
              n: 100 - dansLeNiveau,
              niveau: niveau + 1,
            })}
          </p>
        </div>

        <div className="co-mesures">
          <div className="co-mesure">
            <span className="co-mesure-valeur">{membres.length}</span>
            <span className="co-mesure-quoi">{t("guild.membersWord", "membres")}</span>
          </div>
          <div className="co-mesure">
            <span className="co-mesure-valeur">{gagnes}</span>
            <span className="co-mesure-quoi">{t("guild.raidsWon", "raids gagnés")}</span>
          </div>
        </div>
      </section>

      {/* ── Ce qui court ── */}
      <section className="co-bloc">
        {/* Un « svg » est en display:block dans ce projet — la remise a
            zero de Tailwind. Un pictogramme pose dans un titre passait
            donc A LA LIGNE, au-dessus du texte, orphelin. Le titre
            devient une rangee. */}
        <h2 className="co-bloc-titre gu-rail-titre">
          <Swords aria-hidden="true" />
          {t("guild.raidsOngoing", "En cours")}
        </h2>
        <div className="gu-rail-corps">
          {enCours.length === 0 ? (
            <p className="gu-rail-rien">
              {t("guild.noRaidNow", "Aucun raid ne court en ce moment.")}
            </p>
          ) : (
            enCours.slice(0, 2).map((r) => (
              <RaidEnBref key={r.id} raid={r} onVoir={() => onSection("raids")} />
            ))
          )}
        </div>
      </section>

      {/* ── Qui la porte ── */}
      {premiers.length > 0 && (
        <section className="co-bloc">
          <h2 className="co-bloc-titre gu-rail-titre">
            <Trophy aria-hidden="true" />
            {t("guild.whoCarries", "Qui la porte")}
          </h2>
          <div className="gu-rail-corps">
          {premiers.map((m, i) => {
            const rang = rangs?.get(m.user_id);
            const Icone = ICONE[m.role] || User;
            const nom = nomAffichable(m.display_name, t("friends.unknownAgent", "Agent Inconnu"));
            return (
              <button
                type="button"
                className="gu-rail-membre"
                key={m.id}
                data-podium={i + 1}
                onClick={() => onSection("membres")}
              >
                <span className="gu-place" aria-hidden="true">{i + 1}</span>
                <Pastille identifiant={m.user_id} nom={nom} image={m.avatar_url} petite />
                <span className="gu-rail-membre-nom">
                  {nom}
                  {m.role !== "member" && (
                    <Icone
                      aria-hidden="true"
                      className="gu-rail-membre-role"
                      data-role={m.role}
                    />
                  )}
                </span>
                {rang?.nom && (
                  <span className="gu-rail-membre-rang" style={{ color: rang.couleur || undefined }}>
                    <Gem aria-hidden="true" />
                    {rang.xp.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
          </div>
        </section>
      )}
    </aside>
  );
}
