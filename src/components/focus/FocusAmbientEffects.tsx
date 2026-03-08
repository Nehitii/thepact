import { motion } from "framer-motion";
import { useProfileSettings } from "@/hooks/useProfileSettings";

interface FocusAmbientEffectsProps {
  progress: number;
  isBreak?: boolean;
}

export function FocusAmbientEffects({ progress, isBreak = false }: FocusAmbientEffectsProps) {
  const { profile } = useProfileSettings();
  const particlesEnabled = profile?.particles_enabled ?? true;
  const color = isBreak ? "var(--accent)" : "var(--primary)";

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Pulsing vignette */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, hsl(${color} / 0.08) 70%, hsl(${color} / 0.15) 100%)`,
        }}
      />

      {/* Floating particles */}
      {particlesEnabled && (
        <div className="absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <FloatingParticle
              key={i}
              index={i}
              color={color}
              intensity={0.5 + progress * 0.5}
            />
          ))}
        </div>
      )}

      {/* Glow aura behind timer (centered) */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        animate={{
          opacity: [0.1 + progress * 0.15, 0.2 + progress * 0.2, 0.1 + progress * 0.15],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: `radial-gradient(circle, hsl(${color} / 0.2) 0%, hsl(${color} / 0.05) 40%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
    </div>
  );
}

function FloatingParticle({
  index,
  color,
  intensity,
}: {
  index: number;
  color: string;
  intensity: number;
}) {
  const size = 4 + (index % 3) * 2;
  const startX = 10 + (index * 7.5) % 80;
  const duration = 8 + (index % 5) * 2;
  const delay = index * 0.5;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        bottom: "-20px",
        background: `hsl(${color})`,
        boxShadow: `0 0 ${size * 2}px hsl(${color} / 0.6)`,
      }}
      initial={{ y: 0, opacity: 0 }}
      animate={{
        y: [0, -window.innerHeight - 100],
        opacity: [0, intensity * 0.6, intensity * 0.6, 0],
        x: [0, Math.sin(index) * 30, Math.sin(index * 2) * -20, Math.sin(index) * 15],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}
