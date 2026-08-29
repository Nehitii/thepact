/* UNE DES TROIS VUES DE L ANALYTIQUE.
 *
 * Sa frontiere est d UNE SEULE PROP, `data`, et ce n a ete possible
 * qu APRES avoir sorti la couche de preparation dans
 * `logique/vues.ts` : au premier essai, le compilateur reclamait
 * dix-huit identifiants declares dans la page.
 *
 * Elle derive ce dont elle a besoin — une seule section est montee a la
 * fois, donc rien n est calcule deux fois a l ecran.
 */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie,
  RadialBarChart, RadialBar, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Panneau } from "@/domaines/analytique/composants/PanneauAnalytique";
import { CleanTooltip } from "@/domaines/analytique/composants/clean/CleanTooltip";
import { GoalContrats } from "@/domaines/analytique/composants/GoalContrats";
import { AXE, TRAIT, ACCENT, AMBRE, VERT, ROUGE, LEGENDE } from "@/domaines/analytique/logique/couleurs";
import { preparerVues } from "@/domaines/analytique/logique/vues";
import type { AnalyticsData } from "@/domaines/analytique/types";

export function SectionTrajectoire({ data }: { data: AnalyticsData }) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const moisCourt = useCallback((m: string) => {
    try { return format(parseISO(`${m}-01`), "MMM yy", { locale }); } catch { return m; }
  }, [locale]);
  const jourCourt = useCallback((d: string) => {
    try { return format(parseISO(d), "d MMM", { locale }); } catch { return d; }
  }, [locale]);
  const { pctEtapes, totalTaches, totalReportees, moyenneSommeil } = preparerVues(data);
  const {
    goalsOverTime, goalShowcase, goalVelocity, summary, reports, sommeil, prevuReel,
  } = data;
  return (
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
  );
}
