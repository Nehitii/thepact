import { useMemo } from 'react';
import { Target, CheckCircle, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { Goal } from '@/hooks/useGoals';

interface TodaysFocusMessageProps {
  focusGoals: Goal[];
  allGoals: Goal[];
  pendingValidations?: number;
}

export function TodaysFocusMessage({ 
  focusGoals, 
  allGoals,
  pendingValidations = 0 
}: TodaysFocusMessageProps) {
  const message = useMemo(() => {
    // Priority 1: Pending finance validations
    if (pendingValidations > 0) {
      return {
        icon: Clock,
        text: `${pendingValidations} finance validation${pendingValidations > 1 ? 's' : ''} pending`,
        color: 'text-amber-400',
      };
    }

    // Priority 2: Focus goal with remaining steps
    const primaryFocus = focusGoals[0];
    if (primaryFocus) {
      const remainingSteps = (primaryFocus.total_steps || 0) - (primaryFocus.validated_steps || 0);
      if (remainingSteps > 0) {
        return {
          icon: Target,
          text: `${remainingSteps} step${remainingSteps > 1 ? 's' : ''} remaining on "${primaryFocus.name}"`,
          color: 'text-primary',
        };
      }
      // Focus goal is complete
      return {
        icon: CheckCircle,
        text: `"${primaryFocus.name}" is ready for validation!`,
        color: 'text-health',
      };
    }

    // Priority 3: Goals in progress
    const inProgressGoals = allGoals.filter(g => g.status === 'in_progress');
    if (inProgressGoals.length > 0) {
      const totalRemainingSteps = inProgressGoals.reduce(
        (sum, g) => sum + ((g.total_steps || 0) - (g.validated_steps || 0)), 
        0
      );
      return {
        icon: TrendingUp,
        text: `${totalRemainingSteps} steps across ${inProgressGoals.length} active goal${inProgressGoals.length > 1 ? 's' : ''}`,
        color: 'text-primary',
      };
    }

    // Priority 4: No goals yet
    if (allGoals.length === 0) {
      return {
        icon: Sparkles,
        text: 'Create your first goal to begin your journey',
        color: 'text-accent',
      };
    }

    // Default: All caught up
    return {
      icon: CheckCircle,
      text: 'All caught up! Keep the momentum going.',
      color: 'text-health',
    };
  }, [focusGoals, allGoals, pendingValidations]);

  const IconComponent = message.icon;

  return (
    <div className="flex items-center justify-center gap-2 text-sm animate-fade-in">
      <IconComponent className={`w-4 h-4 ${message.color}`} />
      <span className={`font-rajdhani tracking-wide ${message.color}`}>
        {message.text}
      </span>
    </div>
  );
}
