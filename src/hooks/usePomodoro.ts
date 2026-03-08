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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = phase === "work" ? workMinutes * 60 : breakMinutes * 60;
  const progress = 1 - secondsLeft / totalSeconds;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setPhase("work");
    setSecondsLeft(workMinutes * 60);
  }, [workMinutes]);

  const pause = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    // Timer effect will pick up from current state
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setPhase("idle");
    setSecondsLeft(workMinutes * 60);
  }, [clearTimer, workMinutes]);

  const skip = useCallback(() => {
    clearTimer();
    if (phase === "work") {
      setPhase("break");
      setSecondsLeft(breakMinutes * 60);
    } else {
      setPhase("work");
      setSecondsLeft(workMinutes * 60);
    }
  }, [phase, workMinutes, breakMinutes, clearTimer]);

  useEffect(() => {
    if (phase === "idle") return;

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

    return () => clearTimer();
  }, [phase, workMinutes, breakMinutes, clearTimer]);

  return {
    phase,
    secondsLeft,
    progress,
    sessionsCompleted,
    start,
    pause,
    resume,
    reset,
    skip,
    isRunning: phase !== "idle",
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

  return { sessions, saveSession, todayStats };
}
