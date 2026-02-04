import { useMemo } from 'react';
import { PactVisual } from '@/components/PactVisual';
import { TodaysFocusMessage } from '@/components/home/TodaysFocusMessage';
import { QuickActionsBar } from '@/components/home/QuickActionsBar';
import { CurrentRankBadge } from './CurrentRankBadge';
import { XPProgressBar } from './XPProgressBar';
import { QuickStatsBadges } from './QuickStatsBadges';
import { cn } from '@/lib/utils';
import { Pact } from '@/hooks/usePact';
import { Goal } from '@/hooks/useGoals';
import { RankXPData } from '@/hooks/useRankXP';

interface HeroSectionProps {
  pact: Pact;
  focusGoals: Goal[];
  allGoals: Goal[];
  rankData: RankXPData;
  ownedModules: {
    todo: boolean;
    journal: boolean;
    health: boolean;
  };
  className?: string;
}

/**
 * Hero section of the Home page containing:
 * - PactVisual with progress ring
 * - Project title and mantra
 * - Current rank badge with level
 * - XP progress bar
 * - Quick stats badges
 * - Quick actions bar
 */
export function HeroSection({
  pact,
  focusGoals,
  allGoals,
  rankData,
  ownedModules,
  className,
}: HeroSectionProps) {
  const progressPercentage = Number(pact.global_progress) || 0;
  
  const { 
    currentRank, 
    nextRank, 
    currentXP, 
    progressInCurrentRank,
  } = rankData;

  // Calculate level from rank index
  const level = useMemo(() => {
    if (!currentRank || !rankData.ranks.length) return 1;
    const index = rankData.ranks.findIndex(r => r.id === currentRank.id);
    return index >= 0 ? index + 1 : 1;
  }, [currentRank, rankData.ranks]);

  // Compute quick stats data
  const quickStats = useMemo(() => {
    const completedGoals = allGoals.filter(g => 
      g.status === 'fully_completed' || g.status === 'validated'
    ).length;
    
    const primaryFocus = focusGoals[0];
    const focusGoalName = primaryFocus?.name || null;
    
    const daysRemaining = pact.project_end_date 
      ? Math.max(0, Math.ceil(
          (new Date(pact.project_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ))
      : null;
    
    return {
      totalGoals: allGoals.length,
      completedGoals,
      focusGoalName,
      daysRemaining,
    };
  }, [allGoals, focusGoals, pact.project_end_date]);

  const isMaxRank = !nextRank && rankData.ranks.length > 0;
  const currentRankMin = currentRank?.min_points || 0;
  const nextRankMin = nextRank?.min_points || currentRankMin + 1000;
  const nextRankName = nextRank?.name || 'Next Rank';

  return (
    <div className={cn("text-center space-y-6 pt-8 animate-fade-in", className)}>
      {/* Level Core - Center */}
      <div className="flex justify-center relative overflow-visible">
        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
        <div className="relative overflow-visible">
          <PactVisual symbol={pact.symbol} progress={progressPercentage} size="lg" />
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-3 relative">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)]">
          {pact.name}
        </h1>
        <p className="text-sm sm:text-base text-primary/80 italic font-rajdhani tracking-wide">
          &ldquo;{pact.mantra}&rdquo;
        </p>

        {/* Today's Focus Message */}
        <div className="pt-2">
          <TodaysFocusMessage focusGoals={focusGoals} allGoals={allGoals} />
        </div>
      </div>

      {/* Current Rank Badge - NEW FOCAL POINT */}
      <CurrentRankBadge
        rank={currentRank}
        level={level}
        currentXP={currentXP}
        progressToNext={progressInCurrentRank}
        className="max-w-md mx-auto"
      />

      {/* XP Progress Bar */}
      <XPProgressBar
        currentXP={currentXP}
        currentRankXP={currentRankMin}
        nextRankXP={nextRankMin}
        nextRankName={nextRankName}
        isMaxRank={isMaxRank}
        frameColor={currentRank?.frame_color}
      />

      {/* Quick Stats Badges */}
      <QuickStatsBadges
        totalGoals={quickStats.totalGoals}
        completedGoals={quickStats.completedGoals}
        focusGoalName={quickStats.focusGoalName}
        daysRemaining={quickStats.daysRemaining}
        className="pt-2"
      />

      {/* Quick Actions Bar */}
      <QuickActionsBar
        ownedModules={ownedModules}
        className="pt-2"
      />
    </div>
  );
}
