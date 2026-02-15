import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardWidgetShell, WidgetDisplayMode } from './DashboardWidgetShell';

interface ProgressOverviewModuleProps {
  data: {
    goalsCompleted: number;
    totalGoals: number;
    totalStepsCompleted: number;
    totalSteps: number;
    totalHabitChecks: number;
    completedHabitChecks: number;
    statusCounts: {
      not_started: number;
      in_progress: number;
      fully_completed: number;
    };
  };
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
}

export function ProgressOverviewModule({ 
  data, 
  displayMode = 'compact',
  onToggleDisplayMode,
}: ProgressOverviewModuleProps) {
  const isCompact = displayMode === 'compact';

  const goalsPercentage = data.totalGoals > 0 
    ? ((data.goalsCompleted / data.totalGoals) * 100) 
    : 0;
  
  const stepsPercentage = data.totalSteps > 0 
    ? ((data.totalStepsCompleted / data.totalSteps) * 100) 
    : 0;

  const habitsPercentage = data.totalHabitChecks > 0
    ? ((data.completedHabitChecks / data.totalHabitChecks) * 100)
    : 0;

  // Calculate ring circumference (2 * PI * radius)
  const outerRadius = 50;
  const middleRadius = 38;
  const innerRadius = 26;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const middleCircumference = 2 * Math.PI * middleRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  // Calculate overall including habits
  const activeCounters = [goalsPercentage, stepsPercentage, ...(data.totalHabitChecks > 0 ? [habitsPercentage] : [])];
  const overallPercentage = activeCounters.length > 0
    ? activeCounters.reduce((sum, p) => sum + p, 0) / activeCounters.length
    : 0;

  const statusBreakdown = (
    <div className="grid grid-cols-3 gap-2">
      {/* Not Started */}
      <div className="text-center p-2 rounded-lg bg-card/30 border border-primary/20">
        <div className="flex items-center justify-center gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span className="text-[8px] uppercase font-orbitron text-muted-foreground">Not Started</span>
        </div>
        <div className="text-lg font-bold text-muted-foreground font-orbitron">
          {data.statusCounts.not_started}
        </div>
      </div>
      
      {/* In Progress */}
      <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/30">
        <div className="flex items-center justify-center gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[8px] uppercase font-orbitron text-primary">In Progress</span>
        </div>
        <div className="text-lg font-bold text-primary font-orbitron">
          {data.statusCounts.in_progress}
        </div>
      </div>
      
      {/* Completed */}
      <div className="text-center p-2 rounded-lg bg-health/5 border border-health/30">
        <div className="flex items-center justify-center gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-health" />
          <span className="text-[8px] uppercase font-orbitron text-health">Completed</span>
        </div>
        <div className="text-lg font-bold text-health font-orbitron">
          {data.statusCounts.fully_completed}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardWidgetShell
      title="Progress Overview"
      icon={TrendingUp}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={!isCompact ? statusBreakdown : undefined}
      accentColor="primary"
    >
      <div className="flex items-center justify-center gap-6 flex-1">
        {/* Concentric rings */}
        <div className="relative">
          <svg 
            className="w-28 h-28 -rotate-90"
            viewBox="0 0 120 120"
          >
            {/* Outer ring background (Goals) */}
            <circle cx="60" cy="60" r={outerRadius} stroke="hsl(var(--primary) / 0.15)" strokeWidth="7" fill="none" />
            {/* Outer ring progress (Goals) */}
            <circle
              cx="60" cy="60" r={outerRadius}
              stroke="url(#goalGradientUnified)"
              strokeWidth="7" fill="none" strokeLinecap="round"
              strokeDasharray={`${(goalsPercentage / 100) * outerCircumference} ${outerCircumference}`}
              className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"
            />
            
            {/* Middle ring background (Steps) */}
            <circle cx="60" cy="60" r={middleRadius} stroke="hsl(var(--primary) / 0.15)" strokeWidth="6" fill="none" />
            {/* Middle ring progress (Steps) */}
            <circle
              cx="60" cy="60" r={middleRadius}
              stroke="url(#stepGradientUnified)"
              strokeWidth="6" fill="none" strokeLinecap="round"
              strokeDasharray={`${(stepsPercentage / 100) * middleCircumference} ${middleCircumference}`}
              className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]"
            />

            {/* Inner ring background (Habits) */}
            {data.totalHabitChecks > 0 && (
              <>
                <circle cx="60" cy="60" r={innerRadius} stroke="hsl(var(--primary) / 0.1)" strokeWidth="5" fill="none" />
                <circle
                  cx="60" cy="60" r={innerRadius}
                  stroke="url(#habitGradientUnified)"
                  strokeWidth="5" fill="none" strokeLinecap="round"
                  strokeDasharray={`${(habitsPercentage / 100) * innerCircumference} ${innerCircumference}`}
                  className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                />
              </>
            )}
            
            <defs>
              <linearGradient id="goalGradientUnified" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--health))" />
                <stop offset="100%" stopColor="hsl(142 76% 46%)" />
              </linearGradient>
              <linearGradient id="stepGradientUnified" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
              <linearGradient id="habitGradientUnified" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(270 60% 60%)" />
                <stop offset="100%" stopColor="hsl(290 60% 55%)" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
              {Math.round(overallPercentage)}%
            </div>
            <div className="text-[8px] text-primary/50 font-rajdhani uppercase">
              Overall
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-health to-green-500 shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
              <span className="text-[9px] uppercase tracking-wider font-orbitron text-primary/70">Goals</span>
            </div>
            <div className="text-lg font-bold text-health font-orbitron">
              {data.goalsCompleted}/{data.totalGoals}
            </div>
          </div>
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent shadow-[0_0_6px_rgba(91,180,255,0.5)]" />
              <span className="text-[9px] uppercase tracking-wider font-orbitron text-primary/70">Steps</span>
            </div>
            <div className="text-lg font-bold text-primary font-orbitron">
              {data.totalStepsCompleted}/{data.totalSteps}
            </div>
          </div>

          {data.totalHabitChecks > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                <span className="text-[9px] uppercase tracking-wider font-orbitron text-primary/70">Habits</span>
              </div>
              <div className="text-lg font-bold text-purple-400 font-orbitron">
                {data.completedHabitChecks}/{data.totalHabitChecks}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Compact mode: inline status counts */}
      {isCompact && (
        <div className="flex items-center justify-center gap-4 pt-2 mt-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-orbitron">{data.statusCounts.not_started}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-primary font-orbitron">{data.statusCounts.in_progress}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-health" />
            <span className="text-[10px] text-health font-orbitron">{data.statusCounts.fully_completed}</span>
          </div>
        </div>
      )}
    </DashboardWidgetShell>
  );
}
