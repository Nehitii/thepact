import { DollarSign } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { NeuralPanel, WidgetDisplayMode } from './NeuralPanel';

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
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-sm bg-[rgba(0,180,255,0.03)] border border-[rgba(0,180,255,0.08)]">
          <div className="text-[9px] uppercase tracking-wider font-orbitron text-[rgba(160,210,255,0.35)] mb-1">
            {isCustomMode ? 'Custom Target' : 'Total Estimated'}
          </div>
          <div className="text-base font-mono font-bold text-[rgba(160,210,255,0.7)] tabular-nums">
            {formatCurrency(totalCostEngaged, currency)}
          </div>
        </div>
        {!isCustomMode && (
          <div className="p-2.5 rounded-sm bg-[rgba(0,180,255,0.03)] border border-[rgba(0,180,255,0.08)]">
            <div className="text-[9px] uppercase tracking-wider font-orbitron text-primary/40 mb-1">Paid / Financed</div>
            <div className="text-base font-mono font-bold text-primary tabular-nums">
              {formatCurrency(totalCostPaid, currency)}
            </div>
          </div>
        )}
      </div>
      <div className="p-2.5 rounded-sm bg-[rgba(255,140,0,0.03)] border border-[rgba(255,140,0,0.1)]">
        <div className="text-[9px] uppercase tracking-wider font-orbitron text-amber-400/50 mb-1">Remaining</div>
        <div className="text-lg font-mono font-bold text-amber-400 tabular-nums">
          {formatCurrency(totalCostRemaining, currency)}
        </div>
      </div>
    </div>
  );

  return (
    <NeuralPanel
      title="Cost Tracking"
      icon={DollarSign}
      subtitle={isCustomMode ? "Custom" : undefined}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={!isCompact ? detailedBreakdown : undefined}
    >
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-3">
          <div className="text-[10px] uppercase tracking-wider font-orbitron text-[rgba(160,210,255,0.3)] mb-1">
            {isCustomMode ? 'Remaining' : 'Left to Finance'}
          </div>
          <div className="text-2xl font-mono font-bold text-primary tabular-nums">
            {formatCurrency(totalCostRemaining, currency)}
          </div>
          <div className="text-[10px] text-[rgba(160,210,255,0.25)] font-mono mt-0.5">
            of {formatCurrency(totalCostEngaged, currency)}
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="relative h-2 w-full bg-[rgba(0,180,255,0.06)] rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/50 transition-all duration-1000 rounded-full"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[rgba(160,210,255,0.3)] font-mono tabular-nums">
              {paidPercentage.toFixed(1)}% financed
            </span>
            {!isCustomMode && (
              <span className="text-primary font-mono tabular-nums">
                {formatCurrency(totalCostPaid, currency)}
              </span>
            )}
          </div>
        </div>
      </div>
    </NeuralPanel>
  );
}
