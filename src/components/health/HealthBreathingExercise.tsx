import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wind, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface HealthBreathingExerciseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Phase = "inhale" | "hold" | "exhale" | "rest";

const CYCLE = [
  { phase: "inhale" as Phase, duration: 4 },
  { phase: "hold" as Phase, duration: 4 },
  { phase: "exhale" as Phase, duration: 4 },
  { phase: "rest" as Phase, duration: 2 },
];

export function HealthBreathingExercise({ open, onOpenChange }: HealthBreathingExerciseProps) {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(CYCLE[0].duration);
  const [completedCycles, setCompletedCycles] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = CYCLE[cycleIndex];

  const advancePhase = useCallback(() => {
    const nextIndex = (cycleIndex + 1) % CYCLE.length;
    if (nextIndex === 0) setCompletedCycles((c) => c + 1);
    setCycleIndex(nextIndex);
    setSecondsLeft(CYCLE[nextIndex].duration);
  }, [cycleIndex]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          advancePhase();
          return CYCLE[(cycleIndex + 1) % CYCLE.length].duration;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, advancePhase, cycleIndex]);

  const reset = () => {
    setRunning(false);
    setCycleIndex(0);
    setSecondsLeft(CYCLE[0].duration);
    setCompletedCycles(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => { if (!open) reset(); }, [open]);

  const phaseLabel = t(`health.breathing.${currentPhase.phase}`);
  const circleScale = currentPhase.phase === "inhale" ? 1.4 : currentPhase.phase === "exhale" ? 0.8 : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover border-hud-phosphor/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-hud-phosphor" />
            {t("health.breathing.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-8 space-y-6">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <motion.div
              animate={{ scale: running ? circleScale : 1 }}
              transition={{ duration: currentPhase.duration, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-2 border-hud-phosphor/40"
              style={{ background: "radial-gradient(circle, hsl(var(--hud-phosphor) / 0.15) 0%, transparent 70%)" }}
            />
            <motion.div
              animate={{ scale: running ? circleScale * 0.7 : 0.7 }}
              transition={{ duration: currentPhase.duration, ease: "easeInOut" }}
              className="absolute w-32 h-32 rounded-full"
              style={{ background: "radial-gradient(circle, hsl(var(--hud-phosphor) / 0.25) 0%, transparent 70%)" }}
            />
            <div className="relative z-10 text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentPhase.phase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-lg font-semibold text-foreground font-mono uppercase tracking-wider"
                >
                  {running ? phaseLabel : t("health.breathing.ready")}
                </motion.p>
              </AnimatePresence>
              <p className="text-3xl font-bold text-hud-phosphor mt-1 font-orbitron">
                {running ? secondsLeft : "—"}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground font-mono">
            {t("health.breathing.cycles")}: <span className="font-orbitron text-hud-phosphor">{completedCycles}</span>
          </p>

          <div className="flex gap-3">
            <Button variant="outline" size="icon" onClick={reset} className="border-muted">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setRunning(!running)}
              className={cn("px-8 font-mono",
                running ? "bg-hud-amber/20 border border-hud-amber/40 text-hud-amber hover:bg-hud-amber/30"
                  : "bg-hud-phosphor/20 border border-hud-phosphor/40 text-hud-phosphor hover:bg-hud-phosphor/30"
              )}
            >
              {running ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {running ? t("health.breathing.pause") : t("health.breathing.start")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center max-w-xs font-mono">
            {t("health.breathing.hint")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
