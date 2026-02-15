import { Sparkles } from 'lucide-react';
import { DashboardWidgetShell, WidgetDisplayMode } from './DashboardWidgetShell';
import { Goal } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';
import { getDifficultyColor } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface HabitsModuleProps {
  habits: Goal[];
  customDifficultyColor?: string;
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
}

export function HabitsModule({
  habits,
  customDifficultyColor,
  displayMode = 'compact',
  onToggleDisplayMode,
}: HabitsModuleProps) {
  const navigate = useNavigate();
  const isCompact = displayMode === 'compact';

  const activeHabits = habits.filter(h => h.status !== 'fully_completed');
  const completedHabits = habits.filter(h => h.status === 'fully_completed');
  const visibleHabits = isCompact ? activeHabits.slice(0, 3) : activeHabits;

  const totalChecks = habits.reduce((sum, h) => sum + (h.habit_duration_days || 0), 0);
  const completedChecks = habits.reduce((sum, h) => sum + (h.habit_checks?.filter(Boolean).length || 0), 0);
  const overallPercent = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

  const expandedContent = !isCompact && completedHabits.length > 0 ? (
    <div className="space-y-2">
      <div className="text-[10px] uppercase font-orbitron text-health/70 tracking-wider mb-2">
        Completed Habits
      </div>
      {completedHabits.map(habit => (
        <button
          key={habit.id}
          onClick={() => navigate(`/goals/${habit.id}`)}
          className="w-full text-left p-2 rounded-lg bg-health/5 border border-health/20 hover:border-health/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbitron text-health truncate flex-1 mr-2">{habit.name}</span>
            <span className="text-[10px] font-orbitron text-health">✓</span>
          </div>
        </button>
      ))}
    </div>
  ) : undefined;

  return (
    <DashboardWidgetShell
      title="Habits"
      icon={Sparkles}
      subtitle={`${completedChecks}/${totalChecks} checks`}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={expandedContent}
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
      {habits.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
            <Sparkles className="w-10 h-10 text-primary/40 relative z-10" />
          </div>
          <p className="text-sm text-primary/60 font-rajdhani">No habits yet</p>
          <p className="text-xs text-primary/40 mt-1 font-rajdhani">Create a habit goal to track here</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {/* Overall progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-primary/70 font-rajdhani uppercase">Overall Progress</span>
              <span className="text-primary font-orbitron font-bold">{overallPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-card/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>

          {/* Individual habits */}
          {visibleHabits.map((habit) => {
            const total = habit.habit_duration_days || 1;
            const completed = habit.habit_checks?.filter(Boolean).length || 0;
            const percent = Math.round((completed / total) * 100);
            const diffColor = getDifficultyColor(habit.difficulty || 'easy', customDifficultyColor);

            return (
              <button
                key={habit.id}
                onClick={() => navigate(`/goals/${habit.id}`)}
                className="w-full text-left rounded-lg bg-primary/5 backdrop-blur border border-primary/30 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] overflow-hidden relative p-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: diffColor }}
                    />
                    <span className="text-xs font-orbitron text-primary truncate">{habit.name}</span>
                  </div>
                  <span className="text-[10px] font-rajdhani text-primary/70 ml-2 flex-shrink-0">
                    {completed}/{total}d
                  </span>
                </div>
                <div className="h-1 w-full bg-card/40 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: diffColor,
                      boxShadow: `0 0 8px ${diffColor}60`,
                    }}
                  />
                </div>
              </button>
            );
          })}

          {isCompact && activeHabits.length > 3 && (
            <div className="text-center text-[10px] text-primary/50 font-rajdhani pt-1">
              +{activeHabits.length - 3} more habits
            </div>
          )}
        </div>
      )}
    </DashboardWidgetShell>
  );
}
