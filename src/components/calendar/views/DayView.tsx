import { format, parseISO, isSameDay, differenceInMinutes, startOfDay } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 56;

interface DayViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onCellClick: (date: Date) => void;
}

export function DayView({ viewDate, events, onEventClick, onCellClick }: DayViewProps) {
  const locale = useDateFnsLocale();
  const dayEvents = events.filter((ev) => !ev.all_day && isSameDay(parseISO(ev.start_time), viewDate));
  const allDayEvents = events.filter((ev) => ev.all_day && isSameDay(parseISO(ev.start_time), viewDate));
  const today = isToday(viewDate);

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={cn("text-center py-3 border-b border-border/30", today && "bg-primary/10")}>
        <p className="text-xs uppercase text-muted-foreground">{format(viewDate, "EEEE", { locale })}</p>
        <p className={cn("text-2xl font-bold font-orbitron", today && "text-primary")}>{format(viewDate, "d")}</p>
        <p className="text-xs text-muted-foreground">{format(viewDate, "MMMM yyyy", { locale })}</p>
      </div>

      {/* All-day */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-border/30 p-2 space-y-1">
          {allDayEvents.map((ev) => (
            <button
              key={ev.id}
              onClick={() => onEventClick(ev)}
              className="w-full text-left text-xs rounded px-2 py-1 truncate"
              style={{ backgroundColor: ev.color + "30", color: ev.color }}
            >
              {ev.title}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="overflow-y-auto max-h-[600px] relative">
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

          {/* Positioned events */}
          {dayEvents.map((ev) => {
            const start = parseISO(ev.start_time);
            const end = parseISO(ev.end_time);
            const startMin = differenceInMinutes(start, startOfDay(viewDate));
            const durationMin = Math.max(differenceInMinutes(end, start), 15);
            const top = (startMin / 60) * HOUR_HEIGHT;
            const height = (durationMin / 60) * HOUR_HEIGHT;

            return (
              <button
                key={ev.id}
                onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                className="absolute rounded-md px-2 py-1 text-xs overflow-hidden cursor-pointer hover:brightness-110"
                style={{
                  top, height: Math.max(height, 24),
                  left: 68, right: 8,
                  backgroundColor: ev.color + "40",
                  borderLeft: `3px solid ${ev.color}`,
                  color: ev.color,
                }}
              >
                <p className="font-medium truncate">{ev.title}</p>
                <p className="opacity-70 text-[10px]">{format(start, "HH:mm")} – {format(end, "HH:mm")}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
