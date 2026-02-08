import { Achievement, rarityColors, AchievementRarity } from "@/lib/achievements";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  achievement: Achievement;
  compact?: boolean;
}

const rarityParticleColors: Record<AchievementRarity, string[]> = {
  common: ["#9CA3AF", "#D1D5DB"],
  uncommon: ["#10B981", "#34D399"],
  rare: ["#3B82F6", "#60A5FA"],
  epic: ["#A78BFA", "#C4B5FD"],
  mythic: ["#FF2975", "#EF4444"], // Plus agressif
  legendary: ["#F59E0B", "#FBBF24"],
};

export function AchievementCard({ achievement, compact = false }: AchievementCardProps) {
  const IconComponent =
    (LucideIcons as any)[
      achievement.icon_key
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("")
    ] || LucideIcons.Award;

  const isLocked = !achievement.unlocked;
  const isHidden = achievement.is_hidden && isLocked;
  const color = rarityColors[achievement.rarity];
  const particles = rarityParticleColors[achievement.rarity];

  const condition = achievement.conditions as any;
  const isProgressBased = condition?.value && typeof condition.value === "number" && condition.value > 1;
  const progressValue = achievement.progress || 0;
  const targetValue = isProgressBased ? condition.value : 0;
  const progressPercent = Math.min(100, (progressValue / targetValue) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isLocked ? 1.02 : 1.04, y: -2 }}
      className={cn("relative group transition-all duration-500", compact ? "h-28" : "h-40")}
    >
      {/* Background avec Glassmorphism & Clip-path style futuriste */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-500",
          isLocked
            ? "bg-slate-950/40 border-slate-800"
            : "bg-gradient-to-br from-slate-900/80 to-black/90 backdrop-blur-xl border-t-2",
        )}
        style={{
          clipPath: "polygon(0% 0%, 95% 0%, 100% 15%, 100% 100%, 5% 100%, 0% 85%)",
          borderColor: isLocked ? "#1e293b" : `${color}80`,
          boxShadow: isLocked ? "none" : `0 10px 30px -10px ${color}40`,
        }}
      />

      {/* Scanlines subtiles (effet écran futuriste) */}
      {!isLocked && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden"
          style={{ backgroundImage: `linear-gradient(0deg, transparent 50%, white 50%)`, backgroundSize: "100% 4px" }}
        />
      )}

      {/* Particules animées */}
      {!isLocked && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              animate={{
                y: [0, -40],
                x: [0, i % 2 === 0 ? 20 : -20],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.8,
              }}
              style={{
                left: `${20 + i * 20}%`,
                bottom: "10%",
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative p-4 flex gap-4 h-full items-center z-10">
        {/* Container Icône avec lueur hexagonale */}
        <div className="relative shrink-0">
          {!isLocked && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 opacity-20 blur-sm rounded-full border-t border-r"
              style={{ borderColor: color }}
            />
          )}
          <div
            className={cn(
              "w-14 h-14 flex items-center justify-center relative",
              isLocked ? "bg-slate-900/50" : "bg-black/40",
            )}
            style={{
              clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
              border: `1px solid ${isLocked ? "#334155" : color}`,
            }}
          >
            <IconComponent
              size={26}
              className={cn("transition-all duration-700", isLocked ? "text-slate-600 grayscale" : "")}
              style={{
                color: isLocked ? undefined : color,
                filter: isLocked ? "none" : `drop-shadow(0 0 8px ${color})`,
              }}
            />
          </div>
        </div>

        {/* Textes & Progress */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="flex flex-col">
              <span
                className="text-[9px] uppercase tracking-[0.2em] font-bold mb-0.5 opacity-60"
                style={{ color: isLocked ? "#64748b" : color }}
              >
                {achievement.rarity}
              </span>
              <h3
                className={cn(
                  "font-black italic tracking-tighter uppercase text-base truncate",
                  isLocked ? "text-slate-600" : "text-white",
                )}
              >
                {isHidden ? "••••••••" : achievement.name}
              </h3>
            </div>

            {/* Badge de pourcentage / Statut */}
            <div className="text-[10px] font-mono bg-black/40 px-2 py-1 rounded border border-white/5 uppercase">
              {isLocked ? (isHidden ? "Locked" : "In Progress") : "Sync Complete"}
            </div>
          </div>

          <p
            className={cn(
              "text-xs line-clamp-2 font-medium leading-tight mb-3 transition-colors",
              isLocked ? "text-slate-500" : "text-slate-300",
            )}
          >
            {isHidden ? "Classified information. Objective unknown." : achievement.description}
          </p>

          {/* Progress Bar Style "Cyber" */}
          {isProgressBased && (
            <div className="relative h-1.5 w-full bg-white/5 rounded-none overflow-hidden border-l border-r border-white/10">
              <motion.div
                className="absolute inset-y-0 left-0"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                style={{
                  backgroundColor: isLocked ? "#334155" : color,
                  boxShadow: isLocked ? "none" : `0 0 10px ${color}`,
                }}
              />
              {/* Overlay brillant sur la barre */}
              {!isLocked && (
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Glint effect (brillance au survol) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full rotate-12" />
    </motion.div>
  );
}
