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

/* La vue « agenda » listait les jours a venir. Le ruban fait le meme
   travail — chronologique, jour par jour — mais montre en plus a quelle
   heure les choses tombent et ce qui se chevauche. Garder les deux aurait
   ete garder deux vues pour un seul metier. */
export type CalendarView = "ruban" | "week" | "day" | "month" | "year";

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
    { key: "ruban", label: t("calendar.viewRuban", "Ribbon") },
    { key: "day", label: t("calendar.viewDay", "Day") },
    { key: "week", label: t("calendar.viewWeek", "Week") },
    { key: "month", label: t("calendar.viewMonth", "Month") },
    { key: "year", label: t("calendar.viewYear", "Year") },
  ];

  const navigate = (dir: 1 | -1) => {
    const fn = dir === 1
      ? (view === "day" ? addDays : view === "week" ? addWeeks : view === "year" ? addYears : addMonths)
      : (view === "day" ? subDays : view === "week" ? subWeeks : view === "year" ? subYears : subMonths);
    onDateChange(fn(viewDate, 1));
  };

  /* Un chevron seul n annonce rien. Le libelle nomme la periode
     concernee, pas une direction abstraite. */
  const periode = view === "day" ? t("calendar.viewDay", "Day")
    : view === "week" ? t("calendar.viewWeek", "Week")
    : view === "year" ? t("calendar.viewYear", "Year")
    : t("calendar.viewMonth", "Month");

  const titleFormat = view === "day" ? "EEEE d MMMM yyyy"
    : view === "week" ? "MMM yyyy"
    : view === "year" ? "yyyy"
    : "MMMM yyyy";

  return (
    <div className="cal-barre">
      <div className="cal-barre-haut">
        {/* Gauche : la navigation */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="cal-outil h-8 w-8"
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
                /* Pas d aria-label ici : il remplacerait « aout 2026 » par
                   un texte qui ne le contient pas, et le nom annonce ne
                   correspondrait plus au libelle visible. */
                className="cal-periode"
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
            className="cal-outil h-8 w-8"
            aria-label={t("calendar.nextPeriod", "Next {{period}}", { period: periode.toLowerCase() })}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday} className="cal-outil h-8 text-xs ml-1">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            {t("calendar.today", "Today")}
          </Button>
        </div>

        {/* Centre : le selecteur de vue */}
        <div className="cal-vues" role="group" aria-label={t("calendar.viewSwitcher", "Calendar view")}>
          {viewLabels.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => onViewChange(v.key)}
              /* La vue courante ne se lisait qu a la couleur du fond. */
              aria-pressed={view === v.key}
              className={cn("cal-vue", view === v.key && "est-active")}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Droite : les actions */}
        <div className="flex items-center gap-1.5">
          {onSearchToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearchToggle}
              className="cal-outil h-8 w-8"
              aria-label={t("calendar.search", "Search events")}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <Button size="sm" onClick={onNewEvent} className="cal-outil h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("calendar.newEvent", "Event")}
          </Button>
        </div>
      </div>

      <SourceFilterChips active={activeFilters} onToggle={onFilterToggle} />
    </div>
  );
});

CalendarToolbar.displayName = "CalendarToolbar";
