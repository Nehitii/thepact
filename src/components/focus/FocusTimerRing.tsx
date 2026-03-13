import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, Square } from "lucide-react";
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
  const [hovered, setHovered] = useState(false);
  const [jitter, setJitter] = useState("00");

  const isWork = phase === "work";
  const isBreak = phase === "break";
  const isIdle = phase === "idle";
  const showControls = hovered && !isIdle && !disableHoverControls;

  const colorVar = isBreak ? "var(--accent)" : "var(--primary)";
  const colorHsl = isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))";

  // Effet Jitter (millisecondes défilantes)
  useEffect(() => {
    if (isIdle || isPaused) {
      setJitter("00");
      return;
    }
    const interval = setInterval(() => {
      setJitter(
        Math.floor(Math.random() * 99)
          .toString()
          .padStart(2, "0"),
      );
    }, 50);
    return () => clearInterval(interval);
  }, [isIdle, isPaused]);

  // Constantes SVG
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="relative inline-flex items-center justify-center mb-4"
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
      {/* Objectif d'arrière plan */}
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
              className="w-[260px] h-[260px] opacity-[0.25]"
              style={{
                clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                maskImage: "radial-gradient(circle, black 40%, transparent 80%)",
                WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 80%)",
              }}
            >
              <img src={goalImageUrl} alt="" className="w-full h-full object-cover mix-blend-luminosity" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Réticule de visée tactique (HUD Crosshairs) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Lignes cardinales */}
        <div className="absolute w-[360px] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute h-[360px] w-[1px] bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

        {/* Repères angulaires extérieurs */}
        <svg width="340" height="340" className="absolute" style={{ transform: "rotate(45deg)" }}>
          {[0, 90, 180, 270].map((deg) => (
            <path
              key={deg}
              d="M 170 10 L 170 30 M 160 20 L 180 20"
              stroke={colorHsl}
              strokeWidth="2"
              opacity="0.4"
              transform={`rotate(${deg} 170 170)`}
            />
          ))}
        </svg>
      </div>

      {/* Anneaux du réacteur (SVG) */}
      <motion.svg
        width="320"
        height="320"
        viewBox="0 0 320 320"
        className="transform -rotate-90 relative z-10"
        animate={!isIdle && !isPaused ? { rotate: -90 + 360 } : {}}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {/* Anneau de fond */}
        <circle
          cx="160"
          cy="160"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/20"
          strokeWidth="1"
        />

        {/* Anneau de progression principal (Épais, brille) */}
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

        {/* Anneau interne hachuré (Rotation inverse) */}
        <motion.circle
          cx="160"
          cy="160"
          r={radius - 16}
          fill="none"
          stroke={colorHsl}
          strokeWidth="2"
          strokeDasharray="4 8"
          opacity={isIdle ? 0.2 : 0.6}
          animate={!isIdle && !isPaused ? { strokeDashoffset: -100 } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        {/* Anneau de précision (pointillés denses) */}
        <circle
          cx="160"
          cy="160"
          r={radius + 12}
          fill="none"
          stroke={colorHsl}
          strokeWidth="1"
          strokeDasharray="1 4"
          opacity={isIdle ? 0.1 : 0.3}
        />
      </motion.svg>

      {/* Contenu Central (Données système) */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* ETAT IDLE : Bouton d'amorçage */}
          {isIdle && (hovered || disableHoverControls) && onStart ? (
            <motion.button
              key="start-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={onStart}
              className="group relative flex flex-col items-center justify-center w-28 h-28 bg-primary/10 border border-primary/40 hover:bg-primary/20 hover:border-primary hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-all cursor-pointer"
              style={{ clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary),0.1)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none" />
              <Play className="h-8 w-8 text-primary ml-1 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
              <span className="mt-2 text-[9px] font-mono uppercase tracking-[0.3em] text-primary">Init</span>
            </motion.button>
          ) : showControls ? (
            /* ETAT HOVER : Commandes tactiques */
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
                  className="w-16 h-12 bg-primary/15 border border-primary/40 flex items-center justify-center hover:bg-primary/30 hover:border-primary transition-all"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}
                >
                  {isPaused ? <Play className="h-5 w-5 text-primary" /> : <Pause className="h-5 w-5 text-primary" />}
                </button>
                <button
                  onClick={onSkip}
                  className="w-16 h-12 bg-muted/20 border border-muted-foreground/40 flex items-center justify-center hover:bg-muted/40 hover:border-muted-foreground transition-all"
                  style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                >
                  <SkipForward className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <button
                onClick={onEnd}
                className="w-[136px] h-8 bg-destructive/20 border border-destructive/50 flex items-center justify-center hover:bg-destructive/40 hover:border-destructive transition-all gap-2"
                style={{ clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%, 0 10px)" }}
              >
                <Square className="h-3 w-3 text-destructive" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-destructive uppercase">
                  Abort
                </span>
              </button>
            </motion.div>
          ) : (
            /* ETAT ACTIF : Données HUD */
            <motion.div
              key="timer-data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full relative"
            >
              {/* Statut Système */}
              <motion.div
                className="mb-1 border border-current bg-background/50 px-2 py-0.5"
                style={{ color: colorHsl }}
              >
                <span className="text-[9px] font-mono uppercase tracking-[0.2em]">
                  {isIdle
                    ? "[ SYS :: STANDBY ]"
                    : isPaused
                      ? "[ SYS :: HALTED ]"
                      : isWork
                        ? "[ SYS :: DEEP_SYNC ]"
                        : "[ SYS :: COOLING ]"}
                </span>
              </motion.div>

              {/* Chronomètre principal */}
              <div className="relative flex items-end">
                <motion.p
                  className="text-6xl font-orbitron font-black tabular-nums tracking-widest"
                  style={{ color: colorHsl, textShadow: !isIdle ? `0 0 20px ${colorHsl}` : "none" }}
                  animate={isPaused ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                  transition={isPaused ? { repeat: Infinity, duration: 2 } : {}}
                >
                  {formatTime(secondsLeft)}
                </motion.p>
                {/* Jitter des millisecondes */}
                <span
                  className="absolute -right-7 bottom-2 text-sm font-mono font-bold tracking-tighter opacity-70"
                  style={{ color: colorHsl }}
                >
                  {jitter}
                </span>
              </div>

              {/* Data Tracker inférieur */}
              <div
                className="mt-2 flex items-center gap-4 text-[10px] font-mono opacity-80"
                style={{ color: colorHsl }}
              >
                <span>
                  SEQ: {sessionsCompleted % 4}/{4}
                </span>
                <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                <span>TOTAL: {sessionsCompleted}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
