import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Target, DollarSign, CheckCircle2 } from "lucide-react";
import { getDifficultyColor } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";

interface DifficultyProgress {
  difficulty: string;
  completed: number;
  total: number;
  percentage: number;
}

interface TimelineData {
  date: string;
  points: number;
  progress: number;
  steps: number;
}

interface PactDashboardProps {
  difficultyProgress: DifficultyProgress[];
  totalCostEngaged: number;
  totalCostPaid: number;
  customDifficultyName?: string;
  customDifficultyColor?: string;
}

export function PactDashboard({
  difficultyProgress,
  totalCostEngaged,
  totalCostPaid,
  customDifficultyName,
  customDifficultyColor,
}: PactDashboardProps) {
  const { currency } = useCurrency();
  const totalCostRemaining = totalCostEngaged - totalCostPaid;
  const paidPercentage = totalCostEngaged > 0 ? (totalCostPaid / totalCostEngaged) * 100 : 0;

  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === 'custom' && customDifficultyName) {
      return customDifficultyName;
    }
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const getColor = (difficulty: string) => {
    return getDifficultyColor(difficulty, customDifficultyColor);
  };

  return (
    <div className="space-y-6">
      {/* Progress by Difficulty - Dark HUD */}
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/5 blur-xl" />
        <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg double-border scan-line">
          <div className="p-6 border-b border-primary/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                <Target className="h-5 w-5 text-primary relative z-10 animate-glow-pulse" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                Progress by Difficulty
              </h3>
            </div>
          </div>
          <div className="p-6 space-y-5">
            {difficultyProgress.map((item) => (
              <div key={item.difficulty} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="px-3 py-1 rounded border backdrop-blur text-xs font-bold uppercase tracking-wider font-orbitron"
                      style={{ 
                        borderColor: getColor(item.difficulty),
                        color: getColor(item.difficulty),
                        backgroundColor: `${getColor(item.difficulty)}15`,
                        boxShadow: `0 0 10px ${getColor(item.difficulty)}40`
                      }}
                    >
                      {getDifficultyLabel(item.difficulty)}
                    </div>
                    <span className="text-xs text-primary/50 font-rajdhani">
                      {item.completed} / {item.total}
                    </span>
                  </div>
                  <span className="text-sm font-bold font-orbitron" style={{ color: getColor(item.difficulty) }}>
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-2 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/10">
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: getColor(item.difficulty),
                      boxShadow: `0 0 15px ${getColor(item.difficulty)}80`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Tracking - Dark HUD */}
      <div className="relative group">
        <div className="absolute inset-0 bg-finance/5 blur-xl" />
        <div className="relative bg-card/20 backdrop-blur-xl border-2 border-finance/30 rounded-lg double-border">
          <div className="p-6 border-b border-finance/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-finance/20 blur-md rounded-full" />
                <DollarSign className="h-5 w-5 text-finance relative z-10 animate-glow-pulse" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-finance via-finance to-finance">
                Cost Tracking
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary/50 uppercase tracking-wider font-rajdhani">Total Estimated</span>
                  <span className="font-bold text-foreground font-orbitron">{formatCurrency(totalCostEngaged, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary/50 uppercase tracking-wider font-rajdhani">Paid / Financed</span>
                  <span className="font-bold text-finance font-orbitron">{formatCurrency(totalCostPaid, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary/50 uppercase tracking-wider font-rajdhani">Remaining</span>
                  <span className="font-bold text-foreground font-orbitron">{formatCurrency(totalCostRemaining, currency)}</span>
                </div>
              </div>
              <div className="relative h-2 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-finance/20">
                <div
                  className="h-full bg-gradient-to-r from-finance via-finance to-finance/80 transition-all duration-1000"
                  style={{ 
                    width: `${paidPercentage}%`,
                    boxShadow: '0 0 15px rgba(72, 149, 239, 0.5)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                </div>
              </div>
              <p className="text-[10px] text-finance/60 text-right uppercase tracking-wider font-rajdhani">
                {paidPercentage.toFixed(1)}% paid/financed
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
