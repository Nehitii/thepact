import { memo, useMemo, useState } from "react";
import {
  format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, addYears, subYears,
  startOfWeek, endOfWeek, isSameMonth, isSameWeek, isSameYear, isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Search, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/socle/outils/utils";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { Popover, PopoverContent, PopoverTrigger } from "@/socle/ui/popover";
import { Calendar } from "@/socle/ui/calendar";
import { SourceFilterChips } from "./SourceFilterChips";
import type { CalendarSourceType } from "@/domaines/agenda/types";

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

  /* LE TITRE DISAIT AUTRE CHOSE DANS CHAQUE VUE
     Le jour donnait une phrase en toutes lettres, la semaine un mois
     abrege qui ne nommait meme pas la semaine, le mois un mois entier.
     Ils suivent maintenant la meme grammaire, du plus large au plus
     precis — et c est la seule chose qui change entre eux. */
  const titre = useMemo(() => {
    if (view === "year") return format(viewDate, "yyyy");
    if (view === "day") return format(viewDate, "EEE d MMMM yyyy", { locale });
    if (view === "week") {
      const d = startOfWeek(viewDate, { weekStartsOn: 1 });
      const f = endOfWeek(viewDate, { weekStartsOn: 1 });
      return isSameMonth(d, f)
        ? `${format(d, "d")} — ${format(f, "d MMMM yyyy", { locale })}`
        : `${format(d, "d MMM", { locale })} — ${format(f, "d MMM yyyy", { locale })}`;
    }
    return format(viewDate, "MMMM yyyy", { locale });
  }, [viewDate, view, locale]);

  /* « Aujourd hui » restait offert alors qu on y etait deja : un bouton
     qui ne fait rien est le pire des trois etats. */
  const dejaAujourdHui = useMemo(() => {
    const maintenant = new Date();
    if (view === "day") return isToday(viewDate);
    if (view === "week") return isSameWeek(viewDate, maintenant, { weekStartsOn: 1 });
    if (view === "year") return isSameYear(viewDate, maintenant);
    return isSameMonth(viewDate, maintenant);
  }, [viewDate, view]);

  return (
    <div className="cal-barre">
      <div className="cal-barre-haut">
        {/* Gauche : la navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="cal-outil est-icone"
            aria-label={t("calendar.prevPeriod", "Previous {{period}}", { period: periode.toLowerCase() })}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={datePickerOpen}
                /* Pas d aria-label ici : il remplacerait le titre visible
                   par un texte qui ne le contient pas, et le nom annonce
                   ne correspondrait plus au libelle. */
                className="cal-periode"
              >
                {titre}
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

          <button
            type="button"
            onClick={() => navigate(1)}
            className="cal-outil est-icone"
            aria-label={t("calendar.nextPeriod", "Next {{period}}", { period: periode.toLowerCase() })}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* aria-disabled plutot que disabled : un bouton desactive sort de
              l ordre de tabulation, et l utilisateur au clavier perd a la
              fois l action ET l explication de son absence. */}
          <button
            type="button"
            onClick={() => { if (!dejaAujourdHui) onToday(); }}
            aria-disabled={dejaAujourdHui}
            className={cn("cal-outil ml-1", dejaAujourdHui && "est-inerte")}
            title={dejaAujourdHui ? t("calendar.alreadyToday", "You are already there") : undefined}
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {t("calendar.today", "Today")}
          </button>
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
              className="cal-vue"
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Droite : les actions */}
        <div className="flex items-center gap-1.5">
          {onSearchToggle && (
            <button
              type="button"
              onClick={onSearchToggle}
              className="cal-outil est-icone"
              aria-label={t("calendar.search", "Search events")}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={onNewEvent} className="cal-outil est-primaire">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("calendar.newEvent", "Event")}
          </button>
        </div>
      </div>

      <SourceFilterChips active={activeFilters} onToggle={onFilterToggle} />
    </div>
  );
});

CalendarToolbar.displayName = "CalendarToolbar";
