import { useMemo } from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rank } from '@/hooks/useRankXP';

interface CurrentRankBadgeProps {
  rank: Rank | null;
  level: number;
  currentXP: number;
  progressToNext: number;
  className?: string;
}

/**
 * Displays the current rank with custom rank colors, level badge, and optional quote.
 * Features a pulsing glow animation when close to level-up (90%+ progress).
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
      borderStyle: `2px solid ${frameColor}`,
      boxShadow: `0 0 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`,
    };
  }, [rank]);

  const displayName = rank?.name || 'Initiate';
  const quote = rank?.quote;

  return (
    <div className={cn("relative group", className)}>
      {/* Pulsing outer glow when close to level-up */}
      {isCloseToLevelUp && (
        <div 
          className="absolute -inset-1 rounded-xl animate-pulse opacity-60"
          style={{ 
            background: `radial-gradient(ellipse, ${rankColors.glowColor}, transparent 70%)` 
          }}
        />
      )}
      
      {/* Main badge container */}
      <div 
        className={cn(
          "relative flex items-center gap-4 px-6 py-3",
          "bg-card/40 backdrop-blur-xl rounded-xl",
          "transition-all duration-300 hover:bg-card/50",
          isCloseToLevelUp && "animate-breathe-blue"
        )}
        style={{
          border: rankColors.borderStyle,
          boxShadow: rankColors.boxShadow,
        }}
      >
        {/* Level indicator */}
        <div 
          className="flex items-center justify-center w-12 h-12 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${rankColors.frameColor}20, ${rankColors.frameColor}40)`,
            border: `1px solid ${rankColors.frameColor}60`,
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider opacity-70 font-orbitron">LVL</span>
            <span 
              className="text-xl font-bold font-orbitron"
              style={{ color: rankColors.frameColor }}
            >
              {level}
            </span>
          </div>
        </div>

        {/* Rank name and XP */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Shield 
              className="w-4 h-4" 
              style={{ color: rankColors.frameColor }} 
            />
            <h3 
              className="text-lg font-bold font-orbitron uppercase tracking-wider truncate"
              style={{ 
                color: rankColors.frameColor,
                textShadow: `0 0 15px ${rankColors.glowColor}`,
              }}
            >
              {displayName}
            </h3>
            {isCloseToLevelUp && (
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-mono text-primary/70">
              {currentXP.toLocaleString()} XP
            </span>
            {quote && (
              <span className="text-xs text-muted-foreground/60 italic truncate hidden sm:block">
                "{quote}"
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
