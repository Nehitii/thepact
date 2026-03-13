import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, Minimize } from "lucide-react";
import { usePomodoroTimer, usePomodoroSessions } from "@/hooks/usePomodoro";
import { useGoals } from "@/hooks/useGoals";
import { useTodoList } from "@/hooks/useTodoList";
import { usePact } from "@/hooks/usePact";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import {
  FocusTimerRing,
  FocusStats,
  FocusHistory,
  SpotifyPlayer,
  FocusToolbar,
  FocusConfigPanel,
  FocusAmbientEffects,
  FocusControls,
  type FocusPanel,
} from "@/components/focus";

export default function Focus() {
  const { user } = useAuth();
  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const { tasks } = useTodoList();
  const { play } = useSound();
  const isMobile = useIsMobile();

  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [linkedTodoId, setLinkedTodoId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<FocusPanel>(null);
  const startTimeRef = useRef<string | null>(null);

  const timer = usePomodoroTimer(workMin, breakMin, 15);
  const { saveSession, todayStats, weeklyStats, streak, bestSession, sessions } = usePomodoroSessions();

  // ── Fullscreen Protocol ──
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch { /* browser blocked */ }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch { /* ignored */ }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // ── Notifications ──
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Session completion sound ──
  const prevSessionsRef = useRef(timer.sessionsCompleted);
  useEffect(() => {
    if (timer.sessionsCompleted > prevSessionsRef.current) {
      play("success", "reward");
    }
    prevSessionsRef.current = timer.sessionsCompleted;
  }, [timer.sessionsCompleted, play]);

  // ── Phase-change flash + notification ──
  const [showFlash, setShowFlash] = useState(false);
  const prevPhaseRef = useRef(timer.phase);

  useEffect(() => {
    if (timer.phase !== prevPhaseRef.current && timer.phase !== "idle") {
      setShowFlash(true);
      const timeout = setTimeout(() => setShowFlash(false), 500);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("THE PACT // Focus System", {
          body:
            timer.phase === "break"
              ? "Phase cible atteinte. Initier récupération."
              : "Pause terminée. Reprise du protocole.",
          icon: "/favicon.ico",
        });
      }

      prevPhaseRef.current = timer.phase;
      return () => clearTimeout(timeout);
    }
    prevPhaseRef.current = timer.phase;
  }, [timer.phase]);

  // ── Handlers ──
  const handleStart = () => {
    play("ui");
    startTimeRef.current = new Date().toISOString();
    timer.start();
    enterFullscreen();
  };

  const handlePause = () => {
    play("ui");
    timer.pause();
  };

  const handleResume = () => {
    play("ui");
    timer.resume();
  };

  const handleEnd = () => {
    play("ui");
    if (timer.sessionsCompleted > 0 || timer.phase === "work") {
      saveSession.mutate({
        duration_minutes: workMin,
        break_minutes: breakMin,
        completed: timer.sessionsCompleted > 0,
        linked_goal_id: linkedGoalId,
        linked_todo_id: linkedTodoId,
        started_at: startTimeRef.current || new Date().toISOString(),
      });
    }
    timer.reset();
    startTimeRef.current = null;
    exitFullscreen();
  };

  const handleSkip = useCallback(() => {
    play("ui");
    timer.skip();
  }, [play, timer]);

  // ── Terminal Overrides (Keyboard shortcuts) ──
  useEffect(() => {
    if (!timer.isRunning) return;

    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (timer.isPaused) handleResume();
        else handlePause();
      } else if (e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSkip();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleEnd();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [timer.isRunning, timer.isPaused, handleSkip]);

  // ── Derived state ──
  const linkedGoal = linkedGoalId ? goals.find((g) => g.id === linkedGoalId) : null;
  const linkedName = linkedGoal?.name ?? (linkedTodoId ? tasks.find((t) => t.id === linkedTodoId)?.name : null);
  const linkedImageUrl = linkedGoal?.image_url ?? null;

  const isBreak = timer.phase === "break";
  const frameColor = timer.isRunning ? (isBreak ? "border-accent/40" : "border-primary/40") : "border-border/30";
  const textColor = timer.isRunning ? (isBreak ? "text-accent/40" : "text-primary/40") : "text-muted-foreground/30";

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden bg-[#050508]"
      animate={{
        backgroundColor: timer.isRunning
          ? isBreak
            ? "rgba(var(--accent-rgb), 0.03)"
            : "rgba(var(--primary-rgb), 0.03)"
          : "#050508",
      }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {timer.isRunning && (
        <FocusAmbientEffects progress={timer.progress} isBreak={isBreak} />
      )}

      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: `radial-gradient(circle at center, hsl(var(--${isBreak ? "accent" : "primary"}) / 0.4) 0%, transparent 80%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-4 pointer-events-none z-0 border border-transparent">
        {/* Corner Brackets */}
        <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 transition-colors duration-1000 ${frameColor}`} />
        <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 transition-colors duration-1000 ${frameColor}`} />
        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 transition-colors duration-1000 ${frameColor}`} />
        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 transition-colors duration-1000 ${frameColor}`} />

        {/* Fullscreen toggle — top-right, inside brackets */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-1 right-10 pointer-events-auto w-7 h-7 flex items-center justify-center bg-transparent border border-primary/20 hover:border-primary/60 hover:bg-primary/10 transition-all duration-200 text-primary/40 hover:text-primary z-10"
          style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
          title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
        </button>

        {/* CORRECTION : Vertical Data Streams avec Flexbox */}
        {!isMobile && (
          <>
            <div className="absolute left-1 top-12 bottom-12 flex items-center justify-center w-6">
              <span
                className={`text-[8px] font-mono tracking-[0.3em] uppercase whitespace-nowrap -rotate-90 transition-colors duration-1000 ${textColor}`}
              >
                Uplink :: Secure // Latency 12ms // Protocol {isBreak ? "B-RK" : "F-CS"}
              </span>
            </div>
            <div className="absolute right-1 top-12 bottom-12 flex items-center justify-center w-6">
              <span
                className={`text-[8px] font-mono tracking-[0.3em] uppercase whitespace-nowrap rotate-90 transition-colors duration-1000 ${textColor}`}
              >
                Vitals :: Nominal // Neural Sync {Math.round(timer.progress * 100)}%
              </span>
            </div>
          </>
        )}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-20 pt-6">
        <ModuleHeader title="FOCUS" titleAccent="_CORE" systemLabel="DEEP_WORK // POMODORO" badges={[]} />

        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="h-6 flex items-center justify-center">
            <AnimatePresence>
              {timer.isRunning && linkedName && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-primary/30"
                  style={{ clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)" }}
                >
                  <span className="text-[9px] font-mono text-primary/60 uppercase tracking-widest">Target:</span>
                  <span className="text-[10px] font-mono text-primary font-bold tracking-wider truncate max-w-[200px] uppercase">
                    {linkedName}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <FocusTimerRing
            phase={timer.phase}
            progress={timer.progress}
            secondsLeft={timer.secondsLeft}
            sessionsCompleted={timer.sessionsCompleted}
            isPaused={timer.isPaused}
            goalImageUrl={linkedImageUrl}
            disableHoverControls={isMobile}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onSkip={handleSkip}
            onEnd={handleEnd}
          />

          {!timer.isRunning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex justify-center mt-4">
              <FocusToolbar
                goals={goals}
                todos={tasks}
                linkedGoalId={linkedGoalId}
                linkedTodoId={linkedTodoId}
                onLinkGoal={setLinkedGoalId}
                onLinkTodo={setLinkedTodoId}
                activePanel={activePanel}
                onPanelChange={setActivePanel}
              />
            </motion.div>
          )}

          {timer.isRunning && isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[280px] mx-auto mt-4 z-20 relative"
            >
              <FocusControls
                phase={timer.phase}
                isPaused={timer.isPaused}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onSkip={handleSkip}
                onEnd={handleEnd}
              />
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activePanel && (!timer.isRunning || activePanel === "spotify") && (
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full flex justify-center z-20 relative mt-4"
              >
                <div
                  className="w-full max-w-lg relative bg-[#0a0a0c] border border-primary/20 p-2"
                  style={{
                    clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3 border-b border-primary/20 pb-2">
                    <div className="w-1 h-3 bg-primary" />
                    <span className="text-[10px] font-mono text-primary uppercase tracking-[0.2em]">
                      {" >> "}{" "}
                      {activePanel === "spotify" ? "AUDIO_LINK_ESTABLISHED" : `${activePanel.toUpperCase()}_SYS`}
                    </span>
                  </div>

                  <div className="bg-black/40 backdrop-blur-md p-1">
                    {activePanel === "config" && !timer.isRunning && (
                      <FocusConfigPanel
                        workMin={workMin}
                        breakMin={breakMin}
                        onWorkChange={setWorkMin}
                        onBreakChange={setBreakMin}
                      />
                    )}
                    {activePanel === "spotify" && <SpotifyPlayer className="w-full compact-player" compact={false} />}
                    {activePanel === "stats" && !timer.isRunning && (
                      <FocusStats
                        todayCount={todayStats.count}
                        todayMinutes={todayStats.totalMinutes}
                        streak={streak}
                        bestSession={bestSession}
                        weeklyData={weeklyStats}
                      />
                    )}
                    {activePanel === "history" && !timer.isRunning && <FocusHistory sessions={sessions.data || []} />}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
