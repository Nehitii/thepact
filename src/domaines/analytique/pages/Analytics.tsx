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
import { Releve, Compteur } from "@/domaines/analytique/composants/PanneauAnalytique";
import { ACCENT, AMBRE, VERT } from "@/domaines/analytique/logique/couleurs";
import { preparerVues } from "@/domaines/analytique/logique/vues";
import { SectionTrajectoire } from "@/domaines/analytique/composants/SectionTrajectoire";
import { SectionRepartition } from "@/domaines/analytique/composants/SectionRepartition";
import { SectionRythme } from "@/domaines/analytique/composants/SectionRythme";

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

  /* LES VUES DERIVEES DES DONNEES.
     Quarante-six lignes de preparation vivaient ici, entre la lecture
     des donnees et leur rendu. Elles sont sorties dans
     `logique/vues.ts` : ce sont des calculs purs, et les trois
     sections de graphiques en ont besoin autant que cette page. */
  const {
    pctObjectifs, pctEtapes, pctPaye, totalHabitudes, totalTaches, totalReportees,
    moyenneSommeil, chargeAnnuelle, parJourDeSemaine, bandeDesJours, joursTenus,
    totalQuiTombe, heurePleine,
  } = preparerVues(data);

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
        {section === "trajectoire" && <SectionTrajectoire data={data} />}

        {/* ══ REPARTITION ══ */}
        {section === "repartition" && <SectionRepartition data={data} />}

        {/* ══ RYTHME ══ */}
        {section === "rythme" && <SectionRythme data={data} />}
      </div>
    </DSPageShell>
  );
}
