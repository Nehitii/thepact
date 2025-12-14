import { Target } from "lucide-react";
import { getDifficultyColor } from "@/lib/utils";

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
  compact?: boolean;
}

export function ProgressByDifficultyModule({
  difficultyProgress,
  customDifficultyName,
  customDifficultyColor,
  compact = false,
}: ProgressByDifficultyModuleProps) {
  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === 'custom' && customDifficultyName) {
      return customDifficultyName;
    }
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const getColor = (difficulty: string) => {
    return getDifficultyColor(difficulty, customDifficultyColor);
  };

  return (
    <div className="relative group animate-fade-in">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl" />
      <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg scan-line overflow-hidden hover:border-primary/50 transition-all">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        <div className="relative z-10">
          <div className={`border-b border-primary/20 ${compact ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                <Target className={`text-primary relative z-10 animate-glow-pulse ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
              </div>
              <h3 className={`font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary ${compact ? 'text-xs' : 'text-sm'}`}>
                Progress by Difficulty
              </h3>
            </div>
          </div>
          <div className={`space-y-4 ${compact ? 'p-4' : 'p-6 space-y-5'}`}>
            {difficultyProgress.map((item) => (
              <div key={item.difficulty} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`rounded border backdrop-blur font-bold uppercase tracking-wider font-orbitron ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}
                      style={{ 
                        borderColor: getColor(item.difficulty),
                        color: getColor(item.difficulty),
                        backgroundColor: `${getColor(item.difficulty)}15`,
                        boxShadow: `0 0 10px ${getColor(item.difficulty)}40`
                      }}
                    >
                      {getDifficultyLabel(item.difficulty)}
                    </div>
                    <span className={`text-primary/50 font-rajdhani ${compact ? 'text-[10px]' : 'text-xs'}`}>
                      {item.completed} / {item.total}
                    </span>
                  </div>
                  <span className={`font-bold font-orbitron ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: getColor(item.difficulty) }}>
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
        </div>
      </div>
    </div>
  );
}
