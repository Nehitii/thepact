/**
 * Health streak badge component.
 * Displays the current check-in streak with fire animation.
 */
import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthStreak } from "@/hooks/useHealthStreak";
import { useTranslation } from "react-i18next";

interface HealthStreakBadgeProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function HealthStreakBadge({ 
  size = "md", 
  showLabel = true,
  className 
}: HealthStreakBadgeProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: streak, isLoading } = useHealthStreak(user?.id);
  
  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  
  // Determine streak tier for styling
  const getStreakTier = () => {
    if (currentStreak >= 100) return "legendary";
    if (currentStreak >= 30) return "epic";
    if (currentStreak >= 7) return "rare";
    if (currentStreak >= 3) return "uncommon";
    return "common";
  };
  
  const tier = getStreakTier();
  
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
  };
  
  const tierColors = {
    common: "text-muted-foreground",
    uncommon: "text-emerald-500",
    rare: "text-blue-500",
    epic: "text-purple-500",
    legendary: "text-amber-500",
  };
  
  const tierGlows = {
    common: "",
    uncommon: "drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    rare: "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    epic: "drop-shadow-[0_0_12px_rgba(147,51,234,0.6)]",
    legendary: "drop-shadow-[0_0_16px_rgba(245,158,11,0.7)]",
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 animate-pulse", className)}>
        <div className="w-6 h-6 bg-muted rounded" />
        {showLabel && <div className="w-12 h-4 bg-muted rounded" />}
      </div>
    );
  }

  return (
    <motion.div 
      className={cn("flex items-center gap-2", className)}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <div className="relative">
        {/* Fire icon with glow effect */}
        <motion.div
          animate={currentStreak > 0 ? { 
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut",
          }}
        >
          <Flame 
            className={cn(
              iconSizes[size],
              tierColors[tier],
              tierGlows[tier],
              currentStreak === 0 && "opacity-30"
            )} 
          />
        </motion.div>
        
        {/* Longest streak indicator */}
        {longestStreak > 0 && currentStreak === longestStreak && currentStreak >= 7 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1"
          >
            <Trophy className="w-3 h-3 text-amber-400" />
          </motion.div>
        )}
      </div>
      
      <div className="flex flex-col">
        <span className={cn(
          "font-bold font-orbitron leading-none",
          sizeClasses[size],
          tierColors[tier]
        )}>
          {currentStreak}
        </span>
        
        {showLabel && (
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {currentStreak === 1 ? t("health.streak.day") : t("health.streak.days")}
          </span>
        )}
      </div>
    </motion.div>
  );
}
