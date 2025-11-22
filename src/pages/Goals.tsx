import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, ArrowUpDown, CheckCircle2 } from "lucide-react";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-muted text-muted-foreground";
      case "in_progress":
        return "bg-primary/10 text-primary";
      case "validated":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "fully_completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "paused":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      default:
        return "bg-muted text-muted-foreground";
    }
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

                  return (
                    <Card
                      key={goal.id}
                      className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                      onClick={() => navigate(`/goals/${goal.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          {goal.image_url && (
                            <img 
                              src={goal.image_url} 
                              alt={goal.name}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 space-y-3">
                            <div>
                              <h3 className="text-xl font-semibold mb-2">{goal.name}</h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary">{goal.type}</Badge>
                                <Badge variant="outline">{getDifficultyLabel(goal.difficulty)}</Badge>
                                <Badge className={getStatusColor(goal.status)}>
                                  {goal.status === 'not_started' ? 'Not Started' : 
                                   goal.status === 'in_progress' ? 'In Progress' : 
                                   goal.status === 'validated' ? 'Validated' : 'Completed'}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {goal.validated_steps} / {goal.total_steps} steps completed
                                </span>
                                <span className="font-medium text-primary">
                                  {progress.toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-500 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            {goal.potential_score > 0 && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Potential Score:</span>
                                <span className="font-semibold text-primary">
                                  +{goal.potential_score} pts
                                </span>
                              </div>
                            )}
                          </div>

                          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
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

                  return (
                    <Card
                      key={goal.id}
                      className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 relative bg-muted/30"
                      onClick={() => navigate(`/goals/${goal.id}`)}
                    >
                      {/* Green Completed Badge */}
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-green-500/90 text-white hover:bg-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                      
                      <CardContent className="p-6 opacity-75">
                        <div className="flex items-start justify-between gap-4">
                          {goal.image_url && (
                            <img 
                              src={goal.image_url} 
                              alt={goal.name}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0 grayscale"
                            />
                          )}
                          <div className="flex-1 space-y-3">
                            <div>
                              <h3 className="text-xl font-semibold mb-2">{goal.name}</h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary">{goal.type}</Badge>
                                <Badge variant="outline">{getDifficultyLabel(goal.difficulty)}</Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {goal.validated_steps} / {goal.total_steps} steps completed
                                </span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {progress}%
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 transition-all duration-500 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            {goal.potential_score > 0 && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Score Earned:</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  +{goal.potential_score} pts
                                </span>
                              </div>
                            )}
                          </div>

                          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
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
