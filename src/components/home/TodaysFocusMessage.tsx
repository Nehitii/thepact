import { useMemo } from 'react';
import { Target, CheckCircle, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Goal } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';

interface TodaysFocusMessageProps {
  focusGoals: Goal[];
  allGoals: Goal[];
  pendingValidations?: number;
}

/**
 * Premium glassmorphism pill displaying contextual focus message.
 * Features animated icon glow and message-type-based theming.
 */
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
        colorClass: 'text-amber-400',
        bgClass: 'from-amber-500/20 via-amber-500/10 to-transparent',
        borderClass: 'border-amber-500/30',
        glowClass: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
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
          colorClass: 'text-primary',
          bgClass: 'from-primary/20 via-primary/10 to-transparent',
          borderClass: 'border-primary/30',
          glowClass: 'shadow-[0_0_20px_rgba(0,212,255,0.3)]',
        };
      }
      // Focus goal is complete
      return {
        icon: CheckCircle,
        text: `"${primaryFocus.name}" is ready for validation!`,
        colorClass: 'text-health',
        bgClass: 'from-health/20 via-health/10 to-transparent',
        borderClass: 'border-health/30',
        glowClass: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
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
        colorClass: 'text-primary',
        bgClass: 'from-primary/20 via-primary/10 to-transparent',
        borderClass: 'border-primary/30',
        glowClass: 'shadow-[0_0_20px_rgba(0,212,255,0.3)]',
      };
    }

    // Priority 4: No goals yet
    if (allGoals.length === 0) {
      return {
        icon: Sparkles,
        text: 'Create your first goal to begin your journey',
        colorClass: 'text-accent',
        bgClass: 'from-accent/20 via-accent/10 to-transparent',
        borderClass: 'border-accent/30',
        glowClass: 'shadow-[0_0_20px_rgba(0,212,255,0.2)]',
      };
    }

    // Default: All caught up
    return {
      icon: CheckCircle,
      text: 'All caught up! Keep the momentum going.',
      colorClass: 'text-health',
      bgClass: 'from-health/20 via-health/10 to-transparent',
      borderClass: 'border-health/30',
      glowClass: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    };
  }, [focusGoals, allGoals, pendingValidations]);

  const IconComponent = message.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full",
        "bg-gradient-to-r backdrop-blur-xl",
        "border transition-all duration-300",
        "hover:scale-[1.02] hover:brightness-110",
        message.bgClass,
        message.borderClass,
        message.glowClass
      )}
    >
      <IconComponent 
        className={cn(
          "w-4 h-4 flex-shrink-0 animate-glow-pulse",
          message.colorClass
        )} 
      />
      <span 
        className={cn(
          "text-sm font-rajdhani tracking-wide font-medium",
          message.colorClass
        )}
      >
        {message.text}
      </span>
    </motion.div>
  );
}
