import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/lib/supabase";
import { trackStepCompleted } from "@/lib/achievements";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, ChevronRight, Trash2, Edit, Sparkles, Calendar, Upload, Star, Trophy } from "lucide-react";
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
import { CyberBackground } from "@/components/CyberBackground";
import { useParticleEffect } from "@/components/ParticleEffect";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

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
  is_focus?: boolean;
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
  const { currency } = useCurrency();
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
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editType, setEditType] = useState("");
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");
  const { trigger: triggerParticles, ParticleEffects } = useParticleEffect();

  useEffect(() => {
    if (!user || !id) return;

    const loadData = async () => {
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
        setEditDifficulty(goalData.difficulty || "medium");
        setEditType(goalData.type || "other");

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

    // Trigger particle effect at center of screen
    if (newStatus === "completed") {
      const difficultyColor = getUnifiedDifficultyColor(goal.difficulty, customDifficultyColor);
      const mockEvent = {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2,
        currentTarget: document.body
      } as unknown as React.MouseEvent;
      triggerParticles(mockEvent, difficultyColor);
    }

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
        // Track achievement
        if (user) {
          setTimeout(() => {
            trackStepCompleted(user.id);
          }, 0);
        }

        toast({
          title: "Step Completed",
          description: "You're making progress!",
        });
      }
    }
  };

  const handleFullyComplete = async () => {
    if (!goal || !user) return;

    const { handleFullyComplete: completeGoal } = await import("./GoalDetail_handlers");
    
    completeGoal(
      goal.id,
      goal.total_steps,
      user.id,
      goal.difficulty,
      goal.start_date || new Date().toISOString(),
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
    if (editDifficulty !== goal.difficulty) updates.difficulty = editDifficulty;
    if (editType !== goal.type) updates.type = editType;
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

  // Calculate actual completion ratio from steps
  const completedStepsCount = steps.filter(s => s.status === "completed").length;
  const totalStepsCount = steps.length || 1; // Avoid division by zero
  const progress = (completedStepsCount / totalStepsCount) * 100;

  // Get display label for difficulty
  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === 'custom' && customDifficultyName) {
      return customDifficultyName;
    }
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  // Use unified difficulty color system
  const getDifficultyColor = (difficulty: string) => {
    return getUnifiedDifficultyColor(difficulty, customDifficultyColor);
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

  const difficultyColor = getDifficultyColor(goal.difficulty);
  const isCompleted = goal.status === "fully_completed";

  const toggleFocus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from("goals")
      .update({ is_focus: !goal.is_focus })
      .eq("id", goal.id);

    if (!error) {
      setGoal({ ...goal, is_focus: !goal.is_focus });
    }
  };

  return (
    <div className="min-h-screen relative">
      <CyberBackground />
      <ParticleEffects />
      <div className="relative z-10 bg-gradient-to-br from-background via-background/95 to-secondary/50">
        <div className="max-w-3xl mx-auto p-6 space-y-6 pb-12">
        {/* Back Button */}
        <div className="pt-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/goals")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Hero Card - Matches Goal Card Style */}
        <Card 
          className={`relative overflow-hidden transition-all duration-300 border-2 ${isCompleted ? 'opacity-70' : ''}`}
          style={{
            borderLeftWidth: '8px',
            borderLeftColor: isCompleted ? `${difficultyColor}66` : difficultyColor,
            background: isCompleted 
              ? 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.8) 100%)'
              : 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.95) 100%)',
          }}
        >
          {/* Completion Stamp Effect */}
          {isCompleted && (
            <div className="absolute top-4 right-20 opacity-20 pointer-events-none rotate-12 z-10">
              <div className="border-4 border-green-500 rounded-lg px-4 py-2">
                <span className="text-green-500 font-bold text-sm">COMPLETED</span>
              </div>
            </div>
          )}

          <CardContent className="p-6 relative">
            <div className="flex gap-6">
              {/* Left Section: Image + Focus Star */}
              <div className="relative flex-shrink-0">
                {goal.image_url ? (
                  <div 
                    className={`relative w-32 h-32 rounded-lg overflow-hidden border-2 shadow-lg ${isCompleted ? 'grayscale' : ''}`}
                    style={{ borderColor: isCompleted ? `${difficultyColor}66` : difficultyColor }}
                  >
                    <img 
                      src={goal.image_url} 
                      alt={goal.name}
                      className="w-full h-full object-cover"
                    />
                    {isCompleted && (
                      <div className="absolute inset-0 border-2 pointer-events-none" 
                        style={{ borderColor: `${difficultyColor}99` }} 
                      />
                    )}
                    {/* Focus Star */}
                    <button
                      onClick={toggleFocus}
                      className="absolute -top-2 -left-2 z-10 p-2 bg-card rounded-full shadow-md hover:scale-110 transition-transform border-2"
                      style={{ borderColor: isCompleted ? `${difficultyColor}66` : difficultyColor }}
                      aria-label={goal.is_focus ? "Remove from focus" : "Add to focus"}
                    >
                      <Star 
                        className={`h-5 w-5 ${goal.is_focus ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                      />
                    </button>
                  </div>
                ) : (
                  <div 
                    className={`relative w-32 h-32 rounded-lg border-2 shadow-lg flex items-center justify-center ${isCompleted ? 'grayscale' : ''}`}
                    style={{ 
                      borderColor: isCompleted ? `${difficultyColor}66` : difficultyColor,
                      background: `linear-gradient(135deg, ${difficultyColor}20, ${difficultyColor}10)`
                    }}
                  >
                    <Trophy 
                      className="h-14 w-14" 
                      style={{ color: isCompleted ? `${difficultyColor}99` : difficultyColor }} 
                    />
                    {/* Focus Star */}
                    <button
                      onClick={toggleFocus}
                      className="absolute -top-2 -left-2 z-10 p-2 bg-card rounded-full shadow-md hover:scale-110 transition-transform border-2"
                      style={{ borderColor: isCompleted ? `${difficultyColor}66` : difficultyColor }}
                      aria-label={goal.is_focus ? "Remove from focus" : "Add to focus"}
                    >
                      <Star 
                        className={`h-5 w-5 ${goal.is_focus ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Middle Section: Content */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Title */}
                <h1 className="text-3xl font-bold">{goal.name}</h1>
                
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="secondary" 
                    className="text-sm font-medium capitalize"
                    style={{ 
                      backgroundColor: `${difficultyColor}20`,
                      color: isCompleted ? `${difficultyColor}B3` : difficultyColor,
                      borderColor: `${difficultyColor}50`
                    }}
                  >
                    {getDifficultyLabel(goal.difficulty)}
                  </Badge>
                  <Badge variant="outline" className="text-sm capitalize border">
                    {goal.type}
                  </Badge>
                  <Badge className={`text-sm border ${getStatusColor(goal.status)}`}>
                    {getStatusLabel(goal.status)}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      {completedStepsCount} / {totalStepsCount} steps
                    </span>
                    <span className="font-bold" style={{ color: isCompleted ? "hsl(var(--green-600))" : difficultyColor }}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  {isCompleted ? (
                    <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner relative"
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
                  ) : (
                    <div className="h-3 bg-muted rounded-full overflow-hidden border border-border shadow-inner">
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
                  )}
                </div>

                {/* XP Points */}
                {goal.potential_score > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4" style={{ color: difficultyColor }} />
                    <span className="font-bold" style={{ color: difficultyColor }}>
                      +{goal.potential_score} XP
                    </span>
                  </div>
                )}
              </div>

              {/* Right Section: Actions */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Edit className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                        <Label htmlFor="type">Category</Label>
                        <Select value={editType} onValueChange={setEditType}>
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                            <SelectItem value="financial">Financial</SelectItem>
                            <SelectItem value="learning">Learning</SelectItem>
                            <SelectItem value="bricolage">DIY</SelectItem>
                            <SelectItem value="travaux">Home Renovation</SelectItem>
                            <SelectItem value="relationnel">Relationships</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select value={editDifficulty} onValueChange={setEditDifficulty}>
                          <SelectTrigger id="difficulty">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                            <SelectItem value="extreme">Extreme</SelectItem>
                            <SelectItem value="impossible">Impossible</SelectItem>
                            <SelectItem value="custom">{customDifficultyName || "Custom"}</SelectItem>
                          </SelectContent>
                        </Select>
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
                  <Sparkles className="h-5 w-5" style={{ color: difficultyColor }} />
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
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-primary/20 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(var(--primary)/0.2)] transition-all duration-300 cursor-pointer group relative"
                  onClick={() => navigate(`/step/${step.id}`)}
                >
                  <div onClick={(e) => e.stopPropagation()} className="relative z-20">
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
                        ? "font-semibold"
                        : ""
                    }`}
                    style={{
                      color: step.status === "completed" ? difficultyColor : undefined
                    }}
                  >
                    {step.title}
                  </label>
                  {step.status === "completed" && (
                    <Check className="h-4 w-4" style={{ color: difficultyColor }} />
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
                  <p className="text-lg font-semibold">{formatCurrency(goal.estimated_cost, currency)}</p>
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
    </div>
  );
}
