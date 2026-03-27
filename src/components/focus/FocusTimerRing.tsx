import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, Square, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PomodoroPhase } from "@/hooks/usePomodoro";

interface FocusTimerRingProps {
  phase: PomodoroPhase;
  progress: number;
  secondsLeft: number;
  sessionsCompleted: number;
  isPaused: boolean;
  goalImageUrl?: string | null;
  disableHoverControls?: boolean;
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
  phase,
  progress,
  secondsLeft,
  sessionsCompleted,
  isPaused,
  goalImageUrl,
  disableHoverControls = false,
  onStart,
  onPause,
  onResume,
  onSkip,
  onEnd,
}: FocusTimerRingProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [jitter, setJitter] = useState("000");

  const isWork = phase === "work";
  const isBreak = phase === "break";
  const isIdle = phase === "idle";
  const showControls = hovered && !isIdle && !disableHoverControls;

  const colorHsl = isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))";

  useEffect(() => {
    if (isIdle || isPaused) {
      setJitter("000");
      return;
    }
    const interval = setInterval(() => {
      setJitter(
        Math.floor(Math.random() * 999)
          .toString()
          .padStart(3, "0"),
      );
    }, 200);
    return () => clearInterval(interval);
  }, [isIdle, isPaused]);

  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="relative inline-flex items-center justify-center mb-4 p-4 border border-primary/20 bg-black/40"
      style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)" }}
      onMouseMove={(event) => {
        if (disableHoverControls) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
        setHovered(distance <= 130);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {goalImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <div
              className="w-[280px] h-[280px] opacity-50"
              style={{
                clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                filter: `drop-shadow(0 0 15px ${colorHsl})`,
              }}
            >
              <img src={goalImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-4 pointer-events-none z-10" aria-hidden="true">
        {/* Tactical Brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 transition-colors duration-1000" style={{ borderColor: colorHsl }} />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 transition-colors duration-1000" style={{ borderColor: colorHsl }} />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 transition-colors duration-1000" style={{ borderColor: colorHsl }} />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 transition-colors duration-1000" style={{ borderColor: colorHsl }} />

        <div className="absolute left-0 top-10 bottom-10 flex items-center justify-center w-6">
          <span className="text-[7px] font-mono tracking-[0.2em] uppercase whitespace-nowrap -rotate-90" style={{ color: colorHsl }}>
            UPLINK: SECURE // B-R: {sessionsCompleted % 4}/{4}
          </span>
        </div>
        <div className="absolute right-0 top-10 bottom-10 flex items-center justify-center w-6">
          <span className="text-[7px] font-mono tracking-[0.2em] uppercase whitespace-nowrap rotate-90" style={{ color: colorHsl }}>
            VITAL_SYNC: Nominal // N-SYNC {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      <svg
        width="320"
        height="320"
        viewBox="0 0 320 320"
        className="transform -rotate-90 relative z-10"
        style={!isIdle && !isPaused ? { animation: "spin 60s linear infinite", willChange: "transform" } : undefined}
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <circle cx="160" cy="160" r={radius} fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="1" />
        <circle
          cx="160"
          cy="160"
          r={radius}
          fill="none"
          stroke={colorHsl}
          strokeWidth="6"
          strokeLinecap="square"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 ${isIdle ? 4 : 10}px ${colorHsl})` }}
        />
        <motion.circle
          cx="160"
          cy="160"
          r={radius - 16}
          fill="none"
          stroke={colorHsl}
          strokeWidth="3"
          strokeDasharray="1 10"
          opacity={isIdle ? 0.2 : 0.6}
          animate={!isIdle && !isPaused ? { strokeDashoffset: -100 } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </svg>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {isIdle && (hovered || disableHoverControls) && onStart ? (
            <motion.button
              key="start-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={onStart}
              className="group relative flex flex-col items-center justify-center w-32 h-32 bg-primary/10 border border-primary/40 hover:bg-primary/20 hover:border-primary hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
              style={{ clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" }}
            >
              <Target className="h-8 w-8 text-primary group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
              <span className="mt-2 text-[9px] font-mono uppercase tracking-[0.3em] text-primary">{t("focus.initSync")}</span>
            </motion.button>
          ) : showControls ? (
            <motion.div
              key="controls"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex gap-2">
                <button
                  onClick={isPaused ? onResume : onPause}
                  className="w-16 h-12 bg-primary/15 border border-primary/40 flex items-center justify-center hover:bg-primary/30 hover:border-primary transition-all focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}
                >
                  {isPaused ? <Play className="h-5 w-5 text-primary ml-1" /> : <Pause className="h-5 w-5 text-primary" />}
                </button>
                <button
                  onClick={onSkip}
                  className="w-16 h-12 bg-muted/20 border border-muted-foreground/40 flex items-center justify-center hover:bg-muted/40 hover:border-muted-foreground transition-all focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                >
                  <SkipForward className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <button
                onClick={onEnd}
                className="w-[136px] h-8 bg-destructive/20 border border-destructive/50 flex items-center justify-center hover:bg-destructive/40 hover:border-destructive transition-all gap-2 focus-visible:ring-2 focus-visible:ring-primary"
                style={{ clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%, 0 10px)" }}
              >
                <Square className="h-3 w-3 text-destructive" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-destructive uppercase">
                  {t("focus.terminate")}
                </span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="timer-data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full relative pt-4 pb-2 bg-black/40"
              style={{
                clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)",
              }}
            >
              <motion.div
                className="mb-1 border border-current bg-background px-2 py-0.5"
                style={{ color: colorHsl, clipPath: "polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)" }}
              >
                <span className="text-[9px] font-mono uppercase tracking-[0.2em]">
                  {isIdle
                    ? t("focus.ring.standby")
                    : isPaused
                      ? t("focus.ring.halted")
                      : isWork
                        ? t("focus.ring.focused")
                        : t("focus.ring.cooling")}
                </span>
              </motion.div>

              <div className="relative flex items-end justify-center">
                <motion.p
                  className="text-6xl font-orbitron font-black tabular-nums tracking-widest text-foreground"
                  style={{ textShadow: !isIdle ? `0 0 20px ${colorHsl}` : "none" }}
                  animate={isPaused ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                  transition={isPaused ? { repeat: Infinity, duration: 2 } : {}}
                >
                  {formatTime(secondsLeft)}
                </motion.p>
                <span
                  className="absolute -right-9 bottom-3 text-lg font-mono font-bold tracking-tighter opacity-70"
                  style={{ color: colorHsl }}
                  aria-hidden="true"
                >
                  :{jitter}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
