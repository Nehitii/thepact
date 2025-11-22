import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  status: string;
  validated_steps: number;
  total_steps: number;
  potential_score: number;
}

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadGoals = async () => {
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
      case "active":
        return "bg-primary/10 text-primary";
      case "completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "paused":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

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
        <div className="flex items-center justify-between pt-8">
          <div>
            <h1 className="text-3xl font-bold">Goals</h1>
            <p className="text-muted-foreground">Evolutions of your Pact</p>
          </div>
          <Button onClick={() => navigate("/goals/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Goals List */}
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
          <div className="space-y-4">
            {goals.map((goal) => {
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
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{goal.name}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">{goal.type}</Badge>
                            <Badge variant="outline">{goal.difficulty}</Badge>
                            <Badge className={getStatusColor(goal.status)}>
                              {goal.status}
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
            })}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
