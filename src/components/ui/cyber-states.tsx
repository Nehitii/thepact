import { motion } from "framer-motion";
import { useMemo } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Unified Cyber Loading ──────────────────────────────────
interface CyberLoaderProps {
  /** Number of skeleton rows to show (default 3) */
  rows?: number;
  /** Optional text label */
  label?: string;
  /** Full page or inline */
  fullPage?: boolean;
}

export function CyberLoader({ rows = 3, label, fullPage = false }: CyberLoaderProps) {
  return (
    <div className={fullPage ? "flex min-h-[60vh] items-center justify-center" : "py-12 flex flex-col items-center justify-center gap-4"}>
      <div className="relative">
        {/* Spinner ring */}
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        {/* Inner pulse */}
        <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse" />
      </div>
      {label && (
        <p className="text-xs text-muted-foreground font-mono tracking-wider uppercase animate-pulse">
          {label}
        </p>
      )}
      {rows > 0 && (
        <div className="w-full max-w-md space-y-2 mt-4 px-4">
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className="h-8 rounded bg-muted/40 animate-pulse"
              style={{ width: `${85 - i * 12}%`, animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Unified Cyber Empty State ──────────────────────────────
interface CyberEmptyProps {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function CyberEmpty({ icon: Icon, title = "NO SIGNAL", subtitle = "Nothing here yet", action }: CyberEmptyProps) {
  const dots = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 0.3 + Math.random() * 0.7,
    })),
    []
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4" role="status" aria-label={title}>
      {/* Animated circle with scan lines */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden border border-primary/10">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.05) 2px, hsl(var(--primary) / 0.05) 4px)",
          }}
          aria-hidden="true"
        />
        {Icon ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary/30" />
          </div>
        ) : (
          dots.map((dot, i) => (
            <motion.div
              key={i}
              className="absolute w-[2px] h-[2px] rounded-full bg-primary/40"
              style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: dot.duration, repeat: Infinity, delay: dot.delay }}
            />
          ))
        )}
      </div>

      {/* Title */}
      <motion.h3
        className="font-orbitron text-sm tracking-[0.2em] uppercase text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {title}
      </motion.h3>

      {/* Subtitle */}
      <p className="text-xs text-muted-foreground/60 font-mono max-w-xs text-center">
        {subtitle}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          aria-hidden="true"
        >
          _
        </motion.span>
      </p>

      {/* Action button */}
      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm" className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
