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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, advancePhase, cycleIndex]);

  const reset = () => {
    setRunning(false);
    setCycleIndex(0);
    setSecondsLeft(CYCLE[0].duration);
    setCompletedCycles(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const phaseLabel = t(`health.breathing.${currentPhase.phase}`);
  const circleScale = currentPhase.phase === "inhale" ? 1.4 : currentPhase.phase === "exhale" ? 0.8 : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-teal-500" />
            {t("health.breathing.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-8 space-y-6">
          {/* Breathing circle */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <motion.div
              animate={{ scale: running ? circleScale : 1 }}
              transition={{ duration: currentPhase.duration, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border-2 border-teal-500/40"
            />
            <motion.div
              animate={{ scale: running ? circleScale * 0.7 : 0.7 }}
              transition={{ duration: currentPhase.duration, ease: "easeInOut" }}
              className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-teal-500/30 to-emerald-500/30"
            />
            <div className="relative z-10 text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentPhase.phase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-lg font-semibold text-foreground"
                >
                  {running ? phaseLabel : t("health.breathing.ready")}
                </motion.p>
              </AnimatePresence>
              <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                {running ? secondsLeft : "—"}
              </p>
            </div>
          </div>

          {/* Cycle counter */}
          <p className="text-sm text-muted-foreground">
            {t("health.breathing.cycles")}: {completedCycles}
          </p>

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={reset}
              className="border-muted"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setRunning(!running)}
              className={cn(
                "px-8",
                running
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-teal-600 hover:bg-teal-700",
                "text-white"
              )}
            >
              {running ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {running ? t("health.breathing.pause") : t("health.breathing.start")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
            {t("health.breathing.hint")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
