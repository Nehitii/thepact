import { CalendarDays, CheckSquare, Target, Footprints, type LucideIcon } from "lucide-react";
import type { CalendarSourceType } from "@/domaines/agenda/types";
import { natureDe } from "@/domaines/taches";

/* LES QUATRE SOURCES, DEFINIES UNE FOIS
 *
 * Chaque vue redeclarait sa propre table : la semaine et le jour
 * connaissaient trois icones, la barre laterale quatre, l annee aucune —
 * elle peignait des points avec des classes Tailwind (bg-blue-400) qui
 * n avaient rien a voir avec les teintes reellement employees sur les
 * bandes. La legende ne parlait donc pas la meme langue que la carte.
 */

export interface DescriptionSource {
  icone: LucideIcon;
  teinte: string;
  cle: string;
}

export const SOURCES: Record<CalendarSourceType, DescriptionSource> = {
  event: { icone: CalendarDays, teinte: "#3b82f6", cle: "calendar.sourceEvent" },
  todo:  { icone: CheckSquare,  teinte: "#f97316", cle: "calendar.sourceTodo" },
  goal:  { icone: Target,       teinte: "#a855f7", cle: "calendar.sourceGoal" },
  step:  { icone: Footprints,   teinte: "#14b8a6", cle: "calendar.sourceStep" },
};

export const ORDRE_SOURCES: CalendarSourceType[] = ["event", "todo", "goal", "step"];

/** La source d une entree, avec le repli sur « evenement ». */
export const sourceDe = (source?: CalendarSourceType | null): CalendarSourceType => source ?? "event";

/** Une entree importee — tache, objectif, etape — n est pas un evenement. */
export const estImportee = (source?: CalendarSourceType | null) => !!source && source !== "event";

/**
 * L icone d une entree.
 *
 * La source suffit pour un objectif ou une etape : il n en existe
 * qu une sorte. Une tache, elle, a quatre natures — et un rendez-vous
 * portant une case a cocher se lit comme une corvee.
 */
export function iconeDe(entree: { _source?: CalendarSourceType | null; _nature?: string | null }): LucideIcon {
  if (entree._source === "todo" && entree._nature) return natureDe(entree._nature).icone;
  return SOURCES[sourceDe(entree._source)].icone;
}
