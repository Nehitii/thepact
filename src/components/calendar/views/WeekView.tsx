import { useMemo } from "react";
import { startOfWeek, addDays } from "date-fns";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { GrilleHoraire } from "./GrilleHoraire";

/* La semaine, c est la grille horaire a sept colonnes. Rien d autre ne
   la distingue du jour — et c est precisement ce qui n etait pas vrai
   avant : deux fichiers, deux hauteurs d heure, deux en-tetes. */

interface WeekViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onCellClick: (date: Date) => void;
}

export function WeekView({ viewDate, events, onEventClick, onCellClick }: WeekViewProps) {
  const jours = useMemo(() => {
    const debut = startOfWeek(viewDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(debut, i));
  }, [viewDate]);

  return (
    <GrilleHoraire
      jours={jours}
      events={events}
      onEventClick={onEventClick}
      onCellClick={onCellClick}
    />
  );
}
