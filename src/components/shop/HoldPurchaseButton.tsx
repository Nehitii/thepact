import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface HoldPurchaseButtonProps {
  onComplete: () => void;
  disabled?: boolean;
  isPending?: boolean;
  className?: string;
  holdDuration?: number; // ms
}

type ButtonPhase = "idle" | "holding" | "authorizing" | "acquired";

const HOLD_MS = 1500;

export function HoldPurchaseButton({
  onComplete,
  disabled = false,
  isPending = false,
  className,
  holdDuration = HOLD_MS,
}: HoldPurchaseButtonProps) {
  const [phase, setPhase] = useState<ButtonPhase>(isPending ? "authorizing" : "idle");
  const progress = useMotionValue(0);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const completedRef = useRef(false);

  // Sync isPending from outside
  useEffect(() => {
    if (isPending && phase !== "acquired") setPhase("authorizing");
  }, [isPending, phase]);

  const progressPercent = useTransform(progress, [0, 1], [0, 100]);

  const shakeX = useTransform(progress, (v) => {
    if (v < 0.7) return 0;
    const intensity = (v - 0.7) / 0.3; // 0→1 in last 30%
    return Math.sin(v * 80) * intensity * 3;
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
        return "HOLD";
      case "authorizing":
        return "AUTHORIZING...";
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
        "relative w-full h-12 rounded-lg overflow-hidden select-none",
        "border-2 font-orbitron text-sm tracking-wider uppercase",
        "transition-colors duration-200",
        disabled
          ? "border-muted-foreground/30 text-muted-foreground cursor-not-allowed opacity-50"
          : phase === "authorizing"
            ? "border-primary/60 text-primary cursor-wait"
            : "border-primary/40 text-primary hover:border-primary/60 cursor-pointer",
        className
      )}
    >
      {/* Background fill */}
      <motion.div
        className="absolute inset-0 bg-primary/20"
        style={{ width: useTransform(progressPercent, (v) => `${v}%`) }}
      />

      {/* Neon glow on holding */}
      {phase === "holding" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ boxShadow: ["inset 0 0 10px hsl(var(--primary)/.2)", "inset 0 0 25px hsl(var(--primary)/.4)"] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        />
      )}

      {/* Label */}
      <span className="relative z-10 flex items-center justify-center gap-2 h-full">
        {disabled && <Lock className="w-4 h-4" />}
        {phase === "authorizing" && (
          <motion.span
            animate={{ opacity: [1, 0.4] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          >
            ◈
          </motion.span>
        )}
        {label}
      </span>
    </motion.button>
  );
}
