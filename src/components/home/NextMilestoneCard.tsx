import { useMemo } from 'react';
import { TrendingUp, Calendar, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Goal } from '@/hooks/useGoals';
import { Rank } from '@/hooks/useRanks';

interface NextMilestoneCardProps {
  totalPoints: number;
  currentRank: Rank | null;
  nextRank: Rank | null;
  focusGoals: Goal[];
  projectEndDate?: string | null;
  className?: string;
}

export function NextMilestoneCard({
  totalPoints,
  currentRank,
  nextRank,
  focusGoals,
  projectEndDate,
  className,
}: NextMilestoneCardProps) {
  const milestoneData = useMemo(() => {
    // XP to next rank
    const xpToNextRank = nextRank ? nextRank.min_points - totalPoints : null;
    const xpProgress = currentRank && nextRank 
      ? ((totalPoints - currentRank.min_points) / (nextRank.min_points - currentRank.min_points)) * 100
      : nextRank 
        ? (totalPoints / nextRank.min_points) * 100
        : 100;
    
    // Days remaining
    const daysRemaining = projectEndDate 
      ? Math.max(0, Math.ceil((new Date(projectEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;
    
    // Primary focus goal
    const primaryFocus = focusGoals[0] ?? null;
    const focusProgress = primaryFocus 
      ? primaryFocus.total_steps > 0 
        ? Math.round((primaryFocus.validated_steps / primaryFocus.total_steps) * 100)
        : 0
      : null;
    
    // Check if close to leveling up (within 10%)
    const isCloseToLevelUp = xpProgress >= 90;

    return { xpToNextRank, xpProgress, daysRemaining, primaryFocus, focusProgress, isCloseToLevelUp };
  }, [totalPoints, currentRank, nextRank, focusGoals, projectEndDate]);

  return (
    <div className={cn(
      "relative group animate-fade-in",
      className
    )}>
      <div className="absolute inset-0 bg-primary/10 rounded-lg blur-2xl group-hover:blur-3xl transition-all" />
      
      {/* Pulsing border when close to leveling up */}
      {milestoneData.isCloseToLevelUp && (
        <div className="absolute inset-0 rounded-lg border-2 border-primary/60 animate-pulse" />
      )}
      
      <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden hover:border-primary/50 transition-all">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs text-primary/70 uppercase tracking-widest font-orbitron">
              Next Milestone
            </span>
          </div>
          
          {/* Three columns of milestone info */}
          <div className="grid grid-cols-3 gap-4">
            {/* XP to Next Rank */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-primary/60">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-orbitron">Next Rank</span>
              </div>
              {milestoneData.xpToNextRank !== null ? (
                <>
                  <div className="text-2xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                    {milestoneData.xpToNextRank}
                  </div>
                  <div className="text-[10px] text-primary/50 font-rajdhani">XP remaining</div>
                  {/* Mini progress bar */}
                  <div className="h-1 w-full bg-card/30 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000",
                        milestoneData.isCloseToLevelUp && "animate-pulse"
                      )}
                      style={{ width: `${Math.min(milestoneData.xpProgress, 100)}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-lg text-primary/50 font-orbitron">🏆 Max</div>
              )}
            </div>
            
            {/* Days Remaining */}
            <div className="text-center space-y-2 border-x border-primary/20 px-4">
              <div className="flex items-center justify-center gap-1.5 text-primary/60">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-orbitron">Timeline</span>
              </div>
              {milestoneData.daysRemaining !== null ? (
                <>
                  <div className="text-2xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                    {milestoneData.daysRemaining}
                  </div>
                  <div className="text-[10px] text-primary/50 font-rajdhani">days left</div>
                </>
              ) : (
                <>
                  <div className="text-lg text-primary/50 font-orbitron">—</div>
                  <div className="text-[10px] text-primary/40 font-rajdhani">Not set</div>
                </>
              )}
            </div>
            
            {/* Primary Focus Goal */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-primary/60">
                <Star className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-orbitron">Focus</span>
              </div>
              {milestoneData.primaryFocus ? (
                <>
                  <div className="text-2xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                    {milestoneData.focusProgress}%
                  </div>
                  <div className="text-[10px] text-primary/50 font-rajdhani truncate max-w-[100px] mx-auto">
                    {milestoneData.primaryFocus.name}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg text-primary/50 font-orbitron">—</div>
                  <div className="text-[10px] text-primary/40 font-rajdhani">No focus</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
