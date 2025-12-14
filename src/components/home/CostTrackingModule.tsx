import { DollarSign } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";

interface CostTrackingModuleProps {
  totalCostEngaged: number;
  totalCostPaid: number;
  compact?: boolean;
}

export function CostTrackingModule({
  totalCostEngaged,
  totalCostPaid,
  compact = false,
}: CostTrackingModuleProps) {
  const { currency } = useCurrency();
  const totalCostRemaining = totalCostEngaged - totalCostPaid;
  const paidPercentage = totalCostEngaged > 0 ? (totalCostPaid / totalCostEngaged) * 100 : 0;

  return (
    <div className="relative group animate-fade-in">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl" />
      <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden hover:border-primary/50 transition-all">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        <div className="relative z-10">
          <div className={`border-b border-primary/20 ${compact ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                <DollarSign className={`text-primary relative z-10 animate-glow-pulse ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
              </div>
              <h3 className={`font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary ${compact ? 'text-xs' : 'text-sm'}`}>
                Cost Tracking
              </h3>
            </div>
          </div>
          <div className={compact ? 'p-4' : 'p-6'}>
            <div className={`space-y-3 ${compact ? '' : 'space-y-4'}`}>
              <div className={`space-y-2 ${compact ? 'space-y-1.5' : ''}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary/50 uppercase tracking-wider font-rajdhani">Total Estimated</span>
                  <span className={`font-bold text-foreground font-orbitron ${compact ? 'text-xs' : ''}`}>{formatCurrency(totalCostEngaged, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary/50 uppercase tracking-wider font-rajdhani">Paid / Financed</span>
                  <span className={`font-bold text-primary font-orbitron ${compact ? 'text-xs' : ''}`}>{formatCurrency(totalCostPaid, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary/50 uppercase tracking-wider font-rajdhani">Remaining</span>
                  <span className={`font-bold text-foreground font-orbitron ${compact ? 'text-xs' : ''}`}>{formatCurrency(totalCostRemaining, currency)}</span>
                </div>
              </div>
              <div className="relative h-2 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/20">
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
              <p className={`text-primary/60 text-right uppercase tracking-wider font-rajdhani ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                {paidPercentage.toFixed(1)}% paid/financed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
