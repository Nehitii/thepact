import { DollarSign } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { DashboardWidgetShell, WidgetDisplayMode } from './DashboardWidgetShell';

interface CostTrackingModuleProps {
  totalCostEngaged: number;
  totalCostPaid: number;
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
  isCustomMode?: boolean;
}

export function CostTrackingModule({
  totalCostEngaged,
  totalCostPaid,
  displayMode = 'compact',
  onToggleDisplayMode,
  isCustomMode = false,
}: CostTrackingModuleProps) {
  const { currency } = useCurrency();
  const isCompact = displayMode === 'compact';
  const totalCostRemaining = totalCostEngaged - totalCostPaid;
  const paidPercentage = totalCostEngaged > 0 ? (totalCostPaid / totalCostEngaged) * 100 : 0;

  const detailedBreakdown = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-card/30 border border-primary/20">
          <div className="text-[10px] uppercase tracking-wider font-orbitron text-primary/50 mb-1">
            {isCustomMode ? 'Custom Target' : 'Total Estimated'}
          </div>
          <div className="text-lg font-bold text-foreground font-orbitron">
            {formatCurrency(totalCostEngaged, currency)}
          </div>
        </div>
        {!isCustomMode && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/30">
            <div className="text-[10px] uppercase tracking-wider font-orbitron text-primary/50 mb-1">
              Paid / Financed
            </div>
            <div className="text-lg font-bold text-primary font-orbitron">
              {formatCurrency(totalCostPaid, currency)}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3 rounded-lg bg-accent/5 border border-accent/30">
        <div className="text-[10px] uppercase tracking-wider font-orbitron text-accent/70 mb-1">
          Remaining to Fund
        </div>
        <div className="text-xl font-bold text-accent font-orbitron">
          {formatCurrency(totalCostRemaining, currency)}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardWidgetShell
      title="Cost Tracking"
      icon={DollarSign}
      subtitle={isCustomMode ? "Custom mode" : undefined}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={!isCompact ? detailedBreakdown : undefined}
      accentColor="primary"
    >
      <div className="flex-1 flex flex-col justify-center">
        {/* Main metric display */}
        <div className="text-center mb-4">
          <div className="text-[10px] uppercase tracking-wider font-orbitron text-primary/50 mb-1">
            {isCustomMode ? 'Remaining' : 'Left to Finance'}
          </div>
          <div className="text-3xl font-bold text-primary font-orbitron drop-shadow-[0_0_15px_rgba(91,180,255,0.5)]">
            {formatCurrency(totalCostRemaining, currency)}
          </div>
          <div className="text-xs text-primary/60 font-rajdhani mt-1">
            of {formatCurrency(totalCostEngaged, currency)} total
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="relative h-3 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/20">
            <div
              className="h-full bg-gradient-to-r from-primary via-accent to-primary/80 transition-all duration-1000"
              style={{ 
                width: `${paidPercentage}%`,
                boxShadow: '0 0 15px rgba(91, 180, 255, 0.5)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-primary/50 uppercase tracking-wider font-rajdhani">
              {paidPercentage.toFixed(1)}% financed
            </span>
            {!isCustomMode && (
              <span className="text-primary font-orbitron">
                {formatCurrency(totalCostPaid, currency)}
              </span>
            )}
          </div>
        </div>
        
        {isCustomMode && (
          <div className="text-[9px] text-primary/40 uppercase tracking-wider font-rajdhani text-center mt-2">
            Custom mode • Not linked to goals
          </div>
        )}
      </div>
    </DashboardWidgetShell>
  );
}
