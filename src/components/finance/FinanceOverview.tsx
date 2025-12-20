import { useMemo } from 'react';
import { Target, Wallet, TrendingUp, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { usePact } from '@/hooks/usePact';
import { useGoals } from '@/hooks/useGoals';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInMonths, differenceInDays, format, parseISO, addMonths } from 'date-fns';

interface FinanceOverviewProps {
  projectFundingTarget: number;
  projectMonthlyAllocation: number;
  onEditSettings: () => void;
}

export function FinanceOverview({ 
  projectFundingTarget, 
  projectMonthlyAllocation,
  onEditSettings 
}: FinanceOverviewProps) {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);

  // Calculate totals from goals
  const { totalEstimatedCost, totalPaid, totalRemaining } = useMemo(() => {
    const total = goals.reduce((sum, g) => sum + (g.estimated_cost || 0), 0);
    // For now, assume paid is 0 until we track actual spending per goal
    const paid = 0;
    return {
      totalEstimatedCost: projectFundingTarget || total,
      totalPaid: paid,
      totalRemaining: (projectFundingTarget || total) - paid,
    };
  }, [goals, projectFundingTarget]);

  // Calculate timeline
  const projectEndDate = pact?.project_end_date ? parseISO(pact.project_end_date) : null;
  const today = new Date();
  const monthsRemaining = projectEndDate ? differenceInMonths(projectEndDate, today) : null;
  const daysRemaining = projectEndDate ? differenceInDays(projectEndDate, today) : null;

  // Calculate if on track
  const monthsToComplete = projectMonthlyAllocation > 0 
    ? Math.ceil(totalRemaining / projectMonthlyAllocation) 
    : null;
  
  const isOnTrack = monthsToComplete !== null && monthsRemaining !== null && monthsToComplete <= monthsRemaining;
  const monthsOverDeadline = monthsToComplete !== null && monthsRemaining !== null 
    ? Math.max(0, monthsToComplete - monthsRemaining)
    : 0;

  const progressPercentage = totalEstimatedCost > 0 ? (totalPaid / totalEstimatedCost) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Main Funding Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/10 rounded-xl blur-2xl opacity-50" />
        <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/40 rounded-xl p-6 overflow-hidden">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-primary/50 rounded-tl-xl" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-primary/50 rounded-br-xl" />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/20 border border-primary/30">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-orbitron font-bold text-primary tracking-wider">
                  PROJECT FINANCING
                </h2>
                <p className="text-sm text-muted-foreground font-rajdhani">
                  Your journey to completion
                </p>
              </div>
            </div>
            <button
              onClick={onEditSettings}
              className="text-xs font-rajdhani text-primary/70 hover:text-primary transition-colors"
            >
              Edit Settings
            </button>
          </div>

          {/* Main Numbers Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Total Target */}
            <div className="text-center">
              <p className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider mb-2">
                Total Target
              </p>
              <p className="text-3xl font-orbitron font-bold text-primary drop-shadow-[0_0_15px_rgba(91,180,255,0.5)]">
                {formatCurrency(totalEstimatedCost, currency)}
              </p>
            </div>

            {/* Already Funded */}
            <div className="text-center border-x border-primary/20">
              <p className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider mb-2">
                Already Funded
              </p>
              <p className="text-3xl font-orbitron font-bold text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                {formatCurrency(totalPaid, currency)}
              </p>
            </div>

            {/* Remaining */}
            <div className="text-center">
              <p className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider mb-2">
                Remaining
              </p>
              <p className="text-3xl font-orbitron font-bold text-accent drop-shadow-[0_0_15px_rgba(91,180,255,0.5)]">
                {formatCurrency(totalRemaining, currency)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-rajdhani text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-card/50 rounded-full overflow-hidden border border-primary/20">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(91,180,255,0.5)]"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Deadline Info */}
          {projectEndDate && (
            <div className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
              isOnTrack 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-orange-500/10 border-orange-500/30'
            }`}>
              {isOnTrack ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-400" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-rajdhani ${isOnTrack ? 'text-green-400' : 'text-orange-400'}`}>
                  {isOnTrack 
                    ? "You are on track to meet your goal."
                    : `At this pace, you will exceed your target date by ${monthsOverDeadline} month${monthsOverDeadline !== 1 ? 's' : ''}.`
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-rajdhani">Target Date</p>
                <p className="text-sm font-orbitron text-primary">
                  {format(projectEndDate, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monthly Allocation */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-card/20 backdrop-blur-xl border border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-4 w-4 text-primary/70" />
              <span className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider">
                Monthly Allocation
              </span>
            </div>
            <p className="text-2xl font-orbitron font-bold text-primary">
              {formatCurrency(projectMonthlyAllocation, currency)}
            </p>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-card/20 backdrop-blur-xl border border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-4 w-4 text-primary/70" />
              <span className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider">
                Time Remaining
              </span>
            </div>
            <p className="text-2xl font-orbitron font-bold text-primary">
              {daysRemaining !== null ? (
                <>{daysRemaining} <span className="text-sm text-muted-foreground">days</span></>
              ) : (
                <span className="text-sm text-muted-foreground">No deadline set</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
