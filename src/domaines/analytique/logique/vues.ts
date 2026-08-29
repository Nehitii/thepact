/* CE QUE L ON DERIVE DES DONNEES AVANT DE LES DESSINER.
 *
 * Quarante-six lignes de preparation vivaient au milieu de
 * `pages/Analytics.tsx`, entre la lecture des donnees et leur rendu.
 * Elles n en sortent pas pour alleger la page : elles en sortent parce
 * que les TROIS SECTIONS de graphiques en ont besoin, et qu on ne
 * pouvait pas les extraire tant que leurs valeurs vivaient dans la
 * fonction qui les rend.
 *
 * Un premier essai avait tente de sortir une section d abord : le
 * compilateur a reclame DIX-HUIT identifiants. Ce n etait pas la
 * decoupe qui etait mauvaise, c est l ordre — il fallait separer les
 * deux responsabilites avant de separer les morceaux de rendu.
 *
 * Tout est pur ici : ni React, ni requete, ni etat. Ces calculs se
 * testent donc seuls, ce qu une page de 830 lignes ne permettait pas.
 */
import { format } from "date-fns";
import type { AnalyticsData } from "@/domaines/analytique/types";

/* Lundi en tete : la semaine commence le lundi ici, et getDay() rend
   dimanche pour zero. */
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/* L ENERGIE MOYENNE DE LA QUINZAINE, par moment de la journee.
   Sortie de la page avec le reste : elle ne depend que des releves. */
export function energieMoyenne(releves: unknown[]) {
  const moyenne = (champ: "energy_morning" | "energy_afternoon" | "energy_evening") => {
    const vals = releves
      .map((r) => (r as Record<string, number | null>)[champ])
      .filter((v): v is number => typeof v === "number");
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };
  return [
    { moment: "Matin", niveau: moyenne("energy_morning") },
    { moment: "Après-midi", niveau: moyenne("energy_afternoon") },
    { moment: "Soir", niveau: moyenne("energy_evening") },
  ].filter((p) => p.niveau !== null);
}

export function preparerVues(data: AnalyticsData) {
  const {
    habitStreak, reports, sommeil, anneeQuiPreleve, serieTaches, cequiTombe,
    heureDOuvrage, summary,
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
  return {
    pctObjectifs, pctEtapes, pctPaye, totalHabitudes, totalTaches, totalReportees,
    moyenneSommeil, chargeAnnuelle, parJourDeSemaine, bandeDesJours, joursTenus,
    totalQuiTombe, heurePleine,
  };
}
