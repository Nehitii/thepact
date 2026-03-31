import { useMemo, useState, useCallback } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, format, parseISO, getISOWeek,
} from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { EventCard } from "../EventCard";
import { EventQuickAdd } from "../EventQuickAdd";
import { DndContext, DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";

interface MonthViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onQuickAdd: (data: { title: string; start_time: string; end_time: string; all_day: boolean }) => void;
  onEventMove: (eventId: string, newDate: Date) => void;
}

const MAX_VISIBLE = 3;

function DraggableEvent({ event, onClick }: { event: CalendarEvent; onClick: (e: React.MouseEvent) => void }) {
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

function DayCell({ day, viewDate, events, onEventClick, onQuickAdd }: {
  day: Date;
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onQuickAdd: MonthViewProps["onQuickAdd"];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day.toISOString() });
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const inMonth = isSameMonth(day, viewDate);
  const today = isToday(day);
  const visible = events.slice(0, MAX_VISIBLE);
  const overflow = events.length - MAX_VISIBLE;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] border border-border/30 p-1 transition-colors relative",
        !inMonth && "opacity-40",
        isOver && "bg-primary/10",
        today && "bg-primary/5 ring-1 ring-inset ring-primary/40"
      )}
    >
      <EventQuickAdd date={day} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onSave={onQuickAdd}>
        <button
          className="w-full text-left"
          onDoubleClick={(e) => { e.stopPropagation(); setQuickAddOpen(true); }}
        >
          <span className={cn(
            "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full mb-0.5",
            today && "bg-primary text-primary-foreground font-bold"
          )}>
            {format(day, "d")}
          </span>
          {today && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      </EventQuickAdd>

      <div className="space-y-0.5">
        {visible.map((ev) => (
          <DraggableEvent key={ev.id} event={ev} onClick={(e) => { e.stopPropagation(); onEventClick(ev); }} />
        ))}
        {overflow > 0 && (
          <p className="text-[10px] text-muted-foreground pl-1">+{overflow} more</p>
        )}
      </div>
    </div>
  );
}

export function MonthView({ viewDate, events, onEventClick, onQuickAdd, onEventMove }: MonthViewProps) {
  const locale = useDateFnsLocale();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewDate]);

  const dayHeaders = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, i + 1);
      return format(d, "EEE", { locale });
    });
  }, [locale]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
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
    const newDate = new Date(over.id as string);
    onEventMove(realId, newDate);
  }, [onEventMove]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="rounded-lg overflow-hidden border border-border/40">
        {/* Header */}
        <div className="grid grid-cols-[32px_repeat(7,1fr)] bg-muted/30">
          <div className="text-center text-[9px] text-muted-foreground py-1.5 uppercase">W</div>
          {dayHeaders.map((h) => (
            <div key={h} className="text-center text-[10px] font-medium text-muted-foreground py-1.5 uppercase tracking-wider">
              {h}
            </div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-[32px_repeat(7,1fr)]">
            <div className="flex items-start justify-center pt-2 text-[9px] text-muted-foreground font-mono border border-border/20">
              {getISOWeek(week[0])}
            </div>
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
                />
              );
            })}
          </div>
        ))}
      </div>
    </DndContext>
  );
}
