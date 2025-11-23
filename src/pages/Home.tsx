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
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [dashboardData, setDashboardData] = useState({
    difficultyProgress: [] as any[],
    totalStepsCompleted: 0,
    totalSteps: 0,
    totalCostEngaged: 0,
    totalCostPaid: 0,
    goalsCompleted: 0,
    totalGoals: 0,
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

      // Load custom difficulty name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("custom_difficulty_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData?.custom_difficulty_name) {
        setCustomDifficultyName(profileData.custom_difficulty_name);
      }

      // Load focus goals for display and all goals for calculations
      const { data: allGoalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("pact_id", pactData.id);

      // Filter focus goals (excluding fully completed)
      const focusGoals = allGoalsData?.filter(g => 
        g.is_focus && g.status !== 'fully_completed'
      ) || [];

      setGoals(focusGoals);

      // Calculate difficulty progress
      const difficulties = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
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

      // Calculate total steps across all goals
      const totalSteps = allGoalsData?.reduce((sum, g) => sum + (g.total_steps || 0), 0) || 0;
      const totalStepsCompleted = allGoalsData?.reduce((sum, g) => sum + (g.validated_steps || 0), 0) || 0;

      // Calculate goals completed
      const goalsCompleted = allGoalsData?.filter(g => g.status === 'fully_completed').length || 0;
      const totalGoals = allGoalsData?.length || 0;

      // Calculate costs - Total Estimated Cost
      const totalCostEngaged = allGoalsData?.reduce((sum, g) => sum + (Number(g.estimated_cost) || 0), 0) || 0;
      
      // Calculate costs - Paid/Financed So Far (proportional to completion)
      const totalCostPaid = allGoalsData?.reduce((sum, g) => {
        const completionRatio = (g.total_steps || 0) > 0 
          ? (g.validated_steps || 0) / (g.total_steps || 0)
          : 0;
        return sum + ((Number(g.estimated_cost) || 0) * completionRatio);
      }, 0) || 0;

      setDashboardData({
        difficultyProgress,
        totalStepsCompleted,
        totalSteps,
        totalCostEngaged,
        totalCostPaid,
        goalsCompleted,
        totalGoals,
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

        {/* Goals & Steps Completed */}
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {dashboardData.goalsCompleted}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Goals Completed</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400 mt-2">
                  {dashboardData.totalGoals > 0 
                    ? ((dashboardData.goalsCompleted / dashboardData.totalGoals) * 100).toFixed(0)
                    : 0}%
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <div className="text-3xl font-bold text-primary">
                  {dashboardData.totalStepsCompleted}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Steps Completed</div>
                <div className="text-lg font-semibold text-primary mt-2">
                  {dashboardData.totalSteps > 0 
                    ? ((dashboardData.totalStepsCompleted / dashboardData.totalSteps) * 100).toFixed(0)
                    : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Indicators */}
        <PactDashboard
          difficultyProgress={dashboardData.difficultyProgress}
          totalCostEngaged={dashboardData.totalCostEngaged}
          totalCostPaid={dashboardData.totalCostPaid}
          customDifficultyName={customDifficultyName}
        />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Focus Goals
                </CardTitle>
                <CardDescription>Your starred priorities</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate("/goals")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No focus goals yet</p>
                <p className="text-sm mt-2">Star goals in the Goals tab to see them here</p>
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
