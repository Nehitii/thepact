import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Coffee, Clock, Play, Pause, SkipForward, Square } from "lucide-react";
import { RotatingRing } from "@/components/journal/JournalDecorations";
import type { PomodoroPhase } from "@/hooks/usePomodoro";

interface FocusTimerRingProps {
  phase: PomodoroPhase;
  progress: number;
  secondsLeft: number;
  sessionsCompleted: number;
  isPaused: boolean;
  goalImageUrl?: string | null;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onSkip?: () => void;
  onEnd?: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function FocusTimerRing({
  phase, progress, secondsLeft, sessionsCompleted, isPaused, goalImageUrl,
  onStart, onPause, onResume, onSkip, onEnd,
}: FocusTimerRingProps) {
  const [hovered, setHovered] = useState(false);
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference * (1 - progress);
  const isWork = phase === "work";
  const isBreak = phase === "break";
  const isIdle = phase === "idle";
  const showControls = hovered && !isIdle;

  return (
    <div className="relative inline-flex items-center justify-center mb-8">
      {/* Hover detection zone - smaller, centered, above SVG */}
      <div
        className="absolute z-10 w-[280px] h-[280px] rounded-full"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
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
              className="w-[260px] h-[260px] rounded-full overflow-hidden opacity-[0.35] dark:opacity-[0.4]"
              style={{
                maskImage: "radial-gradient(circle, black 40%, transparent 75%)",
                WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 75%)",
              }}
            >
              <img src={goalImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer decorative rotating rings with breathing animation */}
      <motion.div
        className="absolute -inset-16 pointer-events-none hidden dark:block"
        animate={!isIdle ? {
          scale: [1, 1.02, 1],
          opacity: [1, 0.85, 1],
        } : {}}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <RotatingRing size={400} color="hsl(var(--primary))" duration={30} dasharray="2 16" opacity={0.15} />
      </motion.div>
      <motion.div
        className="absolute -inset-10 pointer-events-none hidden dark:block"
        animate={!isIdle ? {
          scale: [1, 0.98, 1],
          opacity: [1, 0.7, 1],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <RotatingRing size={360} color="hsl(var(--accent))" duration={22} reverse dasharray="4 10" opacity={0.1} />
      </motion.div>

      {/* SVG rings */}
      <svg width="320" height="320" viewBox="0 0 320 320" className="transform -rotate-90">
        <circle cx="160" cy="160" r="140" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" opacity="0.2" />
        <circle
          cx="160" cy="160" r="126" fill="none"
          stroke={isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
          strokeWidth="1" strokeDasharray="3 8"
          opacity={isIdle ? 0.1 : 0.25} className="transition-opacity duration-500"
        />
        <circle
          cx="160" cy="160" r="140" fill="none"
          stroke={isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
          strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 ${isIdle ? 4 : 12 + progress * 12}px ${isBreak ? "hsl(var(--accent) / 0.5)" : "hsl(var(--primary) / 0.5)"})` }}
        />
        <circle
          cx="160" cy="160" r="152" fill="none"
          stroke={isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
          strokeWidth="1" strokeDasharray="1 6"
          opacity={isIdle ? 0.08 : 0.2}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* IDLE + HOVER → Play button */}
          {isIdle && hovered && onStart ? (
            <motion.button
              key="start-hover"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2 }}
              onClick={onStart}
              className="flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center group-hover:bg-primary/25 group-hover:border-primary/60 transition-all group-hover:shadow-[0_0_25px_hsl(var(--primary)/0.3)]">
                <Play className="h-7 w-7 text-primary ml-1" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary/70 group-hover:text-primary transition-colors">
                Start
              </span>
            </motion.button>

          /* RUNNING/PAUSED + HOVER → Control buttons */
          ) : showControls ? (
            <motion.div
              key="controls-hover"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="w-14 h-14 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center hover:bg-primary/25 hover:border-primary/60 transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                  title="Resume"
                >
                  <Play className="h-6 w-6 text-primary ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="w-14 h-14 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center hover:bg-primary/25 hover:border-primary/60 transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                  title="Pause"
                >
                  <Pause className="h-6 w-6 text-primary" />
                </button>
              )}

              <button
                onClick={onSkip}
                className="w-11 h-11 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center hover:bg-muted/50 hover:border-border transition-all"
                title="Skip phase"
              >
                <SkipForward className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={onEnd}
                className="w-11 h-11 rounded-full bg-destructive/15 border border-destructive/40 flex items-center justify-center hover:bg-destructive/25 hover:border-destructive/60 transition-all hover:shadow-[0_0_20px_hsl(var(--destructive)/0.3)]"
                title="End session"
              >
                <Square className="h-4 w-4 text-destructive" />
              </button>
            </motion.div>

          /* DEFAULT → Timer display */
          ) : (
            <motion.div
              key="timer-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
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

              <p className="text-[10px] font-mono text-muted-foreground mt-3 tracking-wider">
                SESSIONS: <span className="text-primary font-bold">{sessionsCompleted}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
