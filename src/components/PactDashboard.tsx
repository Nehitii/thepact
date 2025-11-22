import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Target, DollarSign, CheckCircle2 } from "lucide-react";

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
  totalStepsCompleted: number;
  totalSteps: number;
  totalCostEngaged: number;
  totalCostFinanced: number;
  timelineData: TimelineData[];
  currentTier: number;
  customDifficultyName?: string;
}

const difficultyColors = {
  easy: "hsl(var(--health))",
  medium: "hsl(var(--primary))",
  hard: "hsl(var(--accent))",
  extreme: "hsl(var(--destructive))",
  impossible: "hsl(280 100% 60%)", // Purple
  custom: "hsl(45 100% 50%)", // Gold
};

export function PactDashboard({
  difficultyProgress,
  totalStepsCompleted,
  totalSteps,
  totalCostEngaged,
  totalCostFinanced,
  timelineData,
  currentTier,
  customDifficultyName,
}: PactDashboardProps) {
  const costPercentage = totalCostEngaged > 0 ? (totalCostFinanced / totalCostEngaged) * 100 : 0;

  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === 'custom' && customDifficultyName) {
      return customDifficultyName;
    }
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
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
                      borderColor: difficultyColors[item.difficulty as keyof typeof difficultyColors],
                      color: difficultyColors[item.difficulty as keyof typeof difficultyColors]
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
                  "--progress-background": difficultyColors[item.difficulty as keyof typeof difficultyColors]
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Steps */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Steps Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">{totalStepsCompleted}</span>
                <span className="text-lg text-muted-foreground">/ {totalSteps}</span>
              </div>
              <Progress 
                value={totalSteps > 0 ? (totalStepsCompleted / totalSteps) * 100 : 0} 
                className="h-2"
              />
            </div>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Engaged</span>
                <span className="font-medium text-foreground">${totalCostEngaged.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Financed</span>
                <span className="font-medium text-primary">${totalCostFinanced.toFixed(2)}</span>
              </div>
              <Progress value={costPercentage} className="h-2" />
              <div className="text-xs text-muted-foreground text-right">
                {costPercentage.toFixed(0)}% financed
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pact Growth Timeline */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Pact Evolution Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--foreground))"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="progress" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProgress)"
                    name="Progress %"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="points" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPoints)"
                    name="Points"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <p>Start completing goals to see your evolution timeline</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
