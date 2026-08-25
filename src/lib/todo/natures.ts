import { Sparkles, Hourglass, CalendarClock, Clock, type LucideIcon } from "lucide-react";
import type { TodoTaskType } from "@/hooks/useTodoList";

/* ═══════════════════════════════════════════════════════════════
   LES QUATRE NATURES D'UNE TÂCHE, DÉFINIES UNE FOIS

   Comme les catégories l'ont été avant elles — voir `categories.ts`,
   qui raconte la même histoire — les natures étaient écrites deux
   fois : le formulaire de création et la barre de filtres. Elles
   n'avaient pas encore divergé, mais rien ne les en empêchait.

   Elles disent CE QU'EST la tâche, pas de quoi elle parle :

     flexible    à faire quand ça vient
     waiting     en attente de quelqu'un d'autre
     rendezvous  un moment fixé, avec une heure et souvent un lieu
     deadline    une échéance qui tombe

   POURQUOI LE CALENDRIER EN A BESOIN.

   Il les ignorait toutes. Une tâche importée arrivait en journée
   entière, teintée d'orange, avec l'icône de case à cocher — quelle
   que soit sa nature. Un rendez-vous saisi à 14 h perdait donc son
   heure ET son apparence : il s'affichait comme une tâche posée sur
   la journée, exactement ce qu'il n'est pas.
   ═══════════════════════════════════════════════════════════════ */

export interface NatureTache {
  id: TodoTaskType;
  icone: LucideIcon;
  /** La teinte, reprise du formulaire — c'est là qu'on la choisit. */
  couleur: string;
  /** La clé de traduction du libellé. */
  cle: string;
}

export const NATURES_TACHE: readonly NatureTache[] = [
  { id: "flexible", icone: Sparkles, couleur: "#22d3ee", cle: "todo.filters.types.flexible" },
  { id: "waiting", icone: Hourglass, couleur: "#f59e0b", cle: "todo.filters.types.waiting" },
  { id: "rendezvous", icone: CalendarClock, couleur: "#a855f7", cle: "todo.filters.types.rendezvous" },
  { id: "deadline", icone: Clock, couleur: "#ff4d5e", cle: "todo.filters.types.deadline" },
];

/** La nature par défaut : celle d'une tâche qu'on note sans préciser. */
export const NATURE_PAR_DEFAUT: TodoTaskType = "flexible";

/**
 * La nature d'une tâche, avec le repli sur « flexible ».
 *
 * `todo_tasks.task_type` est du texte libre et peut être nul — une
 * tâche d'avant l'introduction des natures, ou venue d'un import.
 * Elle retombe proprement plutôt que de casser un rendu.
 */
export function natureDe(type?: string | null): NatureTache {
  return NATURES_TACHE.find((n) => n.id === type) ?? NATURES_TACHE[0];
}

/** Un rendez-vous est le seul qui porte une heure et un lieu. */
export const estRendezVous = (type?: string | null) => type === "rendezvous";
