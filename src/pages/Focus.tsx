import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  // Ajout de la pause longue implicite (15 min) dans le hook usePomodoroTimer
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [linkedTodoId, setLinkedTodoId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<FocusPanel>(null);
  const startTimeRef = useRef<string | null>(null);

  const timer = usePomodoroTimer(workMin, breakMin, 15);
  const { saveSession, todayStats, weeklyStats, streak, bestSession, sessions } = usePomodoroSessions();

  // Request Notification Permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Track session completions for sound
  const prevSessionsRef = useRef(timer.sessionsCompleted);
  useEffect(() => {
    if (timer.sessionsCompleted > prevSessionsRef.current) {
      play("success", "reward");
    }
    prevSessionsRef.current = timer.sessionsCompleted;
  }, [timer.sessionsCompleted, play]);

  // Phase transition flash & System Notification
  const [showFlash, setShowFlash] = useState(false);
  const prevPhaseRef = useRef(timer.phase);

  useEffect(() => {
    if (timer.phase !== prevPhaseRef.current && timer.phase !== "idle") {
      setShowFlash(true);
      const timeout = setTimeout(() => setShowFlash(false), 500); // Transition un peu plus douce

      // Envoi d'une notification système pour contourner la veille/changement d'onglet
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("THE PACT // Focus System", {
          body:
            timer.phase === "break"
              ? "Session complète. Phase de récupération activée."
              : "Pause terminée. Retour immédiat à l'objectif.",
          icon: "/favicon.ico",
        });
      }

      prevPhaseRef.current = timer.phase;
      return () => clearTimeout(timeout);
    }
    prevPhaseRef.current = timer.phase;
  }, [timer.phase]);

  const handleStart = () => {
    play("ui");
    startTimeRef.current = new Date().toISOString();
    timer.start();
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
  };

  const linkedGoal = linkedGoalId ? goals.find((g) => g.id === linkedGoalId) : null;
  const linkedName = linkedGoal?.name ?? (linkedTodoId ? tasks.find((t) => t.id === linkedTodoId)?.name : null);
  const linkedImageUrl = linkedGoal?.image_url ?? null;

  const isActive = timer.isRunning;
  const isBreak = timer.phase === "break";

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden"
      animate={{
        backgroundColor: isActive
          ? isBreak
            ? "hsl(var(--accent) / 0.06)"
            : "hsl(var(--primary) / 0.04)"
          : "transparent",
      }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {timer.isRunning && <FocusAmbientEffects progress={timer.progress} isBreak={timer.phase === "break"} />}

      {/* Adoucissement de l'effet Flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              background: `radial-gradient(circle at center, hsl(var(--${timer.phase === "break" ? "accent" : "primary"}) / 0.3) 0%, transparent 80%)`,
            }}
          />
        )}
      </AnimatePresence>

      {timer.isRunning && (
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.15) 2px, hsl(var(--primary) / 0.15) 4px)",
          }}
        />
      )}

      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-16">
        <ModuleHeader title="FOCUS" titleAccent=" MODE" systemLabel="DEEP_WORK // POMODORO" badges={[]} />

        <div className="flex flex-col items-center gap-6">
          {!timer.isRunning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex justify-center"
            >
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

          {/* Seul Spotify a le droit de rester ouvert pendant le timer */}
          <AnimatePresence mode="wait">
            {activePanel && (!timer.isRunning || activePanel === "spotify") && (
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full overflow-hidden flex justify-center z-20 relative"
              >
                {activePanel === "config" && !timer.isRunning && (
                  <FocusConfigPanel
                    workMin={workMin}
                    breakMin={breakMin}
                    onWorkChange={setWorkMin}
                    onBreakChange={setBreakMin}
                  />
                )}
                {activePanel === "spotify" && (
                  <SpotifyPlayer
                    className="w-full max-w-lg shadow-[0_0_20px_rgba(var(--primary),0.1)] rounded-xl"
                    compact={false}
                  />
                )}
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
              </motion.div>
            )}
          </AnimatePresence>

          {timer.isRunning && linkedName && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-mono text-primary/70 tracking-wider text-center max-w-xs truncate"
            >
              ▸ {linkedName}
            </motion.p>
          )}

          <FocusTimerRing
            phase={timer.phase}
            progress={timer.progress}
            secondsLeft={timer.secondsLeft}
            sessionsCompleted={timer.sessionsCompleted}
            isPaused={timer.isPaused}
            goalImageUrl={linkedImageUrl}
            disableHoverControls={isMobile} // Sur Mobile, on bloque le hover capricieux
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onSkip={() => {
              play("ui");
              timer.skip();
            }}
            onEnd={handleEnd}
          />

          {/* Barre de contrôle Fixe pour le Mobile en bas */}
          {isMobile && timer.isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xs mx-auto mt-2 relative z-20"
            >
              <FocusControls
                phase={timer.phase}
                isPaused={timer.isPaused}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onSkip={() => {
                  play("ui");
                  timer.skip();
                }}
                onEnd={handleEnd}
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
