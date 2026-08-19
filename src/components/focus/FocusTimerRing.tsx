import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PomodoroPhase } from "@/hooks/usePomodoro";

interface FocusTimerRingProps {
  phase: PomodoroPhase;
  progress: number;
  secondsLeft: number;
  isPaused: boolean;
  goalImageUrl?: string | null;
  onStart?: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/* L anneau ne montre plus qu une chose a la fois, et toujours la bonne :
   le bouton de depart au repos, le temps restant pendant une session.
   Les commandes vivent sous l anneau, jamais a sa place.

   Elles n apparaissaient qu au survol, a moins de 130 px du centre. Cela
   coutait trois choses d un coup : au clavier on ne pouvait ni suspendre
   ni arreter puisque les boutons n existaient pas dans le DOM ; sur
   tablette tactile il n y a pas de survol du tout ; et approcher la
   souris — le geste le plus naturel pour agir — effacait le compte a
   rebours, la seule information que cette page existe pour montrer. */
export function FocusTimerRing({
  phase,
  progress,
  secondsLeft,
  isPaused,
  goalImageUrl,
  onStart,
}: FocusTimerRingProps) {
  const { t } = useTranslation();
  const mouvementReduit = useReducedMotion();

  const isWork = phase === "work";
  const isBreak = phase === "break";
  const isIdle = phase === "idle";

  const colorHsl = isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))";

  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="relative inline-flex items-center justify-center mb-2 sm:mb-4 p-4 border border-primary/20 bg-black/40"
      style={{
        // Le SVG etait fige a 320 px : sous 360 px de fenetre, il debordait
        // des deux cotes, et la coque de page portant overflow:hidden, il
        // etait rogne sans meme ouvrir un defilement.
        ["--anneau" as string]: "min(320px, 78vw)",
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
      }}
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
              className="opacity-50"
              style={{
                width: "calc(var(--anneau) * 0.875)",
                height: "calc(var(--anneau) * 0.875)",
                clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                filter: `drop-shadow(0 0 15px ${colorHsl})`,
              }}
            >
              <img src={goalImageUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactical Brackets */}
      <div className="absolute inset-4 pointer-events-none z-10" aria-hidden="true">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 transition-colors duration-1000" style={{ borderColor: colorHsl }} />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 transition-colors duration-1000" style={{ borderColor: colorHsl }} />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 transition-colors duration-1000" style={{ borderColor: colorHsl }} />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 transition-colors duration-1000" style={{ borderColor: colorHsl }} />
      </div>

      <svg
        viewBox="0 0 320 320"
        className={`transform -rotate-90 relative z-10 block${
          !isIdle && !isPaused ? " focus-anneau--tourne" : ""
        }`}
        style={{ width: "var(--anneau)", height: "var(--anneau)" }}
        role="progressbar"
        aria-label={t("focus.ring.progress")}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={
          isIdle
            ? t("focus.ring.notStarted")
            : t("focus.ring.remaining", { time: formatTime(secondsLeft) })
        }
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
          animate={!isIdle && !isPaused && !mouvementReduit ? { strokeDashoffset: -100 } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </svg>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {isIdle && onStart ? (
            <motion.button
              key="start-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={onStart}
              aria-label={t("focus.initSync")}
              className="group relative flex flex-col items-center justify-center w-32 h-32 bg-primary/10 border border-primary/40 hover:bg-primary/20 hover:border-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
              style={{ clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" }}
            >
              <Target className="h-8 w-8 text-primary group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
              <span className="mt-2 ds-t-label font-mono uppercase tracking-[0.3em] text-primary">{t("focus.initSync")}</span>
            </motion.button>
          ) : !isIdle ? (
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
                <span className="ds-t-label font-mono uppercase tracking-[0.2em]">
                  {isPaused
                    ? t("focus.ring.halted")
                    : isWork
                      ? t("focus.ring.focused")
                      : t("focus.ring.cooling")}
                </span>
              </motion.div>

              <div className="relative flex items-end justify-center">
                <motion.p
                  className="text-6xl font-orbitron font-black tabular-nums tracking-widest text-foreground"
                  style={{ textShadow: `0 0 20px ${colorHsl}` }}
                  animate={
                    isPaused
                      ? mouvementReduit
                        ? { opacity: 0.55 }
                        : { opacity: [1, 0.3, 1] }
                      : { opacity: 1 }
                  }
                  transition={isPaused && !mouvementReduit ? { repeat: Infinity, duration: 2 } : {}}
                >
                  {formatTime(secondsLeft)}
                </motion.p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
