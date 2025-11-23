import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, CheckCircle2, Star, Sparkles, Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParticleEffect } from "@/components/ParticleEffect";
import { CyberBackground } from "@/components/CyberBackground";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  status: string;
  validated_steps: number;
  total_steps: number;
  potential_score: number;
  estimated_cost: number;
  created_at: string;
  start_date?: string;
  completion_date?: string;
  image_url?: string;
  is_focus?: boolean;
  completedStepsCount?: number;
  totalStepsCount?: number;
}

type SortOption = 
  | "difficulty" 
  | "type" 
  | "points" 
  | "created" 
  | "name" 
  | "status" 
  | "start";

type SortDirection = "asc" | "desc";

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");
  const { trigger: triggerParticles, ParticleEffects } = useParticleEffect();

  useEffect(() => {
    if (!user) return;

    const loadGoals = async () => {
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

      // Get user's pact first
      const { data: pactData } = await supabase
        .from("pacts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pactData) return;

      // Load all goals
      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("pact_id", pactData.id)
        .order("created_at", { ascending: false });

      if (goalsData) {
        // Fetch actual step counts for each goal
        const goalsWithStepCounts = await Promise.all(
          goalsData.map(async (goal) => {
            const { data: steps } = await supabase
              .from("steps")
              .select("status")
              .eq("goal_id", goal.id);

            const totalStepsCount = steps?.length || 0;
            const completedStepsCount = steps?.filter(s => s.status === "completed").length || 0;

            return {
              ...goal,
              totalStepsCount,
              completedStepsCount,
            };
          })
        );
        setGoals(goalsWithStepCounts);
      }

      setLoading(false);
    };

    loadGoals();
  }, [user]);

  const toggleFocus = async (goalId: string, currentFocus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Trigger particle effect
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const difficultyColor = getUnifiedDifficultyColor(goal.difficulty, customDifficultyColor);
      triggerParticles(e, difficultyColor);
    }
    
    const { error } = await supabase
      .from("goals")
      .update({ is_focus: !currentFocus })
      .eq("id", goalId);

    if (!error) {
      setGoals(goals.map(g => 
        g.id === goalId ? { ...g, is_focus: !currentFocus } : g
      ));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-muted text-muted-foreground";
      case "in_progress":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "validated":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "fully_completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "paused":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_started": return "Not Started";
      case "in_progress": return "In Progress";
      case "validated": return "Validated";
      case "fully_completed": return "Completed";
      case "paused": return "Paused";
      default: return status;
    }
  };

  // Use unified difficulty color system
  const getDifficultyColor = (difficulty: string) => {
    return getUnifiedDifficultyColor(difficulty, customDifficultyColor);
  };

  // Get display label for difficulty
  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === 'custom' && customDifficultyName) {
      return customDifficultyName;
    }
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const handleSortChange = (newSortBy: SortOption) => {
    // Just change the sort category, keep the current direction
    setSortBy(newSortBy);
  };

  const handleDirectionChange = (newDirection: SortDirection) => {
    setSortDirection(newDirection);
  };

  const sortGoals = (goalsToSort: Goal[]) => {
    const sorted = [...goalsToSort];
    const direction = sortDirection === "asc" ? 1 : -1;
    
    switch (sortBy) {
      case "difficulty":
        const difficultyOrder = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
        return sorted.sort((a, b) => {
          const indexA = difficultyOrder.indexOf(a.difficulty);
          const indexB = difficultyOrder.indexOf(b.difficulty);
          return (indexA - indexB) * direction;
        });
      
      case "type":
        return sorted.sort((a, b) => a.type.localeCompare(b.type) * direction);
      
      case "points":
        return sorted.sort((a, b) => ((a.potential_score || 0) - (b.potential_score || 0)) * direction);
      
      case "created":
        return sorted.sort((a, b) => (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction);
      
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name) * direction);
      
      case "status":
        const statusOrder = ["not_started", "in_progress", "validated", "fully_completed", "paused"];
        return sorted.sort((a, b) => {
          const indexA = statusOrder.indexOf(a.status);
          const indexB = statusOrder.indexOf(b.status);
          return (indexA - indexB) * direction;
        });
      
      case "start":
        return sorted.sort((a, b) => {
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;
          return (new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) * direction;
        });
      
      default:
        return sorted;
    }
  };

  // Filter goals by active/completed status
  const activeGoals = goals.filter(g => 
    g.status === 'not_started' || g.status === 'in_progress' || g.status === 'validated'
  );
  const completedGoals = goals.filter(g => g.status === 'fully_completed');
  
  const sortedActiveGoals = sortGoals(activeGoals);
  const sortedCompletedGoals = sortGoals(completedGoals);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative">
      <CyberBackground />
      <ParticleEffects />
      <div className="relative z-10 bg-gradient-to-br from-background via-background/95 to-secondary/50">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Goals</h1>
              <p className="text-muted-foreground">Evolutions of your Pact</p>
            </div>
            <Button onClick={() => navigate("/goals/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
          
          {/* Sort Controls */}
          {goals.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-medium">Sort by:</span>
              <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="z-50 bg-card">
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="type">Category</SelectItem>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="start">Start Date</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 transition-all ${
                    sortDirection === "asc" 
                      ? "bg-primary/10 border-primary text-primary shadow-sm" 
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleDirectionChange("asc")}
                  aria-label="Sort ascending"
                >
                  <span className="text-base">▲</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 transition-all ${
                    sortDirection === "desc" 
                      ? "bg-primary/10 border-primary text-primary shadow-sm" 
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleDirectionChange("desc")}
                  aria-label="Sort descending"
                >
                  <span className="text-base">▼</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Goals Tabs */}
        {goals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Goals Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Start your journey by adding your first Pact evolution
              </p>
              <Button onClick={() => navigate("/goals/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "completed")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active ({activeGoals.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedGoals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-6">
              {activeGoals.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Active Goals</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Start your journey by adding your first Pact evolution
                    </p>
                    <Button onClick={() => navigate("/goals/new")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Goal
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                sortedActiveGoals.map((goal) => {
                  const totalSteps = goal.totalStepsCount || 0;
                  const completedSteps = goal.completedStepsCount || 0;
                  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
                  const difficultyColor = getDifficultyColor(goal.difficulty);

                  return (
                    <Card
                      key={goal.id}
                      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-2"
                      style={{
                        borderLeftWidth: '6px',
                        borderLeftColor: difficultyColor,
                        background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.95) 100%)',
                      }}
                      onClick={() => navigate(`/goals/${goal.id}`)}
                    >
                      {/* Quest Frame Effect */}
                      <div className="absolute inset-0 opacity-5 pointer-events-none"
                        style={{
                          backgroundImage: `repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 2px,
                            ${difficultyColor} 2px,
                            ${difficultyColor} 4px
                          )`,
                        }}
                      />

                      <CardContent className="p-5 relative">
                        <div className="flex gap-4">
                          {/* Left Section: Image + Focus Star */}
                          <div className="relative flex-shrink-0">
                            {goal.image_url ? (
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 shadow-lg"
                                style={{ borderColor: difficultyColor }}>
                                <img 
                                  src={goal.image_url} 
                                  alt={goal.name}
                                  className="w-full h-full object-cover"
                                />
                                {/* Focus Star Overlay on Image */}
                                <button
                                  onClick={(e) => toggleFocus(goal.id, goal.is_focus || false, e)}
                                  className="absolute -top-2 -left-2 z-10 p-1.5 bg-card rounded-full shadow-md hover:scale-110 transition-transform border-2"
                                  style={{ borderColor: difficultyColor }}
                                  aria-label={goal.is_focus ? "Remove from focus" : "Add to focus"}
                                >
                                  <Star 
                                    className={`h-4 w-4 ${goal.is_focus ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                  />
                                </button>
                              </div>
                            ) : (
                              <div className="relative w-24 h-24 rounded-lg border-2 shadow-lg flex items-center justify-center"
                                style={{ 
                                  borderColor: difficultyColor,
                                  background: `linear-gradient(135deg, ${difficultyColor}20, ${difficultyColor}10)`
                                }}>
                                <Trophy className="h-10 w-10" style={{ color: difficultyColor }} />
                                {/* Focus Star when no image */}
                                <button
                                  onClick={(e) => toggleFocus(goal.id, goal.is_focus || false, e)}
                                  className="absolute -top-2 -left-2 z-10 p-1.5 bg-card rounded-full shadow-md hover:scale-110 transition-transform border-2"
                                  style={{ borderColor: difficultyColor }}
                                  aria-label={goal.is_focus ? "Remove from focus" : "Add to focus"}
                                >
                                  <Star 
                                    className={`h-4 w-4 ${goal.is_focus ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                  />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Middle Section: Content */}
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Title & Badges */}
                            <div>
                              <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {goal.name}
                              </h3>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs font-medium capitalize"
                                  style={{ 
                                    backgroundColor: `${difficultyColor}20`,
                                    color: difficultyColor,
                                    borderColor: `${difficultyColor}50`
                                  }}
                                >
                                  {getDifficultyLabel(goal.difficulty)}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize border">
                                  {goal.type}
                                </Badge>
                                <Badge className={`text-xs border ${getStatusColor(goal.status)}`}>
                                  {getStatusLabel(goal.status)}
                                </Badge>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">
                                  {completedSteps} / {totalSteps} steps
                                </span>
                                <span className="font-bold" style={{ color: difficultyColor }}>
                                  {progress.toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border shadow-inner">
                                <div
                                  className="h-full transition-all duration-500 rounded-full relative"
                                  style={{ 
                                    width: `${progress}%`,
                                    backgroundColor: difficultyColor,
                                    boxShadow: `0 0 10px ${difficultyColor}80`
                                  }}
                                >
                                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </div>
                              </div>
                            </div>

                            {/* XP Points */}
                            {goal.potential_score > 0 && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Sparkles className="h-3.5 w-3.5" style={{ color: difficultyColor }} />
                                <span className="font-bold" style={{ color: difficultyColor }}>
                                  +{goal.potential_score} XP
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right Section: Arrow */}
                          <div className="flex items-center justify-center flex-shrink-0 pl-2">
                            <ArrowRight 
                              className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" 
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {completedGoals.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Completed Goals Yet</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Complete your active goals to see them here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                sortedCompletedGoals.map((goal) => {
                  const totalSteps = goal.totalStepsCount || 0;
                  const difficultyColor = getDifficultyColor(goal.difficulty);

                  return (
                    <Card
                      key={goal.id}
                      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border-2 opacity-70 hover:opacity-85"
                      style={{
                        borderLeftWidth: '6px',
                        borderLeftColor: `${difficultyColor}66`,
                        background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.8) 100%)',
                      }}
                      onClick={() => navigate(`/goals/${goal.id}`)}
                    >
                      {/* Completion Stamp Effect */}
                      <div className="absolute top-2 right-16 opacity-20 pointer-events-none rotate-12">
                        <div className="border-4 border-green-500 rounded-lg px-3 py-1">
                          <span className="text-green-500 font-bold text-xs">COMPLETED</span>
                        </div>
                      </div>

                      <CardContent className="p-5 relative">
                        <div className="flex gap-4">
                          {/* Left Section: Image + Focus Star */}
                          <div className="relative flex-shrink-0">
                            {goal.image_url ? (
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 shadow-lg grayscale"
                                style={{ borderColor: `${difficultyColor}66` }}>
                                <img 
                                  src={goal.image_url} 
                                  alt={goal.name}
                                  className="w-full h-full object-cover"
                                />
                                {/* Thin difficulty accent border visible on completed */}
                                <div className="absolute inset-0 border-2 pointer-events-none" 
                                  style={{ borderColor: `${difficultyColor}99` }} 
                                />
                                {/* Focus Star */}
                                <button
                                  onClick={(e) => toggleFocus(goal.id, goal.is_focus || false, e)}
                                  className="absolute -top-2 -left-2 z-10 p-1.5 bg-card rounded-full shadow-md hover:scale-110 transition-transform border-2"
                                  style={{ borderColor: `${difficultyColor}66` }}
                                  aria-label={goal.is_focus ? "Remove from focus" : "Add to focus"}
                                >
                                  <Star 
                                    className={`h-4 w-4 ${goal.is_focus ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                  />
                                </button>
                              </div>
                            ) : (
                              <div className="relative w-24 h-24 rounded-lg border-2 shadow-lg flex items-center justify-center grayscale"
                                style={{ 
                                  borderColor: `${difficultyColor}66`,
                                  background: `linear-gradient(135deg, ${difficultyColor}20, ${difficultyColor}10)`
                                }}>
                                <Trophy className="h-10 w-10" style={{ color: `${difficultyColor}99` }} />
                                {/* Focus Star */}
                                <button
                                  onClick={(e) => toggleFocus(goal.id, goal.is_focus || false, e)}
                                  className="absolute -top-2 -left-2 z-10 p-1.5 bg-card rounded-full shadow-md hover:scale-110 transition-transform border-2"
                                  style={{ borderColor: `${difficultyColor}66` }}
                                  aria-label={goal.is_focus ? "Remove from focus" : "Add to focus"}
                                >
                                  <Star 
                                    className={`h-4 w-4 ${goal.is_focus ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                  />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Middle Section: Content */}
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Title & Badges */}
                            <div>
                              <h3 className="text-lg font-bold mb-2 line-clamp-2">
                                {goal.name}
                              </h3>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs font-medium capitalize"
                                  style={{ 
                                    backgroundColor: `${difficultyColor}20`,
                                    color: `${difficultyColor}B3`,
                                    borderColor: `${difficultyColor}33`
                                  }}
                                >
                                  {getDifficultyLabel(goal.difficulty)}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize border">
                                  {goal.type}
                                </Badge>
                                <Badge className={`text-xs border ${getStatusColor(goal.status)}`}>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                            </div>

                            {/* Progress Bar - Full with Difficulty Accent */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">
                                  {totalSteps} / {totalSteps} steps
                                </span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  100%
                                </span>
                              </div>
                              <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner relative"
                                style={{ 
                                  border: `2px solid ${difficultyColor}66`
                                }}>
                                <div
                                  className="h-full transition-all duration-500 rounded-full bg-green-500 relative"
                                  style={{ width: "100%" }}
                                >
                                  {/* Thin difficulty color accent overlay */}
                                  <div 
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                      background: `linear-gradient(90deg, transparent 0%, ${difficultyColor}40 50%, transparent 100%)`
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* XP Points Earned */}
                            {goal.potential_score > 0 && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Trophy className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  +{goal.potential_score} XP Earned
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right Section: Arrow */}
                          <div className="flex items-center justify-center flex-shrink-0 pl-2">
                            <ArrowRight 
                              className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" 
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}
