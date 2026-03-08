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
      {/* Deep background gradient shift */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        style={{
          background: isBreak
            ? "radial-gradient(ellipse 120% 80% at 50% 120%, hsl(var(--accent) / 0.12) 0%, hsl(var(--accent) / 0.04) 40%, transparent 70%)"
            : "radial-gradient(ellipse 120% 80% at 50% 120%, hsl(var(--primary) / 0.1) 0%, hsl(var(--primary) / 0.03) 40%, transparent 70%)",
        }}
      />

      {/* Top subtle gradient */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 3 }}
        style={{
          background: isBreak
            ? "radial-gradient(ellipse 100% 50% at 50% -10%, hsl(var(--accent) / 0.06) 0%, transparent 60%)"
            : "radial-gradient(ellipse 100% 50% at 50% -10%, hsl(var(--primary) / 0.05) 0%, transparent 60%)",
        }}
      />

      {/* Pulsing vignette */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(ellipse at center, transparent 25%, hsl(${color} / 0.06) 55%, hsl(${color} / 0.14) 85%, hsl(${color} / 0.2) 100%)`,
        }}
      />

      {/* Floating particles */}
      {particlesEnabled && (
        <div className="absolute inset-0">
          {Array.from({ length: 16 }).map((_, i) => (
            <FloatingParticle
              key={i}
              index={i}
              color={color}
              intensity={0.4 + progress * 0.6}
            />
          ))}
        </div>
      )}

      {/* Central glow aura */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        animate={{
          opacity: [0.08 + progress * 0.12, 0.18 + progress * 0.18, 0.08 + progress * 0.12],
          scale: [1, 1.06, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(circle, hsl(${color} / 0.25) 0%, hsl(${color} / 0.08) 35%, transparent 65%)`,
          filter: "blur(50px)",
        }}
      />

      {/* Side accent streaks */}
      <motion.div
        className="absolute left-0 top-1/4 w-1 h-1/2"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 0.15, 0], scaleY: [0.3, 1, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `linear-gradient(to bottom, transparent, hsl(${color} / 0.3), transparent)`,
          filter: "blur(8px)",
          width: "3px",
        }}
      />
      <motion.div
        className="absolute right-0 top-1/3 w-1 h-1/3"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 0.12, 0], scaleY: [0.3, 1, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          background: `linear-gradient(to bottom, transparent, hsl(${color} / 0.25), transparent)`,
          filter: "blur(8px)",
          width: "3px",
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
  const size = 3 + (index % 4) * 2;
  const startX = 8 + ((index * 6.2) % 84);
  const duration = 7 + (index % 6) * 1.8;
  const delay = index * 0.4;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        bottom: "-20px",
        background: `hsl(${color})`,
        boxShadow: `0 0 ${size * 3}px hsl(${color} / 0.5)`,
      }}
      initial={{ y: 0, opacity: 0 }}
      animate={{
        y: [0, -window.innerHeight - 100],
        opacity: [0, intensity * 0.5, intensity * 0.5, 0],
        x: [0, Math.sin(index * 1.3) * 40, Math.sin(index * 2.1) * -25, Math.sin(index * 0.7) * 20],
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
