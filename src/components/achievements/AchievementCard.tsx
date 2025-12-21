import { Achievement, rarityColors, AchievementRarity } from "@/lib/achievements";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  achievement: Achievement;
  compact?: boolean;
}

// Particle colors based on rarity for unlocked achievements
const rarityParticleColors: Record<AchievementRarity, string[]> = {
  common: ["#9CA3AF", "#D1D5DB", "#E5E7EB"], // neutral/light
  uncommon: ["#10B981", "#34D399", "#6EE7B7"], // green/teal
  rare: ["#3B82F6", "#60A5FA", "#93C5FD"], // blue
  epic: ["#8B5CF6", "#A78BFA", "#C4B5FD"], // purple
  mythic: ["#DC2626", "#EF4444", "#8B1E3F"], // crimson/arcane
  legendary: ["#F59E0B", "#FBBF24", "#FCD34D"], // gold/radiant
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
  const particleColors = rarityParticleColors[achievement.rarity];

  // Check if this is a progress-based achievement
  const condition = achievement.conditions as any;
  const isProgressBased = condition?.value && typeof condition.value === "number" && condition.value > 1;
  const progressValue = achievement.progress || 0;
  const targetValue = isProgressBased ? condition.value : 0;
  const remaining = Math.max(0, targetValue - progressValue);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: isLocked ? 1 : 1.01 }}
      className={cn(
        "relative rounded-lg transition-all duration-300 overflow-hidden",
        compact ? "p-3 h-24" : "p-4 h-36",
        isLocked
          ? "bg-card/15 backdrop-blur-sm border border-primary/10"
          : "bg-card/30 backdrop-blur-xl border border-primary/25"
      )}
      style={{
        boxShadow: isLocked
          ? "none"
          : `0 0 25px ${color}25, inset 0 0 20px ${color}08`,
        borderColor: isLocked ? undefined : `${color}50`,
      }}
    >
      {/* Subtle rarity glow for unlocked */}
      {!isLocked && (
        <div
          className="absolute inset-0 rounded-lg opacity-15 blur-2xl pointer-events-none"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Difficulty-colored particles for unlocked achievements */}
      {!isLocked && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[
            { x: "12%", y: "20%", delay: 0 },
            { x: "88%", y: "25%", delay: 1.5 },
            { x: "15%", y: "75%", delay: 3 },
            { x: "85%", y: "70%", delay: 0.8 },
            { x: "50%", y: "15%", delay: 2.2 },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0.8, 0],
                scale: [0.3, 1, 1, 0.3],
                y: [0, -6, -10, -14],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                delay: pos.delay,
                ease: "easeOut",
                times: [0, 0.15, 0.7, 1],
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: particleColors[i % particleColors.length],
                  boxShadow: `0 0 6px ${particleColors[i % particleColors.length]}`,
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      <div className="relative flex items-start gap-3 z-10 h-full">
        {/* Icon */}
        <div
          className={cn(
            "rounded-lg flex items-center justify-center shrink-0 transition-all",
            compact ? "p-2" : "p-2.5",
            isLocked ? "bg-card/20" : "bg-card/40 backdrop-blur-sm"
          )}
          style={{
            boxShadow: isLocked ? "none" : `0 0 15px ${color}30`,
            borderColor: isLocked ? "transparent" : color,
            borderWidth: 1.5,
          }}
        >
          <IconComponent
            size={28}
            style={{
              color: isLocked ? "hsl(var(--muted-foreground))" : color,
              filter: isLocked ? "none" : `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className={cn(
                  "font-bold leading-tight font-orbitron uppercase tracking-wider text-sm",
                  isLocked ? "text-muted-foreground/50" : "text-foreground"
                )}
                style={{
                  textShadow: isLocked ? "none" : `0 0 8px ${color}40`,
                }}
              >
                {isHidden ? "???" : achievement.name}
              </h3>

              {/* Rarity badge */}
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded shrink-0 font-orbitron uppercase tracking-wider",
                  isLocked ? "bg-card/30 text-muted-foreground/40" : "bg-card/50 backdrop-blur-sm"
                )}
                style={{
                  color: isLocked ? undefined : color,
                  borderColor: isLocked ? "transparent" : `${color}50`,
                  borderWidth: 1,
                }}
              >
                {achievement.rarity.toUpperCase()}
              </span>
            </div>

            <p
              className={cn(
                "text-xs font-rajdhani tracking-wide leading-relaxed line-clamp-2",
                isLocked ? "text-muted-foreground/35" : "text-muted-foreground"
              )}
            >
              {isHidden ? "Secret achievement - complete hidden objectives to unlock" : achievement.description}
            </p>
          </div>

          {/* Bottom section: flavor text, progress, or unlock date */}
          <div className="mt-auto pt-2">
            {/* Progress counter for progress-based achievements */}
            {isProgressBased && !isLocked && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-card/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (progressValue / targetValue) * 100)}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <span className="text-xs font-orbitron tracking-wider" style={{ color }}>
                  {progressValue}/{targetValue}
                </span>
              </div>
            )}

            {isProgressBased && isLocked && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-card/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-muted-foreground/20"
                    style={{ width: `${Math.min(100, (progressValue / targetValue) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground/50 font-orbitron tracking-wider">
                  {remaining} remaining
                </span>
              </div>
            )}

            {/* Flavor text for non-progress achievements */}
            {!isProgressBased && achievement.flavor_text && !isHidden && !isLocked && (
              <p
                className="text-[11px] italic opacity-70 font-rajdhani line-clamp-1"
                style={{ color }}
              >
                "{achievement.flavor_text}"
              </p>
            )}

            {/* Unlock date */}
            {achievement.unlocked && achievement.unlocked_at && !isProgressBased && (
              <p className="text-[10px] text-muted-foreground/60 font-orbitron tracking-wider uppercase">
                Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subtle shimmer on hover for unlocked */}
      {!isLocked && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"
          style={{
            background: `linear-gradient(135deg, transparent 0%, ${color}08 50%, transparent 100%)`,
          }}
        />
      )}
    </motion.div>
  );
}
