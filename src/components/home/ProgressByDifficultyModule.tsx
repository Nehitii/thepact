import { Target } from "lucide-react";
import { getDifficultyColor } from "@/lib/utils";
import { DashboardWidgetShell, WidgetDisplayMode } from './DashboardWidgetShell';
import { cn } from "@/lib/utils";

interface DifficultyProgress {
  difficulty: string;
  completed: number;
  total: number;
  percentage: number;
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

  const allDifficultiesBreakdown = (
    <div className="space-y-3">
      {difficultyProgress.map((item) => (
        <div key={item.difficulty} className="space-y-1.5">
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
              <span className="text-[10px] text-primary/50 font-rajdhani">
                {item.completed} / {item.total}
              </span>
            </div>
            <span className="text-xs font-bold font-orbitron" style={{ color: getColor(item.difficulty) }}>
              {item.percentage.toFixed(0)}%
            </span>
          </div>
          <div className="relative h-2 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/10">
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
      ))}
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
          {visibleProgress.map((item) => (
            <div key={item.difficulty} className="space-y-1.5">
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
                  <span className="text-[10px] text-primary/50 font-rajdhani">
                    {item.completed} / {item.total}
                  </span>
                </div>
                <span className="text-xs font-bold font-orbitron" style={{ color: getColor(item.difficulty) }}>
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="relative h-2 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/10">
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
          ))}
          
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
