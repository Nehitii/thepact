import { useMemo } from "react";
import { startOfWeek, addDays, format, parseISO, isSameDay, isToday, differenceInMinutes, startOfDay } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48; // px per hour

interface WeekViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onCellClick: (date: Date) => void;
}

export function WeekView({ viewDate, events, onEventClick, onCellClick }: WeekViewProps) {
  const locale = useDateFnsLocale();
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const getEventsForDay = (day: Date) =>
    events.filter((ev) => !ev.all_day && isSameDay(parseISO(ev.start_time), day));

  const allDayEvents = events.filter((ev) => ev.all_day);

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[50px_repeat(7,1fr)] bg-muted/30 border-b border-border/30">
        <div />
        {days.map((d) => (
          <div key={d.toISOString()} className={cn("text-center py-2", isToday(d) && "bg-primary/10")}>
            <p className="text-[10px] uppercase text-muted-foreground">{format(d, "EEE", { locale })}</p>
            <p className={cn(
              "text-sm font-bold",
              isToday(d) && "text-primary"
            )}>{format(d, "d")}</p>
          </div>
        ))}
      </div>

      {/* All-day row */}
      {allDayEvents.length > 0 && (
        <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-border/30">
          <div className="text-[9px] text-muted-foreground p-1">ALL</div>
          {days.map((d) => {
            const dayAllDay = allDayEvents.filter((ev) => isSameDay(parseISO(ev.start_time), d));
            return (
              <div key={d.toISOString()} className="p-0.5 space-y-0.5">
                {dayAllDay.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick(ev)}
                    className="w-full text-left text-[10px] rounded px-1 py-0.5 truncate"
                    style={{ backgroundColor: ev.color + "30", color: ev.color }}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="grid grid-cols-[50px_repeat(7,1fr)] overflow-y-auto max-h-[600px]">
        {/* Hour labels */}
        <div className="relative">
          {HOURS.map((h) => (
            <div key={h} className="border-b border-border/20" style={{ height: HOUR_HEIGHT }}>
              <span className="text-[9px] text-muted-foreground pl-1">{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div key={day.toISOString()} className="relative border-l border-border/20">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="border-b border-border/20 hover:bg-primary/5 cursor-pointer"
                  style={{ height: HOUR_HEIGHT }}
                  onClick={() => {
                    const clicked = new Date(day);
                    clicked.setHours(h, 0, 0, 0);
                    onCellClick(clicked);
                  }}
                />
              ))}

              {/* Events positioned absolutely */}
              {dayEvents.map((ev) => {
                const start = parseISO(ev.start_time);
                const end = parseISO(ev.end_time);
                const startMin = differenceInMinutes(start, startOfDay(day));
                const durationMin = Math.max(differenceInMinutes(end, start), 15);
                const top = (startMin / 60) * HOUR_HEIGHT;
                const height = (durationMin / 60) * HOUR_HEIGHT;

                return (
                  <button
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                    className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-[10px] overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                    style={{
                      top, height: Math.max(height, 18),
                      backgroundColor: ev.color + "40",
                      borderLeft: `3px solid ${ev.color}`,
                      color: ev.color,
                    }}
                  >
                    <p className="font-medium truncate">{ev.title}</p>
                    <p className="opacity-70">{format(start, "HH:mm")} – {format(end, "HH:mm")}</p>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
