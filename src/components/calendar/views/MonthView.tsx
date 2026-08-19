import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format, parseISO, getISOWeek,
} from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import type { Locale } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { EventCard } from "../EventCard";
import { EventQuickAdd } from "../EventQuickAdd";
import { DndContext, DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";

/* LA CARTE
 *
 * Le ruban est devenu la vue par defaut ; la grille reste ce qu elle a
 * toujours ete de mieux : une carte. On y cherche une date, on y voit la
 * forme d un mois, on n y lit pas le detail d une journee.
 *
 * Elle est habillee du meme cadre que le reste : les coordonnees en
 * en-tete, les evenements en bandes, et aujourd hui marque par quatre
 * crochets plutot que par un aplat de couleur.
 */

interface MonthViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onQuickAdd: (data: { title: string; start_time: string; end_time: string; all_day: boolean }) => void;
  onEventMove: (eventId: string, newDate: Date) => void;
  /** Le surplus d une case mene a la journee, la seule vue qui le tienne. */
  onShowMore?: (day: Date) => void;
}

const MAX_VISIBLE = 3;

function DraggableEvent({ event, onClick }: { event: CalendarEvent; onClick: (e: React.MouseEvent) => void }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
    disabled: !!event._virtual,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      aria-label={t("calendar.openEvent", "Open: {{title}}", { title: event.title })}
      className="min-w-0 overflow-hidden"
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
    >
      <EventCard event={event} compact onClick={onClick} />
    </div>
  );
}

function DayCell({ day, viewDate, events, onEventClick, onQuickAdd, onShowMore, locale }: {
  day: Date;
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onQuickAdd: MonthViewProps["onQuickAdd"];
  onShowMore?: (day: Date) => void;
  locale?: Locale;
}) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: day.toISOString() });
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const inMonth = isSameMonth(day, viewDate);
  const today = isToday(day);
  const visible = events.slice(0, MAX_VISIBLE);
  const overflow = events.length - MAX_VISIBLE;

  return (
    <div
      ref={setNodeRef}
      className={cn("cal-case", !inMonth && "hors-mois", today && "est-auj", isOver && "est-survolee")}
    >
      <EventQuickAdd
        date={day}
        open={quickAddOpen}
        onOpen={() => setQuickAddOpen(true)}
        onClose={() => setQuickAddOpen(false)}
        onSave={onQuickAdd}
      >
        {/* Le seul gestionnaire etait onDoubleClick : un clic simple ne
            faisait rien, et la touche Entree produit un clic — au clavier,
            on ne pouvait pas creer d evenement depuis une case. */}
        <button
          type="button"
          className="cal-jour"
          aria-label={t("calendar.addOnDay", "New event on {{date}}", {
            date: format(day, "EEEE d MMMM", { locale }),
          })}
        >
          {format(day, "d")}
        </button>
      </EventQuickAdd>

      <div className="relative z-[2] flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden space-y-[3px] scrollbar-thin scrollbar-thumb-border/50">
        {visible.map((ev) => (
          <DraggableEvent key={ev.id} event={ev} onClick={(e) => { e.stopPropagation(); onEventClick(ev); }} />
        ))}
      </div>

      {overflow > 0 && (
        /* C etait un paragraphe : le surplus n etait atteignable qu en
           faisant defiler l interieur d une case de 112 px, ce que rien
           n indiquait. */
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onShowMore?.(day); }}
          className="cal-plus relative z-[2]"
        >
          {t("calendar.moreEvents", "+{{count}} more", { count: overflow })}
        </button>
      )}
    </div>
  );
}

export function MonthView({ viewDate, events, onEventClick, onQuickAdd, onEventMove, onShowMore }: MonthViewProps) {
  const locale = useDateFnsLocale();
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewDate]);

  const dayHeaders = useMemo(
    () => Array.from({ length: 7 }, (_, i) => format(new Date(2024, 0, i + 1), "EEE", { locale })),
    [locale],
  );

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  }, [days]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = format(parseISO(ev.start_time), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [events]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const eventData = active.data.current?.event as CalendarEvent | undefined;
    if (!eventData) return;
    const realId = eventData._virtual ? eventData.id.split("_r")[0] : eventData.id;
    onEventMove(realId, new Date(over.id as string));
  }, [onEventMove]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {/* Sous 640 px de conteneur la grille defile dans SON cadre : la
          page, elle, ne part jamais en travers. */}
      <div className="cal-mois-cadre">
        <div className="cal-mois-piste">
          <div className="cal-grille">
            <div className="cal-jourtete cal-semaine-tete" aria-hidden="true" />
            {dayHeaders.map((h, i) => (
              <div key={h} className="cal-jourtete">
                <span className="cal-coord" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="cal-abrev">{h}</span>
              </div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="cal-grille">
              <div className="cal-semaine cal-case">{getISOWeek(week[0])}</div>
              {week.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                return (
                  <DayCell
                    key={key}
                    day={day}
                    viewDate={viewDate}
                    events={eventsByDay.get(key) ?? []}
                    onEventClick={onEventClick}
                    onQuickAdd={onQuickAdd}
                    onShowMore={onShowMore}
                    locale={locale}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
