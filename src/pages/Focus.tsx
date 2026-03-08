import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, Pause, RotateCcw, SkipForward, Coffee, Flame, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePomodoroTimer, usePomodoroSessions } from "@/hooks/usePomodoro";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Focus() {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);

  const timer = usePomodoroTimer(workMin, breakMin);
  const { saveSession, todayStats } = usePomodoroSessions();

  const handleStart = () => {
    timer.start();
  };

  const handleReset = () => {
    if (timer.sessionsCompleted > 0) {
      saveSession.mutate({
        duration_minutes: workMin,
        break_minutes: breakMin,
        completed: true,
        started_at: new Date(Date.now() - workMin * 60 * 1000).toISOString(),
      });
    }
    timer.reset();
  };

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - timer.progress);

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col items-center">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 w-full">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Timer className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-black font-orbitron text-foreground tracking-wide">Focus Timer</h1>
        </div>
        <p className="text-sm text-muted-foreground font-mono">Pomodoro technique • Deep work sessions</p>
      </motion.div>

      {/* Timer Circle */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-10"
      >
        <svg width="280" height="280" viewBox="0 0 280 280" className="transform -rotate-90">
          {/* Background circle */}
          <circle cx="140" cy="140" r="120" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" opacity="0.3" />
          {/* Progress circle */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke={timer.phase === "break" ? "hsl(var(--accent))" : "hsl(var(--primary))"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
            style={{
              filter: `drop-shadow(0 0 10px ${timer.phase === "break" ? "hsl(var(--accent) / 0.4)" : "hsl(var(--primary) / 0.4)"})`,
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={timer.phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 mb-2"
            >
              {timer.phase === "work" ? (
                <Flame className="h-4 w-4 text-primary" />
              ) : timer.phase === "break" ? (
                <Coffee className="h-4 w-4 text-accent" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {timer.phase === "idle" ? "Ready" : timer.phase === "work" ? "Focus" : "Break"}
              </span>
            </motion.div>
          </AnimatePresence>

          <p className="text-5xl font-orbitron font-black text-foreground tabular-nums tracking-wider">
            {formatTime(timer.secondsLeft)}
          </p>

          <p className="text-xs font-mono text-muted-foreground mt-3">
            Sessions: <span className="text-primary font-bold">{timer.sessionsCompleted}</span>
          </p>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-10">
        {!timer.isRunning ? (
          <Button onClick={handleStart} size="lg" className="gap-2 font-orbitron text-sm px-8">
            <Play className="h-4 w-4" />
            Start
          </Button>
        ) : (
          <>
            <Button onClick={timer.skip} variant="outline" size="icon" className="h-12 w-12">
              <SkipForward className="h-5 w-5" />
            </Button>
            <Button onClick={handleReset} variant="destructive" size="lg" className="gap-2 font-orbitron text-sm px-8">
              <RotateCcw className="h-4 w-4" />
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Settings (only when idle) */}
      {!timer.isRunning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm space-y-4 mb-10">
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
            <span className="text-sm font-rajdhani text-foreground">Work Duration</span>
            <div className="flex items-center gap-2">
              {[15, 25, 30, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => setWorkMin(m)}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                    workMin === m
                      ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
            <span className="text-sm font-rajdhani text-foreground">Break Duration</span>
            <div className="flex items-center gap-2">
              {[3, 5, 10, 15].map((m) => (
                <button
                  key={m}
                  onClick={() => setBreakMin(m)}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                    breakMin === m
                      ? "bg-accent text-accent-foreground shadow-[0_0_10px_hsl(var(--accent)/0.3)]"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Today Stats */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <div className="p-4 rounded-lg bg-card border border-border/50 text-center">
          <p className="text-2xl font-orbitron font-bold text-primary">{todayStats.count}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">Sessions Today</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border/50 text-center">
          <p className="text-2xl font-orbitron font-bold text-foreground">{todayStats.totalMinutes}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">Minutes Focused</p>
        </div>
      </div>
    </div>
  );
}
