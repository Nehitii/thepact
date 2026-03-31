import { useState, useCallback, useMemo } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { CalendarToolbar, type CalendarView } from "./CalendarToolbar";
import { MonthView } from "./views/MonthView";
import { WeekView } from "./views/WeekView";
import { DayView } from "./views/DayView";
import { YearView } from "./views/YearView";
import { AgendaView } from "./views/AgendaView";
import { EventDetailModal } from "./EventDetailModal";
import { CalendarSearch } from "./CalendarSearch";
import { CalendarSidebar } from "./CalendarSidebar";
import type { CalendarEvent, CalendarEventInsert, CalendarSourceType } from "@/hooks/useCalendarEvents";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const ALL_SOURCES = new Set<CalendarSourceType>(["event", "todo", "goal", "step"]);

export function CalendarPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [viewDate, setViewDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(isMobile ? "agenda" : "month");
  const [showSearch, setShowSearch] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<Date | undefined>();
  const [activeFilters, setActiveFilters] = useState<Set<CalendarSourceType>>(new Set(ALL_SOURCES));

  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents(viewDate, view, activeFilters);

  // Filter events by active sources
  const filteredEvents = useMemo(() =>
    events.filter(e => activeFilters.has(e._source || "event")),
    [events, activeFilters]
  );

  const handleFilterToggle = useCallback((source: CalendarSourceType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }, []);

  const handleEventClick = useCallback((ev: CalendarEvent) => {
    // External events: navigate to their source
    if (ev._source === "todo" && ev._sourceId) {
      navigate("/todo");
      return;
    }
    if (ev._source === "goal" && ev._sourceId) {
      navigate(`/goals/${ev._sourceId}`);
      return;
    }
    if (ev._source === "step" && ev.linked_goal_id) {
      navigate(`/goals/${ev.linked_goal_id}`);
      return;
    }
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

  return (
    <div className="max-w-7xl mx-auto">
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
          onClose={() => setShowSearch(false)}
        />
      )}

      <div className={cn("flex gap-4", !isMobile && "flex-row")}>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {view === "month" && (
                <MonthView
                  viewDate={viewDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onQuickAdd={handleQuickAdd}
                  onEventMove={handleEventMove}
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
              {view === "agenda" && (
                <AgendaView events={filteredEvents} onEventClick={handleEventClick} />
              )}
            </>
          )}
        </div>

        {/* Sidebar - desktop only */}
        {!isMobile && (
          <div className="w-64 shrink-0 hidden lg:block">
            <CalendarSidebar events={filteredEvents} onDayClick={handleDayClick} />
          </div>
        )}
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

