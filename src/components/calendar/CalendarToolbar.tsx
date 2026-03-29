import { memo } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, addYears, subYears } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Search, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";

export type CalendarView = "month" | "week" | "day" | "year" | "agenda";

interface CalendarToolbarProps {
  viewDate: Date;
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  onDateChange: (d: Date) => void;
  onToday: () => void;
  onNewEvent: () => void;
  onSearchToggle?: () => void;
}

const views: { key: CalendarView; label: string }[] = [
  { key: "day", label: "D" },
  { key: "week", label: "W" },
  { key: "month", label: "M" },
  { key: "year", label: "Y" },
  { key: "agenda", label: "A" },
];

export const CalendarToolbar = memo(({
  viewDate, view, onViewChange, onDateChange, onToday, onNewEvent, onSearchToggle,
}: CalendarToolbarProps) => {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();

  const navigate = (dir: 1 | -1) => {
    const fn = dir === 1
      ? (view === "day" ? addDays : view === "week" ? addWeeks : view === "year" ? addYears : addMonths)
      : (view === "day" ? subDays : view === "week" ? subWeeks : view === "year" ? subYears : subMonths);
    onDateChange(fn(viewDate, 1));
  };

  const titleFormat = view === "day" ? "EEEE d MMMM yyyy"
    : view === "week" ? "MMM yyyy"
    : view === "year" ? "yyyy"
    : "MMMM yyyy";

  return (
    <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
      {/* Left: nav */}
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-orbitron font-bold capitalize min-w-[140px] text-center">
          {format(viewDate, titleFormat, { locale })}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => navigate(1)} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday} className="h-8 text-xs ml-1">
          <CalendarDays className="h-3.5 w-3.5 mr-1" />
          {t("calendar.today", "Today")}
        </Button>
      </div>

      {/* Center: view switcher */}
      <div className="flex items-center bg-card/50 rounded-lg p-0.5 border border-border/40">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => onViewChange(v.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              view === v.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {onSearchToggle && (
          <Button variant="ghost" size="icon" onClick={onSearchToggle} className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" onClick={onNewEvent} className="h-8 gap-1">
          <Plus className="h-3.5 w-3.5" />
          {t("calendar.newEvent", "Event")}
        </Button>
      </div>
    </div>
  );
});

CalendarToolbar.displayName = "CalendarToolbar";
