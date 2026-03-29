import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addWeeks, addMonths, addYears,
  isBefore, isAfter, isSameDay, parseISO,
  startOfDay, endOfDay,
} from "date-fns";

// ─── Types ───────────────────────────────────────────────────
export interface RecurrenceRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  byDay?: string[]; // MO, TU, WE …
  bySetPos?: number[]; // e.g. [2] = 2nd occurrence
  count?: number;
  until?: string; // ISO date
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  color: string;
  category: string;
  recurrence_rule: RecurrenceRule | null;
  recurrence_parent_id: string | null;
  recurrence_exception: boolean;
  reminders: { type: string; minutes_before: number }[];
  is_busy: boolean;
  linked_goal_id: string | null;
  linked_todo_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Virtual fields for expanded recurrences
  _virtual?: boolean;
  _originalStart?: string;
}

export type CalendarEventInsert = Omit<CalendarEvent, "id" | "user_id" | "created_at" | "updated_at" | "_virtual" | "_originalStart">;

// ─── Recurrence expansion ───────────────────────────────────
const DAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function expandRecurrences(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  const rule = event.recurrence_rule;
  if (!rule) return [event];

  const results: CalendarEvent[] = [];
  const eventStart = parseISO(event.start_time);
  const eventEnd = parseISO(event.end_time);
  const duration = eventEnd.getTime() - eventStart.getTime();
  const interval = rule.interval || 1;
  const until = rule.until ? parseISO(rule.until) : null;
  const maxCount = rule.count || 365;
  let count = 0;

  const advanceFn = rule.freq === "daily" ? addDays
    : rule.freq === "weekly" ? addWeeks
    : rule.freq === "monthly" ? addMonths
    : addYears;

  let cursor = new Date(eventStart);
  while (count < maxCount) {
    if (until && isAfter(cursor, until)) break;
    if (isAfter(cursor, rangeEnd)) break;

    const occEnd = new Date(cursor.getTime() + duration);
    if (!isBefore(occEnd, rangeStart)) {
      // byDay filter for weekly
      if (rule.freq === "weekly" && rule.byDay && rule.byDay.length > 0) {
        const dayOfWeek = cursor.getDay();
        const dayNames = Object.entries(DAY_MAP);
        const dayName = dayNames.find(([, v]) => v === dayOfWeek)?.[0];
        if (dayName && rule.byDay.includes(dayName)) {
          results.push(makeVirtualOccurrence(event, cursor, occEnd, count));
        }
      } else {
        results.push(makeVirtualOccurrence(event, cursor, occEnd, count));
      }
    }
    count++;
    cursor = advanceFn(eventStart, interval * count);
  }

  return results;
}

function makeVirtualOccurrence(event: CalendarEvent, start: Date, end: Date, idx: number): CalendarEvent {
  if (idx === 0) return event; // first occurrence is the original
  return {
    ...event,
    id: `${event.id}_r${idx}`,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    _virtual: true,
    _originalStart: event.start_time,
  };
}

// ─── Hook ───────────────────────────────────────────────────
export function useCalendarEvents(viewDate: Date, view: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Compute range based on view
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === "year") {
      const y = viewDate.getFullYear();
      return { rangeStart: new Date(y, 0, 1), rangeEnd: new Date(y, 11, 31, 23, 59, 59) };
    }
    if (view === "day") {
      return { rangeStart: startOfDay(viewDate), rangeEnd: endOfDay(viewDate) };
    }
    if (view === "week") {
      const ws = startOfWeek(viewDate, { weekStartsOn: 1 });
      return { rangeStart: ws, rangeEnd: endOfWeek(viewDate, { weekStartsOn: 1 }) };
    }
    // month (default) — include surrounding weeks
    const ms = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
    const me = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
    return { rangeStart: ms, rangeEnd: me };
  }, [viewDate, view]);

  const query = useQuery({
    queryKey: ["calendar-events", user?.id, rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .gte("start_time", rangeStart.toISOString())
        .lte("start_time", rangeEnd.toISOString())
        .order("start_time");
      if (error) throw error;
      return (data ?? []) as unknown as CalendarEvent[];
    },
    enabled: !!user,
  });

  // Also fetch recurring events that started before range but may have occurrences in range
  const recurringQuery = useQuery({
    queryKey: ["calendar-recurring", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .not("recurrence_rule", "is", null)
        .lt("start_time", rangeStart.toISOString())
        .order("start_time");
      if (error) throw error;
      return (data ?? []) as unknown as CalendarEvent[];
    },
    enabled: !!user,
  });

  // Expand all events with recurrences
  const events = useMemo(() => {
    const base = query.data ?? [];
    const recurring = recurringQuery.data ?? [];
    const all = [...base, ...recurring];
    const expanded: CalendarEvent[] = [];
    const seen = new Set<string>();
    for (const ev of all) {
      if (seen.has(ev.id)) continue;
      seen.add(ev.id);
      if (ev.recurrence_rule) {
        expanded.push(...expandRecurrences(ev, rangeStart, rangeEnd));
      } else {
        expanded.push(ev);
      }
    }
    return expanded;
  }, [query.data, recurringQuery.data, rangeStart, rangeEnd]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("calendar-events-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_events" }, () => {
        qc.invalidateQueries({ queryKey: ["calendar-events"] });
        qc.invalidateQueries({ queryKey: ["calendar-recurring"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  // Mutations
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["calendar-events"] });
    qc.invalidateQueries({ queryKey: ["calendar-recurring"] });
  };

  const createEvent = useMutation({
    mutationFn: async (ev: Partial<CalendarEventInsert>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({ ...ev, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CalendarEventInsert>) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    events,
    isLoading: query.isLoading || recurringQuery.isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    rangeStart,
    rangeEnd,
  };
}
