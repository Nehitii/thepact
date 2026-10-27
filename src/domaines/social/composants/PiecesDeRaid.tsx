/* LES CINQ PIECES D UN RAID DE GUILDE.
 *
 * L anneau de progression, les canaux, les porteurs, le raid en cours,
 * le raid clos. Cent cinquante lignes sorties de `GuildRaidsPanel.tsx`,
 * qui en faisait 437 : ce sont les etats visuels d un meme objet, et
 * rien d autre ne les rend.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Clock, Flag, Trophy } from "lucide-react";
import { Pastille } from "@/domaines/social/composants/Pastille";
import { nomAffichable } from "@/domaines/social/logique/vocabulaire";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { useGuildMembers } from "@/domaines/social/hooks/useGuilds";
import { CANAUX, VIDE } from "@/domaines/social/logique/canauxDeRaid";
import {
  ciblesDe, metriquesDemandees, partFranchie, useAvancementRaid,
  type Raid, type Compte,
} from "@/domaines/social/hooks/useRaids";

/** L anneau de completion : la part moyenne des cibles demandees. */
export function Anneau({ part }: { part: number }) {
  const R = 31;
  const tour = 2 * Math.PI * R;
  return (
    <div className="gu-anneau">
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle className="gu-anneau-fond" cx="36" cy="36" r={R} />
        <circle
          className="gu-anneau-part"
          cx="36" cy="36" r={R}
          strokeDasharray={tour}
          strokeDashoffset={tour * (1 - part)}
        />
      </svg>
      <span className="gu-anneau-chiffre">{Math.round(part * 100)}%</span>
    </div>
  );
}

/** Les quatre canaux, chacun avec sa teinte et sa barre. */
export function Canaux({ raid, fait }: { raid: Raid; fait: Compte }) {
  const { t } = useTranslation();
  const cibles = ciblesDe(raid);
  const demandees = metriquesDemandees(raid);

  return (
    <div className="gu-canaux">
      {CANAUX.filter((c) => demandees.includes(c.cle)).map(({ cle, Icone, defaut }) => {
        const cible = cibles[cle];
        const compte = fait[cle];
        const atteint = compte >= cible;
        return (
          <div className="gu-canal" key={cle} data-canal={cle} data-fait={atteint}>
            <Icone className="gu-canal-icone" aria-hidden="true" />
            <span className="gu-canal-nom">{t(`guild.metric.${cle}`, defaut)}</span>
            <span className="gu-canal-compte">
              <b>{compte}</b> / {cible}
            </span>
            <span className="gu-canal-barre">
              <i style={{ width: `${Math.min(100, (compte / cible) * 100)}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Qui porte le raid, et surtout : quel canal ne porte personne. */
export function Porteurs({
  membres, raid,
}: {
  membres: Array<{ user_id: string } & Compte>;
  raid: Raid;
}) {
  const { t } = useTranslation();
  const { data: gens = [] } = useGuildMembers(raid.guild_id);
  const demandees = metriquesDemandees(raid);
  const parId = useMemo(() => new Map(gens.map((g) => [g.user_id, g])), [gens]);

  const actifs = membres.filter((m) => demandees.some((d) => m[d] > 0));
  if (!actifs.length) return null;

  return (
    <div className="gu-porteurs">
      <p className="gu-etiquette">{t("guild.raidCarriers", "Qui le porte")}</p>
      {actifs.map((m) => {
        const p = parId.get(m.user_id);
        const nom = nomAffichable(p?.display_name, t("friends.unknownAgent", "Agent Inconnu"));
        const total = demandees.reduce((s, d) => s + m[d], 0);
        return (
          <div className="gu-porteur" key={m.user_id}>
            <Pastille identifiant={m.user_id} nom={nom} image={p?.avatar_url} petite />
            <span className="gu-porteur-nom">{nom}</span>
            <span className="gu-porteur-part" aria-hidden="true">
              {demandees.flatMap((d) =>
                Array.from({ length: Math.min(6, m[d]) }, (_, i) => (
                  <i key={`${d}-${i}`} data-canal={d} />
                )),
              )}
            </span>
            <span className="gu-porteur-total">{total}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Un raid qui court : son avancement est mesure a chaque consultation. */
export function RaidEnCours({ raid }: { raid: Raid }) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { data: av } = useAvancementRaid(raid.id);
  const fait = av?.totaux ?? VIDE;

  const fin = new Date(raid.finit_le);
  const restant = fin.getTime() - Date.now();
  const urgent = restant < 24 * 3600 * 1000;

  return (
    <article className="gu-raid">
      <div className="gu-raid-tete">
        <div>
          <h3 className="gu-raid-titre">{raid.titre}</h3>
          {raid.intention && <p className="gu-raid-intention">{raid.intention}</p>}
        </div>
        <span className="gu-raid-temps" data-urgent={urgent}>
          <Clock aria-hidden="true" />
          <time dateTime={raid.finit_le}>
            {t("guild.raidTimeLeft", "Reste {{duree}}", {
              duree: formatDistanceToNowStrict(fin, { locale }),
            })}
          </time>
        </span>
      </div>

      <div className="gu-raid-corps">
        <Anneau part={partFranchie(raid, fait)} />
        <Canaux raid={raid} fait={fait} />
      </div>

      {av && <Porteurs membres={av.membres} raid={raid} />}
    </article>
  );
}

/** Un raid clos rend ce qui a ete FIGE, jamais un recalcul. */
export function RaidClos({ raid }: { raid: Raid }) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { data: av } = useAvancementRaid(raid.id);
  const reussi = raid.etat === "reussi";
  const fait = av?.totaux ?? VIDE;

  return (
    <article className="gu-raid">
      <div className="gu-raid-tete">
        <div>
          <h3 className="gu-raid-titre">{raid.titre}</h3>
          <p className="gu-raid-intention">
            {t("guild.raidClosedOn", "Clos le {{date}}", {
              date: raid.clos_le ? format(new Date(raid.clos_le), "d MMMM yyyy", { locale }) : "—",
            })}
          </p>
        </div>
        <span className="gu-raid-verdict" data-reussi={reussi}>
          {reussi ? <Trophy aria-hidden="true" /> : <Flag aria-hidden="true" />}
          {reussi
            ? t("guild.raidWon", "Réussi · +{{xp}} XP", { xp: av?.xp ?? 0 })
            : t("guild.raidLost", "Échoué")}
        </span>
      </div>

      <div className="gu-raid-corps">
        <Anneau part={partFranchie(raid, fait)} />
        <Canaux raid={raid} fait={fait} />
      </div>
    </article>
  );
}
