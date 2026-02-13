import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface HoldPurchaseButtonProps {
  onComplete: () => void;
  disabled?: boolean;
  isPending?: boolean;
  className?: string;
  holdDuration?: number; // ms
}

type ButtonPhase = "idle" | "holding" | "authorizing" | "acquired";

const DEFAULT_HOLD_MS = 1500;

export function HoldPurchaseButton({
  onComplete,
  disabled = false,
  isPending = false,
  className,
  holdDuration = DEFAULT_HOLD_MS,
}: HoldPurchaseButtonProps) {
  const [phase, setPhase] = useState<ButtonPhase>(isPending ? "authorizing" : "idle");
  const progress = useMotionValue(0);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const completedRef = useRef(false);

  // Sync isPending state
  useEffect(() => {
    if (isPending && phase !== "acquired") setPhase("authorizing");
    if (!isPending && phase === "authorizing") setPhase("idle");
  }, [isPending, phase]);

  const progressPercent = useTransform(progress, [0, 1], [0, 100]);

  // Shake effect when nearing completion
  const shakeX = useTransform(progress, (v) => {
    if (v < 0.7) return 0;
    const intensity = (v - 0.7) / 0.3;
    return Math.sin(v * 50) * intensity * 4;
  });

  const startHold = useCallback(() => {
    if (disabled || phase === "authorizing" || phase === "acquired") return;
    completedRef.current = false;
    setPhase("holding");

    animRef.current = animate(progress, 1, {
      duration: holdDuration / 1000,
      ease: "linear",
      onComplete: () => {
        if (!completedRef.current) {
          completedRef.current = true;
          setPhase("authorizing");
          onComplete();
        }
      },
    });
  }, [disabled, phase, holdDuration, onComplete, progress]);

  const cancelHold = useCallback(() => {
    if (completedRef.current || phase === "authorizing" || phase === "acquired") return;
    animRef.current?.stop();
    animate(progress, 0, { duration: 0.25, ease: "easeOut" });
    setPhase("idle");
  }, [phase, progress]);

  const label = (() => {
    switch (phase) {
      case "holding":
        return "HOLD...";
      case "authorizing":
        return "AUTHORIZING";
      case "acquired":
        return "ACQUIRED";
      default:
        return "HOLD TO BUY";
    }
  })();

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      style={{ x: shakeX }}
      className={cn(
        "relative w-full h-11 rounded-lg overflow-hidden select-none",
        "border font-orbitron text-sm tracking-wider uppercase",
        "transition-colors duration-200 flex items-center justify-center",
        disabled
          ? "border-muted-foreground/20 text-muted-foreground/50 cursor-not-allowed bg-muted/10"
          : phase === "authorizing"
            ? "border-primary/50 text-primary bg-primary/10 cursor-wait"
            : "border-primary/40 text-primary hover:border-primary/80 hover:bg-primary/5 cursor-pointer",
        className,
      )}
    >
      {/* Background Progress Fill */}
      <motion.div
        className="absolute inset-0 bg-primary/20 origin-left"
        style={{ width: useTransform(progressPercent, (v) => `${v}%`) }}
      />

      {/* Glow Effect while holding */}
      {phase === "holding" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ boxShadow: "inset 0 0 15px hsl(var(--primary)/0.4)" }}
        />
      )}

      {/* Text Label */}
      <span className="relative z-10 flex items-center gap-2">
        {disabled && <Lock className="w-3 h-3" />}
        {phase === "authorizing" && <Loader2 className="w-3 h-3 animate-spin" />}
        {label}
      </span>
    </motion.button>
  );
}
