import { Target, Star, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatsBadgesProps {
  totalGoals: number;
  completedGoals: number;
  focusGoalName: string | null;
  daysRemaining: number | null;
  className?: string;
}

/**
 * Compact stat badges row showing key metrics at a glance.
 * Stacks vertically on mobile, horizontal on larger screens.
 */
export function QuickStatsBadges({
  totalGoals,
  completedGoals,
  focusGoalName,
  daysRemaining,
  className,
}: QuickStatsBadgesProps) {
  const completionRate = totalGoals > 0 
    ? Math.round((completedGoals / totalGoals) * 100) 
    : 0;

  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-2xl mx-auto",
      className
    )}>
      {/* Goals Progress */}
      <StatBadge
        icon={Target}
        label="Goals"
        value={`${completedGoals}/${totalGoals}`}
        subtext={`${completionRate}% complete`}
        accentColor="hsl(var(--primary))"
      />

      {/* Current Focus */}
      <StatBadge
        icon={Star}
        label="Focus"
        value={focusGoalName || '—'}
        subtext={focusGoalName ? 'Active target' : 'None set'}
        accentColor="hsl(45 95% 55%)"
        truncateValue
      />

      {/* Timeline */}
      <StatBadge
        icon={Calendar}
        label="Timeline"
        value={daysRemaining !== null ? `${daysRemaining}` : '—'}
        subtext={daysRemaining !== null ? 'days left' : 'Not set'}
        accentColor="hsl(200 100% 67%)"
      />
    </div>
  );
}

interface StatBadgeProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  accentColor: string;
  truncateValue?: boolean;
}

function StatBadge({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  accentColor,
  truncateValue = false,
}: StatBadgeProps) {
  return (
    <div className="relative group">
      {/* Subtle hover glow */}
      <div 
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
        style={{ background: `${accentColor}20` }}
      />
      
      <div className="relative flex items-center gap-3 px-4 py-3 bg-card/30 backdrop-blur-sm border border-primary/20 rounded-lg hover:border-primary/40 transition-all">
        {/* Icon */}
        <div 
          className="flex items-center justify-center w-8 h-8 rounded-md"
          style={{ background: `${accentColor}15` }}
        >
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-orbitron block">
            {label}
          </span>
          <span 
            className={cn(
              "text-sm font-bold font-orbitron",
              truncateValue && "truncate block max-w-[100px]"
            )}
            style={{ color: accentColor }}
          >
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground/50 font-rajdhani">
            {subtext}
          </span>
        </div>
      </div>
    </div>
  );
}
