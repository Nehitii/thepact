import { motion } from "framer-motion";
import { useMemo } from "react";

interface SignalLostEmptyProps {
  subtitle?: string;
}

export function SignalLostEmpty({ subtitle = "Check back later" }: SignalLostEmptyProps) {
  // Generate static dots positions once
  const dots = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 0.3 + Math.random() * 0.7,
    })),
    []
  );

  return (
    <div className="relative flex flex-col items-center justify-center py-16 gap-4">
      {/* Static circle */}
      <div className="relative w-24 h-24 rounded-full overflow-hidden border border-primary/10">
        {/* Scan lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.05) 2px, hsl(var(--primary) / 0.05) 4px)",
          }}
        />
        {/* Flickering dots */}
        {dots.map((dot, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-[2px] rounded-full bg-primary/40"
            style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: dot.duration,
              repeat: Infinity,
              delay: dot.delay,
            }}
          />
        ))}
      </div>

      {/* Text */}
      <motion.h3
        className="font-orbitron text-sm tracking-[0.3em] uppercase text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        NO SIGNAL
      </motion.h3>
      <p className="text-xs text-muted-foreground/60 font-mono">
        {subtitle}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          _
        </motion.span>
      </p>
    </div>
  );
}
