import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PomodoroPhase = "work" | "break" | "idle";

export interface PomodoroSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  break_minutes: number;
  completed: boolean;
  linked_todo_id: string | null;
  linked_goal_id: string | null;
  linked_step_id: string | null;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export function usePomodoroTimer(workMinutes = 25, breakMinutes = 5) {
  const [phase, setPhase] = useState<PomodoroPhase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = phase === "work" ? workMinutes * 60 : breakMinutes * 60;
  const progress = 1 - secondsLeft / totalSeconds;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTicking = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (phase === "work") {
            setSessionsCompleted((s) => s + 1);
            setPhase("break");
            return breakMinutes * 60;
          } else {
            setPhase("work");
            return workMinutes * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
  }, [phase, workMinutes, breakMinutes, clearTimer]);

  const start = useCallback(() => {
    setPhase("work");
    setSecondsLeft(workMinutes * 60);
    setIsPaused(false);
  }, [workMinutes]);

  const pause = useCallback(() => {
    clearTimer();
    setIsPaused(true);
  }, [clearTimer]);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setPhase("idle");
    setSecondsLeft(workMinutes * 60);
    setIsPaused(false);
  }, [clearTimer, workMinutes]);

  const skip = useCallback(() => {
    clearTimer();
    setIsPaused(false);
    if (phase === "work") {
      setPhase("break");
      setSecondsLeft(breakMinutes * 60);
    } else {
      setPhase("work");
      setSecondsLeft(workMinutes * 60);
    }
  }, [phase, workMinutes, breakMinutes, clearTimer]);

  useEffect(() => {
    if (phase === "idle" || isPaused) {
      clearTimer();
      return;
    }
    startTicking();
    return () => clearTimer();
  }, [phase, isPaused, startTicking, clearTimer]);

  return {
    phase,
    secondsLeft,
    progress,
    sessionsCompleted,
    isPaused,
    start,
    pause,
    resume,
    reset,
    skip,
    isRunning: phase !== "idle",
    isActive: phase !== "idle" && !isPaused,
  };
}

export function usePomodoroSessions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: ["pomodoro-sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as PomodoroSession[];
    },
    enabled: !!user?.id,
  });

  const saveSession = useMutation({
    mutationFn: async (session: {
      duration_minutes: number;
      break_minutes: number;
      completed: boolean;
      linked_goal_id?: string | null;
      linked_todo_id?: string | null;
      started_at: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await (supabase as any)
        .from("pomodoro_sessions")
        .insert({
          ...session,
          user_id: user.id,
          completed_at: session.completed ? new Date().toISOString() : null,
        });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pomodoro-sessions"] }),
  });

  const todayStats = (() => {
    const today = new Date().toISOString().split("T")[0];
    const todaySessions = (sessions.data || []).filter(
      (s) => s.completed && s.completed_at?.startsWith(today)
    );
    return {
      count: todaySessions.length,
      totalMinutes: todaySessions.reduce((acc, s) => acc + s.duration_minutes, 0),
    };
  })();

  // Weekly stats for sparkline
  const weeklyStats = (() => {
    const now = new Date();
    const days: { label: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en", { weekday: "short" });
      const mins = (sessions.data || [])
        .filter((s) => s.completed && s.completed_at?.startsWith(dateStr))
        .reduce((acc, s) => acc + s.duration_minutes, 0);
      days.push({ label: dayLabel, minutes: mins });
    }
    return days;
  })();

  // Streak: consecutive days with at least one completed session
  const streak = (() => {
    const allDates = new Set(
      (sessions.data || [])
        .filter((s) => s.completed && s.completed_at)
        .map((s) => s.completed_at!.split("T")[0])
    );
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (allDates.has(dateStr)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  })();

  // Best session (longest single work duration)
  const bestSession = (() => {
    const completed = (sessions.data || []).filter((s) => s.completed);
    if (completed.length === 0) return 0;
    return Math.max(...completed.map((s) => s.duration_minutes));
  })();

  return { sessions, saveSession, todayStats, weeklyStats, streak, bestSession };
}
