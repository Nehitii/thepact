import { memo } from "react";
import { format, parseISO } from "date-fns";
import { Repeat, MapPin } from "lucide-react";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const EventCard = memo(({ event, compact, onClick }: EventCardProps) => {
  const start = parseISO(event.start_time);
  const timeStr = event.all_day ? "" : format(start, "HH:mm");

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-md px-1.5 py-0.5 text-xs font-medium truncate transition-all",
        "hover:ring-1 hover:ring-white/30 hover:brightness-110 cursor-pointer",
        compact && "text-[10px] leading-tight"
      )}
      style={{
        backgroundColor: event.color + "30",
        borderLeft: `3px solid ${event.color}`,
        color: event.color,
      }}
      title={event.title}
    >
      <span className="flex items-center gap-1 min-w-0">
        {timeStr && <span className="opacity-70 shrink-0">{timeStr}</span>}
        <span className="truncate">{event.title}</span>
        {event.recurrence_rule && <Repeat className="w-2.5 h-2.5 opacity-50 shrink-0" />}
      </span>
    </button>
  );
});

EventCard.displayName = "EventCard";
