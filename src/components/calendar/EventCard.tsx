import { memo } from "react";
import { format, parseISO } from "date-fns";
import { Repeat } from "lucide-react";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { cn } from "@/lib/utils";
import { estImportee } from "./sources";

/* LA BANDE
 *
 * Un filet de couleur, l heure en mono, le titre. Pas de pastille, pas
 * de coin arrondi : la case du mois fait 112 px de haut et doit en loger
 * trois — chaque pixel de chrome est un pixel de titre en moins.
 *
 * Les echeances importees — taches, objectifs, etapes — portent un filet
 * POINTILLE : on les distingue des vrais evenements sans avoir a les
 * lire, et sans depenser une icone.
 */

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const EventCard = memo(({ event, compact, onClick }: EventCardProps) => {
  const debut = parseISO(event.start_time);
  const importe = estImportee(event._source);
  const heure = event.all_day ? null : format(debut, "HH:mm");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("cal-evt", compact && "est-compact")}
      data-importe={importe}
      style={{ ["--cal-teinte" as string]: event.color } as React.CSSProperties}
      title={event.title}
    >
      <span className="cal-evt-filet" aria-hidden="true" />
      {heure && <span className="cal-evt-heure">{heure}</span>}
      <span className="cal-evt-titre">
        {event.title}
        {event.recurrence_rule && (
          <Repeat className="cal-evt-marque inline-block w-2.5 h-2.5 ml-1 -mt-0.5" aria-hidden="true" />
        )}
      </span>
    </button>
  );
});

EventCard.displayName = "EventCard";
