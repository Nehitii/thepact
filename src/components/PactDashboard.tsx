import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Target, DollarSign, CheckCircle2 } from "lucide-react";
import { getDifficultyColor } from "@/lib/utils";

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
      {/* Progress by Difficulty */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Progress by Difficulty
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {difficultyProgress.map((item) => (
            <div key={item.difficulty} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="capitalize"
                    style={{ 
                      borderColor: getColor(item.difficulty),
                      color: getColor(item.difficulty)
                    }}
                  >
                    {getDifficultyLabel(item.difficulty)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {item.completed} / {item.total}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={item.percentage} 
                className="h-2"
                style={{
                  // @ts-ignore
                  "--progress-background": getColor(item.difficulty)
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cost Tracking */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-primary" />
            Cost Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Estimated</span>
                <span className="font-semibold text-foreground">${totalCostEngaged.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Paid / Financed</span>
                <span className="font-semibold text-primary">${totalCostPaid.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold text-foreground">${totalCostRemaining.toFixed(0)}</span>
              </div>
            </div>
            <Progress value={paidPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {paidPercentage.toFixed(1)}% paid/financed
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
