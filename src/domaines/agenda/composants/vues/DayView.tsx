import type { CalendarEvent } from "@/domaines/agenda/types";
import { GrilleHoraire } from "./GrilleHoraire";

/* Le jour, c est la grille horaire a une colonne. Il avait sa propre
   copie — avec sa hauteur d heure, son en-tete et sa ligne du moment —
   et les deux se sont mises a diverger. */

interface DayViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onCellClick: (date: Date) => void;
}

export function DayView({ viewDate, events, onEventClick, onCellClick }: DayViewProps) {
  return (
    <GrilleHoraire
      jours={[viewDate]}
      events={events}
      onEventClick={onEventClick}
      onCellClick={onCellClick}
    />
  );
}
