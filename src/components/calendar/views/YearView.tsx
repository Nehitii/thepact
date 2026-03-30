import { useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, format, parseISO, isSameDay, isToday,
} from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarSourceType } from "@/hooks/useCalendarEvents";

interface YearViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onMonthClick: (month: Date) => void;
}

const SOURCE_COLORS: Record<CalendarSourceType, string> = {
  event: "bg-blue-400",
  todo: "bg-orange-400",
  goal: "bg-purple-400",
  step: "bg-teal-400",
};

function MiniMonth({ month, events, onClick, locale }: {
  month: Date;
  events: CalendarEvent[];
  onClick: () => void;
  locale: any;
}) {
  const days = useMemo(() => {
    const ms = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const me = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: ms, end: me });
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Set<CalendarSourceType>>();
    events.forEach((ev) => {
      const key = format(parseISO(ev.start_time), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(ev._source || "event");
    });
    return map;
  }, [events]);

  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
    >
      <p className="text-xs font-bold font-orbitron mb-1 capitalize">{format(month, "MMM", { locale })}</p>
      <div className="grid grid-cols-7 gap-px">
        {days.map((d) => {
          const inMonth = isSameMonth(d, month);
          const dayKey = format(d, "yyyy-MM-dd");
          const sources = eventsByDay.get(dayKey);
          const today = isToday(d);
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "w-4 h-4 flex flex-col items-center justify-center text-[8px] rounded-sm relative",
                !inMonth && "opacity-20",
                today && "bg-primary text-primary-foreground font-bold",
              )}
            >
              {format(d, "d")}
              {sources && sources.size > 0 && !today && (
                <div className="flex gap-px absolute -bottom-0.5">
                  {Array.from(sources).slice(0, 3).map(s => (
                    <span key={s} className={cn("w-1 h-1 rounded-full", SOURCE_COLORS[s])} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </button>
  );
}

export function YearView({ viewDate, events, onMonthClick }: YearViewProps) {
  const locale = useDateFnsLocale();
  const year = viewDate.getFullYear();
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)), [year]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {months.map((m) => (
        <MiniMonth
          key={m.getMonth()}
          month={m}
          events={events}
          onClick={() => onMonthClick(m)}
          locale={locale}
        />
      ))}
    </div>
  );
}
