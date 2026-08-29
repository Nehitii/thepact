import { useCallback, useMemo } from "react";
import "@/socle/ds/cyberpunk.css";
import "@/domaines/analytique/analytique.css";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { DSPageShell } from "@/socle/ds";
import { Skeleton } from "@/socle/ui/skeleton";
import { SpaceBackdrop } from "@/socle/ds/SpaceBackdrop";
import { CleanPeriodSelector } from "@/domaines/analytique/composants/clean/CleanPeriodSelector";
import { CleanTooltip } from "@/domaines/analytique/composants/clean/CleanTooltip";
import { GoalContrats } from "@/domaines/analytique/composants/GoalContrats";
import { Telemetrie } from "@/socle/ds/Telemetrie";

import { useAnalytics } from "@/domaines/analytique/hooks/useAnalytics";
import { glisse, useBarreCollee, useSommaire } from "@/domaines/analytique/hooks/useBarreAnalytics";
import { useAnalyticsState, type PrismSection } from "@/domaines/analytique/hooks/useAnalyticsState";
import { useHealthHistory } from "@/domaines/sante";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useCurrency } from "@/socle/contextes/CurrencyContext";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { formatCurrency } from "@/socle/outils/currency";
import { getDifficultyLabel, getTagLabel } from "@/domaines/objectifs";
import { Panneau, Releve, Compteur } from "@/domaines/analytique/composants/PanneauAnalytique";
import { AXE, TRAIT, ACCENT, AMBRE, VERT, ROUGE, LEGENDE } from "@/domaines/analytique/logique/couleurs";

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

/* Les libellés des catégories de tâches et des priorités. Ils vivaient
   dans les traductions de Todo ; ici on nomme en clair, parce que la page
   n'a pas d'autre contexte pour les désambiguïser. */
const NOM_CATEGORIE: Record<string, string> = {
  general: "Général",
  admin: "Administratif",
  health: "Santé",
  study: "Études",
  work: "Travail",
  personal: "Personnel",
  home: "Maison",
  finance: "Finance",
};

const NOM_DIFFICULTE: Record<string, string> = {
  low: "Facile",
  medium: "Moyenne",
  high: "Difficile",
};

const MOIS_COURTS = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];

/* Lundi en tête : la semaine commence le lundi ici, et getDay() rend
   dimanche pour zéro. */
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const VUES: { id: PrismSection; nom: string; sous: string }[] = [
  { id: "trajectoire", nom: "Trajectoire", sous: "Comment j'avance dans le temps" },
  { id: "repartition", nom: "Répartition", sous: "Où va l'effort" },
  { id: "rythme", nom: "Rythme", sous: "À quelle cadence je tiens" },
];

export default function Analytics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  /* LA COURBE D ENERGIE VIENT DE LA PAGE SANTE.
     Elle y etait enfermee dans un HUDFrame avec scanline — un langage
     etranger a celui-ci, exactement ce que cette page a ete refondue
     pour eliminer. On reprend donc la DONNEE, pas le composant : trois
     moments de la journee, moyennes sur la quinzaine, dans le meme
     panneau que tout le reste. */
  const { data: releves = [] } = useHealthHistory(user?.id, 14);
  const energie = useMemo(() => {
    const moyenne = (champ: "energy_morning" | "energy_afternoon" | "energy_evening") => {
      const vals = releves
        .map((r) => (r as unknown as Record<string, number | null>)[champ])
        .filter((v): v is number => typeof v === "number");
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    };
    return [
      { moment: "Matin", niveau: moyenne("energy_morning") },
      { moment: "Après-midi", niveau: moyenne("energy_afternoon") },
      { moment: "Soir", niveau: moyenne("energy_evening") },
    ].filter((p) => p.niveau !== null);
  }, [releves]);

  const { section, period, setSection, setPeriod } = useAnalyticsState({
    section: "trajectoire",
    period: "all",
  });
  const { data, isLoading } = useAnalytics(period);
  const { currency } = useCurrency();
  const locale = useDateFnsLocale();

  /* LA BARRE SUIT LA LECTURE. Voir useBarreAnalytics : « sticky » est
     inopérant ici, trois ancêtres déclarent un débordement. */
  const { sentinelle, colonne, barre, collee, geo, hauteur: hauteurBarre } = useBarreCollee();
  const { entrees, actif, aller } = useSommaire(section, !isLoading && !!data);

  const changerVue = useCallback((s: PrismSection) => {
    setSection(s);
    /* Changer de vue depuis la barre collée sans remonter laisserait le
       lecteur au milieu d'un contenu qu'il n'a pas demandé. */
    window.scrollTo({ top: 0, behavior: glisse() });
  }, [setSection]);

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
    reports, focusParObjectif, tachesParCategorie, tachesParDifficulte,
    anneeQuiPreleve, heureDOuvrage, sommeil, serieTaches, cequiTombe, prevuReel, matiere,
  } = data;

  const pctObjectifs = summary.totalGoals > 0
    ? Math.round((summary.completedGoals / summary.totalGoals) * 100) : 0;
  const pctEtapes = summary.totalSteps > 0
    ? Math.round((summary.completedSteps / summary.totalSteps) * 100) : 0;
  const pctPaye = summary.totalCost > 0
    ? Math.min(100, (summary.paidCost / summary.totalCost) * 100) : 0;
  const totalHabitudes = habitStreak.reduce((a, h) => a + h.completed, 0);
  const totalTaches = reports.reduce((a, r) => a + r.faites, 0);
  const totalReportees = reports.filter((r) => r.reports > 0).reduce((a, r) => a + r.faites, 0);
  const moyenneSommeil = sommeil.length
    ? (sommeil.reduce((a, s) => a + s.heures, 0) / sommeil.length).toFixed(1).replace(".", ",")
    : "0";
  const chargeAnnuelle = anneeQuiPreleve.reduce((a, m) => a + m.montant, 0);

  /* LES JOURS QUI PORTENT.
     Un total mensuel ne dit pas quel jour de la semaine tient l'effort.
     Sept barres le disent — et elles disent surtout lequel décroche. */
  const parJourDeSemaine = (() => {
    const j = JOURS.map((nom) => ({ nom, valeur: 0 }));
    for (const d of serieTaches) j[(new Date(d.date + "T12:00:00").getDay() + 6) % 7].valeur += d.n;
    return j;
  })();

  /* LES RUPTURES DE SÉRIE.
     Un compteur donne la longueur d'une série ; il ne dit jamais OÙ elle
     s'est cassée. Il faut donc remplir les jours vides — ils ne sont pas
     en base, et ce sont eux qu'on vient lire. */
  const bandeDesJours = (() => {
    if (!serieTaches.length) return [];
    const parDate = new Map(serieTaches.map((d) => [d.date, d.n]));
    const debut = new Date(serieTaches[0].date + "T12:00:00");
    const fin = new Date();
    const jours: { date: string; n: number }[] = [];
    for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
      const cle = format(d, "yyyy-MM-dd");
      jours.push({ date: cle, n: parDate.get(cle) ?? 0 });
    }
    return jours.slice(-120);
  })();
  const joursTenus = bandeDesJours.filter((j) => j.n > 0).length;
  const totalQuiTombe = cequiTombe.reduce((a, m) => a + m.evenements + m.echeances, 0);
  /* L'heure de pointe cumule les deux séries : c'est le moment où l'on
     est à l'ouvrage, pas celui où l'on coche le plus. */
  const heurePleine = heureDOuvrage.some((h) => h.taches + h.focus > 0)
    ? heureDOuvrage.reduce((m, h) => (h.taches + h.focus > m.taches + m.focus ? h : m)).heure
    : null;

  return (
    <DSPageShell width="xl" background={<SpaceBackdrop />}>
      <div className="ana-page" ref={colonne}>

        {/* ── Bandeau : trois compteurs, fixes d'une vue a l'autre ── */}
        <div className="cp-cadre">
        <section className="cp-fond ana-panneau ana-bandeau-panneau cp-avec-telemetrie">
          <span className="cp-charge" />
          <span className="cp-equerre cp-equerre-hg" />
          <span className="cp-equerre cp-equerre-bd" />
          <header className="ana-panneau-tete">
            <h1 className="ana-panneau-titre ds-t-label">Statistiques</h1>
            <span className="cp-tag">REL. {period.toUpperCase()}</span>
            <span className="ana-panneau-fil" />
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

          {/* Releve : uniquement des valeurs deja calculees plus haut. Rien
              n est invente pour meubler la ligne. */}
          <Telemetrie
            segments={[
              `${summary.totalGoals} OBJECTIFS`,
              `${summary.activeGoals} EN COURS`,
              `${summary.completedSteps}/${summary.totalSteps} ÉTAPES`,
              `${Math.round(summary.pomodoroMinutes / 60)} H DE FOCUS`,
              `${summary.totalXP.toLocaleString("fr-FR")} XP`,
              `${formatCurrency(summary.paidCost, currency)} ENGAGÉ`,
            ]}
          />
        </section>
        </div>

        {/* ── La barre : vues, période, sommaire ──
            Elle reste sous la main quand on descend. Sans elle, changer de
            vue ou de période depuis le bas de la page — jusqu'à 2,6 écrans
            — obligeait à tout remonter. */}
        <div ref={sentinelle} className="ana-sentinelle" aria-hidden="true" />
        <div className="ana-nav-place" data-collee={collee} style={{ height: collee ? hauteurBarre : undefined }}>
          <nav
            ref={barre}
            className="ana-nav"
            data-collee={collee}
            style={collee ? { left: geo.gauche, width: geo.largeur } : undefined}
            aria-label="Navigation des statistiques"
          >
            <div className="ana-nav-haut">
              <div className="ana-vues" role="tablist" aria-label="Vues des statistiques">
                {VUES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    role="tab"
                    onClick={() => changerVue(v.id)}
                    aria-selected={section === v.id}
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
              </div>
              <CleanPeriodSelector value={period} onChange={setPeriod} />
            </div>

            {/* LE SOMMAIRE NE S'AFFICHE QU'UNE FOIS ENGAGÉ DANS LA PAGE.
                En haut, les panneaux sont sous les yeux ; c'est en
                descendant qu'on perd le fil. Il se lit dans le rendu —
                chaque panneau porte son nom — donc il ne peut pas dériver. */}
            {collee && entrees.length > 1 && (
              <div className="ana-sommaire" role="list">
                {entrees.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    role="listitem"
                    className="ana-sommaire-lien"
                    data-actif={e.id === actif}
                    onClick={() => aller(e.id)}
                  >
                    {e.nom}
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>

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
            <div className="ana-duo">
              {/* CE QU'IL A FALLU DE TENTATIVES.
                  postpone_count suit chaque tâche jusqu'à son
                  accomplissement : c'est la seule trace de ce qui a été
                  difficile à commencer, et rien ne la lisait. */}
              <Panneau
                titre="Reports par tâche"
                droite={reports.length ? `${totalReportees} sur ${totalTaches} reportées` : undefined}
                vide={reports.length === 0}
                messageVide="Aucune tâche accomplie"
              >
                <ResponsiveContainer width="100%" height={195}>
                  <BarChart data={reports}>
                    <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                    <XAxis
                      dataKey="reports" tick={AXE} stroke={TRAIT} tickLine={false}
                      tickFormatter={(r: number) => (r === 0 ? "du premier coup" : `${r} report${r > 1 ? "s" : ""}`)}
                    />
                    <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={30} allowDecimals={false} />
                    <Tooltip content={<CleanTooltip />} />
                    <Bar dataKey="faites" name="Tâches" fill={AMBRE} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panneau>

              {/* LE SOMMEIL EST LA SEULE MESURE DE SANTÉ EN UNITÉ RÉELLE.
                  Les autres sont des notes de 1 à 5 ; celle-ci est un
                  nombre d'heures, et elle n'était jamais lue. */}
              <Panneau
                titre="Sommeil"
                droite={sommeil.length ? `${moyenneSommeil} h en moyenne` : undefined}
                vide={sommeil.length < 3}
                messageVide={sommeil.length === 0
                  ? "Aucune nuit relevée"
                  : `${sommeil.length} nuit${sommeil.length > 1 ? "s" : ""} relevée${sommeil.length > 1 ? "s" : ""} — une courbe en demande une trentaine`}
              >
                <ResponsiveContainer width="100%" height={195}>
                  <LineChart data={sommeil}>
                    <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={jourCourt} tick={AXE} stroke={TRAIT} tickLine={false} />
                    <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={30} domain={[0, "dataMax + 1"]} />
                    <Tooltip content={<CleanTooltip />} />
                    <Line type="monotone" dataKey="heures" name="Heures" stroke={ACCENT} strokeWidth={1.8} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Panneau>
            </div>

            {/* PRÉVU CONTRE RÉEL.
                L'imprévu est enregistré à part : le prévu se retrouve donc
                par soustraction, et l'écart mesure une chose qu'on ne
                mesure jamais — la justesse d'une prévision. */}
            <Panneau
              titre="Dépenses prévues et réelles"
              droite={prevuReel.length ? `${prevuReel.length} mois pointés` : undefined}
              vide={prevuReel.length < 3}
              messageVide={prevuReel.length === 0
                ? "Aucun mois validé"
                : `${prevuReel.length} mois validé${prevuReel.length > 1 ? "s" : ""} — l'écart de prévision se lit à partir de six`}
            >
              <ResponsiveContainer width="100%" height={215}>
                <BarChart data={prevuReel}>
                  <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={moisCourt} tick={AXE} stroke={TRAIT} tickLine={false} />
                  <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={44} />
                  <Tooltip content={<CleanTooltip />} />
                  <Legend wrapperStyle={LEGENDE} />
                  <Bar dataKey="reelDepenses" name="Dépenses" fill={ROUGE} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="imprevuDepenses" name="Dont imprévu" fill={AMBRE} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panneau>

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
                titre="Objectifs par difficulté"
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
                titre="Objectifs par domaine"
                droite={tags.length ? `${tags.length} étiquettes` : undefined}
                vide={tags.length === 0}
                messageVide="Aucune étiquette posée"
              >
                <Releve lignes={tags} teinte={ACCENT} />
              </Panneau>
            </div>

            {/* OÙ LE FOCUS EST RÉELLEMENT ALLÉ.
                Une session porte l'objectif sur lequel elle a été lancée.
                C'est la seule mesure de l'application capable de
                contredire une intention — le pacte annonce une priorité,
                les minutes disent autre chose. */}
            <Panneau
              titre="Focus par objectif"
              droite={`${matiere.sessionsLiees} session${matiere.sessionsLiees > 1 ? "s" : ""} rattachée${matiere.sessionsLiees > 1 ? "s" : ""}`}
              vide={focusParObjectif.length === 0}
              messageVide="Aucune session rattachée à un objectif"
            >
              <Releve
                lignes={focusParObjectif.map((f) => ({ nom: f.nom, valeur: f.minutes }))}
                teinte={ACCENT}
                suffixe=" min"
              />
            </Panneau>

            <div className="ana-duo">
              <Panneau
                titre="Tâches par domaine"
                droite={totalTaches ? `${totalTaches} accomplies` : undefined}
                vide={tachesParCategorie.length === 0}
                messageVide="Aucune tâche accomplie"
              >
                <Releve
                  lignes={tachesParCategorie.map((c) => ({ nom: NOM_CATEGORIE[c.categorie] ?? c.categorie, valeur: c.n }))}
                  teinte={AMBRE}
                />
              </Panneau>

              <Panneau
                titre="Tâches par difficulté"
                vide={tachesParDifficulte.length === 0}
                messageVide="Aucune tâche accomplie"
              >
                <Releve
                  lignes={tachesParDifficulte.map((d) => ({ nom: NOM_DIFFICULTE[d.niveau] ?? d.niveau, valeur: d.n }))}
                  teinte={VERT}
                />
              </Panneau>
            </div>

            {/* LA FORME DE L'ANNÉE QUI PRÉLÈVE.
                Une dépense de cadence plurimensuelle ne tombe pas tous les
                mois. La charge n'est donc pas plate : certains mois portent
                trois échéances quand d'autres n'en portent aucune. Finance
                le montre pour décider ; ici on le montre pour comprendre la
                part de l'année qui n'est pas modulable. */}
            <Panneau
              titre="Dépenses par mois"
              droite={chargeAnnuelle ? `${formatCurrency(chargeAnnuelle, currency)} sur douze mois` : undefined}
              vide={chargeAnnuelle === 0}
              messageVide="Aucune dépense récurrente"
            >
              <ResponsiveContainer width="100%" height={215}>
                <BarChart data={anneeQuiPreleve}>
                  <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="mois" tickFormatter={(m: number) => MOIS_COURTS[m]} tick={AXE} stroke={TRAIT} tickLine={false} />
                  <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={44} />
                  <Tooltip content={<CleanTooltip />} />
                  <Bar dataKey="montant" name="Prélevé" fill={ROUGE} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panneau>

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
              titre="Énergie dans la journée"
              droite={energie.length ? `moyenne sur ${releves.length} relevés` : undefined}
              /* Matin, après-midi, soir : les trois relevés d'énergie,
                 moyennés. Une version jour par jour a été essayée et
                 retirée — avec trois journées relevées elle montrait les
                 mêmes trois nombres sur un axe de dates, et deux panneaux
                 sur la même donnée sont exactement ce que la refonte de
                 cette page a supprimé. */
              vide={energie.length < 2}
              messageVide="Pas assez de relevés"
            >
              <ResponsiveContainer width="100%" height={175}>
                <LineChart data={energie}>
                  <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="moment" tick={AXE} stroke={TRAIT} tickLine={false} />
                  <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={26} domain={[0, 5]} />
                  <Tooltip content={<CleanTooltip />} />
                  <Line
                    type="monotone" dataKey="niveau" name="Énergie"
                    stroke={AMBRE} strokeWidth={1.8} dot={{ r: 3, fill: AMBRE }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Panneau>

            {/* L'HEURE OÙ LES CHOSES SE FONT.
                Les tâches portent leur heure d'accomplissement, les
                sessions leur heure de départ. Superposées, elles disent si
                le travail déclaré et le travail fait tombent au même
                moment de la journée. */}
            <Panneau
              titre="Activité par heure"
              droite={heurePleine !== null ? `Pic à ${heurePleine} h` : undefined}
              vide={totalTaches === 0 && summary.pomodoroMinutes === 0}
              messageVide="Rien d'horodaté"
            >
              <ResponsiveContainer width="100%" height={215}>
                <BarChart data={heureDOuvrage}>
                  <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                  <XAxis
                    dataKey="heure" tick={AXE} stroke={TRAIT} tickLine={false}
                    tickFormatter={(h: number) => (h % 3 === 0 ? `${h}h` : "")}
                    interval={0}
                  />
                  <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip content={<CleanTooltip />} />
                  <Legend wrapperStyle={LEGENDE} />
                  <Bar dataKey="taches" name="Tâches cochées" fill={AMBRE} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="focus" name="Sessions lancées" fill={ACCENT} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panneau>

            <div className="ana-duo">
              <Panneau
                titre="Tâches par jour de la semaine"
                droite={totalTaches ? `${totalTaches} tâches réparties` : undefined}
                vide={totalTaches === 0}
                messageVide="Aucune tâche accomplie"
              >
                <Releve lignes={parJourDeSemaine} teinte={ACCENT} />
              </Panneau>

              <Panneau
                titre="Tâches jour par jour"
                droite={bandeDesJours.length ? `${joursTenus} jours sur ${bandeDesJours.length}` : undefined}
                vide={bandeDesJours.length === 0}
                messageVide="Aucune tâche accomplie"
              >
                <ResponsiveContainer width="100%" height={195}>
                  <BarChart data={bandeDesJours}>
                    <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={jourCourt} tick={AXE} stroke={TRAIT} tickLine={false} minTickGap={28} />
                    <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={26} allowDecimals={false} />
                    <Tooltip content={<CleanTooltip />} />
                    <Bar dataKey="n" name="Tâches" fill={VERT} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panneau>
            </div>

            {/* CE QUI TOMBE, MOIS PAR MOIS.
                Le calendrier portait « charge du mois » et « jours
                occupés » : deux nombres qui ne valent que pour le mois
                affiché, dans un flanc qu'on ne regarde pas en planifiant.
                Étendus à l'année, ils répondent enfin à une question de
                rythme — quels mois portent quelque chose, lesquels sont
                vides, et si la charge se concentre. */}
            <Panneau
              titre="Échéances par mois"
              droite={totalQuiTombe ? `${totalQuiTombe} sur ${cequiTombe.length} mois` : undefined}
              vide={cequiTombe.length === 0}
              messageVide="Rien de daté : ni événement, ni échéance"
            >
              <ResponsiveContainer width="100%" height={215}>
                <BarChart data={cequiTombe}>
                  <CartesianGrid stroke={TRAIT} strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="mois" tickFormatter={moisCourt} tick={AXE} stroke={TRAIT} tickLine={false} />
                  <YAxis tick={AXE} stroke={TRAIT} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip content={<CleanTooltip />} />
                  <Legend wrapperStyle={LEGENDE} />
                  <Bar dataKey="echeances" name="Échéances" fill={AMBRE} radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="evenements" name="Événements" fill={ACCENT} radius={[2, 2, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </Panneau>

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
