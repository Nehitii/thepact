import { Achievement, rarityColors } from "@/lib/achievements";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  achievement: Achievement;
  size?: "small" | "medium" | "large";
}

export function AchievementCard({ achievement, size = "medium" }: AchievementCardProps) {
  const IconComponent = (LucideIcons as any)[
    achievement.icon_key.split('-').map((w: string) => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join('')
  ] || LucideIcons.Award;

  const isLocked = !achievement.unlocked;
  const isHidden = achievement.is_hidden && isLocked;
  const color = rarityColors[achievement.rarity];

  const sizeClasses = {
    small: "p-3 gap-2",
    medium: "p-4 gap-3",
    large: "p-6 gap-4",
  };

  const iconSizes = {
    small: 24,
    medium: 32,
    large: 48,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isLocked ? 1 : 1.05 }}
      className={cn(
        "relative rounded-lg border transition-all duration-300",
        sizeClasses[size],
        isLocked 
          ? "bg-muted/20 border-border/50 opacity-60" 
          : "bg-card/30 backdrop-blur-sm border-border/80",
        !isLocked && "shadow-lg"
      )}
      style={{
        boxShadow: isLocked 
          ? "none" 
          : `0 0 20px ${color}40, inset 0 0 20px ${color}20`,
        borderColor: isLocked ? undefined : color,
      }}
    >
      {/* Rarity glow effect */}
      {!isLocked && (
        <div
          className="absolute inset-0 rounded-lg opacity-20 blur-xl"
          style={{ backgroundColor: color }}
        />
      )}

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "rounded-full p-2 flex items-center justify-center shrink-0",
            isLocked ? "bg-muted/50" : "bg-background/50"
          )}
          style={{
            boxShadow: isLocked ? "none" : `0 0 15px ${color}60`,
            borderColor: color,
            borderWidth: isLocked ? 0 : 2,
          }}
        >
          <IconComponent
            size={iconSizes[size]}
            style={{ color: isLocked ? "hsl(var(--muted-foreground))" : color }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "font-bold leading-tight",
                size === "small" ? "text-sm" : size === "medium" ? "text-base" : "text-lg",
                isLocked ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {isHidden ? "???" : achievement.name}
            </h3>
            
            {/* Rarity badge */}
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                isLocked ? "bg-muted" : "bg-background/80"
              )}
              style={{
                color: isLocked ? "hsl(var(--muted-foreground))" : color,
                borderColor: color,
                borderWidth: isLocked ? 0 : 1,
              }}
            >
              {achievement.rarity.toUpperCase()}
            </span>
          </div>

          <p className={cn(
            "text-sm mt-1",
            isLocked ? "text-muted-foreground/70" : "text-muted-foreground"
          )}>
            {isHidden ? "Secret achievement - complete hidden objectives to unlock" : achievement.description}
          </p>

          {achievement.flavor_text && !isHidden && (
            <p
              className="text-xs italic mt-2 opacity-80"
              style={{ color: isLocked ? "hsl(var(--muted-foreground))" : color }}
            >
              "{achievement.flavor_text}"
            </p>
          )}

          {achievement.unlocked && achievement.unlocked_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Particle effect for unlocked achievements */}
      {!isLocked && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ backgroundColor: color }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: [0, Math.random() * 100 - 50],
                y: [0, -Math.random() * 100],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}