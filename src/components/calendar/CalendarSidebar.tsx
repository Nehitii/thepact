import { memo, useMemo } from "react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import { Target, CheckSquare, Footprints, CalendarDays, Clock } from "lucide-react";
import type { CalendarEvent, CalendarSourceType } from "@/hooks/useCalendarEvents";
import { useTranslation } from "react-i18next";

interface CalendarSidebarProps {
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
}

const sourceIcons: Record<CalendarSourceType, typeof CalendarDays> = {
  event: CalendarDays,
  todo: CheckSquare,
  goal: Target,
  step: Footprints,
};

export const CalendarSidebar = memo(({ events, onDayClick }: CalendarSidebarProps) => {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();

  const upcoming = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter(e => !isPast(parseISO(e.end_time)) || isToday(parseISO(e.start_time)))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .slice(0, 5);
  }, [events]);

  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm p-3 space-y-2">
      <h3 className="text-xs font-orbitron font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="h-3 w-3" />
        {t("calendar.upcoming", "Upcoming")}
      </h3>
      <div className="space-y-1">
        {upcoming.map(ev => {
          const source = ev._source || "event";
          const Icon = sourceIcons[source];
          const start = parseISO(ev.start_time);
          const overdue = isPast(start) && !isToday(start);

          return (
            <button
              key={ev.id}
              onClick={() => onDayClick(start)}
              className="w-full flex items-start gap-2 text-left p-1.5 rounded-md hover:bg-muted/30 transition-colors group"
            >
              <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ backgroundColor: ev.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors flex items-center gap-1">
                  <Icon className="h-3 w-3 shrink-0 opacity-60" />
                  {ev.title}
                </p>
                <p className={cn("text-[10px]", overdue ? "text-destructive" : "text-muted-foreground")}>
                  {format(start, "EEE d MMM", { locale })}
                  {!ev.all_day && ` · ${format(start, "HH:mm")}`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

CalendarSidebar.displayName = "CalendarSidebar";
