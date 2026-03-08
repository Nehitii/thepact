import { motion, AnimatePresence } from "framer-motion";
import { Flame, Coffee, Clock } from "lucide-react";
import { RotatingRing } from "@/components/journal/JournalDecorations";
import type { PomodoroPhase } from "@/hooks/usePomodoro";

interface FocusTimerRingProps {
  phase: PomodoroPhase;
  progress: number;
  secondsLeft: number;
  sessionsCompleted: number;
  isPaused: boolean;
  goalImageUrl?: string | null;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function FocusTimerRing({ phase, progress, secondsLeft, sessionsCompleted, isPaused, goalImageUrl }: FocusTimerRingProps) {
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);
  const isWork = phase === "work";
  const isBreak = phase === "break";
  const isIdle = phase === "idle";

  return (
    <div className="relative inline-flex items-center justify-center mb-8">
      {/* Goal image background circle */}
      <AnimatePresence>
        {goalImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className="w-[220px] h-[220px] rounded-full overflow-hidden opacity-[0.25] dark:opacity-[0.3]"
              style={{
                maskImage: "radial-gradient(circle, black 40%, transparent 75%)",
                WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 75%)",
              }}
            >
              <img
                src={goalImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Outer decorative rotating rings */}
      <div className="absolute -inset-12 pointer-events-none hidden dark:block">
        <RotatingRing size={340} color="hsl(var(--primary))" duration={30} dasharray="2 16" opacity={0.15} />
      </div>
      <div className="absolute -inset-6 pointer-events-none hidden dark:block">
        <RotatingRing size={300} color="hsl(var(--accent))" duration={22} reverse dasharray="4 10" opacity={0.1} />
      </div>

      {/* SVG rings */}
      <svg width="280" height="280" viewBox="0 0 280 280" className="transform -rotate-90">
        {/* Background ring */}
        <circle cx="140" cy="140" r="120" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" opacity="0.2" />

        {/* Inner decorative dashed ring */}
        <circle
          cx="140" cy="140" r="108"
          fill="none"
          stroke={isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
          strokeWidth="1"
          strokeDasharray="3 8"
          opacity={isIdle ? 0.1 : 0.25}
          className="transition-opacity duration-500"
        />

        {/* Progress ring */}
        <circle
          cx="140" cy="140" r="120"
          fill="none"
          stroke={isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
          style={{
            filter: `drop-shadow(0 0 ${isIdle ? 4 : 12 + progress * 12}px ${isBreak ? "hsl(var(--accent) / 0.5)" : "hsl(var(--primary) / 0.5)"})`,
          }}
        />

        {/* Outer decorative ring */}
        <circle
          cx="140" cy="140" r="130"
          fill="none"
          stroke={isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
          strokeWidth="1"
          strokeDasharray="1 6"
          opacity={isIdle ? 0.08 : 0.2}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Phase icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase + String(isPaused)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 mb-2"
          >
            {isWork ? (
              <Flame className="h-4 w-4 text-primary" />
            ) : isBreak ? (
              <Coffee className="h-4 w-4 text-accent" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              {isIdle ? "Ready" : isPaused ? "Paused" : isWork ? "Focus" : "Break"}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Timer */}
        <motion.p
          className="text-5xl font-orbitron font-black text-foreground tabular-nums tracking-wider"
          style={{
            textShadow: !isIdle ? `0 0 20px ${isBreak ? "hsl(var(--accent) / 0.3)" : "hsl(var(--primary) / 0.3)"}` : undefined,
          }}
          animate={isPaused ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
          transition={isPaused ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
        >
          {formatTime(secondsLeft)}
        </motion.p>

        {/* Sessions counter */}
        <p className="text-[10px] font-mono text-muted-foreground mt-3 tracking-wider">
          SESSIONS: <span className="text-primary font-bold">{sessionsCompleted}</span>
        </p>
      </div>
    </div>
  );
}
