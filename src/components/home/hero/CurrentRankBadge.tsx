import { useMemo } from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Rank } from '@/hooks/useRankXP';
import { NoiseOverlay } from './NoiseOverlay';

interface CurrentRankBadgeProps {
  rank: Rank | null;
  level: number;
  currentXP: number;
  progressToNext: number;
  className?: string;
}

/**
 * Premium rank badge with noise texture, corner brackets, shimmer wave hover,
 * and pulsing glow animation when close to level-up (90%+ progress).
 */
export function CurrentRankBadge({
  rank,
  level,
  currentXP,
  progressToNext,
  className,
}: CurrentRankBadgeProps) {
  const isCloseToLevelUp = progressToNext >= 90;
  
  const rankColors = useMemo(() => {
    const frameColor = rank?.frame_color || '#5bb4ff';
    const glowColor = rank?.glow_color || 'rgba(91,180,255,0.5)';
    
    return {
      frameColor,
      glowColor,
    };
  }, [rank]);

  const displayName = rank?.name || 'Initiate';
  const quote = rank?.quote;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className={cn("relative group", className)}
    >
      {/* Pulsing outer glow when close to level-up */}
      {isCloseToLevelUp && (
        <div 
          className="absolute -inset-2 rounded-2xl animate-pulse opacity-60 blur-md"
          style={{ 
            background: `radial-gradient(ellipse, ${rankColors.glowColor}, transparent 70%)` 
          }}
        />
      )}
      
      {/* Main badge container with corner brackets */}
      <div 
        className={cn(
          "relative flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4",
          "bg-gradient-to-br from-card/60 via-card/40 to-card/20",
          "backdrop-blur-xl rounded-xl overflow-hidden",
          "transition-all duration-300",
          "hover:-translate-y-1 hover:shadow-lg",
          "corner-brackets hover-shimmer-wave",
          isCloseToLevelUp && "animate-breathe-blue"
        )}
        style={{
          border: `2px solid ${rankColors.frameColor}`,
          boxShadow: `0 0 25px ${rankColors.glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`,
          // CSS custom properties for corner brackets
          '--primary': rankColors.frameColor,
        } as React.CSSProperties}
      >
        {/* Noise texture overlay */}
        <NoiseOverlay opacity={0.15} />
        
        {/* Inner gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${rankColors.frameColor}10 0%, transparent 50%)`,
          }}
        />

        {/* Level indicator */}
        <div 
          className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${rankColors.frameColor}25, ${rankColors.frameColor}45)`,
            border: `1px solid ${rankColors.frameColor}70`,
            boxShadow: `0 0 15px ${rankColors.glowColor}`,
          }}
        >
          <div className="flex flex-col items-center">
            <span 
              className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-70 font-orbitron"
              style={{ color: rankColors.frameColor }}
            >
              LVL
            </span>
            <span 
              className="text-2xl sm:text-3xl font-bold font-orbitron"
              style={{ 
                color: rankColors.frameColor,
                textShadow: `0 0 10px ${rankColors.glowColor}`,
              }}
            >
              {level}
            </span>
          </div>
        </div>

        {/* Rank name and XP */}
        <div className="flex-1 min-w-0 text-center sm:text-left relative z-10">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Shield 
              className="w-4 h-4 sm:w-5 sm:h-5" 
              style={{ color: rankColors.frameColor }} 
            />
            <h3 
              className="text-lg sm:text-xl font-bold font-orbitron uppercase tracking-wider truncate"
              style={{ 
                color: rankColors.frameColor,
                textShadow: `0 0 20px ${rankColors.glowColor}`,
              }}
            >
              {displayName}
            </h3>
            {isCloseToLevelUp && (
              <Sparkles 
                className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-pulse flex-shrink-0" 
              />
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 mt-1.5">
            <span 
              className="text-sm sm:text-base font-mono font-semibold"
              style={{ color: `${rankColors.frameColor}cc` }}
            >
              {currentXP.toLocaleString()} XP
            </span>
            {quote && (
              <span 
                className="text-[11px] sm:text-xs text-muted-foreground/60 italic truncate max-w-[200px] hidden sm:block"
              >
                "{quote}"
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
