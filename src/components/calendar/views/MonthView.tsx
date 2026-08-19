import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format, parseISO, getISOWeek,
  startOfDay, endOfDay, differenceInCalendarDays, isSameWeek,
} from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import type { Locale } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { EventCard } from "../EventCard";
import { EventQuickAdd } from "../EventQuickAdd";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors,
  defaultDropAnimationSideEffects,
  type DragEndEvent, type DragStartEvent, type DropAnimation,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { estImportee } from "../sources";

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

/** Une entree qui ne tient pas dans une journee est une barre, pas un point. */
const estLongue = (ev: CalendarEvent) =>
  differenceInCalendarDays(parseISO(ev.end_time), parseISO(ev.start_time)) >= 1;

interface Barre {
  ev: CalendarEvent;
  colonne: number;
  portee: number;
  vientDAvant: boolean;
  vaApres: boolean;
  etage: number;
}

/* Les vacances du 16 au 31 s affichaient le 16 et nulle part ailleurs :
   chaque entree etait indexee sur sa seule date de debut. On calcule
   donc, semaine par semaine, la portee reelle de ce qui deborde — et les
   barres s empilent quand elles se croisent. */
function barresDeLaSemaine(semaine: Date[], longues: CalendarEvent[]): Barre[] {
  const debutSem = startOfDay(semaine[0]);
  const finSem = endOfDay(semaine[6]);

  const brutes = longues
    .map((ev) => {
      const d = parseISO(ev.start_time);
      const f = parseISO(ev.end_time);
      if (f < debutSem || d > finSem) return null;
      const colonne = Math.max(0, differenceInCalendarDays(startOfDay(d), debutSem));
      const derniere = Math.min(6, differenceInCalendarDays(startOfDay(f), debutSem));
      return {
        ev,
        colonne,
        portee: Math.max(1, derniere - colonne + 1),
        vientDAvant: d < debutSem,
        vaApres: f > finSem,
      };
    })
    .filter((b): b is Omit<Barre, "etage"> => b !== null)
    .sort((a, b) => a.colonne - b.colonne || b.portee - a.portee);

  const finsParEtage: number[] = [];
  return brutes.map((b) => {
    let etage = finsParEtage.findIndex((fin) => fin <= b.colonne);
    if (etage === -1) { etage = finsParEtage.length; finsParEtage.push(0); }
    finsParEtage[etage] = b.colonne + b.portee;
    return { ...b, etage };
  });
}

/* La traine suit le pointeur au-dessus de la page entiere. L element
   d origine reste en place, efface : c est ce qui donne le sentiment de
   soulever quelque chose plutot que de le pousser. */
const ANIMATION_DEPOT: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.35" } },
  }),
};

function DraggableEvent({ event, onClick }: { event: CalendarEvent; onClick: (e: React.MouseEvent) => void }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
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
      className={cn("cal-draggable min-w-0 overflow-hidden", isDragging && "est-en-vol")}
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

      <div className="cal-case-evts relative z-[2] flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden space-y-[3px] scrollbar-thin scrollbar-thumb-border/50">
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

  /* Ce qui tient dans une journee va dans les cases ; ce qui deborde va
     dans les barres, au-dessus. */
  const { parJour, longues } = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const larges: CalendarEvent[] = [];
    for (const ev of events) {
      if (estLongue(ev)) { larges.push(ev); continue; }
      const key = format(parseISO(ev.start_time), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return { parJour: map, longues: larges };
  }, [events]);

  const [enVol, setEnVol] = useState<CalendarEvent | null>(null);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setEnVol((e.active.data.current?.event as CalendarEvent) ?? null);
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setEnVol(null);
    const { active, over } = e;
    if (!over) return;
    const eventData = active.data.current?.event as CalendarEvent | undefined;
    if (!eventData) return;
    const realId = eventData._virtual ? eventData.id.split("_r")[0] : eventData.id;
    onEventMove(realId, new Date(over.id as string));
  }, [onEventMove]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setEnVol(null)}
    >
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

          {weeks.map((week, wi) => {
            const barres = barresDeLaSemaine(week, longues);
            const etages = barres.length ? Math.max(...barres.map((b) => b.etage)) + 1 : 0;
            return (
              <div
                key={wi}
                className="cal-grille cal-mois-rangee"
                style={{ ["--cal-etages" as string]: etages } as React.CSSProperties}
              >
                <div
                  className={cn("cal-semaine cal-case", isSameWeek(week[0], new Date(), { weekStartsOn: 1 }) && "est-semaine-courante")}
                >
                  {getISOWeek(week[0])}
                </div>
                {week.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  return (
                    <DayCell
                      key={key}
                      day={day}
                      viewDate={viewDate}
                      events={parJour.get(key) ?? []}
                      onEventClick={onEventClick}
                      onQuickAdd={onQuickAdd}
                      onShowMore={onShowMore}
                      locale={locale}
                    />
                  );
                })}

                {barres.length > 0 && (
                  <div className="cal-grille cal-mois-barres">
                    {barres.map(({ ev, colonne, portee, vientDAvant, vaApres, etage }) => (
                      <button
                        key={ev.id + "-" + wi}
                        type="button"
                        onClick={() => onEventClick(ev)}
                        className={cn("cal-barre-evt", vientDAvant && "vient-d-avant", vaApres && "va-apres")}
                        data-importe={estImportee(ev._source)}
                        title={ev.title}
                        style={{
                          ["--cal-teinte" as string]: ev.color,
                          gridColumn: `${colonne + 2} / span ${portee}`,
                          gridRow: etage + 1,
                        } as React.CSSProperties}
                      >
                        {vientDAvant && <span className="cal-barre-fleche" aria-hidden="true">&#8592;</span>}
                        <span className="cal-barre-titre">{ev.title}</span>
                        {vaApres && <span className="cal-barre-fleche ml-auto" aria-hidden="true">&#8594;</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={ANIMATION_DEPOT}>
        {enVol && (
          <div className="cal-traine">
            <EventCard event={enVol} compact />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
