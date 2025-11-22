import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPact } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { PactVisual } from "@/components/PactVisual";
import { PactDashboard } from "@/components/PactDashboard";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";

interface Pact {
  id: string;
  name: string;
  mantra: string;
  symbol: string;
  color: string;
  points: number;
  tier: number;
  global_progress: number;
}

interface Goal {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  status: string;
  validated_steps: number;
  total_steps: number;
  start_date?: string;
  completion_date?: string;
  image_url?: string;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pact, setPact] = useState<Pact | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    difficultyProgress: [] as any[],
    totalStepsCompleted: 0,
    totalSteps: 0,
    totalCostEngaged: 0,
    totalCostFinanced: 0,
    timelineData: [] as any[],
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // Check if user has a pact
      const { data: pactData } = await getUserPact(user.id);
      
      if (!pactData) {
        navigate("/onboarding");
        return;
      }

      setPact(pactData);

      // Load active goals
      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("pact_id", pactData.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);

      if (goalsData) {
        setGoals(goalsData);
      }

      // Load all goals for dashboard calculations
      const { data: allGoalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("pact_id", pactData.id);

      // Calculate difficulty progress
      const difficulties = ["easy", "medium", "hard", "extreme"];
      const difficultyProgress = difficulties.map((difficulty) => {
        const diffGoals = allGoalsData?.filter((g) => g.difficulty === difficulty) || [];
        const totalSteps = diffGoals.reduce((sum, g) => sum + (g.total_steps || 0), 0);
        const completedSteps = diffGoals.reduce((sum, g) => sum + (g.validated_steps || 0), 0);
        return {
          difficulty,
          completed: completedSteps,
          total: totalSteps,
          percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
        };
      });

      // Calculate total steps
      const totalSteps = allGoalsData?.reduce((sum, g) => sum + (g.total_steps || 0), 0) || 0;
      const totalStepsCompleted = allGoalsData?.reduce((sum, g) => sum + (g.validated_steps || 0), 0) || 0;

      // Calculate costs
      const totalCostEngaged = allGoalsData?.reduce((sum, g) => sum + (Number(g.estimated_cost) || 0), 0) || 0;
      
      const { data: spendingData } = await supabase
        .from("pact_spending")
        .select("amount")
        .eq("user_id", user.id);
      
      const totalCostFinanced = spendingData?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;

      // Generate timeline data (last 30 days)
      const currentProgress = Number(pactData.global_progress) || 0;
      const timelineData = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "MM/dd");
        
        // In a real app, you'd query historical data
        // For now, we'll simulate progression
        const dayProgress = Math.min(currentProgress, ((30 - i) / 30) * currentProgress);
        const dayPoints = Math.min(pactData.points, Math.floor(((30 - i) / 30) * pactData.points));
        
        timelineData.push({
          date: dateStr,
          progress: Number(dayProgress.toFixed(1)),
          points: dayPoints,
          steps: Math.floor(((30 - i) / 30) * totalStepsCompleted),
        });
      }

      setDashboardData({
        difficultyProgress,
        totalStepsCompleted,
        totalSteps,
        totalCostEngaged,
        totalCostFinanced,
        timelineData,
      });

      setLoading(false);
    };

    loadData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your Pact...</p>
        </div>
      </div>
    );
  }

  if (!pact) {
    return null;
  }

  const progressPercentage = Number(pact.global_progress) || 0;

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-secondary">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Pact Header */}
        <div className="text-center space-y-6 pt-8 animate-fade-in">
          <div className="flex justify-center">
            <PactVisual 
              symbol={pact.symbol} 
              progress={progressPercentage}
              size="lg"
            />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">{pact.name}</h1>
            <p className="text-lg text-muted-foreground italic">&ldquo;{pact.mantra}&rdquo;</p>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{pact.points}</div>
              <div className="text-muted-foreground">Points</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Tier {pact.tier}</div>
              <div className="text-muted-foreground">Level</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{progressPercentage.toFixed(0)}%</div>
              <div className="text-muted-foreground">Progress</div>
            </div>
          </div>
        </div>

        {/* Goal Status Counters */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Goal Status Overview</CardTitle>
            <CardDescription>Track your progress across all goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                <div className="text-2xl font-bold text-muted-foreground">
                  {goals.filter(g => g.status === 'not_started').length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Not Started</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <div className="text-2xl font-bold text-primary">
                  {goals.filter(g => g.status === 'in_progress').length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">In Progress</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {goals.filter(g => g.status === 'validated').length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Validated</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {goals.filter(g => g.status === 'fully_completed').length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Indicators */}
        <PactDashboard
          difficultyProgress={dashboardData.difficultyProgress}
          totalStepsCompleted={dashboardData.totalStepsCompleted}
          totalSteps={dashboardData.totalSteps}
          totalCostEngaged={dashboardData.totalCostEngaged}
          totalCostFinanced={dashboardData.totalCostFinanced}
          timelineData={dashboardData.timelineData}
          currentTier={pact.tier}
        />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Active Goals
                </CardTitle>
                <CardDescription>Your current evolutions</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate("/goals/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active goals yet</p>
                <p className="text-sm mt-2">Start by adding your first Pact evolution</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => navigate(`/goals/${goal.id}`)}
                    className="w-full text-left p-4 rounded-lg border border-border hover:border-primary/50 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{goal.name}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {goal.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {goal.difficulty}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {goal.validated_steps} / {goal.total_steps} steps
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full border-2 border-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {goal.total_steps > 0
                              ? Math.round((goal.validated_steps / goal.total_steps) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col gap-2"
            onClick={() => navigate("/health")}
          >
            <span className="text-2xl">❤️</span>
            <span className="text-sm font-medium">Log Health</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col gap-2"
            onClick={() => navigate("/finance")}
          >
            <span className="text-2xl">💰</span>
            <span className="text-sm font-medium">Track Finance</span>
          </Button>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
