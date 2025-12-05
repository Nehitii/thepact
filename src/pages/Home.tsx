import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPact } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { PactVisual } from "@/components/PactVisual";
import { PactDashboard } from "@/components/PactDashboard";
import { PactTimeline } from "@/components/PactTimeline";
import { AchievementsWidget } from "@/components/achievements/AchievementsWidget";
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
  project_start_date?: string | null;
  project_end_date?: string | null;
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
    <div className="min-h-screen pb-20 bg-[#00050B] relative overflow-hidden">
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>
      
      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8 relative z-10">
        {/* Pact Timeline Widget */}
        <div className="mt-8">
          <PactTimeline 
            projectStartDate={pact.project_start_date} 
            projectEndDate={pact.project_end_date} 
          />
        </div>

        {/* Pact Header - Main HUD Panel */}
        <div className="text-center space-y-8 pt-8 animate-fade-in">
          {/* Level Core - Center */}
          <div className="flex justify-center relative">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
            <div className="relative">
              <PactVisual 
                symbol={pact.symbol} 
                progress={progressPercentage}
                size="lg"
              />
            </div>
          </div>
          
          {/* Title & Subtitle */}
          <div className="space-y-3 relative">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-shimmer uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)]" style={{ backgroundSize: '200% auto' }}>
              {pact.name}
            </h1>
            <p className="text-base text-primary/80 italic font-rajdhani tracking-wide">&ldquo;{pact.mantra}&rdquo;</p>
          </div>

          {/* Three HUD Info Panels - Bottom Row */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {/* Pact XP Panel */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-2">Pact XP</div>
                  <div className="text-3xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                    {totalPoints}
                  </div>
                  <div className="text-xs text-primary/50 uppercase tracking-wider font-rajdhani mt-1">Points</div>
                </div>
              </div>
            </div>

            {/* Rank Panel */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-2">Rank</div>
                  <div className="text-2xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)] truncate">
                    {currentRank ? currentRank.name : "No Rank"}
                  </div>
                  <div className="text-xs text-primary/50 uppercase tracking-wider font-rajdhani mt-1">Current Tier</div>
                </div>
              </div>
            </div>

            {/* Level Panel */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-2">Level</div>
                  <div className="text-3xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                    {level}
                  </div>
                  <div className="text-xs text-primary/50 uppercase tracking-wider font-rajdhani mt-1">Tier</div>
                </div>
              </div>
            </div>
          </div>

          {/* Global XP Progress Bar */}
          <div className="space-y-3 max-w-3xl mx-auto">
            {nextRank && currentRank ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary/60 uppercase tracking-wider font-orbitron">
                    Next: {nextRank.name}
                  </span>
                  <span className="font-medium text-primary font-orbitron">
                    {nextRank.min_points - totalPoints} XP
                  </span>
                </div>
                <div className="relative h-3 w-full bg-card/20 backdrop-blur rounded-full overflow-hidden border border-primary/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% auto' }} />
                  <div
                    className="h-full bg-gradient-to-r from-primary via-accent to-primary relative transition-all duration-1000 shadow-[0_0_20px_rgba(91,180,255,0.6)]"
                    style={{
                      width: `${
                        ((totalPoints - currentRank.min_points) /
                          (nextRank.min_points - currentRank.min_points)) *
                        100
                      }%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                  </div>
                </div>
              </>
            ) : nextRank && !currentRank ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary/60 uppercase tracking-wider font-orbitron">
                    Next: {nextRank.name}
                  </span>
                  <span className="font-medium text-primary font-orbitron">
                    {nextRank.min_points - totalPoints} XP
                  </span>
                </div>
                <div className="relative h-3 w-full bg-card/20 backdrop-blur rounded-full overflow-hidden border border-primary/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% auto' }} />
                  <div
                    className="h-full bg-gradient-to-r from-primary via-accent to-primary relative transition-all duration-1000 shadow-[0_0_20px_rgba(91,180,255,0.6)]"
                    style={{
                      width: `${(totalPoints / nextRank.min_points) * 100}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-primary/60 font-orbitron uppercase tracking-wider">
                {ranks.length === 0 ? (
                  <span>No ranks defined</span>
                ) : (
                  <span className="font-medium text-primary">🏆 Max Rank Reached</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Goals & Steps Completed - Dark HUD Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Goals Completed Gauge */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-6 scan-line overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
              </div>
              <div className="relative z-10">
                <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-4">Goals Completed</div>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-primary font-orbitron drop-shadow-[0_0_15px_rgba(91,180,255,0.5)]">
                    {dashboardData.goalsCompleted}
                    <span className="text-2xl text-primary/50 ml-2">/ {dashboardData.totalGoals}</span>
                  </div>
                  <div className="text-xl font-semibold text-accent mt-2 font-orbitron">
                    {dashboardData.totalGoals > 0 
                      ? ((dashboardData.goalsCompleted / dashboardData.totalGoals) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative h-3 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/20">
                    <div
                      className="h-full bg-gradient-to-r from-health via-health to-health/80 transition-all duration-1000 shadow-[0_0_15px_rgba(74,222,128,0.5)]"
                      style={{ 
                        width: `${dashboardData.totalGoals > 0 
                          ? ((dashboardData.goalsCompleted / dashboardData.totalGoals) * 100)
                          : 0}%` 
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-primary/50 uppercase tracking-wider font-rajdhani">
                    <span>{dashboardData.goalsCompleted} complete</span>
                    <span>{dashboardData.totalGoals - dashboardData.goalsCompleted} remaining</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Steps Completed Gauge */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-6 scan-line overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
              </div>
              <div className="relative z-10">
                <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-4">Steps Completed</div>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-primary font-orbitron drop-shadow-[0_0_15px_rgba(91,180,255,0.5)]">
                    {dashboardData.totalStepsCompleted}
                    <span className="text-2xl text-primary/50 ml-2">/ {dashboardData.totalSteps}</span>
                  </div>
                  <div className="text-xl font-semibold text-accent mt-2 font-orbitron">
                    {dashboardData.totalSteps > 0 
                      ? ((dashboardData.totalStepsCompleted / dashboardData.totalSteps) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative h-3 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/20">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-1000 shadow-[0_0_15px_rgba(91,180,255,0.5)]"
                      style={{ 
                        width: `${dashboardData.totalSteps > 0 
                          ? ((dashboardData.totalStepsCompleted / dashboardData.totalSteps) * 100)
                          : 0}%` 
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-primary/50 uppercase tracking-wider font-rajdhani">
                    <span>{dashboardData.totalStepsCompleted} complete</span>
                    <span>{dashboardData.totalSteps - dashboardData.totalStepsCompleted} remaining</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Status Summary - Dark HUD Panel */}
        <div className="animate-fade-in relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-lg blur-2xl" />
          <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
            </div>
            <div className="relative z-10">
              <div className="p-6 border-b border-primary/20">
                <h3 className="text-sm font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                  Goals Status Summary
                </h3>
                <p className="text-xs text-primary/50 font-rajdhani mt-1">Distribution by current status</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Not Started */}
                  <div className="relative text-center p-4 rounded-lg bg-card/30 backdrop-blur border border-primary/20 hover:border-primary/40 transition-all overflow-hidden group/stat">
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-[1px] border border-primary/10 rounded-[6px]" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground shadow-[0_0_8px_rgba(156,163,175,0.5)]"></div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-orbitron">Not Started</span>
                      </div>
                      <div className="text-4xl font-bold text-muted-foreground font-orbitron drop-shadow-[0_0_10px_rgba(156,163,175,0.3)]">
                        {dashboardData.statusCounts.not_started}
                      </div>
                      <div className="text-xs text-muted-foreground/70 mt-2 font-rajdhani">
                        {dashboardData.totalGoals > 0 
                          ? ((dashboardData.statusCounts.not_started / dashboardData.totalGoals) * 100).toFixed(0)
                          : 0}%
                      </div>
                    </div>
                  </div>

                  {/* In Progress */}
                  <div className="relative text-center p-4 rounded-lg bg-primary/5 backdrop-blur border border-primary/30 hover:border-primary/50 transition-all overflow-hidden group/stat">
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-[1px] border border-primary/10 rounded-[6px]" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(91,180,255,0.6)] animate-glow-pulse"></div>
                        <span className="text-[10px] font-medium text-primary uppercase tracking-wider font-orbitron">In Progress</span>
                      </div>
                      <div className="text-4xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                        {dashboardData.statusCounts.in_progress}
                      </div>
                      <div className="text-xs text-primary/70 mt-2 font-rajdhani">
                        {dashboardData.totalGoals > 0 
                          ? ((dashboardData.statusCounts.in_progress / dashboardData.totalGoals) * 100).toFixed(0)
                          : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Validated */}
                  <div className="relative text-center p-4 rounded-lg bg-accent/5 backdrop-blur border border-accent/30 hover:border-accent/50 transition-all overflow-hidden group/stat">
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-[1px] border border-primary/10 rounded-[6px]" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(122,191,255,0.6)]"></div>
                        <span className="text-[10px] font-medium text-accent uppercase tracking-wider font-orbitron">Validated</span>
                      </div>
                      <div className="text-4xl font-bold text-accent font-orbitron drop-shadow-[0_0_10px_rgba(122,191,255,0.5)]">
                        {dashboardData.statusCounts.validated}
                      </div>
                      <div className="text-xs text-accent/70 mt-2 font-rajdhani">
                        {dashboardData.totalGoals > 0 
                          ? ((dashboardData.statusCounts.validated / dashboardData.totalGoals) * 100).toFixed(0)
                          : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Completed */}
                  <div className="relative text-center p-4 rounded-lg bg-health/5 backdrop-blur border border-health/30 hover:border-health/50 transition-all overflow-hidden group/stat">
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-[1px] border border-primary/10 rounded-[6px]" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-health shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
                        <span className="text-[10px] font-medium text-health uppercase tracking-wider font-orbitron">Completed</span>
                      </div>
                      <div className="text-4xl font-bold text-health font-orbitron drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                        {dashboardData.statusCounts.fully_completed}
                      </div>
                      <div className="text-xs text-health/70 mt-2 font-rajdhani">
                        {dashboardData.totalGoals > 0 
                          ? ((dashboardData.statusCounts.fully_completed / dashboardData.totalGoals) * 100).toFixed(0)
                          : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Indicators */}
        <PactDashboard
          difficultyProgress={dashboardData.difficultyProgress}
          totalCostEngaged={dashboardData.totalCostEngaged}
          totalCostPaid={dashboardData.totalCostPaid}
          customDifficultyName={customDifficultyName}
          customDifficultyColor={customDifficultyColor}
        />

        {/* Focus Goals - Dark HUD Panel */}
        <div className="animate-fade-in relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl" />
          <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
            </div>
            <div className="relative z-10">
              <div className="p-6 border-b border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                      <TrendingUp className="h-5 w-5 text-primary relative z-10 animate-glow-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                        Focus Goals
                      </h3>
                      <p className="text-xs text-primary/50 font-rajdhani mt-1">Your starred priorities</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => navigate("/goals")}
                    className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 font-orbitron text-xs uppercase tracking-wider"
                  >
                    View All
                  </Button>
                </div>
              </div>
              <div className="p-6">
                {goals.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 text-primary/40 relative z-10" />
                    </div>
                    <p className="text-sm text-primary/60 font-rajdhani">No focus goals yet</p>
                    <p className="text-xs text-primary/40 mt-2 font-rajdhani">Star goals in the Goals tab to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goals.map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => navigate(`/goals/${goal.id}`)}
                        className="w-full text-left p-4 rounded-lg bg-primary/5 backdrop-blur border border-primary/30 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(91,180,255,0.2)] group/goal overflow-hidden relative"
                      >
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-[1px] border border-primary/10 rounded-[6px]" />
                        </div>
                        <div className="relative z-10 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2 text-primary font-orbitron drop-shadow-[0_0_5px_rgba(91,180,255,0.3)]">{goal.name}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider font-orbitron bg-primary/10 text-primary border border-primary/30">
                                {goal.type}
                              </span>
                              <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider font-orbitron bg-accent/10 text-accent border border-accent/30">
                                {goal.difficulty}
                              </span>
                              <span className="text-xs text-primary/70 font-rajdhani">
                                {goal.validated_steps} / {goal.total_steps} steps
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="relative h-12 w-12 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/5">
                              <div className="absolute inset-0 bg-primary/10 rounded-full blur-sm" />
                              <span className="text-sm font-bold text-primary font-orbitron drop-shadow-[0_0_5px_rgba(91,180,255,0.5)] relative z-10">
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
              </div>
            </div>
          </div>
        </div>

        {/* Finance Quick Action - Dark HUD Panel */}
        <div className="animate-fade-in relative group">
          <div className="absolute inset-0 bg-finance/5 rounded-lg blur-2xl" />
          <button
            onClick={() => navigate("/finance")}
            className="relative w-full bg-card/20 backdrop-blur-xl border-2 border-finance/30 rounded-lg overflow-hidden hover:border-finance/50 transition-all hover:shadow-[0_0_20px_rgba(72,149,239,0.3)] group/finance"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-[2px] border border-finance/20 rounded-[6px]" />
            </div>
            <div className="relative z-10 p-6 flex items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-finance/20 blur-md rounded-full" />
                <span className="text-4xl relative z-10">💰</span>
              </div>
              <span className="text-lg font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-finance via-finance to-finance">
                Track Finance
              </span>
            </div>
          </button>
        </div>

        {/* Achievements Widget */}
        <AchievementsWidget />
      </div>

      <Navigation />
    </div>
  );
}
