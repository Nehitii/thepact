import { TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardWidgetShell, WidgetDisplayMode } from './DashboardWidgetShell';
import { Goal } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';

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

  const allGoalsList = (
    <div className="space-y-3">
      {goals.slice(2).map((goal, index) => {
        // Use unified field access with fallback support for both raw DB fields and enriched hook data
        const totalSteps = goal.totalStepsCount ?? goal.total_steps ?? 0;
        const completedSteps = goal.completedStepsCount ?? goal.validated_steps ?? 0;
        const remainingSteps = totalSteps - completedSteps;
        const progressPercent = totalSteps > 0
          ? Math.round((completedSteps / totalSteps) * 100)
          : 0;
        
        return (
          <button
            key={goal.id}
            onClick={() => navigate(`/goals/${goal.id}`)}
            className="w-full text-left p-3 rounded-lg bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-orbitron text-primary truncate flex-1 mr-2">
                {goal.name}
              </span>
              <span className="text-xs font-orbitron text-primary/70">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-card/40 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <DashboardWidgetShell
      title="Focus Goals"
      icon={TrendingUp}
      subtitle="Your starred priorities"
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={!isCompact && goals.length > 2 ? allGoalsList : undefined}
      headerAction={
        <Button 
          size="sm" 
          onClick={() => navigate("/goals")}
          className="h-7 px-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 font-orbitron text-[10px] uppercase tracking-wider"
        >
          View All
        </Button>
      }
      accentColor="primary"
    >
      {goals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
            <TrendingUp className="w-10 h-10 text-primary/40 relative z-10" />
          </div>
          <p className="text-sm text-primary/60 font-rajdhani">No focus goals yet</p>
          <p className="text-xs text-primary/40 mt-1 font-rajdhani">Star goals to see them here</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {visibleGoals.map((goal, index) => {
            // Use unified field access with fallback support for both raw DB fields and enriched hook data
            const totalSteps = goal.totalStepsCount ?? goal.total_steps ?? 0;
            const completedSteps = goal.completedStepsCount ?? goal.validated_steps ?? 0;
            const remainingSteps = totalSteps - completedSteps;
            const progressPercent = totalSteps > 0
              ? Math.round((completedSteps / totalSteps) * 100)
              : 0;
            
            return (
              <button
                key={goal.id}
                onClick={() => navigate(`/goals/${goal.id}`)}
                className="w-full text-left rounded-lg bg-primary/5 backdrop-blur border border-primary/30 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] group/goal overflow-hidden relative"
              >
                {/* Priority badge for top 3 */}
                {index < 3 && (
                  <div className="absolute top-2 left-2 z-20 w-5 h-5 rounded-full bg-primary/80 border border-primary flex items-center justify-center shadow-[0_0_10px_hsl(var(--primary)/0.5)]">
                    <span className="text-[10px] font-bold text-primary-foreground font-orbitron">{index + 1}</span>
                  </div>
                )}
                
                <div className="flex">
                  {/* Goal Image Section */}
                  <div className="relative w-16 h-16 flex-shrink-0 bg-card/30">
                    {goal.image_url ? (
                      <img 
                        src={goal.image_url} 
                        alt={goal.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <Target className="w-6 h-6 text-primary/50" />
                      </div>
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
                  </div>
                  
                  {/* Goal Info Section */}
                  <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                    <h3 className="font-semibold text-xs text-primary font-orbitron drop-shadow-[0_0_5px_hsl(var(--primary)/0.3)] truncate mb-1.5">
                      {goal.name}
                    </h3>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-primary/70 font-rajdhani truncate">
                          {remainingSteps > 0 
                            ? `${remainingSteps} step${remainingSteps > 1 ? 's' : ''} left`
                            : 'Complete!'
                          }
                        </span>
                        <span className="text-primary font-orbitron font-bold ml-2">
                          {progressPercent}%
                        </span>
                      </div>
                      
                      <div className="h-1 w-full bg-card/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          
          {isCompact && goals.length > 2 && (
            <div className="text-center text-[10px] text-primary/50 font-rajdhani pt-1">
              +{goals.length - 2} more focus goals
            </div>
          )}
        </div>
      )}
    </DashboardWidgetShell>
  );
}
