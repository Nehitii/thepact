import { useState, useCallback, useEffect, useMemo } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { CalendarToolbar, type CalendarView } from "./CalendarToolbar";
import { RubanView } from "./views/RubanView";
import { MonthView } from "./views/MonthView";
import { WeekView } from "./views/WeekView";
import { DayView } from "./views/DayView";
import { YearView } from "./views/YearView";
import { EventDetailModal } from "./EventDetailModal";
import { CalendarSearch } from "./CalendarSearch";
import { CalendarSidebar } from "./CalendarSidebar";
import type { CalendarEvent, CalendarEventInsert, CalendarSourceType } from "@/hooks/useCalendarEvents";
import { addDays, differenceInCalendarDays, parseISO, format, getISOWeek, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const ALL_SOURCES = new Set<CalendarSourceType>(["event", "todo", "goal", "step"]);
const VUES: CalendarView[] = ["ruban", "day", "week", "month", "year"];
const CLE_VUE = "vowpact.calendar.vue";

/* La vue de depart est le ruban — c est lui qui dit comment le temps est
   fait, la grille ne dit que ce qu il contient. Mais le choix suivant
   appartient a l utilisateur : on le retient. */
function vueInitiale(): CalendarView {
  try {
    const stockee = localStorage.getItem(CLE_VUE) as CalendarView | null;
    if (stockee && VUES.includes(stockee)) return stockee;
  } catch { /* stockage indisponible : le defaut suffit */ }
  return "ruban";
}

export function CalendarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [viewDate, setViewDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(vueInitiale);
  const [showSearch, setShowSearch] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<Date | undefined>();
  const [activeFilters, setActiveFilters] = useState<Set<CalendarSourceType>>(new Set(ALL_SOURCES));

  useEffect(() => {
    try { localStorage.setItem(CLE_VUE, view); } catch { /* sans consequence */ }
  }, [view]);

  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents(viewDate, view, activeFilters);

  const filteredEvents = useMemo(
    () => events.filter((e) => activeFilters.has(e._source || "event")),
    [events, activeFilters],
  );

  /* Le rail : des coordonnees vraies, pas un decor. */
  const rail = useMemo(() => {
    const s1 = getISOWeek(startOfMonth(viewDate));
    const s2 = getISOWeek(endOfMonth(viewDate));
    const periode = view === "year" ? format(viewDate, "yyyy")
      : view === "day" ? format(viewDate, "yyyy.MM.dd")
      : format(viewDate, "yyyy.MM");
    const semaines = view === "day" ? `SEM ${getISOWeek(viewDate)}`
      : view === "week" ? `SEM ${getISOWeek(viewDate)}`
      : view === "year" ? "SEM 01—52"
      : `SEM ${s1}—${s2}`;
    return { periode, semaines };
  }, [viewDate, view]);

  const handleFilterToggle = useCallback((source: CalendarSourceType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }, []);

  const handleEventClick = useCallback((ev: CalendarEvent) => {
    // Les entrees importees renvoient a leur source, pas a un formulaire.
    if (ev._source === "todo" && ev._sourceId) { navigate("/todo"); return; }
    if (ev._source === "goal" && ev._sourceId) { navigate(`/goals/${ev._sourceId}`); return; }
    if (ev._source === "step" && ev.linked_goal_id) { navigate(`/goals/${ev.linked_goal_id}`); return; }
    setSelectedEvent(ev);
    setQuickAddDate(undefined);
    setModalOpen(true);
  }, [navigate]);

  const handleNewEvent = useCallback(() => {
    setSelectedEvent(null);
    setQuickAddDate(new Date());
    setModalOpen(true);
  }, []);

  const handleCellClick = useCallback((date: Date) => {
    setSelectedEvent(null);
    setQuickAddDate(date);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async (data: Partial<CalendarEventInsert>) => {
    try {
      if (selectedEvent && !selectedEvent._virtual) {
        await updateEvent.mutateAsync({ id: selectedEvent.id, ...data });
        toast.success(t("calendar.eventUpdated", "Event updated"));
      } else {
        await createEvent.mutateAsync(data);
        toast.success(t("calendar.eventCreated", "Event created"));
      }
    } catch {
      toast.error(t("common.error"));
    }
  }, [selectedEvent, updateEvent, createEvent, t]);

  const handleQuickAdd = useCallback(async (data: { title: string; start_time: string; end_time: string; all_day: boolean }) => {
    try {
      await createEvent.mutateAsync(data);
      toast.success(t("calendar.eventCreated", "Event created"));
    } catch {
      toast.error(t("common.error"));
    }
  }, [createEvent, t]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success(t("calendar.eventDeleted", "Event deleted"));
    } catch {
      toast.error(t("common.error"));
    }
  }, [deleteEvent, t]);

  const handleEventMove = useCallback(async (eventId: string, newDate: Date) => {
    const event = events.find((e) => e.id === eventId);
    if (!event || event._source !== "event") return;
    const oldStart = parseISO(event.start_time);
    const oldEnd = parseISO(event.end_time);
    const diff = differenceInCalendarDays(newDate, oldStart);
    if (diff === 0) return;
    try {
      await updateEvent.mutateAsync({
        id: eventId,
        start_time: addDays(oldStart, diff).toISOString(),
        end_time: addDays(oldEnd, diff).toISOString(),
      });
      toast.success(t("calendar.eventMoved", "Event moved"));
    } catch {
      toast.error(t("common.error"));
    }
  }, [events, updateEvent, t]);

  const handleMonthClick = useCallback((month: Date) => {
    setViewDate(month);
    setView("month");
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setViewDate(date);
    setView("day");
  }, []);

  const nomDeVue = t(
    view === "ruban" ? "calendar.viewRuban"
      : view === "day" ? "calendar.viewDay"
      : view === "week" ? "calendar.viewWeek"
      : view === "year" ? "calendar.viewYear"
      : "calendar.viewMonth",
  );

  return (
    <div className="cal max-w-7xl mx-auto">
      <CalendarToolbar
        viewDate={viewDate}
        view={view}
        onViewChange={setView}
        onDateChange={setViewDate}
        onToday={() => setViewDate(new Date())}
        onNewEvent={handleNewEvent}
        onSearchToggle={() => setShowSearch((s) => !s)}
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
      />

      {showSearch && (
        <CalendarSearch
          events={filteredEvents}
          onEventClick={handleEventClick}
          onNavigate={setViewDate}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Le conteneur porte la mesure : « lg » regardait la fenetre, qui
          compte 280 px de navigation que le calendrier n a jamais eus. */}
      <div className="cal-corps">
        <div className="cal-plaque min-w-0">
          <div className="cal-rail">
            <b>CAL.01</b>
            <i />
            <span>{rail.periode}</span>
            <i />
            <span className="cal-rail-facultatif">{rail.semaines}</span>
            <i className="cal-rail-facultatif" />
            <span className="cal-rail-facultatif">{nomDeVue}</span>
            <i className="cal-rail-facultatif" />
            <b>{t("calendar.entries", { count: filteredEvents.length })}</b>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {view === "ruban" && (
                <RubanView
                  viewDate={viewDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onDayClick={handleDayClick}
                />
              )}
              {view === "month" && (
                <MonthView
                  viewDate={viewDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onQuickAdd={handleQuickAdd}
                  onEventMove={handleEventMove}
                  onShowMore={handleDayClick}
                />
              )}
              {view === "week" && (
                <WeekView
                  viewDate={viewDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onCellClick={handleCellClick}
                />
              )}
              {view === "day" && (
                <DayView
                  viewDate={viewDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onCellClick={handleCellClick}
                />
              )}
              {view === "year" && (
                <YearView viewDate={viewDate} events={filteredEvents} onMonthClick={handleMonthClick} />
              )}
            </>
          )}
        </div>

        {/* Elle ne revient que si la grille a de quoi respirer une fois
            ses 208 px preleves — voir calendar.css. */}
        <div className="cal-flanc">
          <CalendarSidebar
            events={filteredEvents}
            viewDate={viewDate}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        </div>
      </div>

      <EventDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        event={selectedEvent}
        defaultDate={quickAddDate}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
