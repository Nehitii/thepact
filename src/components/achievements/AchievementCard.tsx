import { Achievement, rarityColors } from "@/lib/achievements";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  achievement: Achievement;
  size?: "small" | "medium" | "large";
}

export function AchievementCard({ achievement, size = "medium" }: AchievementCardProps) {
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
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      className={cn(
        "relative rounded-lg transition-all duration-300 overflow-hidden",
        sizeClasses[size],
        isLocked 
          ? "bg-card/10 backdrop-blur-sm border border-primary/10" 
          : "bg-card/30 backdrop-blur-xl border-2 border-primary/30",
      )}
      style={{
        boxShadow: isLocked 
          ? "none" 
          : `0 0 30px ${color}30, inset 0 0 30px ${color}10, 0 8px 32px rgba(0,5,11,0.4)`,
        borderColor: isLocked ? undefined : `${color}80`,
      }}
    >
      {/* Inner border glow */}
      {!isLocked && (
        <div className="absolute inset-[2px] rounded-[6px] border pointer-events-none" style={{ borderColor: `${color}30` }} />
      )}

      {/* Rarity glow effect */}
      {!isLocked && (
        <div 
          className="absolute inset-0 rounded-lg opacity-20 blur-xl pointer-events-none" 
          style={{ backgroundColor: color }} 
        />
      )}

      {/* Scan line effect for unlocked */}
      {!isLocked && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div 
            className="absolute top-0 left-0 right-0 h-[2px] animate-scan"
            style={{ 
              background: `linear-gradient(90deg, transparent, ${color}80, transparent)`,
              boxShadow: `0 0 10px ${color}60`
            }}
          />
        </div>
      )}

      <div className="relative flex items-start gap-3 z-10">
        {/* Icon */}
        <div
          className={cn(
            "rounded-lg p-2.5 flex items-center justify-center shrink-0 transition-all",
            isLocked ? "bg-card/20" : "bg-card/40 backdrop-blur-sm",
          )}
          style={{
            boxShadow: isLocked ? "none" : `0 0 20px ${color}40, inset 0 0 10px ${color}20`,
            borderColor: isLocked ? "transparent" : color,
            borderWidth: 2,
          }}
        >
          <IconComponent 
            size={iconSizes[size]} 
            style={{ 
              color: isLocked ? "hsl(var(--muted-foreground))" : color,
              filter: isLocked ? "none" : `drop-shadow(0 0 8px ${color})`
            }} 
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "font-bold leading-tight font-orbitron uppercase tracking-wider",
                size === "small" ? "text-xs" : size === "medium" ? "text-sm" : "text-base",
                isLocked ? "text-muted-foreground/60" : "text-foreground",
              )}
              style={{
                textShadow: isLocked ? "none" : `0 0 10px ${color}60`
              }}
            >
              {isHidden ? "???" : achievement.name}
            </h3>

            {/* Rarity badge */}
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-1 rounded shrink-0 font-orbitron uppercase tracking-wider",
                isLocked ? "bg-card/30 text-muted-foreground/50" : "bg-card/50 backdrop-blur-sm",
              )}
              style={{
                color: isLocked ? undefined : color,
                borderColor: isLocked ? "transparent" : `${color}60`,
                borderWidth: 1,
                boxShadow: isLocked ? "none" : `0 0 10px ${color}30`
              }}
            >
              {achievement.rarity.toUpperCase()}
            </span>
          </div>

          <p className={cn(
            "text-sm mt-1.5 font-rajdhani tracking-wide leading-relaxed",
            isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
          )}>
            {isHidden ? "Secret achievement - complete hidden objectives to unlock" : achievement.description}
          </p>

          {achievement.flavor_text && !isHidden && (
            <p
              className="text-xs italic mt-2 opacity-80 font-rajdhani"
              style={{ 
                color: isLocked ? "hsl(var(--muted-foreground))" : color,
                textShadow: isLocked ? "none" : `0 0 5px ${color}40`
              }}
            >
              "{achievement.flavor_text}"
            </p>
          )}

          {achievement.unlocked && achievement.unlocked_at && (
            <p className="text-xs text-primary/60 mt-2 font-orbitron tracking-wider uppercase">
              Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Particle effect for unlocked achievements */}
      {!isLocked && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ backgroundColor: color }}
              initial={{ opacity: 0, x: "50%", y: "50%" }}
              animate={{
                opacity: [0, 0.8, 0],
                x: [`50%`, `${Math.random() * 100}%`],
                y: [`50%`, `${Math.random() * 100}%`],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Shimmer effect on hover for unlocked */}
      {!isLocked && (
        <div 
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 0%, ${color}10 50%, transparent 100%)`
          }}
        />
      )}
    </motion.div>
  );
}
