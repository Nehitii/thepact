import { motion } from "framer-motion";
import { useProfileSettings } from "@/hooks/useProfileSettings";

interface FocusAmbientEffectsProps {
  progress: number;
  isBreak?: boolean;
}

export function FocusAmbientEffects({ progress, isBreak = false }: FocusAmbientEffectsProps) {
  const { profile } = useProfileSettings();
  const particlesEnabled = profile?.particles_enabled ?? true;

  // Use concrete colors for proper rendering
  const mainColor = isBreak ? "160, 80%, 55%" : "195, 100%, 50%";
  const mainColorRgb = isBreak ? "60, 180, 130" : "0, 170, 255";

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Full-screen dark overlay for immersion */}
      <div
        className="absolute inset-0"
        style={{
          background: isBreak
            ? "linear-gradient(180deg, hsla(160,40%,5%,0.7) 0%, hsla(160,30%,3%,0.85) 100%)"
            : "linear-gradient(180deg, hsla(210,50%,4%,0.7) 0%, hsla(220,40%,2%,0.85) 100%)",
        }}
      />

      {/* Large bottom radial glow */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(ellipse 130% 60% at 50% 110%, hsla(${mainColor}, 0.15) 0%, hsla(${mainColor}, 0.05) 40%, transparent 70%)`,
        }}
      />

      {/* Top ambient glow */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          background: `radial-gradient(ellipse 80% 40% at 50% -5%, hsla(${mainColor}, 0.1) 0%, transparent 60%)`,
        }}
      />

      {/* Pulsing vignette */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(ellipse at center, transparent 20%, hsla(${mainColor}, 0.04) 45%, hsla(${mainColor}, 0.1) 70%, hsla(${mainColor}, 0.18) 100%)`,
        }}
      />

      {/* Central glow aura behind timer */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 550,
          height: 550,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, hsla(${mainColor}, ${0.2 + progress * 0.15}) 0%, hsla(${mainColor}, 0.06) 40%, transparent 65%)`,
          filter: "blur(60px)",
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      {particlesEnabled && (
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <FloatingParticle
              key={i}
              index={i}
              mainColor={mainColor}
              mainColorRgb={mainColorRgb}
              intensity={0.5 + progress * 0.5}
            />
          ))}
        </div>
      )}

      {/* Subtle side light bars */}
      <motion.div
        className="absolute left-0 top-1/4 h-1/2"
        animate={{ opacity: [0, 0.25, 0], scaleY: [0.4, 1, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 2,
          background: `linear-gradient(to bottom, transparent, hsla(${mainColor}, 0.5), transparent)`,
          filter: "blur(4px)",
        }}
      />
      <motion.div
        className="absolute right-0 top-1/3 h-1/3"
        animate={{ opacity: [0, 0.2, 0], scaleY: [0.4, 1, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        style={{
          width: 2,
          background: `linear-gradient(to bottom, transparent, hsla(${mainColor}, 0.4), transparent)`,
          filter: "blur(4px)",
        }}
      />

      {/* Horizontal scan line sweep */}
      <motion.div
        className="absolute left-0 w-full"
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent 10%, hsla(${mainColor}, 0.15) 50%, transparent 90%)`,
          filter: "blur(1px)",
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}

function FloatingParticle({
  index,
  mainColor,
  mainColorRgb,
  intensity,
}: {
  index: number;
  mainColor: string;
  mainColorRgb: string;
  intensity: number;
}) {
  const size = 3 + (index % 4) * 2;
  const startX = 5 + ((index * 4.8) % 90);
  const duration = 6 + (index % 7) * 1.5;
  const delay = index * 0.35;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        bottom: "-10px",
        background: `hsla(${mainColor}, 0.8)`,
        boxShadow: `0 0 ${size * 3}px rgba(${mainColorRgb}, 0.6)`,
      }}
      animate={{
        y: [0, -(typeof window !== "undefined" ? window.innerHeight : 800) - 50],
        opacity: [0, intensity * 0.7, intensity * 0.7, 0],
        x: [0, Math.sin(index * 1.3) * 50, Math.sin(index * 2.1) * -30, Math.sin(index * 0.7) * 25],
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
