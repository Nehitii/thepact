import { useCallback, useMemo } from "react";
import "@/styles/cyberpunk.css";
import "@/styles/analytics.css";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { DSPageShell } from "@/components/ds";
import { Skeleton } from "@/components/ui/skeleton";
import { SpaceBackdrop } from "@/components/home/SpaceBackdrop";
import { CleanPeriodSelector } from "@/components/analytics/clean/CleanPeriodSelector";
import { CleanTooltip } from "@/components/analytics/clean/CleanTooltip";
import { GoalContrats } from "@/components/analytics/GoalContrats";

import { useAnalytics } from "@/hooks/useAnalytics";
import { useAnalyticsState, type PrismSection } from "@/hooks/useAnalyticsState";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { formatCurrency } from "@/lib/currency";
import { getDifficultyLabel, getTagLabel } from "@/lib/goalConstants";

/* ─────────────────────────────────────────────────────────────
   STATISTIQUES

   La page etait organisee par SOURCE de donnees : six onglets —
   apercu, objectifs, focus, sante, finance, habitudes — repondant
   chacun "voici tout ce que je sais sur X", jamais "ou en es-tu".
   Elle comptait 24 tuiles de KPI, 13 cartes et 27 graphiques, dans un
   systeme visuel etranger au tableau de bord : coins a 12px contre 4,
   jetons generiques au lieu des jetons nexus, et backdrop-blur — le
   filtre meme qui grisait le champ d'etoiles et qu'on a retire de
   onze panneaux du tableau de bord.

   Elle est desormais organisee par QUESTION, en trois vues :

     TRAJECTOIRE  comment j'avance dans le temps
     REPARTITION  ou va l'effort
     RYTHME       a quelle cadence je tiens

   Le tableau de bord dit ou vous en etes maintenant ; cette page dit
   comment vous y etes arrive. C'est sa seule raison d'exister a cote.

   Trois compteurs en tete, fixes d'une vue a l'autre : on ne les
   apprend qu'une fois.
   ───────────────────────────────────────────────────────────── */

const AXE = { fontSize: 11, fill: "var(--nexus-text-dimmer)" } as const;
const TRAIT = "hsl(var(--primary) / 0.16)";
const ACCENT = "hsl(var(--primary))";
const AMBRE = "#ffab00";
const VERT = "#00ff88";
const ROUGE = "#ff6b4a";
const LEGENDE = { fontSize: 11, fontFamily: "'Share Tech Mono', monospace" } as const;

const VUES: { id: PrismSection; nom: string; sous: string }[] = [
  { id: "trajectoire", nom: "Trajectoire", sous: "Comment j'avance dans le temps" },
  { id: "repartition", nom: "Répartition", sous: "Où va l'effort" },
  { id: "rythme", nom: "Rythme", sous: "À quelle cadence je tiens" },
];

/** Panneau, dans le langage exact du tableau de bord : fond opaque,
 *  bord cyan, coins a 4px, aucun backdrop-filter. */
function Panneau({
  titre, droite, children, vide, messageVide,
}: {
  titre: string;
  droite?: string;
  children?: React.ReactNode;
  vide?: boolean;
  messageVide?: string;
}) {
  return (
    <div className="cp-cadre">
      <section className="cp-fond ana-panneau">
        <span className="cp-equerre cp-equerre-hg" />
        <span className="cp-equerre cp-equerre-bd" />
        <header className="ana-panneau-tete">
          <h2 className="ana-panneau-titre ds-t-label">{titre}</h2>
          <span className="ana-panneau-fil" />
          {droite && <span className="ana-panneau-droite ds-t-label">{droite}</span>}
        </header>
        {vide
          ? <p className="ana-vide ds-t-label">{messageVide || "Aucune donnée"}</p>
          : children}
      </section>
    </div>
  );
}

/** Releve segmente : etiquette, barre en cellules, valeur — sur une ligne.
 *  Remplace les BarChart horizontaux, ou il fallait suivre une barre
 *  jusqu'a un axe pour lire un nombre qu'on peut simplement ecrire. */
function Releve({ lignes, teinte = ACCENT, suffixe = "" }: {
  lignes: { nom: string; valeur: number }[];
  teinte?: string;
  suffixe?: string;
}) {
  const max = Math.max(1, ...lignes.map((l) => l.valeur));
  return (
    <div className="cp-releve">
      {lignes.map((l) => (
        <div key={l.nom} className="cp-releve-ligne">
          <span className="cp-releve-nom" title={l.nom}>{l.nom}</span>
          <span className="cp-segments cp-releve-barre" style={{ ["--c" as string]: teinte }}>
            <i style={{ width: `${(l.valeur / max) * 100}%` }} />
          </span>
          <span className="cp-releve-val">{l.valeur}{suffixe}</span>
        </div>
      ))}
    </div>
  );
}

function Compteur({ valeur, unite, libelle, teinte, pct }: {
  valeur: string | number; unite?: string; libelle: string; teinte: string; pct?: number;
}) {
  return (
    <div className="ana-compteur">
      {pct !== undefined && (
        <span
          className="ana-jauge"
          style={{
            ["--c" as string]: teinte,
            ["--p" as string]: `${Math.min(100, Math.max(0, pct))}%`,
          }}
        />
      )}
      <span className="ana-compteur-txt">
        <span
          className="ana-compteur-val font-orbitron"
          style={{ color: teinte, textShadow: `0 0 14px ${teinte}55` }}
        >
          {valeur}{unite && <i className="ana-compteur-unite">{unite}</i>}
        </span>
        <span className="ana-compteur-lib ds-t-label">{libelle}</span>
      </span>
    </div>
  );
}

export default function Analytics() {
  const { t } = useTranslation();
  const { section, period, setSection, setPeriod } = useAnalyticsState({
    section: "trajectoire",
    period: "all",
  });
  const { data, isLoading } = useAnalytics(period);
  const { currency } = useCurrency();
  const locale = useDateFnsLocale();

  const changerVue = useCallback((s: PrismSection) => setSection(s), [setSection]);

  const moisCourt = useCallback((m: string) => {
    try { return format(parseISO(`${m}-01`), "MMM yy", { locale }); } catch { return m; }
  }, [locale]);
  const jourCourt = useCallback((d: string) => {
    try { return format(parseISO(d), "d MMM", { locale }); } catch { return d; }
  }, [locale]);

  const radarDiff = useMemo(() => (data?.goalsByDifficulty ?? []).map((d) => ({
    palier: getDifficultyLabel(d.difficulty, t),
    valeur: d.count,
  })), [data, t]);

  const tags = useMemo(() => (data?.goalsByTag ?? [])
    .map((d) => ({ nom: getTagLabel(d.tag, t), valeur: d.count }))
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 8), [data, t]);

  if (isLoading || !data) {
    return (
      <DSPageShell width="xl" background={<SpaceBackdrop />}>
        <div className="ana-page">
          <Skeleton className="h-28 w-full rounded" />
          <Skeleton className="h-14 w-full rounded" />
          <Skeleton className="h-80 w-full rounded" />
        </div>
      </DSPageShell>
    );
  }

  const {
    goalsOverTime, healthTrend, financeTrend, habitStreak, todoStats, goalShowcase,
    pomodoroTrend, goalVelocity, summary,
  } = data;

  const pctObjectifs = summary.totalGoals > 0
    ? Math.round((summary.completedGoals / summary.totalGoals) * 100) : 0;
  const pctEtapes = summary.totalSteps > 0
    ? Math.round((summary.completedSteps / summary.totalSteps) * 100) : 0;
  const pctPaye = summary.totalCost > 0
    ? Math.min(100, (summary.paidCost / summary.totalCost) * 100) : 0;
  const totalHabitudes = habitStreak.reduce((a, h) => a + h.completed, 0);

  return (
    <DSPageShell width="xl" background={<SpaceBackdrop />}>
      <div className="ana-page">

        {/* ── Bandeau : trois compteurs, fixes d'une vue a l'autre ── */}
        <div className="cp-cadre">
        <section className="cp-fond ana-panneau ana-bandeau-panneau">
          <span className="cp-balayage" />
          <span className="cp-equerre cp-equerre-hg" />
          <span className="cp-equerre cp-equerre-bd" />
          <header className="ana-panneau-tete">
            <h1 className="ana-panneau-titre ds-t-label">Statistiques</h1>
            <span className="cp-tag">REL. {period.toUpperCase()}</span>
            <span className="ana-panneau-fil" />
            <CleanPeriodSelector value={period} onChange={setPeriod} />
          </header>
          <div className="cp-danger ana-bandeau-rayure" />
          <div className="ana-bandeau">
            <Compteur
              valeur={pctObjectifs} unite="%" libelle="Objectifs franchis"
              teinte={ACCENT} pct={pctObjectifs}
            />
            <Compteur
              valeur={pctEtapes} unite="%" libelle="Étapes validées"
              teinte={AMBRE} pct={pctEtapes}
            />
            <Compteur
              valeur={summary.totalXP.toLocaleString("fr-FR")}
              libelle="XP accumulé" teinte={VERT}
            />
          </div>
        </section>
        </div>

        {/* ── Bascule de vue ── */}
        <nav className="ana-vues" aria-label="Vues des statistiques">
          {VUES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => changerVue(v.id)}
              aria-pressed={section === v.id}
              className="ana-vue"
              data-actif={section === v.id}
            >
              {/* Un seul conteneur interieur, et non deux enfants directs :
                  c'est lui qui porte le fond opaque et le chanfrein. Sans
                  lui, le liseré du cadre transparait entre les deux lignes. */}
              <span className="ana-vue-in">
                <span className="ana-vue-nom">{v.nom}</span>
                <span className="ana-vue-sous">{v.sous}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* ══ TRAJECTOIRE ══ */}
        {section === "trajectoire" && (
          <div className="ana-grille">
            <Panneau
              titre="Objectifs dans le temps"
              droite={`${summary.completedGoals} / ${summary.totalGoals}`}
              vide={goalsOverTime.length === 0}
              messageVide="Aucun objectif sur la période"
            >
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={goalsOverTime}>
                  <defs>
                    <linearGradient id="ana-cree" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.34} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ana-fait" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={VERT} stopOpacity={0.34} />
                      <stop offset="100%" stopColor={VERT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={moisCourt} tick={AXE} stroke={TRAIT} tickLine={false} />
                  <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip content={<CleanTooltip />} />
                  <Legend wrapperStyle={LEGENDE} />
                  <Area
                    type="monotone" dataKey="created" name="Créés"
                    stroke={ACCENT} fill="url(#ana-cree)" strokeWidth={1.8}
                  />
                  <Area
                    type="monotone" dataKey="completed" name="Franchis"
                    stroke={VERT} fill="url(#ana-fait)" strokeWidth={1.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Panneau>

            <div className="ana-duo">
              <Panneau
                titre="Durée moyenne d'un objectif"
                droite={goalVelocity.length
                  ? `${Math.round(goalVelocity[goalVelocity.length - 1].avgDays)} j`
                  : undefined}
                vide={goalVelocity.length === 0}
                messageVide="Pas encore d'objectif franchi"
              >
                <ResponsiveContainer width="100%" height={195}>
                  <LineChart data={goalVelocity}>
                    <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={moisCourt} tick={AXE} stroke={TRAIT} tickLine={false} />
                    <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={30} />
                    <Tooltip content={<CleanTooltip />} />
                    <Line
                      type="monotone" dataKey="avgDays" name="Jours"
                      stroke={AMBRE} strokeWidth={1.8} dot={{ r: 2.5, fill: AMBRE }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Panneau>

              <Panneau
                titre="Étapes validées"
                droite={`${summary.completedSteps} / ${summary.totalSteps}`}
                vide={summary.totalSteps === 0}
                messageVide="Aucune étape"
              >
                {/* Le chiffre est frere de l'anneau, pas enfant : un masque
                    s'applique aussi aux descendants, et le centre de celui-ci
                    est transparent — le pourcentage y disparaitrait. */}
                <div className="ana-anneau-box">
                  <div className="ana-anneau-cadre">
                    <span
                      className="ana-anneau"
                      style={{ ["--c" as string]: AMBRE, ["--p" as string]: `${pctEtapes}%` }}
                    />
                    <b
                      className="ana-anneau-val font-orbitron"
                      style={{ color: AMBRE, textShadow: `0 0 16px ${AMBRE}88` }}
                    >
                      {pctEtapes}%
                    </b>
                  </div>
                </div>
                <p className="ana-pied ds-t-label">
                  {summary.totalSteps - summary.completedSteps} étapes restantes
                </p>
              </Panneau>
            </div>

            {/* La courbe dit combien ; l'archive dit lesquels. */}
            <Panneau
              titre="Contrats"
              droite={`${goalShowcase.length} ouverts`}
              vide={goalShowcase.length === 0}
              messageVide="Aucun contrat ouvert"
            >
              <GoalContrats goals={goalShowcase} />
            </Panneau>
          </div>
        )}

        {/* ══ REPARTITION ══ */}
        {section === "repartition" && (
          <div className="ana-grille">
            <div className="ana-duo">
              <Panneau
                titre="Par difficulté"
                droite={`${summary.totalGoals} objectifs`}
                vide={radarDiff.length === 0}
                messageVide="Aucun objectif à classer"
              >
                <ResponsiveContainer width="100%" height={262}>
                  <RadarChart data={radarDiff}>
                    <PolarGrid stroke={TRAIT} />
                    <PolarAngleAxis dataKey="palier" tick={AXE} />
                    <PolarRadiusAxis tick={AXE} stroke={TRAIT} />
                    <Tooltip content={<CleanTooltip />} />
                    <Radar
                      name="Objectifs" dataKey="valeur" stroke={ACCENT}
                      fill={ACCENT} fillOpacity={0.22} strokeWidth={1.8}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Panneau>

              <Panneau
                titre="Par domaine"
                droite={tags.length ? `${tags.length} étiquettes` : undefined}
                vide={tags.length === 0}
                messageVide="Aucune étiquette posée"
              >
                <Releve lignes={tags} teinte={ACCENT} />
              </Panneau>
            </div>

            <Panneau
              titre="Coût du pacte"
              droite={`${formatCurrency(summary.paidCost, currency)} / ${formatCurrency(summary.totalCost, currency)}`}
              vide={summary.totalCost === 0}
              messageVide="Aucun coût estimé"
            >
              <div className="cp-segments cp-cout-barre" style={{ ["--c" as string]: AMBRE }}>
                <i style={{ width: `${pctPaye}%` }} />
              </div>
              <p className="ana-pied ana-pied-gauche ds-t-label">
                Reste {formatCurrency(summary.remainingCost, currency)}
              </p>
              {financeTrend.length > 0 && (
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart data={financeTrend}>
                    <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={moisCourt} tick={AXE} stroke={TRAIT} tickLine={false} />
                    <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={42} />
                    <Tooltip content={<CleanTooltip />} />
                    <Legend wrapperStyle={LEGENDE} />
                    <Bar dataKey="income" name="Revenus" fill={VERT} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="expenses" name="Dépenses" fill={ROUGE} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="savings" name="Épargne" fill={ACCENT} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panneau>
          </div>
        )}

        {/* ══ RYTHME ══ */}
        {section === "rythme" && (
          <div className="ana-grille">
            <Panneau
              titre="Focus"
              droite={`${Math.round(summary.pomodoroMinutes / 60)} h cumulées`}
              vide={pomodoroTrend.length === 0}
              messageVide="Aucune session lancée"
            >
              <ResponsiveContainer width="100%" height={215}>
                <AreaChart data={pomodoroTrend}>
                  <defs>
                    <linearGradient id="ana-focus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={jourCourt} tick={AXE} stroke={TRAIT} tickLine={false} />
                  <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={34} />
                  <Tooltip content={<CleanTooltip />} />
                  <Area
                    type="monotone" dataKey="minutes" name="Minutes"
                    stroke={ACCENT} fill="url(#ana-focus)" strokeWidth={1.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Panneau>

            <div className="ana-duo">
              <Panneau
                titre="Habitudes"
                droite={habitStreak.length
                  ? `${totalHabitudes} / ${habitStreak.length} jours`
                  : undefined}
                /* Un histogramme de soixante barres a zero ne dit pas
                   "jamais tenue" — il ressemble a un graphique casse. Quand
                   rien n'est coche, on l'ecrit. (Verifie en base : l'unique
                   objectif d'habitude a 180 cases, toutes a false.) */
                vide={habitStreak.length === 0 || totalHabitudes === 0}
                messageVide={habitStreak.length === 0
                  ? "Aucune habitude suivie"
                  : `Aucun jour tenu sur ${habitStreak.length} suivis`}
              >
                <ResponsiveContainer width="100%" height={195}>
                  <BarChart data={habitStreak.slice(-60)}>
                    <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={jourCourt} tick={AXE} stroke={TRAIT} tickLine={false} />
                    <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip content={<CleanTooltip />} />
                    <Bar dataKey="completed" name="Tenues" fill={VERT} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panneau>

              <Panneau
                titre="Santé"
                droite={healthTrend.length ? `${healthTrend.length} relevés` : undefined}
                vide={healthTrend.length === 0}
                messageVide="Aucun relevé"
              >
                <ResponsiveContainer width="100%" height={195}>
                  <LineChart data={healthTrend}>
                    <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={jourCourt} tick={AXE} stroke={TRAIT} tickLine={false} />
                    <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={30} domain={[0, 100]} />
                    <Tooltip content={<CleanTooltip />} />
                    <Line
                      type="monotone" dataKey="score" name="Score"
                      stroke={VERT} strokeWidth={1.8} dot={{ r: 2.5, fill: VERT }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Panneau>
            </div>

            <Panneau
              titre="Tâches accomplies"
              droite={`${todoStats.reduce((a, x) => a + x.completed, 0)} au total`}
              vide={todoStats.length === 0}
              messageVide="Aucune tâche terminée"
            >
              {/* Cinq mois, cinq nombres : un releve les donne directement,
                  la ou un histogramme obligeait a estimer chaque hauteur. */}
              <Releve
                lignes={todoStats.map((x) => ({ nom: moisCourt(x.month), valeur: x.completed }))}
                teinte={AMBRE}
              />
            </Panneau>
          </div>
        )}
      </div>
    </DSPageShell>
  );
}
