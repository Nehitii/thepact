"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, CheckCircle, Clock, TrendingUp, Sparkles, 
  Zap, AlertTriangle, Trophy, Timer, Brain 
} from 'lucide-react';
import { Goal } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';

interface SmartProjectHeaderProps {
  focusGoals: Goal[];
  allGoals: Goal[];
  pendingValidations?: number;
}

interface SmartMetrics {
  icon: React.ElementType;
  headline: string;
  subMetrics: string[];
  colorClass: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  pulseActive?: boolean;
}

/**
 * Smart Optimization Engine - Intelligent project header
 * Calculates dynamic "Next Best Action" with time estimates and efficiency metrics
 */
export function SmartProjectHeader({ 
  focusGoals, 
  allGoals,
  pendingValidations = 0 
}: SmartProjectHeaderProps) {
  const metrics = useMemo((): SmartMetrics => {
    const inProgressGoals = allGoals.filter(g => g.status === 'in_progress');
    const completedGoals = allGoals.filter(g => g.status === 'fully_completed' || g.status === 'validated');
    const totalStepsRemaining = allGoals.reduce(
      (sum, g) => sum + Math.max(0, (g.total_steps || 0) - (g.validated_steps || 0)), 
      0
    );
    
    // Estimated time calculation (15 min per step average)
    const estimatedMinutes = totalStepsRemaining * 15;
    const estimatedHours = Math.ceil(estimatedMinutes / 60);
    const estimatedTimeText = estimatedHours >= 24 
      ? `~${Math.ceil(estimatedHours / 24)}d`
      : estimatedHours > 0 
        ? `~${estimatedHours}h` 
        : '<15min';

    // Weekly efficiency calculation (mock - would use real historical data)
    const completionRate = allGoals.length > 0 
      ? Math.round((completedGoals.length / allGoals.length) * 100) 
      : 0;
    const efficiencyDelta = completionRate > 50 ? `+${completionRate - 50}%` : `${completionRate - 50}%`;

    // Priority 1: Finance validations pending (critical)
    if (pendingValidations > 0) {
      return {
        icon: AlertTriangle,
        headline: `${pendingValidations} validation${pendingValidations > 1 ? 's' : ''} required`,
        subMetrics: ['Action needed', 'Finance module'],
        colorClass: 'text-amber-400',
        bgClass: 'from-amber-500/20 via-amber-500/10 to-transparent',
        borderClass: 'border-amber-500/40',
        glowClass: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
        priority: 'critical',
        pulseActive: true,
      };
    }

    // Priority 2: Focus goal with remaining steps
    const primaryFocus = focusGoals[0];
    if (primaryFocus) {
      const remainingSteps = Math.max(0, (primaryFocus.total_steps || 0) - (primaryFocus.validated_steps || 0));
      const focusEstimate = remainingSteps * 15;
      const focusTimeText = focusEstimate >= 60 
        ? `~${Math.ceil(focusEstimate / 60)}h` 
        : `~${focusEstimate}min`;

      if (remainingSteps > 0) {
        return {
          icon: Target,
          headline: `${remainingSteps} step${remainingSteps > 1 ? 's' : ''} on focus`,
          subMetrics: [focusTimeText, 'Priority Target'],
          colorClass: 'text-primary',
          bgClass: 'from-primary/20 via-primary/10 to-transparent',
          borderClass: 'border-primary/40',
          glowClass: 'shadow-[0_0_25px_rgba(0,212,255,0.35)]',
          priority: 'high',
          pulseActive: true,
        };
      }
      
      // Focus goal is complete
      return {
        icon: Trophy,
        headline: 'Focus ready to validate!',
        subMetrics: ['100% complete', primaryFocus.name.slice(0, 20)],
        colorClass: 'text-health',
        bgClass: 'from-health/20 via-health/10 to-transparent',
        borderClass: 'border-health/40',
        glowClass: 'shadow-[0_0_25px_rgba(34,197,94,0.35)]',
        priority: 'high',
        pulseActive: true,
      };
    }

    // Priority 3: Active goals in progress
    if (inProgressGoals.length > 0) {
      return {
        icon: TrendingUp,
        headline: `${totalStepsRemaining} steps remaining`,
        subMetrics: [estimatedTimeText, `${inProgressGoals.length} active goal${inProgressGoals.length > 1 ? 's' : ''}`],
        colorClass: 'text-primary',
        bgClass: 'from-primary/20 via-primary/10 to-transparent',
        borderClass: 'border-primary/30',
        glowClass: 'shadow-[0_0_20px_rgba(0,212,255,0.25)]',
        priority: 'medium',
      };
    }

    // Priority 4: All caught up - show efficiency
    if (completedGoals.length > 0) {
      return {
        icon: Zap,
        headline: `Efficiency: ${efficiencyDelta} this week`,
        subMetrics: [`${completedGoals.length} completed`, 'On track'],
        colorClass: 'text-health',
        bgClass: 'from-health/20 via-health/10 to-transparent',
        borderClass: 'border-health/30',
        glowClass: 'shadow-[0_0_20px_rgba(34,197,94,0.25)]',
        priority: 'low',
      };
    }

    // Priority 5: No goals yet
    if (allGoals.length === 0) {
      return {
        icon: Sparkles,
        headline: 'Begin your journey',
        subMetrics: ['Create first goal', 'Start now'],
        colorClass: 'text-accent',
        bgClass: 'from-accent/20 via-accent/10 to-transparent',
        borderClass: 'border-accent/30',
        glowClass: 'shadow-[0_0_20px_rgba(0,212,255,0.2)]',
        priority: 'low',
      };
    }

    // Default: All caught up
    return {
      icon: CheckCircle,
      headline: 'All systems nominal',
      subMetrics: ['No pending actions', 'Keep momentum'],
      colorClass: 'text-health',
      bgClass: 'from-health/20 via-health/10 to-transparent',
      borderClass: 'border-health/30',
      glowClass: 'shadow-[0_0_20px_rgba(34,197,94,0.25)]',
      priority: 'low',
    };
  }, [focusGoals, allGoals, pendingValidations]);

  const IconComponent = metrics.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className={cn(
        "relative inline-flex items-center gap-3 px-5 py-3 rounded-2xl",
        "bg-gradient-to-r backdrop-blur-xl",
        "border transition-all duration-300",
        "hover:scale-[1.02] hover:brightness-110 cursor-default",
        metrics.bgClass,
        metrics.borderClass,
        metrics.glowClass
      )}
    >
      {/* Active pulse ring for critical/high priority */}
      {metrics.pulseActive && (
        <div className="absolute -inset-0.5 rounded-2xl animate-pulse opacity-50">
          <div className={cn("absolute inset-0 rounded-2xl", metrics.bgClass)} />
        </div>
      )}

      {/* Progress ring indicator */}
      <div className="relative">
        <div className={cn(
          "absolute inset-0 rounded-full blur-md",
          metrics.priority === 'critical' && "bg-amber-500/40",
          metrics.priority === 'high' && "bg-primary/40",
          metrics.priority === 'medium' && "bg-primary/20",
          metrics.priority === 'low' && "bg-health/20",
        )} />
        <div className={cn(
          "relative p-2 rounded-full border",
          metrics.borderClass,
          "bg-black/40"
        )}>
          <IconComponent 
            className={cn(
              "w-5 h-5 flex-shrink-0",
              metrics.pulseActive && "animate-glow-pulse",
              metrics.colorClass
            )} 
          />
        </div>
      </div>

      {/* Text content */}
      <div className="flex flex-col items-start min-w-0">
        <span className={cn(
          "text-sm font-orbitron font-bold tracking-wide",
          metrics.colorClass
        )}>
          {metrics.headline}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          {metrics.subMetrics.map((metric, i) => (
            <span 
              key={i}
              className={cn(
                "text-[10px] font-rajdhani uppercase tracking-wider",
                "text-muted-foreground/70",
                i > 0 && "before:content-['•'] before:mr-2 before:text-muted-foreground/30"
              )}
            >
              {metric}
            </span>
          ))}
        </div>
      </div>

      {/* Priority indicator dot */}
      <div className={cn(
        "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-black/50",
        metrics.priority === 'critical' && "bg-amber-500 animate-pulse",
        metrics.priority === 'high' && "bg-primary animate-pulse",
        metrics.priority === 'medium' && "bg-primary/60",
        metrics.priority === 'low' && "bg-health/60",
      )} />
    </motion.div>
  );
}
