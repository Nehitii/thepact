import { useEffect, useRef, useState } from "react";
import { format, parseISO, isSameDay, differenceInMinutes, startOfDay, isToday } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { CheckSquare, Target, Footprints } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 56;

const sourceIcons: Record<string, typeof CheckSquare> = {
  todo: CheckSquare,
  goal: Target,
  step: Footprints,
};

interface DayViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onCellClick: (date: Date) => void;
}

function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
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

export function DayView({ viewDate, events, onEventClick, onCellClick }: DayViewProps) {
  const locale = useDateFnsLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayEvents = events.filter((ev) => !ev.all_day && isSameDay(parseISO(ev.start_time), viewDate));
  const allDayEvents = events.filter((ev) => ev.all_day && isSameDay(parseISO(ev.start_time), viewDate));
  const today = isToday(viewDate);

  useEffect(() => {
    if (scrollRef.current && today) {
      const now = new Date();
      const top = Math.max(0, (now.getHours() - 1) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = top;
    }
  }, [today]);

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <div className={cn("text-center py-3 border-b border-border/30", today && "bg-primary/10")}>
        <p className="text-xs uppercase text-muted-foreground">{format(viewDate, "EEEE", { locale })}</p>
        <p className={cn("text-2xl font-bold font-orbitron", today && "text-primary")}>{format(viewDate, "d")}</p>
        <p className="text-xs text-muted-foreground">{format(viewDate, "MMMM yyyy", { locale })}</p>
      </div>

      {allDayEvents.length > 0 && (
        <div className="border-b border-border/30 p-2 space-y-1">
          {allDayEvents.map((ev) => {
            const isExternal = ev._source && ev._source !== "event";
            const SourceIcon = isExternal ? sourceIcons[ev._source!] : undefined;
            return (
              <button
                key={ev.id}
                onClick={() => onEventClick(ev)}
                className="w-full text-left text-xs rounded px-2 py-1 truncate flex items-center gap-1"
                style={{
                  backgroundColor: ev.color + "30",
                  color: ev.color,
                  borderLeft: isExternal ? `3px dashed ${ev.color}` : `3px solid ${ev.color}`,
                }}
              >
                {SourceIcon && <SourceIcon className="w-3 h-3 shrink-0" />}
                {ev.title}
              </button>
            );
          })}
        </div>
      )}

      <div ref={scrollRef} className="overflow-y-auto max-h-[600px] relative">
        <div className="grid grid-cols-[60px_1fr]">
          {HOURS.map((h) => (
            <div key={h} className="contents">
              <div className="border-b border-border/20 flex items-start justify-end pr-2 pt-1" style={{ height: HOUR_HEIGHT }}>
                <span className="text-[10px] text-muted-foreground">{String(h).padStart(2, "0")}:00</span>
              </div>
              <div
                className="border-b border-l border-border/20 hover:bg-primary/5 cursor-pointer relative"
                style={{ height: HOUR_HEIGHT }}
                onClick={() => {
                  const d = new Date(viewDate);
                  d.setHours(h, 0, 0, 0);
                  onCellClick(d);
                }}
              />
            </div>
          ))}

          {/* Current time line */}
          {today && (
            <div className="col-start-2 row-start-1 row-end-[25] relative pointer-events-none">
              <CurrentTimeLine />
            </div>
          )}

          {dayEvents.map((ev) => {
            const start = parseISO(ev.start_time);
            const end = parseISO(ev.end_time);
            const startMin = differenceInMinutes(start, startOfDay(viewDate));
            const durationMin = Math.max(differenceInMinutes(end, start), 15);
            const top = (startMin / 60) * HOUR_HEIGHT;
            const height = (durationMin / 60) * HOUR_HEIGHT;
            const isExternal = ev._source && ev._source !== "event";
            const SourceIcon = isExternal ? sourceIcons[ev._source!] : undefined;

            return (
              <button
                key={ev.id}
                onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                className="absolute rounded-md px-2 py-1 text-xs overflow-hidden cursor-pointer hover:brightness-110"
                style={{
                  top, height: Math.max(height, 24),
                  left: 68, right: 8,
                  backgroundColor: ev.color + "40",
                  borderLeft: isExternal ? `3px dashed ${ev.color}` : `3px solid ${ev.color}`,
                  color: ev.color,
                }}
              >
                <p className="font-medium truncate flex items-center gap-0.5">
                  {SourceIcon && <SourceIcon className="w-3 h-3 shrink-0" />}
                  {ev.title}
                </p>
                <p className="opacity-70 text-[10px]">{format(start, "HH:mm")} – {format(end, "HH:mm")}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
