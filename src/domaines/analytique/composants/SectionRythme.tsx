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
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie,
  RadialBarChart, RadialBar, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useHealthHistory } from "@/domaines/sante";
import { Panneau, Releve } from "@/domaines/analytique/composants/PanneauAnalytique";
import { CleanTooltip } from "@/domaines/analytique/composants/clean/CleanTooltip";
import { AXE, TRAIT, ACCENT, AMBRE, VERT, LEGENDE } from "@/domaines/analytique/logique/couleurs";
import { preparerVues, energieMoyenne } from "@/domaines/analytique/logique/vues";
import type { AnalyticsData } from "@/domaines/analytique/types";

export function SectionRythme({ data }: { data: AnalyticsData }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const locale = useDateFnsLocale();
  const { data: releves = [] } = useHealthHistory(user?.id, 14);
  const energie = useMemo(() => energieMoyenne(releves), [releves]);
  const moisCourt = useCallback((m: string) => {
    try { return format(parseISO(`${m}-01`), "MMM yy", { locale }); } catch { return m; }
  }, [locale]);
  const jourCourt = useCallback((d: string) => {
    try { return format(parseISO(d), "d MMM", { locale }); } catch { return d; }
  }, [locale]);
  const { totalHabitudes, totalTaches, parJourDeSemaine, bandeDesJours, joursTenus, totalQuiTombe, heurePleine } = preparerVues(data);
  const {
    healthTrend, habitStreak, todoStats, pomodoroTrend, summary, heureDOuvrage, cequiTombe,
  } = data;
  return (
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
  );
}
