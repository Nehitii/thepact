import { useMemo } from "react";
import { format, parseISO, isToday, isSameDay } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";
import { MapPin, Clock, Repeat } from "lucide-react";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { useTranslation } from "react-i18next";

interface AgendaViewProps {
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
}

export function AgendaView({ events, onEventClick }: AgendaViewProps) {
  const locale = useDateFnsLocale();
  const { t } = useTranslation();

  const grouped = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const groups: { date: Date; events: CalendarEvent[] }[] = [];
    for (const ev of sorted) {
      const d = parseISO(ev.start_time);
      const last = groups[groups.length - 1];
      if (last && isSameDay(last.date, d)) {
        last.events.push(ev);
      } else {
        groups.push({ date: d, events: [ev] });
      }
    }
    return groups;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">{t("calendar.noEvents", "No events in this period")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div key={group.date.toISOString()}>
          <div className={cn(
            "flex items-center gap-2 mb-2 px-2",
            isToday(group.date) && "text-primary"
          )}>
            <span className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              isToday(group.date) ? "bg-primary text-primary-foreground" : "bg-muted/50 text-foreground"
            )}>
              {format(group.date, "d")}
            </span>
            <div>
              <p className="text-xs font-medium capitalize">{format(group.date, "EEEE", { locale })}</p>
              <p className="text-[10px] text-muted-foreground">{format(group.date, "d MMMM yyyy", { locale })}</p>
            </div>
          </div>

          <div className="space-y-1 ml-12">
            {group.events.map((ev) => {
              const start = parseISO(ev.start_time);
              const end = parseISO(ev.end_time);
              return (
                <button
                  key={ev.id}
                  onClick={() => onEventClick(ev)}
                  className="w-full text-left rounded-lg p-2.5 hover:bg-muted/30 transition-colors flex gap-3 items-start group"
                >
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{ev.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {ev.all_day ? t("calendar.allDay", "All day") : `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="h-2.5 w-2.5" />
                          {ev.location}
                        </span>
                      )}
                      {ev.recurrence_rule && <Repeat className="h-2.5 w-2.5" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
