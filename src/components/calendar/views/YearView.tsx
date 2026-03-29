import { useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, format, parseISO, isSameDay,
} from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";

interface YearViewProps {
  viewDate: Date;
  events: CalendarEvent[];
  onMonthClick: (month: Date) => void;
}

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

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    events.forEach((ev) => set.add(format(parseISO(ev.start_time), "yyyy-MM-dd")));
    return set;
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
          const hasEvent = eventDates.has(format(d, "yyyy-MM-dd"));
          const today = isToday(d);
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "w-4 h-4 flex items-center justify-center text-[8px] rounded-sm",
                !inMonth && "opacity-20",
                today && "bg-primary text-primary-foreground font-bold",
                hasEvent && !today && "bg-primary/20 font-bold",
              )}
            >
              {format(d, "d")}
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
