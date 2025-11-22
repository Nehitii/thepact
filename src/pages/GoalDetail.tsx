import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, ChevronRight, Trash2, Edit, Sparkles, Calendar, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Goal {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  status: string;
  validated_steps: number;
  total_steps: number;
  estimated_cost: number;
  notes: string | null;
  potential_score: number;
  start_date?: string;
  completion_date?: string;
  image_url?: string;
}

interface Step {
  id: string;
  title: string;
  order: number;
  status: string;
  due_date: string | null;
}

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSteps, setEditSteps] = useState(0);
  const [editStartDate, setEditStartDate] = useState("");
  const [editCompletionDate, setEditCompletionDate] = useState("");
  const [editImage, setEditImage] = useState("");

  useEffect(() => {
    if (!user || !id) return;

    const loadData = async () => {
      const { data: goalData } = await supabase
        .from("goals")
        .select("*")
        .eq("id", id)
        .single();

      if (goalData) {
        setGoal(goalData);
        setEditName(goalData.name);
        setEditSteps(goalData.total_steps || 0);
        setEditStartDate(goalData.start_date?.split('T')[0] || "");
        setEditCompletionDate(goalData.completion_date?.split('T')[0] || "");
        setEditImage(goalData.image_url || "");

        const { data: stepsData } = await supabase
          .from("steps")
          .select("*")
          .eq("goal_id", id)
          .order("order", { ascending: true });

        if (stepsData) {
          setSteps(stepsData);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [user, id]);

  const handleToggleStep = async (stepId: string, currentStatus: string) => {
    if (!goal) return;

    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    const validatedAt = newStatus === "completed" ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("steps")
      .update({ status: newStatus, validated_at: validatedAt })
      .eq("id", stepId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Update local state
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, status: newStatus } : s)));

    // Update goal validated_steps count
    const newValidatedCount =
      newStatus === "completed"
        ? goal.validated_steps + 1
        : goal.validated_steps - 1;

    const { error: goalError } = await supabase
      .from("goals")
      .update({ validated_steps: newValidatedCount })
      .eq("id", goal.id);

    if (!goalError) {
      setGoal({ ...goal, validated_steps: newValidatedCount });

      if (newStatus === "completed") {
        toast({
          title: "Step Completed",
          description: "You're making progress!",
        });
      }
    }
  };

  const handleFullyComplete = async () => {
    if (!goal) return;

    const { handleFullyComplete: completeGoal } = await import("./GoalDetail_handlers");
    
    completeGoal(
      goal.id,
      goal.total_steps,
      async () => {
        // Reload data
        const { data: updatedGoal } = await supabase
          .from("goals")
          .select("*")
          .eq("id", goal.id)
          .single();

        if (updatedGoal) {
          setGoal(updatedGoal);
        }

        const { data: updatedSteps } = await supabase
          .from("steps")
          .select("*")
          .eq("goal_id", goal.id)
          .order("order", { ascending: true });

        if (updatedSteps) {
          setSteps(updatedSteps);
        }

        toast({
          title: "Goal Completed! 🎉",
          description: "All steps have been marked as complete",
        });
      },
      (message) => {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    );
  };

  const handleEditGoal = async () => {
    if (!goal) return;

    const { handleUpdateGoal } = await import("./GoalDetail_handlers");
    
    const updates: any = {};
    if (editName !== goal.name) updates.name = editName;
    if (editSteps !== goal.total_steps) updates.total_steps = editSteps;
    if (editStartDate && editStartDate !== goal.start_date?.split('T')[0]) {
      updates.start_date = new Date(editStartDate).toISOString();
    }
    if (editCompletionDate && editCompletionDate !== goal.completion_date?.split('T')[0]) {
      updates.completion_date = new Date(editCompletionDate).toISOString();
    }
    if (editImage !== goal.image_url) updates.image_url = editImage;

    handleUpdateGoal(
      goal.id,
      goal.total_steps,
      updates,
      async () => {
        // Reload data
        const { data: updatedGoal } = await supabase
          .from("goals")
          .select("*")
          .eq("id", goal.id)
          .single();

        if (updatedGoal) {
          setGoal(updatedGoal);
          setEditName(updatedGoal.name);
          setEditSteps(updatedGoal.total_steps || 0);
        }

        const { data: updatedSteps } = await supabase
          .from("steps")
          .select("*")
          .eq("goal_id", goal.id)
          .order("order", { ascending: true });

        if (updatedSteps) {
          setSteps(updatedSteps);
        }

        setEditDialogOpen(false);
        toast({
          title: "Goal Updated",
          description: "Changes saved successfully",
        });
      },
      (message) => {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    );
  };

  const handleDeleteGoal = async () => {
    if (!id) return;

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Goal Deleted",
        description: "This evolution has been removed from your Pact",
      });
      navigate("/goals");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Goal not found</p>
          <Button onClick={() => navigate("/goals")} className="mt-4">
            Back to Goals
          </Button>
        </div>
      </div>
    );
  }

  const progress =
    goal.total_steps > 0 ? (goal.validated_steps / goal.total_steps) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <div className="max-w-2xl mx-auto p-6 space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pt-8">
          <div className="flex items-start gap-4 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("/goals")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {goal.image_url && (
              <img 
                src={goal.image_url} 
                alt={goal.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{goal.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{goal.type}</Badge>
                <Badge variant="outline">{goal.difficulty}</Badge>
                <Badge
                  className={
                    goal.status === "not_started"
                      ? "bg-muted text-muted-foreground"
                      : goal.status === "in_progress"
                      ? "bg-primary/10 text-primary"
                      : goal.status === "validated"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : goal.status === "fully_completed"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-muted"
                  }
                >
                  {goal.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Edit className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Goal Name</Label>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="steps">Number of Steps</Label>
                    <Input
                      id="steps"
                      type="number"
                      min="1"
                      value={editSteps}
                      onChange={(e) => setEditSteps(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="completionDate">Completion Date</Label>
                    <Input
                      id="completionDate"
                      type="date"
                      value={editCompletionDate}
                      onChange={(e) => setEditCompletionDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="image"
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        placeholder="https://..."
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleEditGoal} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={handleFullyComplete}>
              <Sparkles className="h-5 w-5 text-primary" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this goal and all its steps.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {goal.validated_steps} / {goal.total_steps} steps completed
                </span>
                <span className="font-medium text-primary">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {goal.potential_score > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">Potential Score</span>
                <span className="text-lg font-bold text-primary">
                  +{goal.potential_score} pts
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/step/${step.id}`)}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      id={step.id}
                      checked={step.status === "completed"}
                      onCheckedChange={() => handleToggleStep(step.id, step.status)}
                    />
                  </div>
                  <label
                    htmlFor={step.id}
                    className={`flex-1 cursor-pointer text-sm ${
                      step.status === "completed"
                        ? "text-primary font-medium"
                        : ""
                    }`}
                  >
                    {step.title}
                  </label>
                  {step.status === "completed" && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        {(goal.notes || goal.estimated_cost > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goal.estimated_cost > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estimated Cost</p>
                  <p className="text-lg font-semibold">${goal.estimated_cost.toFixed(2)}</p>
                </div>
              )}
              {goal.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{goal.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
