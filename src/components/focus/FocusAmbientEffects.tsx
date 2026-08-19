import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useProfileSettings } from "@/hooks/useProfileSettings";

interface FocusAmbientEffectsProps {
  progress: number;
  isBreak?: boolean;
  /** Au repos, l ambiance reste — mais elle ne bouge pas. */
  statique?: boolean;
}

/* Cette couche reste a l ecran pendant vingt-cinq minutes : c est le
   contexte ou le cout d un effet se paie en autonomie et en chauffe.
   Elle est memoisee, et l appelant lui transmet un avancement quantifie
   — sans quoi elle se re-rendait chaque seconde. */
export const FocusAmbientEffects = memo(function FocusAmbientEffects({
  progress,
  isBreak = false,
  statique = false,
}: FocusAmbientEffectsProps) {
  const { profile } = useProfileSettings();
  const particlesEnabled = profile?.particles_enabled ?? true;
  const reducedMotion = useReducedMotion();

  /* La couche la plus visible de la page vivait hors du systeme de
     jetons : changer la couleur d accent de l application l aurait
     laissee derriere. Elle suit maintenant --accent en pause et
     --primary en travail, avec la syntaxe qui fonctionne pour un
     triplet HSL. */
  const jeton = isBreak ? "--accent" : "--primary";
  const teinte = (alpha: number) => `hsl(var(${jeton}) / ${alpha})`;

  /* La page paraissait eteinte au repos : cette couche n existait que
     pendant une session. Elle reste maintenant en permanence — figee tant
     qu aucune clause ne s execute, ce qui donne du fond a l ecran sans
     rien faire bouger pour rien. */
  if (reducedMotion || statique) {
    return (
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background: isBreak
              ? `linear-gradient(180deg, ${teinte(0.06)} 0%, ${teinte(0.03)} 100%), linear-gradient(180deg, rgb(4 6 9 / 0.72) 0%, rgb(3 4 6 / 0.86) 100%)`
              : `linear-gradient(180deg, ${teinte(0.06)} 0%, ${teinte(0.03)} 100%), linear-gradient(180deg, rgb(4 6 9 / 0.72) 0%, rgb(3 4 6 / 0.86) 100%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 130% 60% at 50% 110%, ${teinte(0.12)} 0%, transparent 70%)`,
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      aria-hidden="true"
    >
      {/* Full-screen dark overlay for immersion */}
      <div
        className="absolute inset-0"
        style={{
          background: isBreak
            ? `linear-gradient(180deg, ${teinte(0.06)} 0%, ${teinte(0.03)} 100%), linear-gradient(180deg, rgb(4 6 9 / 0.72) 0%, rgb(3 4 6 / 0.86) 100%)`
            : `linear-gradient(180deg, ${teinte(0.06)} 0%, ${teinte(0.03)} 100%), linear-gradient(180deg, rgb(4 6 9 / 0.72) 0%, rgb(3 4 6 / 0.86) 100%)`,
        }}
      />

      {/* Large bottom radial glow */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(ellipse 130% 60% at 50% 110%, ${teinte(0.15)} 0%, ${teinte(0.05)} 40%, transparent 70%)`,
        }}
      />

      {/* Top ambient glow */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          background: `radial-gradient(ellipse 80% 40% at 50% -5%, ${teinte(0.1)} 0%, transparent 60%)`,
        }}
      />

      {/* Pulsing vignette */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(ellipse at center, transparent 20%, ${teinte(0.04)} 45%, ${teinte(0.1)} 70%, ${teinte(0.18)} 100%)`,
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
          background: `radial-gradient(circle, ${teinte(0.2 + progress * 0.15)} 0%, ${teinte(0.06)} 40%, transparent 65%)`,
          filter: "blur(60px)",
        }}
        animate={{ opacity: [0.62, 1, 0.62] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles — reduced to 12 for performance */}
      {particlesEnabled && (
        <div className="absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <FloatingParticle
              key={i}
              index={i}
              couleur={teinte}
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
          background: `linear-gradient(to bottom, transparent, ${teinte(0.5)}, transparent)`,
          filter: "blur(4px)",
        }}
      />
      <motion.div
        className="absolute right-0 top-1/3 h-1/3"
        animate={{ opacity: [0, 0.2, 0], scaleY: [0.4, 1, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        style={{
          width: 2,
          background: `linear-gradient(to bottom, transparent, ${teinte(0.4)}, transparent)`,
          filter: "blur(4px)",
        }}
      />

      {/* Horizontal scan line sweep */}
      <motion.div
        className="absolute left-0 w-full"
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent 10%, ${teinte(0.15)} 50%, transparent 90%)`,
          filter: "blur(1px)",
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
});

function FloatingParticle({
  index,
  couleur,
  intensity,
}: {
  index: number;
  couleur: (alpha: number) => string;
  intensity: number;
}) {
  const size = 3 + (index % 4) * 2;
  const startX = 5 + ((index * 7.5) % 90);
  const duration = 6 + (index % 7) * 1.5;
  const delay = index * 0.5;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        bottom: "-10px",
        background: couleur(0.8),
        boxShadow: `0 0 ${size * 3}px ${couleur(0.6)}`,
      }}
      animate={{
        y: [0, "-105vh"],
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
