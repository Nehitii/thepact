import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, ArrowUpDown, CheckCircle2, Star, Sparkles, Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

type SortOption = 
  | "status" 
  | "difficulty" 
  | "progress" 
  | "cost" 
  | "created" 
  | "start" 
  | "completion" 
  | "name-asc" 
  | "name-desc"
  | "smart";

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("smart");
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [customDifficultyName, setCustomDifficultyName] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadGoals = async () => {
      // Load custom difficulty settings
      const { data: profileData } = await supabase
        .from("profiles")
        .select("custom_difficulty_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData?.custom_difficulty_name) {
        setCustomDifficultyName(profileData.custom_difficulty_name);
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
        setGoals(goalsData);
      }

      setLoading(false);
    };

    loadGoals();
  }, [user]);

  const toggleFocus = async (goalId: string, currentFocus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
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

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      easy: "difficulty-easy",
      medium: "difficulty-medium",
      hard: "difficulty-hard",
      extreme: "difficulty-extreme",
      impossible: "difficulty-impossible",
      custom: "difficulty-custom",
    };
    return colorMap[difficulty] || "primary";
  };

  // Get display label for difficulty
  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === 'custom' && customDifficultyName) {
      return customDifficultyName;
    }
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const sortGoals = (goalsToSort: Goal[]) => {
    const sorted = [...goalsToSort];
    
    switch (sortBy) {
      case "status":
        const statusOrder = ["not_started", "in_progress", "validated", "fully_completed", "paused"];
        return sorted.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
      
      case "difficulty":
        const difficultyOrder = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
        return sorted.sort((a, b) => difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty));
      
      case "progress":
        return sorted.sort((a, b) => {
          const progressA = a.total_steps > 0 ? (a.validated_steps / a.total_steps) : 0;
          const progressB = b.total_steps > 0 ? (b.validated_steps / b.total_steps) : 0;
          return progressB - progressA;
        });
      
      case "cost":
        return sorted.sort((a, b) => (b.estimated_cost || 0) - (a.estimated_cost || 0));
      
      case "created":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      case "start":
        return sorted.sort((a, b) => {
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        });
      
      case "completion":
        return sorted.sort((a, b) => {
          if (!a.completion_date) return 1;
          if (!b.completion_date) return -1;
          return new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime();
        });
      
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      
      case "smart":
        // Smart sort: prioritize by urgency, progress, difficulty, and activity
        return sorted.sort((a, b) => {
          // Priority 1: In progress goals first
          if (a.status === "in_progress" && b.status !== "in_progress") return -1;
          if (b.status === "in_progress" && a.status !== "in_progress") return 1;
          
          // Priority 2: Not started goals next
          if (a.status === "not_started" && b.status !== "not_started") return -1;
          if (b.status === "not_started" && a.status !== "not_started") return 1;
          
          // Priority 3: Higher progress percentage (closer to completion)
          const progressA = a.total_steps > 0 ? (a.validated_steps / a.total_steps) : 0;
          const progressB = b.total_steps > 0 ? (b.validated_steps / b.total_steps) : 0;
          if (progressA !== progressB) return progressB - progressA;
          
          // Priority 4: Lower difficulty (easier wins)
          const diffOrder = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
          const diffA = diffOrder.indexOf(a.difficulty);
          const diffB = diffOrder.indexOf(b.difficulty);
          if (diffA !== diffB) return diffA - diffB;
          
          // Priority 5: Most recent start date
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateB - dateA;
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
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-secondary">
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
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smart">🧠 Smart Sort</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="cost">Cost</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="start">Start Date</SelectItem>
                  <SelectItem value="completion">Completion Date</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
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
                  const progress =
                    goal.total_steps > 0
                      ? (goal.validated_steps / goal.total_steps) * 100
                      : 0;
                  const difficultyColor = getDifficultyColor(goal.difficulty);

                  return (
                    <Card
                      key={goal.id}
                      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-2"
                      style={{
                        borderLeftWidth: '6px',
                        borderLeftColor: `hsl(var(--${difficultyColor}))`,
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
                            hsl(var(--${difficultyColor})) 2px,
                            hsl(var(--${difficultyColor})) 4px
                          )`,
                        }}
                      />

                      <CardContent className="p-5 relative">
                        <div className="flex gap-4">
                          {/* Left Section: Image + Focus Star */}
                          <div className="relative flex-shrink-0">
                            {goal.image_url ? (
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 shadow-lg"
                                style={{ borderColor: `hsl(var(--${difficultyColor}))` }}>
                                <img 
                                  src={goal.image_url} 
                                  alt={goal.name}
                                  className="w-full h-full object-cover"
                                />
                                {/* Focus Star Overlay on Image */}
                                <button
                                  onClick={(e) => toggleFocus(goal.id, goal.is_focus || false, e)}
                                  className="absolute -top-2 -left-2 z-10 p-1.5 bg-card rounded-full shadow-md hover:scale-110 transition-transform border-2"
                                  style={{ borderColor: `hsl(var(--${difficultyColor}))` }}
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
                                  borderColor: `hsl(var(--${difficultyColor}))`,
                                  background: `linear-gradient(135deg, hsl(var(--${difficultyColor}) / 0.1), hsl(var(--${difficultyColor}) / 0.05))`
                                }}>
                                <Trophy className="h-10 w-10" style={{ color: `hsl(var(--${difficultyColor}))` }} />
                                {/* Focus Star when no image */}
                                <button
                                  onClick={(e) => toggleFocus(goal.id, goal.is_focus || false, e)}
                                  className="absolute -top-2 -left-2 z-10 p-1.5 bg-card rounded-full shadow-md hover:scale-110 transition-transform border-2"
                                  style={{ borderColor: `hsl(var(--${difficultyColor}))` }}
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
                                    backgroundColor: `hsl(var(--${difficultyColor}) / 0.15)`,
                                    color: `hsl(var(--${difficultyColor}))`,
                                    borderColor: `hsl(var(--${difficultyColor}) / 0.3)`
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
                                  {goal.validated_steps} / {goal.total_steps} steps
                                </span>
                                <span className="font-bold" style={{ color: `hsl(var(--${difficultyColor}))` }}>
                                  {progress.toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border shadow-inner">
                                <div
                                  className="h-full transition-all duration-500 rounded-full relative"
                                  style={{ 
                                    width: `${progress}%`,
                                    background: `linear-gradient(90deg, hsl(var(--${difficultyColor}) / 0.8), hsl(var(--${difficultyColor})))`,
                                    boxShadow: `0 0 10px hsl(var(--${difficultyColor}) / 0.5)`
                                  }}
                                >
                                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </div>
                              </div>
                            </div>

                            {/* XP Points */}
                            {goal.potential_score > 0 && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Sparkles className="h-3.5 w-3.5" style={{ color: `hsl(var(--${difficultyColor}))` }} />
                                <span className="font-bold" style={{ color: `hsl(var(--${difficultyColor}))` }}>
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
                  const progress = 100; // Completed goals are always 100%
                  const difficultyColor = getDifficultyColor(goal.difficulty);

                  return (
                    <Card
                      key={goal.id}
                      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border-2 opacity-70 hover:opacity-85"
                      style={{
                        borderLeftWidth: '6px',
                        borderLeftColor: `hsl(var(--${difficultyColor}) / 0.4)`,
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
                                style={{ borderColor: `hsl(var(--${difficultyColor}) / 0.4)` }}>
                                <img 
                                  src={goal.image_url} 
                                  alt={goal.name}
                                  className="w-full h-full object-cover"
                                />
                                {/* Thin difficulty accent border visible on completed */}
                                <div className="absolute inset-0 border-2 pointer-events-none" 
                                  style={{ borderColor: `hsl(var(--${difficultyColor}) / 0.6)` }} 
                                />
                                {/* Focus Star */}
                                <button
                                  onClick={(e) => toggleFocus(goal.id, goal.is_focus || false, e)}
                                  className="absolute -top-2 -left-2 z-10 p-1.5 bg-card rounded-full shadow-md hover:scale-110 transition-transform border-2"
                                  style={{ borderColor: `hsl(var(--${difficultyColor}) / 0.4)` }}
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
                                  borderColor: `hsl(var(--${difficultyColor}) / 0.4)`,
                                  background: `linear-gradient(135deg, hsl(var(--${difficultyColor}) / 0.1), hsl(var(--${difficultyColor}) / 0.05))`
                                }}>
                                <Trophy className="h-10 w-10" style={{ color: `hsl(var(--${difficultyColor}) / 0.6)` }} />
                                {/* Focus Star */}
                                <button
                                  onClick={(e) => toggleFocus(goal.id, goal.is_focus || false, e)}
                                  className="absolute -top-2 -left-2 z-10 p-1.5 bg-card rounded-full shadow-md hover:scale-110 transition-transform border-2"
                                  style={{ borderColor: `hsl(var(--${difficultyColor}) / 0.4)` }}
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
                                    backgroundColor: `hsl(var(--${difficultyColor}) / 0.1)`,
                                    color: `hsl(var(--${difficultyColor}) / 0.7)`,
                                    borderColor: `hsl(var(--${difficultyColor}) / 0.2)`
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

                            {/* Progress Bar - Full */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">
                                  {goal.total_steps} / {goal.total_steps} steps
                                </span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  100%
                                </span>
                              </div>
                              <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border shadow-inner">
                                <div
                                  className="h-full transition-all duration-500 rounded-full bg-green-500"
                                  style={{ width: "100%" }}
                                />
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

      <Navigation />
    </div>
  );
}
