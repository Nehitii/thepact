import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useGoalTags, useSaveGoalTags } from "@/hooks/useGoalTags";
import { useGoalDetail } from "@/hooks/useGoalDetail";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useParticleEffect } from "@/components/ParticleEffect";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";
import { useCostItems, useSaveCostItems } from "@/hooks/useCostItems";
import { useCreatePactWishlistItem } from "@/hooks/usePactWishlist";
import { useUserShop } from "@/hooks/useShop";
import { CyberBackground } from "@/components/CyberBackground";
import { Button } from "@/components/ui/button";
import { ShareGoalModal } from "@/components/goals/ShareGoalModal";
import { Link2 } from "lucide-react";
import type { CostItemData } from "@/components/goals/CostItemsEditor";
import type { EditStepItem } from "@/components/goals/EditStepsList";
import {
  DIFFICULTY_OPTIONS, getDifficultyLabel as getCentralizedDifficultyLabel,
  getStatusLabel as getCentralizedStatusLabel, mapToValidTag,
} from "@/lib/goalConstants";
import {
  SuperGoalEditModal, computeSuperGoalProgress, filterGoalsByRule,
  type SuperGoalRule, type SuperGoalChildInfo,
} from "@/components/goals/super";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useGoalDetailActions } from "@/hooks/useGoalDetailActions";
import {
  GoalDetailHero, GoalDetailSteps, GoalDetailHabit,
  GoalDetailCosts, GoalDetailSuperGoal, GoalDetailEditOverlay,
} from "@/components/goals/detail";

import type { GoalDetailData as Goal } from "@/hooks/useGoalDetail";

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isModulePurchased } = useUserShop(user?.id);
  const queryClient = useQueryClient();
  const createWishlistItem = useCreatePactWishlistItem();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [steps, setSteps] = useState<{ id: string; title: string; order: number; status: string; due_date: string | null; notes?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSteps, setEditSteps] = useState(0);
  const [editStartDate, setEditStartDate] = useState("");
  const [editCompletionDate, setEditCompletionDate] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editCostItems, setEditCostItems] = useState<CostItemData[]>([]);
  const [editStepItems, setEditStepItems] = useState<EditStepItem[]>([]);
  const [superGoalEditOpen, setSuperGoalEditOpen] = useState(false);
  const [editDeadline, setEditDeadline] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const { trigger: triggerParticles, ParticleEffects } = useParticleEffect();
  const editInitialStateRef = useRef<string>("");

  const { data: costItems = [] } = useCostItems(id);
  const saveCostItems = useSaveCostItems();
  const { data: goalTagsData = [] } = useGoalTags(id);
  const saveGoalTags = useSaveGoalTags();
  const { data: profile } = useProfile(user?.id);
  const customDifficultyName = profile?.custom_difficulty_name || "";
  const customDifficultyColor = profile?.custom_difficulty_color || "#a855f7";
  const customDifficultyActive = profile?.custom_difficulty_active || false;

  const { data: goalDetailData, isLoading: goalDetailLoading } = useGoalDetail(id, user?.id);
  const { data: pact } = usePact(user?.id);
  const { data: allGoals = [] } = useGoals(pact?.id, { includeStepCounts: true });

  const getDifficultyColor = useCallback(
    (d: string) => getUnifiedDifficultyColor(d, customDifficultyColor),
    [customDifficultyColor],
  );

  // Actions hook
  const actions = useGoalDetailActions({
    goalId: id,
    userId: user?.id,
    goal,
    steps,
    costItems,
    setGoal,
    setSteps,
    triggerParticles,
    getDifficultyColor,
  });

  // Sync goal detail from React Query into local state
  useEffect(() => {
    if (goalDetailData) {
      const g = goalDetailData.goal;
      setGoal(g);
      setEditName(g.name);
      setEditSteps(g.total_steps || 0);
      setEditStartDate(g.start_date?.split("T")[0] || "");
      setEditCompletionDate(g.completion_date?.split("T")[0] || "");
      setEditImage(g.image_url || "");
      setEditDifficulty(g.difficulty || "medium");
      setEditNotes(g.notes || "");
      setEditDeadline((g as any).deadline || "");
      setSteps(goalDetailData.steps);
      setEditStepItems(goalDetailData.steps.map((s) => ({ dbId: s.id, name: s.title, key: `db-${s.id}`, excludeFromSpin: (s as any).exclude_from_spin ?? false })));
      setLoading(false);
    }
  }, [goalDetailData]);

  useEffect(() => {
    if (!goalDetailLoading && !goalDetailData) setLoading(false);
  }, [goalDetailLoading, goalDetailData]);

  // Super Goal children
  const childGoalsInfo: SuperGoalChildInfo[] = useMemo(() => {
    if (!goal || goal.goal_type !== "super") return [];
    let childIds = goal.child_goal_ids || [];
    if (goal.is_dynamic_super && goal.super_goal_rule) {
      const eligibleGoals = allGoals.filter((g) => g.id !== goal.id && g.goal_type !== "super");
      const matched = filterGoalsByRule(eligibleGoals, goal.super_goal_rule as SuperGoalRule);
      childIds = matched.map((g) => g.id);
    }
    return childIds.map((childId) => {
      const childGoal = allGoals.find((g) => g.id === childId);
      if (!childGoal) return { id: childId, name: "Missing Goal", difficulty: "medium", status: "not_started", progress: 0, isCompleted: false, isMissing: true };
      const total = childGoal.totalStepsCount ?? childGoal.total_steps ?? 0;
      const completed = childGoal.completedStepsCount ?? childGoal.validated_steps ?? 0;
      return { id: childGoal.id, name: childGoal.name, difficulty: childGoal.difficulty, status: childGoal.status, progress: total > 0 ? Math.round((completed / total) * 100) : 0, isCompleted: childGoal.status === "fully_completed", isMissing: false };
    });
  }, [goal, allGoals]);

  // Sync tags
  useEffect(() => {
    if (goalTagsData.length > 0) setEditTags(goalTagsData.map((t) => t.tag));
    else if (goal?.type) setEditTags([mapToValidTag(goal.type)]);
  }, [goalTagsData, goal?.type]);

  // Sync cost items
  useEffect(() => {
    if (costItems.length > 0) {
      setEditCostItems(costItems.map((item) => ({ id: item.id, name: item.name, price: item.price, category: item.category || undefined, stepId: item.step_id })));
    }
  }, [costItems]);

  // Edit overlay unsaved changes guard
  useEffect(() => {
    if (editDialogOpen) {
      editInitialStateRef.current = JSON.stringify({ editName, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate, editImage, editStepItems: editStepItems.map((s) => ({ dbId: s.dbId, name: s.name })), editCostItems });
    }
  }, [editDialogOpen]);

  const hasUnsavedChanges = useCallback(() => {
    if (!editInitialStateRef.current) return false;
    const current = JSON.stringify({ editName, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate, editImage, editStepItems: editStepItems.map((s) => ({ dbId: s.dbId, name: s.name })), editCostItems });
    return current !== editInitialStateRef.current;
  }, [editName, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate, editImage, editStepItems, editCostItems]);

  const handleCloseEdit = useCallback(() => {
    if (hasUnsavedChanges() && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    setEditDialogOpen(false);
  }, [hasUnsavedChanges]);

  const toggleEditTag = useCallback((tagValue: string) => {
    setEditTags((prev) => (prev.includes(tagValue) ? prev.filter((t) => t !== tagValue) : [...prev, tagValue]));
  }, []);

  const getDifficultyLabel = useCallback(
    (d: string) => getCentralizedDifficultyLabel(d, undefined, customDifficultyName),
    [customDifficultyName],
  );
  const getStatusLabel = useCallback((s: string) => getCentralizedStatusLabel(s), []);

  // Handle save
  const handleEditGoal = useCallback(async () => {
    if (!goal || saving) return;
    setSaving(true);
    try {
      const { handleUpdateGoal } = await import("./GoalDetail_handlers");
      const updates: Record<string, unknown> = {};
      if (editName !== goal.name) updates.name = editName;
      if (editSteps !== goal.total_steps) updates.total_steps = editSteps;
      if (editDifficulty !== goal.difficulty) updates.difficulty = editDifficulty;
      const primaryTag = editTags[0] || "personal";
      if (primaryTag !== goal.type) updates.type = primaryTag;
      if (editNotes !== (goal.notes || "")) updates.notes = editNotes || null;
      if (editStartDate && editStartDate !== goal.start_date?.split("T")[0]) updates.start_date = new Date(editStartDate).toISOString();
      if (editCompletionDate && editCompletionDate !== goal.completion_date?.split("T")[0]) updates.completion_date = new Date(editCompletionDate).toISOString();
      if (editImage !== goal.image_url) updates.image_url = editImage;
      const currentDeadline = (goal as any).deadline || "";
      if (editDeadline !== currentDeadline) updates.deadline = editDeadline || null;

      if (id) {
        try { const newTotal = await saveCostItems.mutateAsync({ goalId: id, items: editCostItems }); updates.estimated_cost = newTotal; } catch { toast({ title: "Error", description: "Failed to save cost items", variant: "destructive" }); }
        try { await saveGoalTags.mutateAsync({ goalId: id, tags: editTags }); } catch { toast({ title: "Error", description: "Failed to save tags", variant: "destructive" }); }
      }

      handleUpdateGoal(goal.id, goal.total_steps, updates as any, async () => {
        const { data: updatedGoal } = await supabase.from("goals").select("*").eq("id", goal.id).single();
        if (updatedGoal) { setGoal(updatedGoal); setEditName(updatedGoal.name); setEditSteps(updatedGoal.total_steps || 0); setEditNotes(updatedGoal.notes || ""); }

        if (goal.goal_type !== "habit" && goal.goal_type !== "super" && id) {
          const existingIds = new Set(steps.map((s) => s.id));
          const keptDbIds = new Set(editStepItems.filter((i) => i.dbId).map((i) => i.dbId!));
          const idsToDelete = steps.filter((s) => !keptDbIds.has(s.id)).map((s) => s.id);
          if (idsToDelete.length > 0) await supabase.from("steps").delete().in("id", idsToDelete);

          const updatePromises: Promise<unknown>[] = [];
          const newStepsToInsert: { goal_id: string; title: string; description: string; notes: string; order: number; exclude_from_spin: boolean }[] = [];
          for (let i = 0; i < editStepItems.length; i++) {
            const item = editStepItems[i];
            const title = item.name?.trim() || `Step ${i + 1}`;
            if (item.dbId && existingIds.has(item.dbId)) {
              updatePromises.push(Promise.resolve(supabase.from("steps").update({ title, order: i + 1, exclude_from_spin: item.excludeFromSpin ?? false }).eq("id", item.dbId)));
            } else {
              newStepsToInsert.push({ goal_id: id, title, description: "", notes: "", order: i + 1, exclude_from_spin: item.excludeFromSpin ?? false });
            }
          }
          await Promise.all([...updatePromises, ...(newStepsToInsert.length > 0 ? [supabase.from("steps").insert(newStepsToInsert)] : [])]);
        }

        const { data: updatedSteps } = await supabase.from("steps").select("*").eq("goal_id", goal.id).order("order", { ascending: true });
        if (updatedSteps) { setSteps(updatedSteps); setEditStepItems(updatedSteps.map((s: any) => ({ dbId: s.id, name: s.title, key: `db-${s.id}`, excludeFromSpin: s.exclude_from_spin ?? false }))); }

        queryClient.invalidateQueries({ queryKey: ["goals"] });
        queryClient.invalidateQueries({ queryKey: ["goal-detail", id] });
        setEditDialogOpen(false);
        setSaving(false);
        toast({ title: "Goal Updated", description: "Changes saved successfully" });
      }, (message) => { setSaving(false); toast({ title: "Error", description: message, variant: "destructive" }); });
    } catch { setSaving(false); }
  }, [goal, saving, editName, editSteps, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate, editImage, editDeadline, editStepItems, editCostItems, id, steps, saveCostItems, saveGoalTags, queryClient, toast]);

  // Handle super goal save
  const handleSuperGoalSave = useCallback(async ({ childGoalIds, rule, isDynamic }: { childGoalIds: string[]; rule: SuperGoalRule | null; isDynamic: boolean }) => {
    if (!goal) return;
    const { error } = await supabase.from("goals").update({ child_goal_ids: childGoalIds, super_goal_rule: rule as any, is_dynamic_super: isDynamic }).eq("id", goal.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const { data: updatedGoal } = await supabase.from("goals").select("*").eq("id", goal.id).single();
    if (updatedGoal) setGoal(updatedGoal);
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["goal-detail", id] });
    toast({ title: "Super Goal Updated", description: "Child goals have been updated" });
  }, [goal, id, queryClient, toast]);

  // Loading / Not found
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

  let completedStepsCount: number;
  let totalStepsCount: number;
  let progress: number;
  if (isSuperGoal) {
    const sp = computeSuperGoalProgress(childGoalsInfo);
    completedStepsCount = sp.completedCount; totalStepsCount = sp.totalCount; progress = sp.percentage;
  } else if (isHabitGoal) {
    completedStepsCount = goal.habit_checks?.filter(Boolean).length || 0;
    totalStepsCount = goal.habit_duration_days || 1;
    progress = (completedStepsCount / totalStepsCount) * 100;
  } else {
    completedStepsCount = steps.filter((s) => s.status === "completed").length;
    totalStepsCount = steps.length || 1;
    progress = (completedStepsCount / totalStepsCount) * 100;
  }

  const difficultyColor = getDifficultyColor(goal.difficulty);
  const isCompleted = goal.status === "fully_completed";
  const displayTags = goalTagsData.length > 0 ? goalTagsData.map((t) => t.tag) : goal.type ? [mapToValidTag(goal.type)] : [];

  const wishlistHandler = isModulePurchased("wishlist")
    ? (item: CostItemData) => {
        if (!user?.id) return;
        const name = (item.name || "").trim();
        if (!name) { toast({ title: "Name required", description: "Give this cost item a name first.", variant: "destructive" }); return; }
        createWishlistItem.mutate({ userId: user.id, name, estimatedCost: Number(item.price) || 0, itemType: "required", category: item.category ?? goal.type ?? null, goalId: goal.id });
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      <ParticleEffects />

      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6 pb-24">
        <GoalDetailHero
          goal={goal}
          progress={progress}
          completedStepsCount={completedStepsCount}
          totalStepsCount={totalStepsCount}
          difficultyColor={difficultyColor}
          isCompleted={isCompleted}
          displayTags={displayTags}
          getDifficultyLabel={getDifficultyLabel}
          getStatusLabel={getStatusLabel}
          toggleFocus={actions.toggleFocus}
          onEdit={() => setEditDialogOpen(true)}
          onFullyComplete={actions.handleFullyComplete}
          onPause={actions.handlePauseGoal}
          onResume={actions.handleResumeGoal}
          onArchive={actions.handleArchiveGoal}
          onDuplicate={() => actions.handleDuplicateGoal(goalTagsData)}
          onDelete={actions.handleDeleteGoal}
        />

        {/* Share Goal Button */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)} className="text-xs font-bold uppercase tracking-wider gap-1.5">
            <Link2 className="h-3.5 w-3.5" /> Share with Friend
          </Button>
        </div>

        {isSuperGoal ? (
          <GoalDetailSuperGoal
            goal={goal}
            childGoalsInfo={childGoalsInfo}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
            onEditChildren={() => setSuperGoalEditOpen(true)}
          />
        ) : isHabitGoal ? (
          <GoalDetailHabit
            goal={goal}
            completedStepsCount={completedStepsCount}
            difficultyColor={difficultyColor}
            onToggleHabitCheck={actions.handleToggleHabitCheck}
          />
        ) : (
          <GoalDetailSteps
            steps={steps}
            completedStepsCount={completedStepsCount}
            totalStepsCount={totalStepsCount}
            difficultyColor={difficultyColor}
            onToggleStep={actions.handleToggleStep}
          />
        )}

        <GoalDetailCosts
          goal={goal}
          costItems={costItems}
          steps={steps}
          difficultyColor={difficultyColor}
          currency={currency}
        />
      </div>

      <GoalDetailEditOverlay
        isOpen={editDialogOpen}
        goal={goal}
        userId={user?.id}
        steps={steps}
        editName={editName} setEditName={setEditName}
        editDifficulty={editDifficulty} setEditDifficulty={setEditDifficulty}
        editTags={editTags} toggleEditTag={toggleEditTag}
        editNotes={editNotes} setEditNotes={setEditNotes}
        editStartDate={editStartDate} setEditStartDate={setEditStartDate}
        editCompletionDate={editCompletionDate} setEditCompletionDate={setEditCompletionDate}
        editDeadline={editDeadline} setEditDeadline={setEditDeadline}
        editImage={editImage} setEditImage={setEditImage}
        editStepItems={editStepItems}
        onStepItemsChange={(items) => { setEditStepItems(items); setEditSteps(items.length); }}
        editCostItems={editCostItems} setEditCostItems={setEditCostItems}
        customDifficultyActive={customDifficultyActive}
        customDifficultyName={customDifficultyName}
        customDifficultyColor={customDifficultyColor}
        saving={saving}
        onSave={handleEditGoal}
        onClose={handleCloseEdit}
        onAddToWishlist={wishlistHandler}
      />

      {goal && isSuperGoal && (
        <SuperGoalEditModal
          isOpen={superGoalEditOpen}
          onClose={() => setSuperGoalEditOpen(false)}
          onSave={handleSuperGoalSave}
          currentChildIds={goal.child_goal_ids || []}
          currentRule={goal.super_goal_rule as SuperGoalRule | null}
          currentIsDynamic={goal.is_dynamic_super || false}
          allGoals={allGoals}
          superGoalId={goal.id}
          customDifficultyName={customDifficultyName}
          customDifficultyColor={customDifficultyColor}
        />
      )}

      {goal && (
        <ShareGoalModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          goalId={goal.id}
          goalName={goal.name}
        />
      )}
    </div>
  );
}
