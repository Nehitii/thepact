import { addHours, format as formaterDate } from "date-fns";
import { composerInstant } from "@/domaines/agenda/logique/temps";
import { natureDe, estRendezVous } from "@/domaines/taches";
import type { CalendarEvent } from "@/domaines/agenda/types";

/* CE QUI TOMBE DANS L AGENDA SANS Y AVOIR ETE POSE.
 *
 * Trois choses arrivent d ailleurs : une tache qui a une echeance, un
 * objectif qui a une date, une etape qui en a une. Chacune devient un
 * evenement du calendrier — et cette traduction vivait au fond de trois
 * `queryFn`, entre une requete et un filtre.
 *
 * Ce sont pourtant des fonctions pures d une ligne de base vers un
 * evenement. Ce qu elles decident ne se voit pas : une teinte, une
 * heure, un « journee entiere ». Un rendez-vous qui perd son heure
 * ressemble en tout point a une tache du jour.
 */

/** Le squelette commun : tout ce qu un evenement importe n a pas. */
const RIEN_DE_PROPRE = {
  recurrence_rule: null,
  recurrence_parent_id: null,
  recurrence_exception: false,
  reminders: [],
  is_busy: false,
  created_at: "",
  updated_at: "",
  _virtual: true as const,
} satisfies Partial<CalendarEvent>;

/* UNE ECHEANCE EST UN INSTANT, PAS UNE CHAINE.
 *
 * `deadline` est un timestamptz, `appointment_time` une heure seule.
 * Le jour se lit en LOCAL, pas en tranchant la chaine ISO : une
 * echeance a 2026-08-25T22:00:00Z tombe deja le 26 a Paris, et la
 * decouper donnerait le 25 — le rendez-vous glisserait d un jour pour
 * tout le monde a l est de Greenwich.
 *
 * Sans duree saisie, une heure : c est la longueur qu on prete a un
 * rendez-vous quand on n en sait rien, et un evenement de duree nulle
 * ne se voit pas sur une grille horaire.
 */
export function momentDuJour(echeance: string, heure: string): { debut: string; fin: string } | null {
  const jour = new Date(echeance);
  if (Number.isNaN(jour.getTime())) return null;
  /* « 14:30:00 » -> « 14:30 » : composerInstant attend hh:mm. */
  const debut = composerInstant(formaterDate(jour, "yyyy-MM-dd"), heure.slice(0, 5));
  if (!debut) return null;
  return { debut: debut.toISOString(), fin: addHours(debut, 1).toISOString() };
}

export interface LigneTache {
  id: string;
  name: string;
  deadline: string;
  category: string | null;
  location: string | null;
  task_type: string | null;
  appointment_time: string | null;
}

export function evenementDeTache(t: LigneTache, userId: string): CalendarEvent {
  /* UN RENDEZ-VOUS N EST PAS UNE TACHE POSEE SUR LA JOURNEE.
     Toute tache importee arrivait en journee entiere : un rendez-vous
     saisi a 14 h perdait donc son heure — la seule chose qui en fait un
     rendez-vous — et se rangeait avec les taches du jour, ou personne
     ne le cherche. Sans heure saisie on ne devine pas : la tache reste
     sur la journee, ce qui est honnete. */
  const nature = natureDe(t.task_type);
  const heure = estRendezVous(t.task_type) ? t.appointment_time : null;
  const place = heure ? momentDuJour(t.deadline, heure) : null;

  return {
    ...RIEN_DE_PROPRE,
    id: `todo_${t.id}`,
    user_id: userId,
    title: t.name,
    description: null,
    location: t.location || null,
    start_time: place ? place.debut : t.deadline,
    end_time: place ? place.fin : t.deadline,
    all_day: !place,
    /* La teinte suit la nature : violet pour un rendez-vous, rouge pour
       une echeance, ambre pour une attente. */
    color: nature.couleur,
    category: "todo",
    linked_goal_id: null,
    linked_todo_id: t.id,
    tags: t.category ? [t.category] : [],
    _source: "todo",
    _sourceId: t.id,
    _nature: nature.id,
  } as CalendarEvent;
}

export interface LigneObjectif {
  id: string;
  name: string;
  deadline: string;
}

export function evenementDObjectif(g: LigneObjectif, userId: string): CalendarEvent {
  return {
    ...RIEN_DE_PROPRE,
    id: `goal_${g.id}`,
    user_id: userId,
    title: `🎯 ${g.name}`,
    description: null,
    location: null,
    start_time: new Date(g.deadline).toISOString(),
    end_time: new Date(g.deadline).toISOString(),
    all_day: true,
    color: "#a855f7",
    category: "goal-deadline",
    linked_goal_id: g.id,
    linked_todo_id: null,
    tags: [],
    _source: "goal",
    _sourceId: g.id,
  } as CalendarEvent;
}

export interface LigneEtape {
  id: string;
  title: string;
  due_date: string;
  goal_id: string;
  goals?: { name?: string | null } | null;
}

export function evenementDEtape(s: LigneEtape, userId: string): CalendarEvent {
  return {
    ...RIEN_DE_PROPRE,
    id: `step_${s.id}`,
    user_id: userId,
    title: `📋 ${s.title}`,
    /* « Goal: » etait le dernier mot anglais de cet ecran. La garde de
       langue ne le voyait pas : elle veille sur le glossaire du projet,
       pas sur la langue elle-meme. */
    description: s.goals?.name ? `Objectif : ${s.goals.name}` : null,
    location: null,
    start_time: new Date(s.due_date).toISOString(),
    end_time: new Date(s.due_date).toISOString(),
    all_day: true,
    color: "#14b8a6",
    category: "step-due",
    linked_goal_id: s.goal_id,
    linked_todo_id: null,
    tags: [],
    _source: "step",
    _sourceId: s.id,
  } as CalendarEvent;
}

/* FONDRE LES CINQ SOURCES EN UNE SEULE LISTE.
 *
 * Les evenements propres peuvent se repeter — il faut les deployer sur
 * la fenetre regardee. Les quatre autres sources arrivent deja plates.
 *
 * LE DEDOUBLONNAGE PORTE SUR L IDENTIFIANT, et il est necessaire : un
 * evenement recurrent est lu DEUX FOIS, par la requete de la fenetre et
 * par celle des recurrents. Sans lui, chaque serie apparaitrait en
 * double sur la grille. */
export function fusionnerLesSources({
  propres, recurrents, importes, debut, fin, deployer,
}: {
  propres: CalendarEvent[];
  recurrents: CalendarEvent[];
  importes: CalendarEvent[][];
  debut: Date;
  fin: Date;
  deployer: (ev: CalendarEvent, debut: Date, fin: Date) => CalendarEvent[];
}): CalendarEvent[] {
  const deploye: CalendarEvent[] = [];
  const vus = new Set<string>();
  for (const ev of [...propres, ...recurrents]) {
    if (vus.has(ev.id)) continue;
    vus.add(ev.id);
    if (ev.recurrence_rule) deploye.push(...deployer(ev, debut, fin));
    else deploye.push(ev);
  }
  return [...deploye, ...importes.flat()];
}
