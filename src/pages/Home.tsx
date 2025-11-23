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
import { Plus, TrendingUp, Calendar } from "lucide-react";
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
  project_start_date?: string;
}

interface Rank {
  id: string;
  min_points: number;
  name: string;
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
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentRank, setCurrentRank] = useState<Rank | null>(null);
  const [nextRank, setNextRank] = useState<Rank | null>(null);
  const [level, setLevel] = useState(1);
  const [dashboardData, setDashboardData] = useState({
    difficultyProgress: [] as any[],
    totalStepsCompleted: 0,
    totalSteps: 0,
    totalCostEngaged: 0,
    totalCostPaid: 0,
    goalsCompleted: 0,
    totalGoals: 0,
    statusCounts: {
      not_started: 0,
      in_progress: 0,
      validated: 0,
      fully_completed: 0,
    },
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

      // Load custom difficulty settings
      const { data: profileData } = await supabase
        .from("profiles")
        .select("custom_difficulty_name, custom_difficulty_color")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setCustomDifficultyName(profileData.custom_difficulty_name || "");
        setCustomDifficultyColor(profileData.custom_difficulty_color || "#a855f7");
      }

      // Load ranks
      const { data: ranksData } = await supabase
        .from("ranks")
        .select("*")
        .eq("user_id", user.id)
        .order("min_points", { ascending: true });

      const userRanks = ranksData || [];
      setRanks(userRanks);

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

      // Calculate total points from validated and completed goals
      const points = allGoalsData?.reduce((sum, g) => {
        if (g.status === 'validated' || g.status === 'fully_completed') {
          return sum + (g.potential_score || 0);
        }
        return sum;
      }, 0) || 0;
      setTotalPoints(points);

      // Determine current rank and next rank
      let current: Rank | null = null;
      let next: Rank | null = null;
      let levelIndex = 1;

      for (let i = 0; i < userRanks.length; i++) {
        if (points >= userRanks[i].min_points) {
          current = userRanks[i];
          levelIndex = i + 1;
          next = i + 1 < userRanks.length ? userRanks[i + 1] : null;
        } else {
          if (!current && i === 0) {
            next = userRanks[i];
          }
          break;
        }
      }

      setCurrentRank(current);
      setNextRank(next);
      setLevel(levelIndex);

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

      // Calculate status counts
      const statusCounts = {
        not_started: allGoalsData?.filter(g => g.status === 'not_started').length || 0,
        in_progress: allGoalsData?.filter(g => g.status === 'in_progress').length || 0,
        validated: allGoalsData?.filter(g => g.status === 'validated').length || 0,
        fully_completed: allGoalsData?.filter(g => g.status === 'fully_completed').length || 0,
      };

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
        statusCounts,
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
        {/* Project Start Date */}
        {pact.project_start_date && (
          <Card className="animate-fade-in mt-8">
            <CardContent className="flex items-center gap-3 py-4">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <span className="text-sm text-muted-foreground">Project Start Date: </span>
                <span className="font-semibold text-foreground">
                  {format(new Date(pact.project_start_date), "PPP")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

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

          <div className="space-y-4">
            {/* Rank & Level Info */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalPoints}</div>
                <div className="text-muted-foreground">Points</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentRank ? currentRank.name : "No Rank"}
                </div>
                <div className="text-muted-foreground">Rank</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">Level {level}</div>
                <div className="text-muted-foreground">Tier</div>
              </div>
            </div>

            {/* Progress to Next Rank */}
            {nextRank && currentRank ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Next: {nextRank.name}
                  </span>
                  <span className="font-medium text-primary">
                    {nextRank.min_points - totalPoints} points remaining
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${
                        ((totalPoints - currentRank.min_points) /
                          (nextRank.min_points - currentRank.min_points)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ) : nextRank && !currentRank ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Next: {nextRank.name}
                  </span>
                  <span className="font-medium text-primary">
                    {nextRank.min_points - totalPoints} points remaining
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${(totalPoints / nextRank.min_points) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                {ranks.length === 0 ? (
                  <span>No ranks defined. Set up ranks in your Profile.</span>
                ) : (
                  <span className="font-medium text-primary">🏆 Max Rank Reached</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Goals & Steps Completed with Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {/* Goals Completed Gauge */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Goals Completed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {dashboardData.goalsCompleted} <span className="text-2xl text-muted-foreground">/ {dashboardData.totalGoals}</span>
                </div>
                <div className="text-lg font-semibold text-primary">
                  {dashboardData.totalGoals > 0 
                    ? ((dashboardData.goalsCompleted / dashboardData.totalGoals) * 100).toFixed(0)
                    : 0}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 transition-all duration-500"
                    style={{ 
                      width: `${dashboardData.totalGoals > 0 
                        ? ((dashboardData.goalsCompleted / dashboardData.totalGoals) * 100)
                        : 0}%` 
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{dashboardData.goalsCompleted} completed</span>
                  <span>{dashboardData.totalGoals - dashboardData.goalsCompleted} remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps Completed Gauge */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Steps Completed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {dashboardData.totalStepsCompleted} <span className="text-2xl text-muted-foreground">/ {dashboardData.totalSteps}</span>
                </div>
                <div className="text-lg font-semibold text-primary">
                  {dashboardData.totalSteps > 0 
                    ? ((dashboardData.totalStepsCompleted / dashboardData.totalSteps) * 100).toFixed(0)
                    : 0}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ 
                      width: `${dashboardData.totalSteps > 0 
                        ? ((dashboardData.totalStepsCompleted / dashboardData.totalSteps) * 100)
                        : 0}%` 
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{dashboardData.totalStepsCompleted} completed</span>
                  <span>{dashboardData.totalSteps - dashboardData.totalStepsCompleted} remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Status Summary */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Goals Status Summary</CardTitle>
            <CardDescription>Distribution of goals by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Not Started */}
              <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-muted-foreground"></div>
                  <span className="text-xs font-medium text-muted-foreground">Not Started</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {dashboardData.statusCounts.not_started}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {dashboardData.totalGoals > 0 
                    ? ((dashboardData.statusCounts.not_started / dashboardData.totalGoals) * 100).toFixed(0)
                    : 0}%
                </div>
              </div>

              {/* In Progress */}
              <div className="text-center p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span className="text-xs font-medium text-primary">In Progress</span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {dashboardData.statusCounts.in_progress}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {dashboardData.totalGoals > 0 
                    ? ((dashboardData.statusCounts.in_progress / dashboardData.totalGoals) * 100).toFixed(0)
                    : 0}%
                </div>
              </div>

              {/* Validated */}
              <div className="text-center p-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Validated</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {dashboardData.statusCounts.validated}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {dashboardData.totalGoals > 0 
                    ? ((dashboardData.statusCounts.validated / dashboardData.totalGoals) * 100).toFixed(0)
                    : 0}%
                </div>
              </div>

              {/* Completed */}
              <div className="text-center p-4 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-green-600 dark:bg-green-400"></div>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Completed</span>
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {dashboardData.statusCounts.fully_completed}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {dashboardData.totalGoals > 0 
                    ? ((dashboardData.statusCounts.fully_completed / dashboardData.totalGoals) * 100).toFixed(0)
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
          customDifficultyColor={customDifficultyColor}
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
