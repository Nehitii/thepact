import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { usePomodoroTimer, usePomodoroSessions } from "@/hooks/usePomodoro";
import { useGoals } from "@/hooks/useGoals";
import { useTodoList } from "@/hooks/useTodoList";
import { usePact } from "@/hooks/usePact";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FocusTimerRing, FocusControls, FocusGoalLinker, FocusStats, FocusHistory } from "@/components/focus";

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
  const linkedName = linkedGoal?.name
    ?? (linkedTodoId ? tasks.find((t) => t.id === linkedTodoId)?.name : null);
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

        <div className="flex flex-col items-center gap-8">
          {/* Goal/Task linker — only when idle */}
          {!timer.isRunning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <FocusGoalLinker
                goals={goals}
                todos={tasks}
                linkedGoalId={linkedGoalId}
                linkedTodoId={linkedTodoId}
                onLinkGoal={setLinkedGoalId}
                onLinkTodo={setLinkedTodoId}
              />
            </motion.div>
          )}

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
            onSkip={() => { play("ui"); timer.skip(); }}
            onEnd={handleEnd}
          />

          {/* Config (idle only) */}
          {!timer.isRunning && (
            <Collapsible className="w-full max-w-sm">
              <CollapsibleTrigger className="flex items-center justify-center gap-2 w-full py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="h-3 w-3" />
                Config
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                <DurationRow
                  label="Work"
                  options={[15, 25, 30, 45]}
                  value={workMin}
                  onChange={setWorkMin}
                  color="primary"
                />
                <DurationRow
                  label="Break"
                  options={[3, 5, 10, 15]}
                  value={breakMin}
                  onChange={setBreakMin}
                  color="accent"
                />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Stats */}
          <FocusStats
            todayCount={todayStats.count}
            todayMinutes={todayStats.totalMinutes}
            streak={streak}
            bestSession={bestSession}
            weeklyData={weeklyStats}
          />

          {/* Session History */}
          <FocusHistory sessions={sessions.data || []} />
        </div>
      </div>
    </div>
  );
}

function DurationRow({ label, options, value, onChange, color }: {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
  color: "primary" | "accent";
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-card/60 backdrop-blur border border-border/50">
      <span className="text-xs font-mono text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {options.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`px-3 py-1 text-[10px] font-mono rounded-md transition-all ${
              value === m
                ? `bg-${color} text-${color}-foreground shadow-[0_0_10px_hsl(var(--${color})/0.3)]`
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>
    </div>
  );
}
