import { TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NeuralPanel, WidgetDisplayMode } from './NeuralPanel';
import { Goal } from '@/hooks/useGoals';

interface FocusGoalsModuleProps {
  goals: Goal[];
  navigate: (path: string) => void;
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
}

export function FocusGoalsModule({ 
  goals, 
  navigate, 
  displayMode = 'compact',
  onToggleDisplayMode,
}: FocusGoalsModuleProps) {
  const isCompact = displayMode === 'compact';
  const visibleGoals = isCompact ? goals.slice(0, 2) : goals;

  const allGoalsList = goals.length > 2 ? (
    <div className="space-y-2">
      {goals.slice(2).map((goal) => {
        const totalSteps = goal.totalStepsCount ?? goal.total_steps ?? 0;
        const completedSteps = goal.completedStepsCount ?? goal.validated_steps ?? 0;
        const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        return (
          <button
            key={goal.id}
            onClick={() => navigate(`/goals/${goal.id}`)}
            className="w-full text-left p-2.5 rounded-sm bg-[rgba(0,180,255,0.03)] border border-[rgba(0,180,255,0.08)] hover:border-[rgba(0,210,255,0.2)] transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-rajdhani text-[rgba(160,210,255,0.7)] truncate flex-1 mr-2">{goal.name}</span>
              <span className="text-[10px] font-mono text-primary tabular-nums">{progressPercent}%</span>
            </div>
            <div className="h-1 w-full bg-[rgba(0,180,255,0.06)] rounded-full overflow-hidden">
              <div className="h-full bg-primary/60 transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  ) : undefined;

  return (
    <NeuralPanel
      title="Focus Goals"
      icon={TrendingUp}
      subtitle="Starred priorities"
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={!isCompact ? allGoalsList : undefined}
      headerAction={
        <Button 
          size="sm" 
          onClick={() => navigate("/goals")}
          className="h-6 px-2 bg-transparent hover:bg-[rgba(0,180,255,0.05)] text-[rgba(160,210,255,0.4)] hover:text-[rgba(160,210,255,0.7)] border border-[rgba(0,180,255,0.1)] hover:border-[rgba(0,180,255,0.2)] font-orbitron text-[9px] uppercase tracking-wider rounded-sm"
        >
          View All
        </Button>
      }
    >
      {goals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <TrendingUp className="w-8 h-8 text-[rgba(160,210,255,0.15)] mb-2" />
          <p className="text-xs text-[rgba(160,210,255,0.35)] font-rajdhani">No focus goals yet</p>
          <p className="text-[10px] text-[rgba(160,210,255,0.2)] mt-0.5 font-rajdhani">Star goals to see them here</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {visibleGoals.map((goal) => {
            const totalSteps = goal.totalStepsCount ?? goal.total_steps ?? 0;
            const completedSteps = goal.completedStepsCount ?? goal.validated_steps ?? 0;
            const remainingSteps = totalSteps - completedSteps;
            const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
            
            return (
              <button
                key={goal.id}
                onClick={() => navigate(`/goals/${goal.id}`)}
                className="w-full text-left rounded-sm bg-[rgba(0,180,255,0.03)] border border-[rgba(0,180,255,0.08)] hover:border-[rgba(0,210,255,0.2)] transition-all overflow-hidden"
              >
                <div className="flex">
                  <div className="relative w-14 h-14 flex-shrink-0 bg-[rgba(0,180,255,0.02)]">
                    {goal.image_url ? (
                      <img src={goal.image_url} alt={goal.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Target className="w-5 h-5 text-[rgba(160,210,255,0.15)]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-2.5 flex flex-col justify-center min-w-0">
                    <h3 className="font-rajdhani text-xs text-[rgba(160,210,255,0.75)] truncate mb-1">
                      {goal.name}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-[rgba(160,210,255,0.35)] font-rajdhani">
                        {remainingSteps > 0 ? `${remainingSteps} step${remainingSteps > 1 ? 's' : ''} left` : 'Complete!'}
                      </span>
                      <span className="text-primary font-mono tabular-nums">{progressPercent}%</span>
                    </div>
                    <div className="h-1 w-full bg-[rgba(0,180,255,0.06)] rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {isCompact && goals.length > 2 && (
            <div className="text-center text-[10px] text-[rgba(160,210,255,0.25)] font-mono pt-1">
              +{goals.length - 2} more
            </div>
          )}
        </div>
      )}
    </NeuralPanel>
  );
}
