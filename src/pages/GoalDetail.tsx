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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, ChevronRight, Trash2, Edit, Sparkles, Calendar, Star, Trophy, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useParticleEffect } from "@/components/ParticleEffect";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { GoalImageUpload } from "@/components/GoalImageUpload";
import { CostItemsEditor, CostItemData } from "@/components/goals/CostItemsEditor";
import { useCostItems, useSaveCostItems } from "@/hooks/useCostItems";

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
  goal_type?: string;
  habit_duration_days?: number;
  habit_checks?: boolean[];
}

interface Step {
  id: string;
  title: string;
  order: number;
  status: string;
  due_date: string | null;
}

const goalTypes = [
  { value: "personal", label: "Personal" },
  { value: "professional", label: "Professional" },
  { value: "health", label: "Health" },
  { value: "creative", label: "Creative" },
  { value: "financial", label: "Financial" },
  { value: "learning", label: "Learning" },
  { value: "relationship", label: "Relationship" },
  { value: "diy", label: "DIY" },
  { value: "other", label: "Other" }
];

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
  const [editNotes, setEditNotes] = useState("");
  const [editCostItems, setEditCostItems] = useState<CostItemData[]>([]);
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");
  const [customDifficultyActive, setCustomDifficultyActive] = useState(false);
  const { trigger: triggerParticles, ParticleEffects } = useParticleEffect();

  const { data: costItems = [] } = useCostItems(id);
  const saveCostItems = useSaveCostItems();

  useEffect(() => {
    if (!user || !id) return;
    const loadData = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("custom_difficulty_name, custom_difficulty_color, custom_difficulty_active")
        .eq("id", user.id)
        .maybeSingle();
      if (profileData) {
        setCustomDifficultyName(profileData.custom_difficulty_name || "");
        setCustomDifficultyColor(profileData.custom_difficulty_color || "#a855f7");
        setCustomDifficultyActive(profileData.custom_difficulty_active || false);
      }
      const { data: goalData } = await supabase.from("goals").select("*").eq("id", id).single();
      if (goalData) {
        setGoal(goalData);
        setEditName(goalData.name);
        setEditSteps(goalData.total_steps || 0);
        setEditStartDate(goalData.start_date?.split("T")[0] || "");
        setEditCompletionDate(goalData.completion_date?.split("T")[0] || "");
        setEditImage(goalData.image_url || "");
        setEditDifficulty(goalData.difficulty || "medium");
        setEditType(goalData.type || "other");
        setEditNotes(goalData.notes || "");
        const { data: stepsData } = await supabase.from("steps").select("*").eq("goal_id", id).order("order", { ascending: true });
        if (stepsData) setSteps(stepsData);
      }
      setLoading(false);
    };
    loadData();
  }, [user, id]);

  // Sync cost items when loaded
  useEffect(() => {
    if (costItems.length > 0) {
      setEditCostItems(costItems.map((item) => ({ id: item.id, name: item.name, price: item.price })));
    }
  }, [costItems]);

  const difficulties = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
    { value: "extreme", label: "Extreme" },
    { value: "impossible", label: "Impossible" },
    ...(customDifficultyActive ? [{ value: "custom", label: customDifficultyName || "Custom" }] : [])
  ];

  const handleToggleStep = async (stepId: string, currentStatus: string) => {
    if (!goal) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    const validatedAt = newStatus === "completed" ? new Date().toISOString() : null;

    if (newStatus === "completed") {
      const difficultyColor = getUnifiedDifficultyColor(goal.difficulty, customDifficultyColor);
      const mockEvent = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, currentTarget: document.body } as unknown as React.MouseEvent;
      triggerParticles(mockEvent, difficultyColor);
    }
    const { error } = await supabase.from("steps").update({ status: newStatus, validated_at: validatedAt }).eq("id", stepId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, status: newStatus } : s)));
    const newValidatedCount = newStatus === "completed" ? goal.validated_steps + 1 : goal.validated_steps - 1;
    const { error: goalError } = await supabase.from("goals").update({ validated_steps: newValidatedCount }).eq("id", goal.id);
    if (!goalError) {
      setGoal({ ...goal, validated_steps: newValidatedCount });
      if (newStatus === "completed" && user) {
        setTimeout(() => { trackStepCompleted(user.id); }, 0);
        toast({ title: "Step Completed", description: "You're making progress!" });
      }
    }
  };

  const handleToggleHabitCheck = async (dayIndex: number) => {
    if (!goal || !goal.habit_checks || !user) return;
    const newChecks = [...goal.habit_checks];
    newChecks[dayIndex] = !newChecks[dayIndex];
    if (newChecks[dayIndex]) {
      const difficultyColor = getUnifiedDifficultyColor(goal.difficulty, customDifficultyColor);
      const mockEvent = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, currentTarget: document.body } as unknown as React.MouseEvent;
      triggerParticles(mockEvent, difficultyColor);
    }
    const completedCount = newChecks.filter(Boolean).length;
    const isNowComplete = completedCount === goal.habit_duration_days;
    const { error } = await supabase.from("goals").update({
      habit_checks: newChecks,
      validated_steps: completedCount,
      status: isNowComplete ? "fully_completed" : completedCount > 0 ? "in_progress" : "not_started",
      completion_date: isNowComplete ? new Date().toISOString() : null,
    }).eq("id", goal.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setGoal({ ...goal, habit_checks: newChecks, validated_steps: completedCount, status: isNowComplete ? "fully_completed" : completedCount > 0 ? "in_progress" : "not_started" });
    if (newChecks[dayIndex]) {
      setTimeout(() => { trackStepCompleted(user.id); }, 0);
      toast({ title: `Day ${dayIndex + 1} Complete!`, description: isNowComplete ? "Congratulations! Habit completed!" : `${completedCount}/${goal.habit_duration_days} days done` });
    }
  };

  const handleFullyComplete = async () => {
    if (!goal || !user) return;
    const { handleFullyComplete: completeGoal } = await import("./GoalDetail_handlers");
    completeGoal(goal.id, goal.total_steps, user.id, goal.difficulty, goal.start_date || new Date().toISOString(), async () => {
      const { data: updatedGoal } = await supabase.from("goals").select("*").eq("id", goal.id).single();
      if (updatedGoal) setGoal(updatedGoal);
      const { data: updatedSteps } = await supabase.from("steps").select("*").eq("goal_id", goal.id).order("order", { ascending: true });
      if (updatedSteps) setSteps(updatedSteps);
      toast({ title: "Goal Completed! 🎉", description: "All steps have been marked as complete" });
    }, (message) => { toast({ title: "Error", description: message, variant: "destructive" }); });
  };

  const handleEditGoal = async () => {
    if (!goal) return;
    const { handleUpdateGoal } = await import("./GoalDetail_handlers");
    const updates: any = {};
    if (editName !== goal.name) updates.name = editName;
    if (editSteps !== goal.total_steps) updates.total_steps = editSteps;
    if (editDifficulty !== goal.difficulty) updates.difficulty = editDifficulty;
    if (editType !== goal.type) updates.type = editType;
    if (editNotes !== (goal.notes || "")) updates.notes = editNotes || null;
    if (editStartDate && editStartDate !== goal.start_date?.split("T")[0]) updates.start_date = new Date(editStartDate).toISOString();
    if (editCompletionDate && editCompletionDate !== goal.completion_date?.split("T")[0]) updates.completion_date = new Date(editCompletionDate).toISOString();
    if (editImage !== goal.image_url) updates.image_url = editImage;

    // Save cost items
    if (id) {
      try {
        const newTotal = await saveCostItems.mutateAsync({ goalId: id, items: editCostItems });
        updates.estimated_cost = newTotal;
      } catch (err) {
        toast({ title: "Error", description: "Failed to save cost items", variant: "destructive" });
      }
    }

    handleUpdateGoal(goal.id, goal.total_steps, updates, async () => {
      const { data: updatedGoal } = await supabase.from("goals").select("*").eq("id", goal.id).single();
      if (updatedGoal) {
        setGoal(updatedGoal);
        setEditName(updatedGoal.name);
        setEditSteps(updatedGoal.total_steps || 0);
        setEditNotes(updatedGoal.notes || "");
      }
      const { data: updatedSteps } = await supabase.from("steps").select("*").eq("goal_id", goal.id).order("order", { ascending: true });
      if (updatedSteps) setSteps(updatedSteps);
      setEditDialogOpen(false);
      toast({ title: "Goal Updated", description: "Changes saved successfully" });
    }, (message) => { toast({ title: "Error", description: message, variant: "destructive" }); });
  };

  const handleDeleteGoal = async () => {
    if (!id) return;
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Goal Deleted", description: "This evolution has been removed from your Pact" });
      navigate("/goals");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#00050B]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#00050B]">
        <div className="text-center">
          <p className="text-muted-foreground">Goal not found</p>
          <Button onClick={() => navigate("/goals")} className="mt-4">Back to Goals</Button>
        </div>
      </div>
    );
  }

  const isHabitGoal = goal.goal_type === "habit";
  const completedStepsCount = isHabitGoal ? (goal.habit_checks?.filter(Boolean).length || 0) : steps.filter((s) => s.status === "completed").length;
  const totalStepsCount = isHabitGoal ? (goal.habit_duration_days || 1) : (steps.length || 1);
  const progress = (completedStepsCount / totalStepsCount) * 100;

  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === "custom" && customDifficultyName) return customDifficultyName;
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const getDifficultyColor = (difficulty: string) => getUnifiedDifficultyColor(difficulty, customDifficultyColor);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started": return "bg-muted text-muted-foreground";
      case "in_progress": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "validated": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "fully_completed": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "paused": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default: return "bg-muted text-muted-foreground";
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
    const { error } = await supabase.from("goals").update({ is_focus: !goal.is_focus }).eq("id", goal.id);
    if (!error) setGoal({ ...goal, is_focus: !goal.is_focus });
  };

  return (
    <div className="min-h-screen bg-[#00050B] relative overflow-hidden">
      {/* Deep space background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }} />
      </div>

      <ParticleEffects />

      <div className="max-w-3xl mx-auto p-6 space-y-6 relative z-10 pb-24">
        {/* Header */}
        <div className="pt-8 space-y-4 animate-fade-in">
          <Button variant="ghost" onClick={() => navigate("/goals")} className="text-primary/70 hover:text-primary hover:bg-primary/10 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goals
          </Button>
        </div>

        {/* Hero Card */}
        <div className="relative rounded-xl border border-primary/20 bg-[#050A13]/80 backdrop-blur-xl p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          {isCompleted && (
            <div className="absolute top-4 right-4 opacity-25 pointer-events-none rotate-12 z-10">
              <div className="border-2 border-green-400 rounded-lg px-3 py-1 bg-green-400/10">
                <span className="text-green-400 font-bold text-xs font-orbitron tracking-wider">COMPLETED</span>
              </div>
            </div>
          )}

          <div className="relative flex flex-col md:flex-row gap-6">
            {/* Image */}
            <div className="relative flex-shrink-0">
              {goal.image_url ? (
                <div className={`relative w-32 h-32 rounded-xl overflow-hidden border border-primary/40 ${isCompleted ? "grayscale" : ""}`} style={{ boxShadow: `0 0 30px ${difficultyColor}40` }}>
                  <img src={goal.image_url} alt={goal.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="relative w-32 h-32 rounded-xl border border-primary/40 flex items-center justify-center" style={{ background: `radial-gradient(circle at 30% 30%, ${difficultyColor}20, #050A13)`, boxShadow: `0 0 30px ${difficultyColor}40` }}>
                  <Trophy className="h-14 w-14" style={{ color: difficultyColor, filter: `drop-shadow(0 0 12px ${difficultyColor})` }} />
                </div>
              )}
              <button onClick={toggleFocus} className="absolute -top-3 -right-3 z-20 p-2 bg-[#050A13] rounded-full border border-primary/60 hover:scale-110 transition-all shadow-[0_0_20px_rgba(91,180,255,0.5)]">
                <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-primary/70"}`} style={{ filter: goal.is_focus ? "drop-shadow(0 0 6px rgba(250, 204, 21, 0.9))" : "none" }} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary" style={{ textShadow: "0 0 16px rgba(91, 180, 255, 0.3)" }}>
                {goal.name}
              </h1>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-bold font-rajdhani uppercase tracking-wider" style={{ borderColor: difficultyColor, color: difficultyColor, backgroundColor: `${difficultyColor}15` }}>
                  {getDifficultyLabel(goal.difficulty)}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize font-rajdhani border-primary/30 text-primary">
                  {goal.type}
                </Badge>
                <Badge className={`text-xs ${getStatusColor(goal.status)} font-rajdhani font-bold uppercase`}>
                  {getStatusLabel(goal.status)}
                </Badge>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-rajdhani">
                  <span className="uppercase tracking-wider text-primary/70">Progress</span>
                  <span className="font-bold" style={{ color: difficultyColor }}>{completedStepsCount}/{totalStepsCount} • {progress.toFixed(0)}%</span>
                </div>
                <div className="h-3 w-full bg-[#050A13] rounded-full overflow-hidden border border-primary/30">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: `linear-gradient(90deg, #5BB4FF, ${difficultyColor})`, boxShadow: `0 0 20px ${difficultyColor}60` }} />
                </div>
              </div>

              {goal.potential_score > 0 && (
                <div className="flex items-center gap-2 font-rajdhani font-bold">
                  <Sparkles className="h-5 w-5 text-yellow-400" style={{ filter: "drop-shadow(0 0 8px rgba(250, 204, 21, 0.9))" }} />
                  <span className="text-yellow-400" style={{ textShadow: "0 0 10px rgba(250, 204, 21, 0.6)" }}>+{goal.potential_score} XP Reward</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hud" size="sm" className="rounded-lg">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-orbitron">Edit Goal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Goal Name</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={editType} onValueChange={setEditType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {goalTypes.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <Select value={editDifficulty} onValueChange={setEditDifficulty}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {difficulties.map((d) => (<SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {goal.goal_type !== "habit" && (
                      <div className="space-y-2">
                        <Label>Number of Steps</Label>
                        <Input type="number" min="1" value={editSteps} onChange={(e) => setEditSteps(parseInt(e.target.value) || 0)} />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Completion Date</Label>
                        <Input type="date" value={editCompletionDate} onChange={(e) => setEditCompletionDate(e.target.value)} />
                      </div>
                    </div>
                    <CostItemsEditor items={editCostItems} onChange={setEditCostItems} legacyTotal={goal.estimated_cost} />
                    {user && (
                      <div className="space-y-2">
                        <Label>Goal Image</Label>
                        <GoalImageUpload value={editImage} onChange={setEditImage} userId={user.id} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={4} maxLength={500} />
                    </div>
                    <Button onClick={handleEditGoal} className="w-full">Save Changes</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="hud" 
                size="sm" 
                onClick={handleFullyComplete} 
                className="rounded-lg"
                style={{ 
                  borderColor: `${difficultyColor}50`, 
                  color: difficultyColor,
                  boxShadow: `0 0 12px ${difficultyColor}20, inset 0 1px 0 ${difficultyColor}15`
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Complete
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="hud" 
                    size="sm" 
                    className="rounded-lg border-destructive/40 text-destructive hover:border-destructive/70 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete this goal and all its steps.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Steps or Habit Tracking */}
        {isHabitGoal ? (
          <div className="relative rounded-xl border border-primary/20 bg-[#050A13]/80 backdrop-blur-xl animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-5 w-5" style={{ color: difficultyColor }} />
                <span className="font-orbitron font-bold tracking-wider">Habit Tracking</span>
                <Badge variant="outline" className="ml-auto font-rajdhani text-sm" style={{ borderColor: difficultyColor, color: difficultyColor }}>
                  {completedStepsCount}/{goal.habit_duration_days} days
                </Badge>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {goal.habit_checks?.map((checked, index) => (
                  <div key={index} onClick={() => handleToggleHabitCheck(index)} className={`relative flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${checked ? "border-primary/60 bg-primary/10" : "border-primary/20 bg-[#050A13]/50 hover:border-primary/40"}`} style={{ boxShadow: checked ? `0 0 20px ${difficultyColor}30` : undefined }}>
                    <span className="text-xs text-muted-foreground mb-1 font-rajdhani uppercase">Day</span>
                    <span className={`text-lg font-bold font-orbitron ${checked ? "" : "text-muted-foreground"}`} style={{ color: checked ? difficultyColor : undefined }}>{index + 1}</span>
                    {checked && <Check className="absolute top-1 right-1 h-3 w-3" style={{ color: difficultyColor }} />}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center font-rajdhani">Tap a day to mark it as complete</p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl border border-primary/20 bg-[#050A13]/80 backdrop-blur-xl animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                <Check className="h-5 w-5" style={{ color: difficultyColor }} />
                <span className="font-orbitron font-bold tracking-wider">Steps</span>
                <Badge variant="outline" className="ml-auto font-rajdhani text-sm" style={{ borderColor: difficultyColor, color: difficultyColor }}>
                  {completedStepsCount}/{totalStepsCount}
                </Badge>
              </div>
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.id} className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${step.status === "completed" ? "border-primary/40 bg-primary/5" : "border-primary/20 bg-[#050A13]/50 hover:border-primary/40"}`} onClick={() => navigate(`/step/${step.id}`)}>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={step.status === "completed"} onCheckedChange={() => handleToggleStep(step.id, step.status)} className="border-primary/50" />
                    </div>
                    <span className={`flex-1 font-rajdhani ${step.status === "completed" ? "text-primary" : "text-muted-foreground"}`}>{step.title}</span>
                    {step.status === "completed" && <Check className="h-4 w-4" style={{ color: difficultyColor }} />}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Details & Cost Items */}
        {(goal.notes || goal.estimated_cost > 0 || costItems.length > 0) && (
          <div className="relative rounded-xl border border-primary/20 bg-[#050A13]/80 backdrop-blur-xl animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" style={{ color: difficultyColor }} />
                <span className="font-orbitron font-bold tracking-wider">Details</span>
              </div>

              {(goal.estimated_cost > 0 || costItems.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-rajdhani uppercase tracking-wider text-primary/70">
                    <Receipt className="h-4 w-4" />
                    Estimated Cost
                  </div>
                  {costItems.length > 0 ? (
                    <div className="space-y-2">
                      {costItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-[#050A13]/50">
                          <span className="font-rajdhani text-foreground/90">{item.name}</span>
                          <span className="font-orbitron font-bold" style={{ color: difficultyColor }}>{formatCurrency(item.price, currency)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <span className="font-rajdhani uppercase tracking-wider text-primary/70">Total</span>
                        <span className="font-orbitron font-bold text-lg text-primary">{formatCurrency(goal.estimated_cost, currency)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg border border-primary/20 bg-[#050A13]/50">
                      <p className="text-2xl font-bold font-orbitron" style={{ color: difficultyColor }}>{formatCurrency(goal.estimated_cost, currency)}</p>
                    </div>
                  )}
                </div>
              )}

              {goal.notes && (
                <div className="space-y-2">
                  <p className="text-sm font-rajdhani uppercase tracking-wider text-primary/70">Notes</p>
                  <div className="p-4 rounded-lg border border-primary/20 bg-[#050A13]/50">
                    <p className="text-sm font-rajdhani leading-relaxed text-foreground/90">{goal.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
