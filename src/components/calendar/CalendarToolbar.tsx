import { memo, useState } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, addYears, subYears } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Search, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SourceFilterChips } from "./SourceFilterChips";
import type { CalendarSourceType } from "@/hooks/useCalendarEvents";

export type CalendarView = "month" | "week" | "day" | "year" | "agenda";

interface CalendarToolbarProps {
  viewDate: Date;
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  onDateChange: (d: Date) => void;
  onToday: () => void;
  onNewEvent: () => void;
  onSearchToggle?: () => void;
  activeFilters: Set<CalendarSourceType>;
  onFilterToggle: (source: CalendarSourceType) => void;
}

export const CalendarToolbar = memo(({
  viewDate, view, onViewChange, onDateChange, onToday, onNewEvent, onSearchToggle,
  activeFilters, onFilterToggle,
}: CalendarToolbarProps) => {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const viewLabels: { key: CalendarView; label: string }[] = [
    { key: "day", label: t("calendar.viewDay", "Day") },
    { key: "week", label: t("calendar.viewWeek", "Week") },
    { key: "month", label: t("calendar.viewMonth", "Month") },
    { key: "year", label: t("calendar.viewYear", "Year") },
    { key: "agenda", label: t("calendar.viewAgenda", "Agenda") },
  ];

  const navigate = (dir: 1 | -1) => {
    const fn = dir === 1
      ? (view === "day" ? addDays : view === "week" ? addWeeks : view === "year" ? addYears : addMonths)
      : (view === "day" ? subDays : view === "week" ? subWeeks : view === "year" ? subYears : subMonths);
    onDateChange(fn(viewDate, 1));
  };

  /* Un chevron seul n annonce rien. Le libelle nomme la periode qu on
     quitte ou qu on rejoint, pas une direction abstraite. */
  const periode = view === "day" ? t("calendar.viewDay", "Day")
    : view === "week" ? t("calendar.viewWeek", "Week")
    : view === "year" ? t("calendar.viewYear", "Year")
    : t("calendar.viewMonth", "Month");

  const titleFormat = view === "day" ? "EEEE d MMMM yyyy"
    : view === "week" ? "MMM yyyy"
    : view === "year" ? "yyyy"
    : "MMMM yyyy";

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: nav */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8"
            aria-label={t("calendar.prevPeriod", "Previous {{period}}", { period: periode.toLowerCase() })}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={datePickerOpen}
                /* Pas d aria-label ici : il remplacerait « August 2026 »
                   par un texte qui ne le contient pas, et le nom annonce
                   ne correspondrait plus au libelle visible. */
                className="text-lg font-orbitron font-bold capitalize min-w-[140px] text-center hover:text-primary transition-colors cursor-pointer"
              >
                {format(viewDate, titleFormat, { locale })}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={viewDate}
                onSelect={(d) => {
                  if (d) { onDateChange(d); setDatePickerOpen(false); }
                }}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(1)}
            className="h-8 w-8"
            aria-label={t("calendar.nextPeriod", "Next {{period}}", { period: periode.toLowerCase() })}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday} className="h-8 text-xs ml-1">
            <CalendarDays className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            {t("calendar.today", "Today")}
          </Button>
        </div>

        {/* Center: view switcher */}
        <div
          className="flex items-center bg-card/50 rounded-lg p-0.5 border border-border/40"
          role="group"
          aria-label={t("calendar.viewSwitcher", "Calendar view")}
        >
          {viewLabels.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => onViewChange(v.key)}
              /* La vue courante ne se lisait qu a la couleur du fond. */
              aria-pressed={view === v.key}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearchToggle}
              className="h-8 w-8"
              aria-label={t("calendar.search", "Search events")}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <Button size="sm" onClick={onNewEvent} className="h-8 gap-1">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("calendar.newEvent", "Event")}
          </Button>
        </div>
      </div>

      {/* Source filter chips */}
      <SourceFilterChips active={activeFilters} onToggle={onFilterToggle} />
    </div>
  );
});

CalendarToolbar.displayName = "CalendarToolbar";
