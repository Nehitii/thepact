import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePomodoroTimer, usePomodoroSessions } from "@/hooks/usePomodoro";
import { useGoals } from "@/hooks/useGoals";
import { useTodoList } from "@/hooks/useTodoList";
import { usePact } from "@/hooks/usePact";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import {
  FocusTimerRing,
  FocusStats,
  FocusHistory,
  SpotifyPlayer,
  FocusToolbar,
  FocusConfigPanel,
  type FocusPanel,
} from "@/components/focus";

export default function Focus() {
  const { user } = useAuth();
  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const { tasks } = useTodoList();
  const { play } = useSound();

  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [linkedTodoId, setLinkedTodoId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<FocusPanel>(null);
  const startTimeRef = useRef<string | null>(null);

  const timer = usePomodoroTimer(workMin, breakMin);
  const { saveSession, todayStats, weeklyStats, streak, bestSession, sessions } = usePomodoroSessions();

  // Track session completions for sound
  const prevSessionsRef = useRef(timer.sessionsCompleted);
  useEffect(() => {
    if (timer.sessionsCompleted > prevSessionsRef.current) {
      play("success", "reward");
    }
    prevSessionsRef.current = timer.sessionsCompleted;
  }, [timer.sessionsCompleted, play]);

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

  // Find linked item for display during session
  const linkedGoal = linkedGoalId ? goals.find((g) => g.id === linkedGoalId) : null;
  const linkedName = linkedGoal?.name ?? (linkedTodoId ? tasks.find((t) => t.id === linkedTodoId)?.name : null);
  const linkedImageUrl = linkedGoal?.image_url ?? null;

  return (
    <div className="min-h-screen relative">
      {/* Ambient scan lines during active session */}
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
        {/* Module Header */}
        <ModuleHeader
          title="FOCUS"
          titleAccent=" MODE"
          systemLabel="DEEP_WORK // POMODORO"
          badges={[]}
        />

        <div className="flex flex-col items-center gap-6">
          {/* Toolbar — hidden when running */}
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

          {/* Expandable Panel Area — hidden when running */}
          <AnimatePresence mode="wait">
            {!timer.isRunning && activePanel && (
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full overflow-hidden flex justify-center"
              >
                {activePanel === "config" && (
                  <FocusConfigPanel
                    workMin={workMin}
                    breakMin={breakMin}
                    onWorkChange={setWorkMin}
                    onBreakChange={setBreakMin}
                  />
                )}
                {activePanel === "spotify" && (
                  <SpotifyPlayer className="w-full max-w-lg" compact={false} />
                )}
                {activePanel === "stats" && (
                  <FocusStats
                    todayCount={todayStats.count}
                    todayMinutes={todayStats.totalMinutes}
                    streak={streak}
                    bestSession={bestSession}
                    weeklyData={weeklyStats}
                  />
                )}
                {activePanel === "history" && (
                  <FocusHistory sessions={sessions.data || []} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Linked item name during session */}
          {timer.isRunning && linkedName && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-mono text-primary/70 tracking-wider text-center max-w-xs truncate"
            >
              ▸ {linkedName}
            </motion.p>
          )}

          {/* Timer Ring (all controls integrated on hover) */}
          <FocusTimerRing
            phase={timer.phase}
            progress={timer.progress}
            secondsLeft={timer.secondsLeft}
            sessionsCompleted={timer.sessionsCompleted}
            isPaused={timer.isPaused}
            goalImageUrl={linkedImageUrl}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onSkip={() => {
              play("ui");
              timer.skip();
            }}
            onEnd={handleEnd}
          />
        </div>
      </div>
    </div>
  );
}
