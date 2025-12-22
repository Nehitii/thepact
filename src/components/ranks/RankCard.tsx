import { cn } from "@/lib/utils";
import { Crown, Flame, Star, Zap, Shield, Trophy, Target, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export interface Rank {
  id: string;
  min_points: number;
  max_points?: number;
  name: string;
  logo_url?: string | null;
  background_url?: string | null;
  background_opacity?: number;
  frame_color?: string;
  glow_color?: string;
  quote?: string | null;
}

interface RankCardProps {
  rank: Rank;
  currentXP?: number;
  nextRankMinXP?: number;
  totalMaxXP?: number;
  isActive?: boolean;
  isLocked?: boolean;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  className?: string;
  onClick?: () => void;
}

// Default icons for ranks without custom logos
const defaultIcons = [Zap, Flame, Star, Shield, Crown, Trophy, Target, Sparkles];

export function RankCard({
  rank,
  currentXP = 0,
  nextRankMinXP,
  totalMaxXP,
  isActive = false,
  isLocked = false,
  size = "md",
  showProgress = true,
  className,
  onClick,
}: RankCardProps) {
  // Calculate progress within current rank
  const rankMinXP = rank.min_points;
  const rankMaxXP = nextRankMinXP || rank.max_points || rankMinXP + 1000;
  const xpInRank = Math.max(0, currentXP - rankMinXP);
  const xpNeeded = rankMaxXP - rankMinXP;
  const progress = Math.min(100, (xpInRank / xpNeeded) * 100);

  // Size classes
  const sizeClasses = {
    sm: "w-[180px] p-3",
    md: "w-[280px] p-4",
    lg: "w-[320px] md:w-[360px] p-5",
  };

  const logoSizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const nameSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  // Get a default icon based on rank index/name
  const DefaultIcon = defaultIcons[rank.name.length % defaultIcons.length];

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "relative rounded-xl overflow-hidden transition-all duration-300",
        sizeClasses[size],
        onClick && "cursor-pointer",
        isLocked && "opacity-50 grayscale",
        isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className
      )}
      style={{
        border: `2px solid ${rank.frame_color || '#5bb4ff'}`,
        boxShadow: isActive ? `0 0 30px ${rank.glow_color || 'rgba(91,180,255,0.5)'}` : `0 0 15px ${rank.glow_color || 'rgba(91,180,255,0.3)'}`,
      }}
    >
      {/* Background layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/95 to-card" />
      
      {/* Custom background image */}
      {rank.background_url && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${rank.background_url})`,
            opacity: rank.background_opacity || 0.3,
          }}
        />
      )}
      
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${rank.frame_color || '#5bb4ff'}10, transparent 50%, ${rank.frame_color || '#5bb4ff'}05)`,
        }}
      />
      
      {/* Scan lines effect */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(91,180,255,0.1) 2px, rgba(91,180,255,0.1) 4px)',
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-2">
        {/* Logo / Icon */}
        <div 
          className={cn(
            "rounded-xl flex items-center justify-center",
            logoSizeClasses[size],
            "bg-gradient-to-b from-primary/20 to-primary/10 border border-primary/30"
          )}
          style={{
            borderColor: `${rank.frame_color || '#5bb4ff'}50`,
            boxShadow: `0 0 20px ${rank.glow_color || 'rgba(91,180,255,0.3)'}`,
          }}
        >
          {rank.logo_url ? (
            <img 
              src={rank.logo_url} 
              alt={rank.name}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <DefaultIcon 
              className="w-1/2 h-1/2"
              style={{ color: rank.frame_color || '#5bb4ff' }}
            />
          )}
        </div>

        {/* Rank Name */}
        <h3 
          className={cn(
            "font-orbitron font-bold tracking-wider uppercase",
            nameSizeClasses[size]
          )}
          style={{
            color: rank.frame_color || '#5bb4ff',
            textShadow: `0 0 10px ${rank.glow_color || 'rgba(91,180,255,0.5)'}`,
          }}
        >
          {rank.name}
        </h3>

        {/* Quote */}
        {rank.quote && size !== "sm" && (
          <p 
            className="text-xs text-muted-foreground font-rajdhani italic line-clamp-2 px-2"
            style={{ color: `${rank.frame_color || '#5bb4ff'}80` }}
          >
            "{rank.quote}"
          </p>
        )}

        {/* Progress section */}
        {showProgress && isActive && (
          <div className="w-full mt-2 space-y-1">
            {/* Progress bar */}
            <div className="relative h-2 bg-primary/10 rounded-full overflow-hidden border border-primary/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${rank.frame_color || '#5bb4ff'}80, ${rank.frame_color || '#5bb4ff'})`,
                  boxShadow: `0 0 10px ${rank.glow_color || 'rgba(91,180,255,0.5)'}`,
                }}
              />
            </div>
            
            {/* XP display */}
            <div className="flex justify-between text-[10px] font-rajdhani">
              <span className="text-primary/70">{currentXP.toLocaleString()} XP</span>
              <span className="text-muted-foreground">/ {rankMaxXP.toLocaleString()}</span>
            </div>

            {/* Global progress (optional) */}
            {totalMaxXP && totalMaxXP > 0 && (
              <div className="text-[9px] text-muted-foreground/60 font-rajdhani">
                Global: {currentXP.toLocaleString()} / {totalMaxXP.toLocaleString()} XP
              </div>
            )}
          </div>
        )}

        {/* Locked overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Shield className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Corner decorations */}
      <div 
        className="absolute top-1 left-1 w-3 h-3 border-l border-t opacity-50"
        style={{ borderColor: rank.frame_color || '#5bb4ff' }}
      />
      <div 
        className="absolute top-1 right-1 w-3 h-3 border-r border-t opacity-50"
        style={{ borderColor: rank.frame_color || '#5bb4ff' }}
      />
      <div 
        className="absolute bottom-1 left-1 w-3 h-3 border-l border-b opacity-50"
        style={{ borderColor: rank.frame_color || '#5bb4ff' }}
      />
      <div 
        className="absolute bottom-1 right-1 w-3 h-3 border-r border-b opacity-50"
        style={{ borderColor: rank.frame_color || '#5bb4ff' }}
      />
    </motion.div>
  );
}

// Mini rank badge for bounded profile
interface RankBadgeProps {
  rank: Rank;
  currentXP?: number;
  nextRankMinXP?: number;
}

export function RankBadge({ rank, currentXP = 0, nextRankMinXP }: RankBadgeProps) {
  const rankMinXP = rank.min_points;
  const rankMaxXP = nextRankMinXP || rank.max_points || rankMinXP + 1000;
  const xpInRank = Math.max(0, currentXP - rankMinXP);
  const xpNeeded = rankMaxXP - rankMinXP;
  const progress = Math.min(100, (xpInRank / xpNeeded) * 100);

  const DefaultIcon = defaultIcons[rank.name.length % defaultIcons.length];

  return (
    <div 
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/80 backdrop-blur-sm border"
      style={{
        borderColor: `${rank.frame_color || '#5bb4ff'}50`,
        boxShadow: `0 0 15px ${rank.glow_color || 'rgba(91,180,255,0.3)'}`,
      }}
    >
      {/* Icon */}
      <div 
        className="w-6 h-6 rounded flex items-center justify-center"
        style={{
          background: `${rank.frame_color || '#5bb4ff'}20`,
        }}
      >
        {rank.logo_url ? (
          <img src={rank.logo_url} alt="" className="w-4 h-4 object-contain" />
        ) : (
          <DefaultIcon className="w-3 h-3" style={{ color: rank.frame_color || '#5bb4ff' }} />
        )}
      </div>

      {/* Name & Progress */}
      <div className="flex flex-col">
        <span 
          className="text-xs font-orbitron font-bold tracking-wide uppercase leading-none"
          style={{ 
            color: rank.frame_color || '#5bb4ff',
            textShadow: `0 0 8px ${rank.glow_color || 'rgba(91,180,255,0.5)'}`,
          }}
        >
          {rank.name}
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="w-16 h-1 bg-primary/10 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full"
              style={{ 
                width: `${progress}%`,
                background: rank.frame_color || '#5bb4ff',
              }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}