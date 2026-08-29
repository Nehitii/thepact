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
import { useCurrency } from "@/socle/contextes/CurrencyContext";
import { formatCurrency } from "@/socle/outils/currency";
import { getDifficultyLabel, getTagLabel } from "@/domaines/objectifs";
import { Panneau, Releve } from "@/domaines/analytique/composants/PanneauAnalytique";
import { CleanTooltip } from "@/domaines/analytique/composants/clean/CleanTooltip";
import { AXE, TRAIT, ACCENT, AMBRE, VERT, ROUGE, LEGENDE } from "@/domaines/analytique/logique/couleurs";
import { preparerVues } from "@/domaines/analytique/logique/vues";
import { NOM_CATEGORIE, NOM_DIFFICULTE, MOIS_COURTS } from "@/domaines/analytique/logique/libelles";
import type { AnalyticsData } from "@/domaines/analytique/types";

export function SectionRepartition({ data }: { data: AnalyticsData }) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const locale = useDateFnsLocale();
  const moisCourt = useCallback((m: string) => {
    try { return format(parseISO(`${m}-01`), "MMM yy", { locale }); } catch { return m; }
  }, [locale]);
  const radarDiff = useMemo(() => (data?.goalsByDifficulty ?? []).map((d) => ({
    palier: getDifficultyLabel(d.difficulty, t),
    valeur: d.count,
  })), [data, t]);
  const tags = useMemo(() => (data?.goalsByTag ?? [])
    .map((d) => ({ nom: getTagLabel(d.tag, t), valeur: d.count }))
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 8), [data, t]);
  const { pctPaye, totalTaches, chargeAnnuelle } = preparerVues(data);
  const {
    financeTrend, summary, focusParObjectif, tachesParCategorie, tachesParDifficulte, anneeQuiPreleve, matiere,
  } = data;
  return (
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
  );
}
