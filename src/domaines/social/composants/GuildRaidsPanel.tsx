import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck, Clock, Flag, Footprints, Minus, PenLine, Plus,
  Swords, Target, Trophy, X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import { Pastille } from "@/domaines/social/composants/Pastille";
import { nomAffichable } from "@/domaines/social/logique/vocabulaire";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { useGuildMembers } from "@/domaines/social/hooks/useGuilds";
import {
  METRIQUES, ciblesDe, metriquesDemandees, partFranchie,
  useAvancementRaid, useRaidActions, useRaids,
  type Compte, type Metrique, type Raid,
} from "@/domaines/social/hooks/useRaids";

/* LES RAIDS D UNE GUILDE.
 *
 * Ce panneau remplace les « objectifs collectifs », qui se remplissaient
 * avec un champ ou l on tapait un nombre a la main. On pouvait donc les
 * remplir sans rien faire, et tout faire sans qu ils bougent : la barre
 * de progression ne mesurait rien.
 *
 * Un raid mesure. La base lit les horodatages que l application ecrit
 * deja — etapes validees, objectifs franchis, taches faites, jours
 * ecrits — et en tire l avancement.
 *
 * Il demande QUATRE choses a la fois, ce qui est le coeur de l affaire :
 * une personne seule couvre mal les quatre, plusieurs se repartissent.
 * Et il a une ECHEANCE : il se gagne ou se perd, il ne stagne pas. */

const CANAUX: { cle: Metrique; Icone: typeof Target; defaut: string; pas: number }[] = [
  { cle: "etapes", Icone: Footprints, defaut: "Étapes validées", pas: 5 },
  { cle: "objectifs", Icone: Target, defaut: "Objectifs franchis", pas: 1 },
  { cle: "taches", Icone: CheckCheck, defaut: "Tâches faites", pas: 5 },
  { cle: "journal", Icone: PenLine, defaut: "Jours écrits", pas: 1 },
];

/* La ponderation vient de la RARETE mesuree, pas d une intuition : sur
   huit mois d usage reel, 119 etapes et 65 taches contre 13 objectifs
   et 7 jours ecrits. Elle est la meme qu en base (clore_raid). */
const POIDS: Compte = { etapes: 1, taches: 1, journal: 5, objectifs: 10 };

const xpDe = (c: Compte) => METRIQUES.reduce((t, m) => t + c[m] * POIDS[m], 0);

const VIDE: Compte = { etapes: 0, objectifs: 0, taches: 0, journal: 0 };

/** L anneau de completion : la part moyenne des cibles demandees. */
function Anneau({ part }: { part: number }) {
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
function Canaux({ raid, fait }: { raid: Raid; fait: Compte }) {
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
function Porteurs({
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
function RaidEnCours({ raid }: { raid: Raid }) {
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
function RaidClos({ raid }: { raid: Raid }) {
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

/** Composer un raid : un titre, une duree, et ce qu on demande. */
function Composer({ guildId, fermer }: { guildId: string; fermer: () => void }) {
  const { t } = useTranslation();
  const { lancer } = useRaidActions(guildId);
  const [titre, setTitre] = useState("");
  const [intention, setIntention] = useState("");
  const [jours, setJours] = useState(7);
  const [cibles, setCibles] = useState<Compte>({ etapes: 20, objectifs: 1, taches: 15, journal: 3 });

  const bouger = (m: Metrique, d: number) =>
    setCibles((c) => ({ ...c, [m]: Math.max(0, Math.min(999, c[m] + d)) }));

  const rienDemande = METRIQUES.every((m) => cibles[m] === 0);

  const envoyer = async () => {
    if (!titre.trim() || rienDemande) return;
    try {
      await lancer.mutateAsync({
        titre: titre.trim(),
        intention: intention.trim() || undefined,
        jours,
        cibles,
      });
      toast.success(t("guild.raidLaunched", "Raid lancé"));
      fermer();
    } catch {
      toast.error(t("guild.raidLaunchFailed", "Le lancement a échoué"));
    }
  };

  return (
    <div className="gu-ecrire">
      <input
        className="gu-champ"
        value={titre}
        maxLength={80}
        onChange={(e) => setTitre(e.target.value)}
        placeholder={t("guild.raidTitle", "Le nom du raid")}
        aria-label={t("guild.raidTitle", "Le nom du raid")}
      />
      <textarea
        className="gu-champ"
        style={{ minHeight: 54, resize: "vertical" }}
        value={intention}
        maxLength={200}
        onChange={(e) => setIntention(e.target.value)}
        placeholder={t("guild.raidIntent", "Ce qu’il doit changer — facultatif")}
        aria-label={t("guild.raidIntent", "Ce qu’il doit changer — facultatif")}
      />

      <div>
        <p className="gu-etiquette">{t("guild.raidDuration", "Durée")}</p>
        <div className="gu-barre" style={{ padding: 0, border: "none" }}>
          {[7, 14, 30].map((j) => (
            <button
              key={j}
              type="button"
              className="co-puce"
              aria-pressed={jours === j}
              onClick={() => setJours(j)}
            >
              {t("guild.raidDays", "{{count}} jours", { count: j })}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="gu-etiquette">{t("guild.raidTargets", "Ce que le raid demande")}</p>
        <div className="gu-cibles">
          {CANAUX.map(({ cle, Icone, defaut, pas }) => (
            <div className="gu-cible" key={cle}>
              <Icone className="gu-cible-icone" aria-hidden="true" />
              <span className="gu-cible-nom">{t(`guild.metric.${cle}`, defaut)}</span>
              <span className="gu-compteur">
                <button
                  type="button"
                  onClick={() => bouger(cle, -pas)}
                  disabled={cibles[cle] === 0}
                  aria-label={t("guild.raidLess", "Moins de {{quoi}}", { quoi: t(`guild.metric.${cle}`, defaut) })}
                >
                  <Minus aria-hidden="true" />
                </button>
                <span data-zero={cibles[cle] === 0}>{cibles[cle]}</span>
                <button
                  type="button"
                  onClick={() => bouger(cle, pas)}
                  aria-label={t("guild.raidMore", "Plus de {{quoi}}", { quoi: t(`guild.metric.${cle}`, defaut) })}
                >
                  <Plus aria-hidden="true" />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="gu-raid-gain">
        {t("guild.raidReward", "Réussi, ce raid vaut {{xp}} XP à la guilde.", { xp: xpDe(cibles) })}
      </p>

      <div className="gu-contribuer" style={{ marginTop: 0 }}>
        <button
          type="button"
          className="co-bouton"
          onClick={envoyer}
          disabled={!titre.trim() || rienDemande || lancer.isPending}
        >
          <Swords aria-hidden="true" />
          {t("guild.raidLaunch", "Lancer le raid")}
        </button>
        <button type="button" className="co-puce" onClick={fermer} aria-label={t("common.cancel", "Annuler")}>
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

interface Props {
  guildId: string;
  canManage: boolean;
}

export function GuildRaidsPanel({ guildId, canManage }: Props) {
  const { t } = useTranslation();
  const { data: raids = [], isLoading } = useRaids(guildId);
  const { clore } = useRaidActions(guildId);
  /* mutate garde la meme identite d un rendu a l autre, pas l objet
     de mutation : dependre de « clore » relancerait l effet a chaque
     changement d etat de la mutation, donc en boucle. */
  const cloreRaid = clore.mutate;
  const [composer, setComposer] = useState(false);

  /* LA CLOTURE EST DECLENCHEE PAR LA CONSULTATION.
     Le premier membre qui ouvre la page apres l echeance fige le
     resultat et l XP. Pas de tache planifiee a maintenir pour une
     chose qui n a besoin d etre vraie qu au moment ou on la regarde.
     Le verrou empeche de redemander une cloture deja en vol ; la
     fonction en base est de toute façon idempotente. */
  const closDemandes = useRef(new Set<string>());
  useEffect(() => {
    for (const r of raids) {
      if (r.etat !== "en_cours") continue;
      if (new Date(r.finit_le).getTime() > Date.now()) continue;
      if (closDemandes.current.has(r.id)) continue;
      closDemandes.current.add(r.id);
      cloreRaid(r.id);
    }
  }, [raids, cloreRaid]);

  const enCours = raids.filter((r) => r.etat === "en_cours");
  const passes = raids.filter((r) => r.etat !== "en_cours");

  if (isLoading) {
    return (
      <div aria-busy="true">
        {[0, 1].map((i) => (
          <div className="co-fantome" key={i}>
            <span className="co-os co-os--rond" />
            <span className="co-os" style={{ height: 14, alignSelf: "center" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {canManage && (
        <>
          <div className="gu-barre">
            <button type="button" className="co-bouton" onClick={() => setComposer((v) => !v)}>
              <Swords aria-hidden="true" />
              {t("guild.raidNew", "Lancer un raid")}
            </button>
          </div>
          {composer && <Composer guildId={guildId} fermer={() => setComposer(false)} />}
        </>
      )}

      {raids.length === 0 ? (
        <div className="co-vide">
          <Swords aria-hidden="true" />
          <h3>{t("guild.noRaids", "Aucun raid")}</h3>
          <p>
            {t(
              "guild.noRaidsDesc",
              "Un raid fixe à la guilde quatre choses à accomplir avant une date. Il ne se remplit pas à la main : il se nourrit de ce que ses membres font déjà.",
            )}
          </p>
        </div>
      ) : (
        <>
          {enCours.length > 0 && (
            <section className="gu-bloc">
              <div className="gu-bloc-tete">
                <Swords aria-hidden="true" style={{ width: 15, height: 15, color: "var(--co-accent)" }} />
                <h2 className="gu-bloc-titre">{t("guild.raidsOngoing", "En cours")}</h2>
                <span className="gu-bloc-compte">{enCours.length}</span>
              </div>
              <div className="gu-corps">
                {enCours.map((r) => <RaidEnCours key={r.id} raid={r} />)}
              </div>
            </section>
          )}

          {passes.length > 0 && (
            <section className="gu-bloc">
              <div className="gu-bloc-tete">
                <Trophy aria-hidden="true" style={{ width: 15, height: 15, color: "var(--co-texte-3)" }} />
                <h2 className="gu-bloc-titre">{t("guild.raidsPast", "Le registre")}</h2>
                <span className="gu-bloc-compte">{passes.length}</span>
              </div>
              <div className="gu-corps">
                {passes.map((r) => <RaidClos key={r.id} raid={r} />)}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
