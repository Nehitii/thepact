import { Target } from "lucide-react";
import { getDifficultyColor } from "@/lib/utils";
import { DashboardWidgetShell, WidgetDisplayMode } from './DashboardWidgetShell';
import { cn } from "@/lib/utils";

interface DifficultyProgress {
  difficulty: string;
  completed: number;
  total: number;
  percentage: number;
  totalSteps: number;
  completedSteps: number;
  remainingSteps: number;
}

interface ProgressByDifficultyModuleProps {
  difficultyProgress: DifficultyProgress[];
  customDifficultyName?: string;
  customDifficultyColor?: string;
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
  hideBackgroundLines?: boolean;
}

export function ProgressByDifficultyModule({
  difficultyProgress,
  customDifficultyName,
  customDifficultyColor,
  displayMode = 'compact',
  onToggleDisplayMode,
}: ProgressByDifficultyModuleProps) {
  const isCompact = displayMode === 'compact';
  
  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === 'custom' && customDifficultyName) {
      return customDifficultyName;
    }
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const getColor = (difficulty: string) => {
    return getDifficultyColor(difficulty, customDifficultyColor);
  };

  // Filter to only show non-zero difficulties in compact mode
  const visibleProgress = isCompact 
    ? difficultyProgress.filter(item => item.total > 0).slice(0, 4)
    : difficultyProgress.filter(item => item.total > 0);

  const renderDifficultyRow = (item: DifficultyProgress, showSteps: boolean) => {
    const stepsPercentage = item.totalSteps > 0 
      ? (item.completedSteps / item.totalSteps) * 100 
      : 0;
    const remainingGoals = item.total - item.completed;

    return (
      <div key={item.difficulty} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="px-2 py-0.5 text-[10px] rounded border backdrop-blur font-bold uppercase tracking-wider font-orbitron"
              style={{ 
                borderColor: getColor(item.difficulty),
                color: getColor(item.difficulty),
                backgroundColor: `${getColor(item.difficulty)}15`,
                boxShadow: `0 0 10px ${getColor(item.difficulty)}40`
              }}
            >
              {getDifficultyLabel(item.difficulty)}
            </div>
          </div>
        </div>

        {/* Goals progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-primary/50 font-rajdhani">
              Goals: {remainingGoals > 0 ? `${remainingGoals} remaining` : 'All done'}
            </span>
            <span className="font-bold font-orbitron" style={{ color: getColor(item.difficulty) }}>
              {item.completed}/{item.total}
            </span>
          </div>
          <div className="relative h-1.5 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/10">
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: getColor(item.difficulty),
                boxShadow: `0 0 15px ${getColor(item.difficulty)}80`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
            </div>
          </div>
        </div>

        {/* Steps progress (shown when there are steps) */}
        {showSteps && item.totalSteps > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-primary/40 font-rajdhani">
                Steps: {item.remainingSteps > 0 ? `${item.remainingSteps} remaining` : 'All done'}
              </span>
              <span className="font-orbitron text-primary/60" style={{ color: `${getColor(item.difficulty)}99` }}>
                {item.completedSteps}/{item.totalSteps}
              </span>
            </div>
            <div className="relative h-1 w-full bg-card/20 backdrop-blur rounded-full overflow-hidden border border-primary/5">
              <div
                className="h-full transition-all duration-1000 opacity-70"
                style={{
                  width: `${stepsPercentage}%`,
                  backgroundColor: getColor(item.difficulty),
                  boxShadow: `0 0 10px ${getColor(item.difficulty)}40`
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const allDifficultiesBreakdown = (
    <div className="space-y-4">
      {difficultyProgress
        .filter(item => item.total > 0)
        .map((item) => renderDifficultyRow(item, true))}
    </div>
  );

  return (
    <DashboardWidgetShell
      title="Progress by Difficulty"
      icon={Target}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={!isCompact ? allDifficultiesBreakdown : undefined}
      accentColor="primary"
    >
      <div className="flex-1 flex flex-col">
        {/* Compact: Show mini progress bars */}
        <div className={cn("space-y-3", isCompact && "flex-1")}>
          {visibleProgress.map((item) => renderDifficultyRow(item, true))}
          
          {visibleProgress.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-primary/50 font-rajdhani text-sm">
              No goals created yet
            </div>
          )}
        </div>
      </div>
    </DashboardWidgetShell>
  );
}
