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

export function usePomodoroTimer(workMinutes = 25, breakMinutes = 5, longBreakMinutes = 15) {
  const [phase, setPhase] = useState<PomodoroPhase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [currentTotalSeconds, setCurrentTotalSeconds] = useState(workMinutes * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = 1 - secondsLeft / currentTotalSeconds;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTicking = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      if (!endTimeRef.current) return;

      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        setPhase((currentPhase) => {
          if (currentPhase === "work") {
            setSessionsCompleted((s) => {
              const newCount = s + 1;
              // Pause longue tous les 4 cycles
              const isLongBreak = newCount > 0 && newCount % 4 === 0;
              const breakSecs = (isLongBreak ? longBreakMinutes : breakMinutes) * 60;
              setCurrentTotalSeconds(breakSecs);
              endTimeRef.current = Date.now() + breakSecs * 1000;
              return newCount;
            });
            return "break";
          } else {
            const workSecs = workMinutes * 60;
            setCurrentTotalSeconds(workSecs);
            endTimeRef.current = Date.now() + workSecs * 1000;
            return "work";
          }
        });
      }
    }, 1000);
  }, [workMinutes, breakMinutes, longBreakMinutes, clearTimer]);

  const start = useCallback(() => {
    const workSecs = workMinutes * 60;
    setPhase("work");
    setCurrentTotalSeconds(workSecs);
    setSecondsLeft(workSecs);
    endTimeRef.current = Date.now() + workSecs * 1000;
    setIsPaused(false);
  }, [workMinutes]);

  const pause = useCallback(() => {
    clearTimer();
    endTimeRef.current = null;
    setIsPaused(true);
  }, [clearTimer]);

  const resume = useCallback(() => {
    endTimeRef.current = Date.now() + secondsLeft * 1000;
    setIsPaused(false);
  }, [secondsLeft]);

  const reset = useCallback(() => {
    clearTimer();
    setPhase("idle");
    const workSecs = workMinutes * 60;
    setCurrentTotalSeconds(workSecs);
    setSecondsLeft(workSecs);
    endTimeRef.current = null;
    setIsPaused(false);
  }, [clearTimer, workMinutes]);

  const skip = useCallback(() => {
    clearTimer();
    setIsPaused(false);
    if (phase === "work") {
      setPhase("break");
      const isLongBreak = (sessionsCompleted + 1) % 4 === 0;
      const breakSecs = (isLongBreak ? longBreakMinutes : breakMinutes) * 60;
      setCurrentTotalSeconds(breakSecs);
      setSecondsLeft(breakSecs);
      endTimeRef.current = Date.now() + breakSecs * 1000;
    } else {
      setPhase("work");
      const workSecs = workMinutes * 60;
      setCurrentTotalSeconds(workSecs);
      setSecondsLeft(workSecs);
      endTimeRef.current = Date.now() + workSecs * 1000;
    }
  }, [phase, sessionsCompleted, workMinutes, breakMinutes, longBreakMinutes, clearTimer]);

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

// ... (La suite du fichier: export function usePomodoroSessions() reste inchangée)
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
      const { error } = await (supabase as any).from("pomodoro_sessions").insert({
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
    const todaySessions = (sessions.data || []).filter((s) => s.completed && s.completed_at?.startsWith(today));
    return {
      count: todaySessions.length,
      totalMinutes: todaySessions.reduce((acc, s) => acc + s.duration_minutes, 0),
    };
  })();

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

  const streak = (() => {
    const allDates = new Set(
      (sessions.data || []).filter((s) => s.completed && s.completed_at).map((s) => s.completed_at!.split("T")[0]),
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

  const bestSession = (() => {
    const completed = (sessions.data || []).filter((s) => s.completed);
    if (completed.length === 0) return 0;
    return Math.max(...completed.map((s) => s.duration_minutes));
  })();

  return { sessions, saveSession, todayStats, weeklyStats, streak, bestSession };
}
