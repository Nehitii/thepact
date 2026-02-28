import { TrendingUp } from 'lucide-react';
import { NeuralPanel, WidgetDisplayMode } from './NeuralPanel';

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

  const goalsPercentage = data.totalGoals > 0 ? ((data.goalsCompleted / data.totalGoals) * 100) : 0;
  const stepsPercentage = data.totalSteps > 0 ? ((data.totalStepsCompleted / data.totalSteps) * 100) : 0;
  const habitsPercentage = data.totalHabitChecks > 0 ? ((data.completedHabitChecks / data.totalHabitChecks) * 100) : 0;

  const outerRadius = 50;
  const middleRadius = 38;
  const innerRadius = 26;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const middleCircumference = 2 * Math.PI * middleRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const activeCounters = [goalsPercentage, stepsPercentage, ...(data.totalHabitChecks > 0 ? [habitsPercentage] : [])];
  const overallPercentage = activeCounters.length > 0
    ? activeCounters.reduce((sum, p) => sum + p, 0) / activeCounters.length
    : 0;

  const statusBreakdown = (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-center p-2 rounded-sm bg-[rgba(0,180,255,0.03)] border border-[rgba(0,180,255,0.08)]">
        <div className="text-[8px] font-orbitron uppercase tracking-wider text-[rgba(160,210,255,0.35)] mb-1">Not Started</div>
        <div className="text-base font-mono font-bold text-[rgba(160,210,255,0.5)] tabular-nums">{data.statusCounts.not_started}</div>
      </div>
      <div className="text-center p-2 rounded-sm bg-[rgba(0,180,255,0.03)] border border-[rgba(0,180,255,0.08)]">
        <div className="text-[8px] font-orbitron uppercase tracking-wider text-primary/50 mb-1">In Progress</div>
        <div className="text-base font-mono font-bold text-primary tabular-nums">{data.statusCounts.in_progress}</div>
      </div>
      <div className="text-center p-2 rounded-sm bg-[rgba(0,255,136,0.02)] border border-[rgba(0,255,136,0.08)]">
        <div className="text-[8px] font-orbitron uppercase tracking-wider text-emerald-400/50 mb-1">Completed</div>
        <div className="text-base font-mono font-bold text-emerald-400 tabular-nums">{data.statusCounts.fully_completed}</div>
      </div>
    </div>
  );

  return (
    <NeuralPanel
      title="Progress Overview"
      icon={TrendingUp}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={!isCompact ? statusBreakdown : undefined}
    >
      <div className="flex items-center justify-center gap-6 flex-1">
        {/* Concentric rings */}
        <div className="relative">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={outerRadius} stroke="rgba(0,180,255,0.08)" strokeWidth="7" fill="none" />
            <circle
              cx="60" cy="60" r={outerRadius}
              stroke="url(#goalGradientUnified)"
              strokeWidth="7" fill="none" strokeLinecap="round"
              strokeDasharray={`${(goalsPercentage / 100) * outerCircumference} ${outerCircumference}`}
              className="transition-all duration-1000"
            />
            <circle cx="60" cy="60" r={middleRadius} stroke="rgba(0,180,255,0.08)" strokeWidth="6" fill="none" />
            <circle
              cx="60" cy="60" r={middleRadius}
              stroke="url(#stepGradientUnified)"
              strokeWidth="6" fill="none" strokeLinecap="round"
              strokeDasharray={`${(stepsPercentage / 100) * middleCircumference} ${middleCircumference}`}
              className="transition-all duration-1000"
            />
            {data.totalHabitChecks > 0 && (
              <>
                <circle cx="60" cy="60" r={innerRadius} stroke="rgba(0,180,255,0.05)" strokeWidth="5" fill="none" />
                <circle
                  cx="60" cy="60" r={innerRadius}
                  stroke="url(#habitGradientUnified)"
                  strokeWidth="5" fill="none" strokeLinecap="round"
                  strokeDasharray={`${(habitsPercentage / 100) * innerCircumference} ${innerCircumference}`}
                  className="transition-all duration-1000"
                />
              </>
            )}
            <defs>
              <linearGradient id="goalGradientUnified" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00ff88" />
                <stop offset="100%" stopColor="#00cc66" />
              </linearGradient>
              <linearGradient id="stepGradientUnified" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00d4ff" />
                <stop offset="100%" stopColor="#0088cc" />
              </linearGradient>
              <linearGradient id="habitGradientUnified" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(270 60% 60%)" />
                <stop offset="100%" stopColor="hsl(290 60% 55%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-mono font-bold text-primary tabular-nums">
              {Math.round(overallPercentage)}%
            </div>
            <div className="text-[8px] text-[rgba(160,210,255,0.3)] font-orbitron uppercase tracking-wider">Overall</div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-2.5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[9px] font-orbitron uppercase tracking-wider text-[rgba(160,210,255,0.4)]">Goals</span>
            </div>
            <div className="text-base font-mono font-bold text-emerald-400 tabular-nums">
              {data.goalsCompleted}/{data.totalGoals}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[9px] font-orbitron uppercase tracking-wider text-[rgba(160,210,255,0.4)]">Steps</span>
            </div>
            <div className="text-base font-mono font-bold text-primary tabular-nums">
              {data.totalStepsCompleted}/{data.totalSteps}
            </div>
          </div>
          {data.totalHabitChecks > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-[9px] font-orbitron uppercase tracking-wider text-[rgba(160,210,255,0.4)]">Habits</span>
              </div>
              <div className="text-base font-mono font-bold text-purple-400 tabular-nums">
                {data.completedHabitChecks}/{data.totalHabitChecks}
              </div>
            </div>
          )}
        </div>
      </div>
    </NeuralPanel>
  );
}
