import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { format, parseISO } from "date-fns";

interface CalendarSearchProps {
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onClose: () => void;
}

export function CalendarSearch({ events, onEventClick, onClose }: CalendarSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const results = query.length >= 2
    ? events.filter(
        (ev) =>
          ev.title.toLowerCase().includes(query.toLowerCase()) ||
          ev.description?.toLowerCase().includes(query.toLowerCase()) ||
          ev.location?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : [];

  return (
    <div className="mb-4 bg-card/50 border border-border/40 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          placeholder={t("calendar.searchPlaceholder", "Search events...")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 text-xs"
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {results.map((ev) => (
            <button
              key={ev.id}
              onClick={() => onEventClick(ev)}
              className="w-full text-left flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/30 transition-colors"
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
              <span className="text-xs font-medium truncate flex-1">{ev.title}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {format(parseISO(ev.start_time), "d MMM HH:mm")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
