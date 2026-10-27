import { format } from "date-fns";
import type {
  LigneTodo, LigneSession, LigneSante, LigneDepense, LigneMois,
} from "@/domaines/analytique/types";

/* LES LECTURES QUE LA COLLECTE ELARGIE PERMET.
 *
 * Elles vivaient dans le `queryFn` de `useAnalytics`, entre la
 * requete qui les nourrit et l objet qui les renvoie — donc melangees
 * a l acces reseau, impossibles a eprouver sans une base.
 *
 * Ce ne sont pourtant que des comptages. Sorties ici, elles declarent
 * ENFIN CE QU ELLES LISENT : jusqu ici la reponse etait « dix variables
 * de la portee au-dessus », et rien ne disait laquelle servait a quoi.
 *
 * Aucune n invente une moyenne pour meubler : quand la matiere manque,
 * c est le nombre de releves qui est renvoye, et le panneau le dit.
 */
export interface MatiereBrute {
  taches: LigneTodo[];
  sessions: LigneSession[];
  sante: LigneSante[];
  depenses: LigneDepense[];
  /** Les mois de finance, pour le prevu contre le reel. */
  mois: LigneMois[];
  agenda: { start_time: string | null }[];
  echeances: { deadline: string | null }[];
  /** Juste de quoi nommer un objectif : le focus dit ou il est alle. */
  objectifs: { id: string; name?: string }[];
}

export function lecturesElargies({
  taches: todoLignes, sessions, sante, depenses, mois, agenda, echeances, objectifs,
}: MatiereBrute) {

  /* ── COMBIEN DE FOIS IL A FALLU S'Y REMETTRE ──
     postpone_count est écrit à chaque report et suit la tâche
     jusqu'à son accomplissement. C'est la seule trace de ce qui a
     été difficile à commencer — et rien ne la lisait. */
  const parReports = new Map<number, number>();
  for (const l of todoLignes) {
    const r = Math.min(5, l.postpone_count || 0);
    parReports.set(r, (parReports.get(r) || 0) + 1);
  }
  const reports = Array.from(parReports.entries())
    .map(([reports, faites]) => ({ reports, faites }))
    .sort((a, b) => a.reports - b.reports);

  /* ── OÙ LE FOCUS EST RÉELLEMENT ALLÉ ──
     Une session porte l'objectif sur lequel elle a été lancée. On
     peut donc confronter les minutes PASSÉES à ce que le pacte
     annonce comme priorité — la seule mesure de l'application
     capable de contredire une intention. */
  const nomParObjectif = new Map<string, string>();
  for (const g of objectifs) nomParObjectif.set(g.id, g.name || "Sans nom");
  const parObjectif = new Map<string, { minutes: number; sessions: number }>();
  for (const s of sessions) {
    if (!s.linked_goal_id) continue;
    const e = parObjectif.get(s.linked_goal_id) || { minutes: 0, sessions: 0 };
    e.minutes += s.duration_minutes || 0;
    e.sessions += 1;
    parObjectif.set(s.linked_goal_id, e);
  }
  const focusParObjectif = Array.from(parObjectif.entries())
    .map(([id, e]) => ({ id, nom: nomParObjectif.get(id) || "Objectif retiré", ...e }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 8);

  /* ── LES TÂCHES, PAR CATÉGORIE ET PAR DIFFICULTÉ ── */
  const parCategorie = new Map<string, number>();
  const parDifficulte = new Map<string, number>();
  for (const l of todoLignes) {
    const c = l.category || "general";
    parCategorie.set(c, (parCategorie.get(c) || 0) + 1);
    const d = l.priority || "medium";
    parDifficulte.set(d, (parDifficulte.get(d) || 0) + 1);
  }
  const tachesParCategorie = Array.from(parCategorie.entries())
    .map(([categorie, n]) => ({ categorie, n }))
    .sort((a, b) => b.n - a.n);
  const tachesParDifficulte = ["low", "medium", "high"]
    .map((niveau) => ({ niveau, n: parDifficulte.get(niveau) || 0 }))
    .filter((d) => d.n > 0);

  /* ── LA FORME DE L'ANNÉE QUI PRÉLÈVE ──
     Une dépense de cadence plurimensuelle ne tombe pas tous les
     mois : elle tombe aux mois congrus à son ancre. La charge n'est
     donc pas plate, et certains mois portent trois échéances quand
     d'autres n'en portent aucune. */
  const chargeParMois = Array.from({ length: 12 }, () => ({ montant: 0, lignes: 0 }));
  for (const d of depenses) {
    const periode = Math.max(1, d.periode_mois || 1);
    const montant = Number(d.montant_total ?? d.amount) || 0;
    const ancreMois = d.mois_ancre ? new Date(d.mois_ancre).getMonth() : ((d.decalage_mois || 0) % periode);
    for (let m = 0; m < 12; m++) {
      if (((m - ancreMois) % periode + periode) % periode !== 0) continue;
      chargeParMois[m].montant += montant;
      chargeParMois[m].lignes += 1;
    }
  }
  const anneeQuiPreleve = chargeParMois.map((c, mois) => ({ mois, ...c }));

  /* ── L'HEURE OÙ LES CHOSES SE FONT ──
     Les tâches portent leur heure d'accomplissement, les sessions
     leur heure de départ. Superposées, elles disent si le travail
     déclaré et le travail fait tombent au même moment. */
  const heures = Array.from({ length: 24 }, (_, heure) => ({ heure, taches: 0, focus: 0 }));
  for (const l of todoLignes) {
    if (!l.completed_at) continue;
    heures[new Date(l.completed_at).getHours()].taches += 1;
  }
  for (const s of sessions) {
    const d = s.started_at || s.completed_at;
    if (!d) continue;
    heures[new Date(d).getHours()].focus += 1;
  }
  const heureDOuvrage = heures;

  /* ── LES RUPTURES DE SÉRIE ──
     Un compteur dit la longueur d'une série ; il ne dit jamais OÙ
     elle s'est cassée. Une bande de jours le dit. */
  const parJour = new Map<string, number>();
  for (const l of todoLignes) {
    if (!l.completed_at) continue;
    const j = format(new Date(l.completed_at), "yyyy-MM-dd");
    parJour.set(j, (parJour.get(j) || 0) + 1);
  }
  const serieTaches = Array.from(parJour.entries())
    .map(([date, n]) => ({ date, n }))
    .sort((a, b) => a.date.localeCompare(b.date));

  /* ── LE SOMMEIL, EN HEURES ──
     La seule mesure de santé en unité réelle : les autres sont des
     notes de 1 à 5, celle-ci est un nombre d'heures. */
  const sommeil = sante
    .filter((h) => h.sleep_hours != null)
    .map((h) => ({ date: h.entry_date, heures: Number(h.sleep_hours) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  /* ── LA JOURNÉE EN TROIS TEMPS ──
     Trois relevés valent mieux qu'une moyenne : ils disent À QUEL
     MOMENT la journée casse, ce qu'une moyenne efface. */
  const energieTroisTemps = sante
    .filter((h) => h.energy_morning != null || h.energy_afternoon != null || h.energy_evening != null)
    .map((h) => ({
      date: h.entry_date,
      matin: h.energy_morning ?? null,
      apresMidi: h.energy_afternoon ?? null,
      soir: h.energy_evening ?? null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  /* ── PRÉVU CONTRE RÉEL ──
     L'imprévu est enregistré séparément du total : le prévu se
     retrouve donc par soustraction, et l'écart mesure une chose
     qu'on ne mesure jamais — la justesse d'une prévision. */
  const prevuReel = mois.map((m) => ({
    month: m.month,
    reelDepenses: Number(m.actual_total_expenses) || 0,
    imprevuDepenses: Number(m.unplanned_expenses) || 0,
    reelRevenus: Number(m.actual_total_income) || 0,
    imprevuRevenus: Number(m.unplanned_income) || 0,
  }));

  /* ── CE QUI TOMBE, MOIS PAR MOIS ──
     Le calendrier disait « charge du mois » et « jours occupés » pour
     le mois affiché : deux nombres qui ne valent que pour ce mois-là,
     posés dans un flanc qu'on ne regarde pas en planifiant. Étendus à
     l'année, ils répondent à une question de rythme — quels mois
     portent quelque chose, lesquels sont vides. */
  const parMois = new Map<string, { evenements: number; echeances: number; jours: Set<string> }>();
  const poser = (iso: string | null, quoi: "evenements" | "echeances") => {
    if (!iso) return;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return;
    const mois = format(d, "yyyy-MM");
    const e = parMois.get(mois) ?? { evenements: 0, echeances: 0, jours: new Set<string>() };
    e[quoi] += 1;
    e.jours.add(format(d, "yyyy-MM-dd"));
    parMois.set(mois, e);
  };
  for (const a of agenda) poser(a.start_time, "evenements");
  for (const e of echeances) poser(e.deadline, "echeances");
  const cequiTombe = Array.from(parMois.entries())
    .map(([mois, e]) => ({ mois, evenements: e.evenements, echeances: e.echeances, jours: e.jours.size }))
    .sort((a, b) => a.mois.localeCompare(b.mois));

  const matiere = {
    relevesSante: sante.length,
    relevesEnergie: energieTroisTemps.length,
    nuitsMesurees: sommeil.length,
    moisValides: prevuReel.length,
    sessionsLiees: sessions.filter((s) => s.linked_goal_id).length,
  };

  return {
    reports, focusParObjectif, tachesParCategorie, tachesParDifficulte,
    anneeQuiPreleve, heureDOuvrage, serieTaches, cequiTombe,
    sommeil, energieTroisTemps, prevuReel, matiere,
  };
}
