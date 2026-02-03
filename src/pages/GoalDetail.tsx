import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/lib/supabase";
import { trackStepCompleted } from "@/lib/achievements";
import { useGoalTags, useSaveGoalTags } from "@/hooks/useGoalTags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, ChevronRight, Trash2, Edit, Sparkles, Calendar, Star, Trophy, Receipt, Target, Tag, Zap, ListOrdered, Image, StickyNote, DollarSign, X, MessageSquare, Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useParticleEffect } from "@/components/ParticleEffect";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { GoalImageUpload } from "@/components/GoalImageUpload";
import { CostItemsEditor, CostItemData } from "@/components/goals/CostItemsEditor";
import { useCostItems, useSaveCostItems } from "@/hooks/useCostItems";
import { useCreatePactWishlistItem } from "@/hooks/usePactWishlist";
import { useUserShop } from "@/hooks/useShop";
import { CyberBackground } from "@/components/CyberBackground";
import { motion, AnimatePresence } from "framer-motion";
import { GOAL_TAGS, DIFFICULTY_OPTIONS, getTagLabel, getDifficultyLabel } from "@/lib/goalConstants";
import { SuperGoalChildList, SuperGoalEditModal, computeSuperGoalProgress, filterGoalsByRule, type SuperGoalRule, type SuperGoalChildInfo } from "@/components/goals/super";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";

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
  // Super Goal fields
  child_goal_ids?: string[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  super_goal_rule?: any;
  is_dynamic_super?: boolean;
  pact_id?: string;
}

interface Step {
  id: string;
  title: string;
  order: number;
  status: string;
  due_date: string | null;
  notes?: string | null;
}

export default function GoalDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isModulePurchased } = useUserShop(user?.id);
  const createWishlistItem = useCreatePactWishlistItem();
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
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editCostItems, setEditCostItems] = useState<CostItemData[]>([]);
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");
  const [customDifficultyActive, setCustomDifficultyActive] = useState(false);
  const [superGoalEditOpen, setSuperGoalEditOpen] = useState(false);
  const { trigger: triggerParticles, ParticleEffects } = useParticleEffect();

  const { data: costItems = [] } = useCostItems(id);
  const saveCostItems = useSaveCostItems();
  const { data: goalTagsData = [] } = useGoalTags(id);
  const saveGoalTags = useSaveGoalTags();
  
  // Fetch pact and all goals for Super Goal context
  const { data: pact } = usePact(user?.id);
  const { data: allGoals = [] } = useGoals(pact?.id, { includeStepCounts: true });
  
  // Pre-compute child goals info for Super Goals (must be before early returns)
  const childGoalsInfo: SuperGoalChildInfo[] = useMemo(() => {
    if (!goal || goal.goal_type !== "super") return [];
    
    let childIds = goal.child_goal_ids || [];
    
    // If dynamic, apply rule to get current children
    if (goal.is_dynamic_super && goal.super_goal_rule) {
      const eligibleGoals = allGoals.filter(g => g.id !== goal.id && g.goal_type !== "super");
      const matched = filterGoalsByRule(eligibleGoals, goal.super_goal_rule as SuperGoalRule);
      childIds = matched.map(g => g.id);
    }
    
    return childIds.map(childId => {
      const childGoal = allGoals.find(g => g.id === childId);
      if (!childGoal) {
        return {
          id: childId,
          name: "Missing Goal",
          difficulty: "medium",
          status: "not_started",
          progress: 0,
          isCompleted: false,
          isMissing: true,
        };
      }
      
      const total = childGoal.totalStepsCount ?? childGoal.total_steps ?? 0;
      const completed = childGoal.completedStepsCount ?? childGoal.validated_steps ?? 0;
      const prog = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        id: childGoal.id,
        name: childGoal.name,
        difficulty: childGoal.difficulty,
        status: childGoal.status,
        progress: prog,
        isCompleted: childGoal.status === "fully_completed",
        isMissing: false,
      };
    });
  }, [goal, allGoals]);

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
        // Tags will be loaded from goalTagsData hook
        setEditNotes(goalData.notes || "");
        const { data: stepsData } = await supabase.from("steps").select("*").eq("goal_id", id).order("order", { ascending: true });
        if (stepsData) setSteps(stepsData);
      }
      setLoading(false);
    };
    loadData();
  }, [user, id]);

  // Sync tags from junction table when loaded
  useEffect(() => {
    if (goalTagsData.length > 0) {
      setEditTags(goalTagsData.map(t => t.tag));
    } else if (goal?.type) {
      // Fallback to legacy type field if no junction tags exist
      const validTag = mapToValidTag(goal.type);
      setEditTags([validTag]);
    }
  }, [goalTagsData, goal?.type]);

  // Sync cost items when loaded
  useEffect(() => {
    if (costItems.length > 0) {
      setEditCostItems(costItems.map((item) => ({ id: item.id, name: item.name, price: item.price })));
    }
  }, [costItems]);

  const allDifficulties = [
    ...DIFFICULTY_OPTIONS,
    ...(customDifficultyActive ? [{ value: "custom" as const, label: customDifficultyName || "Custom", color: customDifficultyColor }] : [])
  ];

  // Toggle tag for multi-select
  const toggleEditTag = (tagValue: string) => {
    setEditTags(prev => 
      prev.includes(tagValue) 
        ? prev.filter(t => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  // Map old/invalid tags to valid ones
  const mapToValidTag = (tag: string): string => {
    const validValues = GOAL_TAGS.map(t => t.value) as readonly string[];
    const lowered = tag.toLowerCase();
    if (validValues.includes(lowered)) return lowered;
    // Map old tags like "Growth" to closest valid tag
    const mapping: Record<string, string> = {
      "growth": "personal",
      "career": "professional",
      "fitness": "health",
      "art": "creative",
      "money": "financial",
      "education": "learning",
      "social": "relationship",
      "craft": "diy"
    };
    return mapping[lowered] || "other";
  };

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
    // Use first selected tag as primary type for DB compatibility
    const primaryTag = editTags[0] || "personal";
    if (primaryTag !== goal.type) updates.type = primaryTag;
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

      // Save tags to junction table
      try {
        await saveGoalTags.mutateAsync({ goalId: id, tags: editTags });
      } catch (err) {
        toast({ title: "Error", description: "Failed to save tags", variant: "destructive" });
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground font-rajdhani">Goal not found</p>
          <Button onClick={() => navigate("/goals")} variant="hud" className="mt-4 rounded-lg">Back to Goals</Button>
        </div>
      </div>
    );
  }

  const isHabitGoal = goal.goal_type === "habit";
  const isSuperGoal = goal.goal_type === "super";
  
  // Compute progress based on goal type
  let completedStepsCount: number;
  let totalStepsCount: number;
  let progress: number;
  
  if (isSuperGoal) {
    const superProgress = computeSuperGoalProgress(childGoalsInfo);
    completedStepsCount = superProgress.completedCount;
    totalStepsCount = superProgress.totalCount;
    progress = superProgress.percentage;
  } else if (isHabitGoal) {
    completedStepsCount = goal.habit_checks?.filter(Boolean).length || 0;
    totalStepsCount = goal.habit_duration_days || 1;
    progress = (completedStepsCount / totalStepsCount) * 100;
  } else {
    completedStepsCount = steps.filter((s) => s.status === "completed").length;
    totalStepsCount = steps.length || 1;
    progress = (completedStepsCount / totalStepsCount) * 100;
  }

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* CyberBackground matching /goals */}
      <CyberBackground />
      <ParticleEffects />

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6 pb-24"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <button 
            onClick={() => navigate("/goals")} 
            className="relative overflow-hidden group flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 backdrop-blur-sm border border-border text-primary/70 font-rajdhani font-medium tracking-wider transition-all duration-300 hover:border-primary/40 hover:text-primary hover:bg-primary/10 hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Goals</span>
          </button>
        </motion.div>

        {/* Hero Card */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative rounded-xl border border-border bg-card/80 backdrop-blur-xl p-6"
          style={{ 
            borderColor: `${difficultyColor}30`,
            boxShadow: `0 0 30px ${difficultyColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`
          }}
        >
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
                <div 
                  className={`relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-2 ${isCompleted ? "grayscale" : ""}`} 
                  style={{ 
                    borderColor: `${difficultyColor}60`,
                    boxShadow: `0 0 25px ${difficultyColor}40` 
                  }}
                >
                  <img src={goal.image_url} alt={goal.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div 
                  className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl border-2 flex items-center justify-center" 
                  style={{ 
                    background: `radial-gradient(circle at 30% 30%, ${difficultyColor}25, hsl(var(--card)))`,
                    borderColor: `${difficultyColor}50`,
                    boxShadow: `0 0 25px ${difficultyColor}40` 
                  }}
                >
                  <Trophy className="h-10 w-10 md:h-14 md:w-14" style={{ color: difficultyColor, filter: `drop-shadow(0 0 12px ${difficultyColor})` }} />
                </div>
              )}
              <button 
                onClick={toggleFocus} 
                className="absolute -top-2 -right-2 z-20 p-2 bg-card rounded-full border border-primary/60 hover:scale-110 transition-all duration-200 shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
              >
                <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-primary/70"}`} style={{ filter: goal.is_focus ? "drop-shadow(0 0 6px rgba(250, 204, 21, 0.9))" : "none" }} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold font-orbitron tracking-wider bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
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
                <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden border border-border">
                  <motion.div 
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ 
                      background: `linear-gradient(90deg, hsl(var(--primary)), ${difficultyColor})`,
                      boxShadow: `0 0 15px ${difficultyColor}60` 
                    }} 
                  />
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
              <Button variant="hud" size="sm" className="rounded-lg" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>

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
        </motion.div>

        {/* Steps, Habit Tracking, or Super Goal Children */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {isSuperGoal ? (
            /* Super Goal - Child Goals List */
            <div className="relative rounded-xl border-2 border-primary/30 bg-card/80 backdrop-blur-xl overflow-hidden">
              {/* Legendary aura effect */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at top, hsl(var(--primary) / 0.3), transparent 70%)`,
                }}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <div className="relative p-6">
                {/* Header with edit button */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <Badge variant="outline" className="border-primary/30 text-primary text-xs font-bold uppercase mb-1">
                        {goal.is_dynamic_super ? "Dynamic Super Goal" : "Super Goal"}
                      </Badge>
                      {goal.is_dynamic_super && goal.super_goal_rule && (
                        <p className="text-xs text-muted-foreground font-mono">
                          Auto-updates based on rules
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="hud"
                    size="sm"
                    onClick={() => setSuperGoalEditOpen(true)}
                    className="rounded-lg"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Goals
                  </Button>
                </div>
                
                <SuperGoalChildList
                  children={childGoalsInfo}
                  onChildClick={(childId) => navigate(`/goals/${childId}`)}
                  customDifficultyName={customDifficultyName}
                  customDifficultyColor={customDifficultyColor}
                />
              </div>
            </div>
          ) : isHabitGoal ? (
            <div className="relative rounded-xl border border-border bg-card/80 backdrop-blur-xl">
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
                    <div key={index} onClick={() => handleToggleHabitCheck(index)} className={`relative flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${checked ? "border-primary/60 bg-primary/10" : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"}`} style={{ boxShadow: checked ? `0 0 20px ${difficultyColor}30` : undefined }}>
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
            <div className="relative rounded-xl border border-border bg-card/80 backdrop-blur-xl">
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
                  <TooltipProvider delayDuration={300}>
                    {steps.map((step) => (
                      <Tooltip key={step.id}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${step.status === "completed" ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"}`} 
                            onClick={() => navigate(`/step/${step.id}`)}
                          >
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox checked={step.status === "completed"} onCheckedChange={() => handleToggleStep(step.id, step.status)} className="border-primary/50" />
                            </div>
                            <span className={`flex-1 font-rajdhani ${step.status === "completed" ? "text-primary" : "text-muted-foreground"}`}>{step.title}</span>
                            {step.notes && <MessageSquare className="h-4 w-4 text-primary/50" />}
                            {step.status === "completed" && <Check className="h-4 w-4" style={{ color: difficultyColor }} />}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        {step.notes && (
                          <TooltipContent side="top" className="max-w-[300px] p-3 bg-card border-primary/30">
                            <p className="text-sm font-rajdhani text-foreground/90 whitespace-pre-wrap">{step.notes}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Details & Cost Items */}
        {(goal.notes || goal.estimated_cost > 0 || costItems.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="relative rounded-xl border border-border bg-card/80 backdrop-blur-xl"
          >
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
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
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
                    <div className="p-4 rounded-lg border border-border bg-muted/30">
                      <p className="text-2xl font-bold font-orbitron" style={{ color: difficultyColor }}>{formatCurrency(goal.estimated_cost, currency)}</p>
                    </div>
                  )}
                </div>
              )}

              {goal.notes && (
                <div className="space-y-2">
                  <p className="text-sm font-rajdhani uppercase tracking-wider text-primary/70">Notes</p>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <p className="text-sm font-rajdhani leading-relaxed text-foreground/90">{goal.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Full-Page Edit Goal Overlay */}
      <AnimatePresence>
        {editDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background overflow-hidden"
          >
            {/* Deep space background - matching NewGoal.tsx */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
              <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
            </div>

            {/* Sci-fi grid overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: "50px 50px",
                }}
              />
            </div>

            <div className="relative z-10 h-full overflow-y-auto">
              <div className="max-w-2xl mx-auto px-6 py-8">
                {/* Header */}
                <motion.div 
                  className="space-y-6 mb-10"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => setEditDialogOpen(false)}
                    className="text-primary/70 hover:text-primary hover:bg-primary/10 -ml-2 rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Goal
                  </Button>
                  
                  <div className="text-center space-y-3">
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_30px_rgba(91,180,255,0.6)] font-orbitron">
                      Edit Goal
                    </h1>
                    <p className="text-primary/60 tracking-wide font-rajdhani text-lg">
                      Update your evolution
                    </p>
                  </div>
                </motion.div>

                {/* Form Card */}
                <motion.div 
                  className="relative rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="relative p-8 md:p-10 space-y-10">
                    
                    {/* Section 1: Basic Info */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                        <Target className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Basic Information</h2>
                      </div>
                      
                      {/* Goal Name */}
                      <div className="space-y-3">
                        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                          Goal Name <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                          variant="light"
                          className="h-12 text-base rounded-xl"
                          maxLength={100}
                        />
                      </div>

                      {/* Tags Multi-Select */}
                      <div className="space-y-3">
                        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Tags <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {GOAL_TAGS.map((tag) => {
                            const isSelected = editTags.includes(tag.value);
                            return (
                              <button
                                key={tag.value}
                                type="button"
                                onClick={() => toggleEditTag(tag.value)}
                                className={`
                                  relative px-4 py-2 rounded-xl font-rajdhani text-sm font-medium transition-all duration-200
                                  ${isSelected 
                                    ? 'text-white shadow-lg' 
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
                                  }
                                `}
                                style={isSelected ? { 
                                  background: tag.color,
                                  boxShadow: `0 0 20px ${tag.color}40`
                                } : {}}
                              >
                                <span className="flex items-center gap-1.5">
                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                  {getTagLabel(tag.value, t)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">Select your primary tag (first selected will be saved)</p>
                      </div>
                    </div>

                    {/* Section 2: Type & Difficulty */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                        <Zap className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Type & Difficulty</h2>
                      </div>

                      {/* Goal Type Display (read-only) */}
                      <div className="space-y-3">
                        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">Goal Type</Label>
                        <div className="flex gap-3">
                          <div className={`flex-1 p-4 rounded-xl border-2 text-center ${
                            goal.goal_type !== "habit" 
                              ? "border-primary bg-primary/10" 
                              : "border-border bg-muted/30"
                          }`}>
                            <ListOrdered className={`h-6 w-6 mx-auto mb-1.5 ${goal.goal_type !== "habit" ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-sm font-rajdhani font-medium ${goal.goal_type !== "habit" ? "text-primary" : "text-muted-foreground"}`}>
                              Normal Goal
                            </span>
                          </div>
                          <div className={`flex-1 p-4 rounded-xl border-2 text-center ${
                            goal.goal_type === "habit" 
                              ? "border-primary bg-primary/10" 
                              : "border-border bg-muted/30"
                          }`}>
                            <Sparkles className={`h-6 w-6 mx-auto mb-1.5 ${goal.goal_type === "habit" ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-sm font-rajdhani font-medium ${goal.goal_type === "habit" ? "text-primary" : "text-muted-foreground"}`}>
                              Habit Goal
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Goal type cannot be changed after creation</p>
                      </div>

                      {/* Difficulty Selection */}
                      <div className="space-y-3">
                        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">Difficulty</Label>
                        <div className="flex flex-wrap gap-2">
                          {allDifficulties.map((diff) => {
                            const isSelected = editDifficulty === diff.value;
                            return (
                              <button
                                key={diff.value}
                                type="button"
                                onClick={() => setEditDifficulty(diff.value)}
                                className={`
                                  relative px-4 py-2 rounded-xl font-rajdhani font-bold text-sm uppercase tracking-wide transition-all duration-200
                                  ${isSelected 
                                    ? 'text-white shadow-lg' 
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                                  }
                                `}
                                style={isSelected ? { 
                                  background: diff.color,
                                  boxShadow: `0 0 20px ${diff.color}40`
                                } : {}}
                              >
                                {diff.value === "custom" ? customDifficultyName || t("goals.difficulties.custom") : t(`goals.difficulties.${diff.value}`)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Number of Steps (only for normal goals) */}
                      {goal.goal_type !== "habit" && (
                        <div className="space-y-3">
                          <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                            <ListOrdered className="h-4 w-4" />
                            Number of Steps
                          </Label>
                          <Input 
                            type="number" 
                            min="1" 
                            max="20"
                            value={editSteps} 
                            onChange={(e) => setEditSteps(parseInt(e.target.value) || 0)} 
                            variant="light"
                            className="h-12 text-base rounded-xl"
                          />
                          <p className="text-xs text-muted-foreground">
                            Warning: Changing step count may affect existing step data
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Section 3: Dates */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Scheduling</h2>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">Start Date</Label>
                          <Input 
                            type="date" 
                            value={editStartDate} 
                            onChange={(e) => setEditStartDate(e.target.value)} 
                            variant="light"
                            className="h-12 text-base rounded-xl"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">Completion Date</Label>
                          <Input 
                            type="date" 
                            value={editCompletionDate} 
                            onChange={(e) => setEditCompletionDate(e.target.value)} 
                            variant="light"
                            className="h-12 text-base rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Budget & Cost */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Budget & Cost</h2>
                      </div>
                      
                      <CostItemsEditor 
                        items={editCostItems} 
                        onChange={setEditCostItems} 
                        legacyTotal={goal.estimated_cost} 
                        onAddToWishlist={
                          isModulePurchased("wishlist")
                            ? (item: CostItemData) => {
                                if (!user?.id) return;
                                const name = (item.name || "").trim();
                                if (!name) {
                                  toast({
                                    title: "Name required",
                                    description: "Give this cost item a name first.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                createWishlistItem.mutate({
                                  userId: user.id,
                                  name,
                                  estimatedCost: Number(item.price) || 0,
                                  itemType: "required",
                                  category: goal.type ?? null,
                                  goalId: goal.id,
                                });
                              }
                            : undefined
                        }
                      />
                    </div>

                    {/* Section 5: Media & Notes */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                        <Image className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Media & Notes</h2>
                      </div>
                      
                      {/* Goal Image */}
                      {user && (
                        <div className="space-y-3">
                          <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">Goal Image</Label>
                          <GoalImageUpload value={editImage} onChange={setEditImage} userId={user.id} />
                        </div>
                      )}
                      
                      {/* Notes */}
                      <div className="space-y-3">
                        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                          <StickyNote className="h-4 w-4" />
                          Notes
                        </Label>
                        <Textarea 
                          value={editNotes} 
                          onChange={(e) => setEditNotes(e.target.value)} 
                          rows={4} 
                          maxLength={500}
                          placeholder="Add notes about your goal..."
                          variant="light"
                          className="rounded-xl resize-none text-base"
                        />
                        <p className="text-xs text-muted-foreground text-right">{editNotes.length}/500</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-primary/20">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditDialogOpen(false)}
                        className="flex-1 h-14 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 font-rajdhani uppercase tracking-wider text-base"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleEditGoal} 
                        className="flex-1 h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-rajdhani uppercase tracking-wider text-base shadow-[0_0_20px_rgba(91,180,255,0.3)]"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Super Goal Edit Modal */}
      {goal && isSuperGoal && (
        <SuperGoalEditModal
          isOpen={superGoalEditOpen}
          onClose={() => setSuperGoalEditOpen(false)}
          onSave={async ({ childGoalIds, rule, isDynamic }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ruleForDb = rule as any;
            const { error } = await supabase
              .from("goals")
              .update({
                child_goal_ids: childGoalIds,
                super_goal_rule: ruleForDb,
                is_dynamic_super: isDynamic,
              })
              .eq("id", goal.id);
            
            if (error) {
              toast({ title: "Error", description: error.message, variant: "destructive" });
              return;
            }
            
            // Refresh goal data
            const { data: updatedGoal } = await supabase.from("goals").select("*").eq("id", goal.id).single();
            if (updatedGoal) {
              setGoal(updatedGoal);
            }
            toast({ title: "Super Goal Updated", description: "Child goals have been updated" });
          }}
          currentChildIds={goal.child_goal_ids || []}
          currentRule={goal.super_goal_rule as SuperGoalRule | null}
          currentIsDynamic={goal.is_dynamic_super || false}
          allGoals={allGoals}
          superGoalId={goal.id}
          customDifficultyName={customDifficultyName}
          customDifficultyColor={customDifficultyColor}
        />
      )}
    </div>
  );
}
