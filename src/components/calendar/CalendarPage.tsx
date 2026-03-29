import { useState, useCallback } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { CalendarToolbar, type CalendarView } from "./CalendarToolbar";
import { MonthView } from "./views/MonthView";
import { WeekView } from "./views/WeekView";
import { DayView } from "./views/DayView";
import { YearView } from "./views/YearView";
import { AgendaView } from "./views/AgendaView";
import { EventDetailModal } from "./EventDetailModal";
import { CalendarSearch } from "./CalendarSearch";
import type { CalendarEvent, CalendarEventInsert } from "@/hooks/useCalendarEvents";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

export function CalendarPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [viewDate, setViewDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(isMobile ? "agenda" : "month");
  const [showSearch, setShowSearch] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<Date | undefined>();

  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents(viewDate, view);

  const handleEventClick = useCallback((ev: CalendarEvent) => {
    setSelectedEvent(ev);
    setQuickAddDate(undefined);
    setModalOpen(true);
  }, []);

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
    if (!event) return;
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
      />

      {showSearch && (
        <CalendarSearch
          events={events}
          onEventClick={handleEventClick}
          onClose={() => setShowSearch(false)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {view === "month" && (
            <MonthView
              viewDate={viewDate}
              events={events}
              onEventClick={handleEventClick}
              onQuickAdd={handleQuickAdd}
              onEventMove={handleEventMove}
            />
          )}
          {view === "week" && (
            <WeekView
              viewDate={viewDate}
              events={events}
              onEventClick={handleEventClick}
              onCellClick={handleCellClick}
            />
          )}
          {view === "day" && (
            <DayView
              viewDate={viewDate}
              events={events}
              onEventClick={handleEventClick}
              onCellClick={handleCellClick}
            />
          )}
          {view === "year" && (
            <YearView viewDate={viewDate} events={events} onMonthClick={handleMonthClick} />
          )}
          {view === "agenda" && (
            <AgendaView events={events} onEventClick={handleEventClick} />
          )}
        </>
      )}

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
