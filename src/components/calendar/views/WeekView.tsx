import { useMemo, useEffect, useRef, useState } from "react";
import { startOfWeek, addDays, format, parseISO, isSameDay, isToday, differenceInMinutes, startOfDay } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { CheckSquare, Target, Footprints } from "lucide-react";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48;

const sourceIcons: Record<string, typeof CheckSquare> = {
  todo: CheckSquare,
  goal: Target,
  step: Footprints,
};

interface WeekViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onCellClick: (date: Date) => void;
}

function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());
  useVisibleInterval(() => setNow(new Date()), 60_000);
  const mins = now.getHours() * 60 + now.getMinutes();
  const top = (mins / 60) * HOUR_HEIGHT;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
        <div className="flex-1 h-px bg-destructive" />
      </div>
    </div>
  );
}

export function WeekView({ viewDate, events, onEventClick, onCellClick }: WeekViewProps) {
  const locale = useDateFnsLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Auto-scroll to current hour
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const top = Math.max(0, (now.getHours() - 1) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = top;
    }
  }, []);

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
                {dayAllDay.map((ev) => {
                  const isExternal = ev._source && ev._source !== "event";
                  const SourceIcon = isExternal ? sourceIcons[ev._source!] : undefined;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      className="w-full text-left text-[10px] rounded px-1 py-0.5 truncate flex items-center gap-0.5"
                      style={{
                        backgroundColor: ev.color + "30",
                        color: ev.color,
                        borderLeft: isExternal ? `2px dashed ${ev.color}` : `2px solid ${ev.color}`,
                      }}
                    >
                      {SourceIcon && <SourceIcon className="w-2.5 h-2.5 shrink-0" />}
                      <span className="truncate">{ev.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className="grid grid-cols-[50px_repeat(7,1fr)] overflow-y-auto max-h-[600px]">
        <div className="relative">
          {HOURS.map((h) => (
            <div key={h} className="border-b border-border/20" style={{ height: HOUR_HEIGHT }}>
              <span className="text-[9px] text-muted-foreground pl-1">{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const showTimeLine = isToday(day);
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

              {showTimeLine && <CurrentTimeLine />}

              {dayEvents.map((ev) => {
                const start = parseISO(ev.start_time);
                const end = parseISO(ev.end_time);
                const startMin = differenceInMinutes(start, startOfDay(day));
                const durationMin = Math.max(differenceInMinutes(end, start), 15);
                const top = (startMin / 60) * HOUR_HEIGHT;
                const height = (durationMin / 60) * HOUR_HEIGHT;
                const isExternal = ev._source && ev._source !== "event";
                const SourceIcon = isExternal ? sourceIcons[ev._source!] : undefined;

                return (
                  <button
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                    className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-[10px] overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                    style={{
                      top, height: Math.max(height, 18),
                      backgroundColor: ev.color + "40",
                      borderLeft: isExternal ? `3px dashed ${ev.color}` : `3px solid ${ev.color}`,
                      color: ev.color,
                    }}
                  >
                    <p className="font-medium truncate flex items-center gap-0.5">
                      {SourceIcon && <SourceIcon className="w-2.5 h-2.5 shrink-0" />}
                      {ev.title}
                    </p>
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
