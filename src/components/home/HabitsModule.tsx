import { Sparkles } from 'lucide-react';
import { NeuralPanel, WidgetDisplayMode } from './NeuralPanel';
import { Goal } from '@/hooks/useGoals';
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
      <div className="text-[10px] uppercase font-orbitron text-emerald-400/50 tracking-wider mb-2">Completed</div>
      {completedHabits.map(habit => (
        <button
          key={habit.id}
          onClick={() => navigate(`/goals/${habit.id}`)}
          className="w-full text-left p-2 rounded-sm bg-[rgba(0,255,136,0.03)] border border-[rgba(0,255,136,0.08)] hover:border-[rgba(0,255,136,0.2)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-rajdhani text-emerald-400/70 truncate flex-1 mr-2">{habit.name}</span>
            <span className="text-[10px] font-mono text-emerald-400">✓</span>
          </div>
        </button>
      ))}
    </div>
  ) : undefined;

  return (
    <NeuralPanel
      title="Habits"
      icon={Sparkles}
      subtitle={`${completedChecks}/${totalChecks}`}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={expandedContent}
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
      {habits.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <Sparkles className="w-8 h-8 text-[rgba(160,210,255,0.15)] mb-2" />
          <p className="text-xs text-[rgba(160,210,255,0.35)] font-rajdhani">No habits yet</p>
          <p className="text-[10px] text-[rgba(160,210,255,0.2)] mt-0.5 font-rajdhani">Create a habit goal to track here</p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1">
          {/* Overall bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[rgba(160,210,255,0.35)] font-rajdhani uppercase">Overall</span>
              <span className="text-primary font-mono tabular-nums">{overallPercent}%</span>
            </div>
            <div className="h-1 w-full bg-[rgba(0,180,255,0.06)] rounded-full overflow-hidden">
              <div className="h-full bg-primary/50 transition-all duration-500 rounded-full" style={{ width: `${overallPercent}%` }} />
            </div>
          </div>

          {visibleHabits.map((habit) => {
            const total = habit.habit_duration_days || 1;
            const completed = habit.habit_checks?.filter(Boolean).length || 0;
            const percent = Math.round((completed / total) * 100);
            const diffColor = getDifficultyColor(habit.difficulty || 'easy', customDifficultyColor);

            return (
              <button
                key={habit.id}
                onClick={() => navigate(`/goals/${habit.id}`)}
                className="w-full text-left rounded-sm bg-[rgba(0,180,255,0.03)] border border-[rgba(0,180,255,0.08)] hover:border-[rgba(0,210,255,0.2)] transition-all p-2.5"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: diffColor }} />
                    <span className="text-xs font-rajdhani text-[rgba(160,210,255,0.7)] truncate">{habit.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[rgba(160,210,255,0.4)] ml-2 flex-shrink-0 tabular-nums">
                    {completed}/{total}d
                  </span>
                </div>
                <div className="h-1 w-full bg-[rgba(0,180,255,0.06)] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: diffColor, opacity: 0.6 }}
                  />
                </div>
              </button>
            );
          })}

          {isCompact && activeHabits.length > 3 && (
            <div className="text-center text-[10px] text-[rgba(160,210,255,0.25)] font-mono pt-1">
              +{activeHabits.length - 3} more
            </div>
          )}
        </div>
      )}
    </NeuralPanel>
  );
}
