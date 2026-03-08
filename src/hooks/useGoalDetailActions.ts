/**
 * Goal detail mutation actions hook.
 *
 * Encapsulates all write operations for a single goal:
 * toggle step, toggle habit, pause/resume/archive, duplicate, delete, complete.
 */
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackStepCompleted, trackGoalCompleted } from "@/lib/achievements";
import { useToast } from "@/hooks/use-toast";
import type { GoalDetailData } from "@/hooks/useGoalDetail";

interface CostItem {
  id: string;
  name: string;
  price: number;
  category: string | null;
  step_id: string | null;
}

interface UseGoalDetailActionsOptions {
  goalId: string | undefined;
  userId: string | undefined;
  goal: GoalDetailData | null;
  steps: { id: string; title: string; order: number; status: string; notes?: string | null }[];
  costItems: CostItem[];
  setGoal: (g: GoalDetailData) => void;
  setSteps: (s: any[]) => void;
  triggerParticles: (e: React.MouseEvent, color: string) => void;
  getDifficultyColor: (d: string) => string;
}

export function useGoalDetailActions({
  goalId,
  userId,
  goal,
  steps,
  costItems,
  setGoal,
  setSteps,
  triggerParticles,
  getDifficultyColor,
}: UseGoalDetailActionsOptions) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateGoals = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["goal-detail", goalId] });
  }, [queryClient, goalId]);

  const handleToggleStep = useCallback(
    async (stepId: string, currentStatus: string) => {
      if (!goal) return;
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      const validatedAt = newStatus === "completed" ? new Date().toISOString() : null;

      if (newStatus === "completed") {
        const color = getDifficultyColor(goal.difficulty);
        const mockEvent = {
          clientX: window.innerWidth / 2,
          clientY: window.innerHeight / 2,
          currentTarget: document.body,
        } as unknown as React.MouseEvent;
        triggerParticles(mockEvent, color);
      }

      const { error } = await supabase
        .from("steps")
        .update({ status: newStatus, validated_at: validatedAt })
        .eq("id", stepId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      const updatedSteps = steps.map((s) => (s.id === stepId ? { ...s, status: newStatus } : s));
      setSteps(updatedSteps);
      const newValidatedCount = updatedSteps.filter((s) => s.status === "completed").length;

      const { error: goalError } = await supabase
        .from("goals")
        .update({ validated_steps: newValidatedCount })
        .eq("id", goal.id);
      if (!goalError) {
        setGoal({ ...goal, validated_steps: newValidatedCount });
        invalidateGoals();
        if (newStatus === "completed" && userId) {
          setTimeout(() => trackStepCompleted(userId), 0);
          toast({ title: "Step Completed", description: "You're making progress!" });
        }
      }

      // Auto-acquisition: update wishlist items linked via cost items
      const linkedCostItems = costItems.filter((ci) => ci.step_id === stepId);
      if (linkedCostItems.length > 0) {
        const isAcquired = newStatus === "completed";
        for (const ci of linkedCostItems) {
          await supabase
            .from("wishlist_items")
            .update({
              acquired: isAcquired,
              acquired_at: isAcquired ? new Date().toISOString() : null,
            })
            .eq("source_goal_cost_id", ci.id);
        }
        queryClient.invalidateQueries({ queryKey: ["pact-wishlist"] });
      }
    },
    [goal, steps, costItems, userId, setGoal, setSteps, triggerParticles, getDifficultyColor, invalidateGoals, queryClient, toast],
  );

  const handleToggleHabitCheck = useCallback(
    async (dayIndex: number) => {
      if (!goal || !goal.habit_checks || !userId) return;
      const newChecks = [...goal.habit_checks];
      newChecks[dayIndex] = !newChecks[dayIndex];
      if (newChecks[dayIndex]) {
        const color = getDifficultyColor(goal.difficulty);
        const mockEvent = {
          clientX: window.innerWidth / 2,
          clientY: window.innerHeight / 2,
          currentTarget: document.body,
        } as unknown as React.MouseEvent;
        triggerParticles(mockEvent, color);
      }
      const completedCount = newChecks.filter(Boolean).length;
      const isNowComplete = completedCount === goal.habit_duration_days;
      const { error } = await supabase
        .from("goals")
        .update({
          habit_checks: newChecks,
          validated_steps: completedCount,
          status: isNowComplete ? "fully_completed" : completedCount > 0 ? "in_progress" : "not_started",
          completion_date: isNowComplete ? new Date().toISOString() : null,
        })
        .eq("id", goal.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setGoal({
        ...goal,
        habit_checks: newChecks,
        validated_steps: completedCount,
        status: isNowComplete ? "fully_completed" : completedCount > 0 ? "in_progress" : "not_started",
      });
      invalidateGoals();
      if (newChecks[dayIndex]) {
        setTimeout(() => trackStepCompleted(userId), 0);
        toast({
          title: `Day ${dayIndex + 1} Complete!`,
          description: isNowComplete
            ? "Congratulations! Habit completed!"
            : `${completedCount}/${goal.habit_duration_days} days done`,
        });
      }
    },
    [goal, userId, setGoal, triggerParticles, getDifficultyColor, invalidateGoals, toast],
  );

  const handleFullyComplete = useCallback(async () => {
    if (!goal || !userId) return;
    if (goal.status === "fully_completed") {
      toast({ title: "Already Completed", description: "This goal is already fully completed." });
      return;
    }
    try {
      const { data: stepsData } = await supabase.from("steps").select("id").eq("goal_id", goal.id);
      if (!stepsData) throw new Error("Failed to load steps");

      const updates = stepsData.map((step) =>
        supabase
          .from("steps")
          .update({ status: "completed", validated_at: new Date().toISOString(), completion_date: new Date().toISOString() })
          .eq("id", step.id),
      );
      await Promise.all(updates);

      const { error: goalError } = await supabase
        .from("goals")
        .update({ validated_steps: goal.total_steps, status: "fully_completed", completion_date: new Date().toISOString() })
        .eq("id", goal.id);
      if (goalError) throw goalError;

      setTimeout(() => trackGoalCompleted(userId, goal.difficulty, goal.start_date || new Date().toISOString(), new Date().toISOString()), 0);

      // Refresh local state
      const { data: updatedGoal } = await supabase.from("goals").select("*").eq("id", goal.id).single();
      if (updatedGoal) setGoal(updatedGoal);
      const { data: updatedSteps } = await supabase.from("steps").select("*").eq("goal_id", goal.id).order("order", { ascending: true });
      if (updatedSteps) setSteps(updatedSteps);
      invalidateGoals();
      toast({ title: "Goal Completed! 🎉", description: "All steps have been marked as complete" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to complete goal", variant: "destructive" });
    }
  }, [goal, userId, setGoal, setSteps, invalidateGoals, toast]);

  const handlePauseGoal = useCallback(async () => {
    if (!goal) return;
    const { error } = await supabase.from("goals").update({ status: "paused" }).eq("id", goal.id);
    if (!error) {
      setGoal({ ...goal, status: "paused" });
      invalidateGoals();
      toast({ title: "Goal Paused", description: "This goal has been paused." });
    }
  }, [goal, setGoal, invalidateGoals, toast]);

  const handleResumeGoal = useCallback(async () => {
    if (!goal) return;
    const newStatus = (goal.validated_steps ?? 0) > 0 ? "in_progress" : "not_started";
    const { error } = await supabase.from("goals").update({ status: newStatus }).eq("id", goal.id);
    if (!error) {
      setGoal({ ...goal, status: newStatus });
      invalidateGoals();
      toast({ title: "Goal Resumed", description: "This goal is now active again." });
    }
  }, [goal, setGoal, invalidateGoals, toast]);

  const handleArchiveGoal = useCallback(async () => {
    if (!goal) return;
    const { error } = await supabase.from("goals").update({ status: "archived" }).eq("id", goal.id);
    if (!error) {
      setGoal({ ...goal, status: "archived" });
      invalidateGoals();
      toast({ title: "Goal Archived", description: "This goal has been archived." });
    }
  }, [goal, setGoal, invalidateGoals, toast]);

  const handleDuplicateGoal = useCallback(
    async (goalTagsData: { tag: string }[]) => {
      if (!goal || !userId) return;
      try {
        const { data: pactResult } = await supabase.from("pacts").select("id").eq("user_id", userId).single();
        if (!pactResult) return;

        const { data: newGoal, error: goalError } = await supabase
          .from("goals")
          .insert({
            pact_id: pactResult.id,
            name: `${goal.name} (Copy)`,
            type: goal.type as any,
            difficulty: goal.difficulty as any,
            estimated_cost: goal.estimated_cost,
            notes: goal.notes,
            total_steps: goal.total_steps,
            potential_score: goal.potential_score,
            start_date: new Date().toISOString(),
            status: "not_started" as any,
            goal_type: goal.goal_type || "normal",
            habit_duration_days: goal.habit_duration_days,
            habit_checks: goal.goal_type === "habit" ? Array(goal.habit_duration_days || 7).fill(false) : null,
            image_url: goal.image_url,
            deadline: null,
          } as any)
          .select()
          .single();

        if (goalError) throw goalError;

        if (goalTagsData.length > 0) {
          const { insertGoalTags } = await import("@/hooks/useGoalTags");
          await insertGoalTags(newGoal.id, goalTagsData.map((t) => t.tag));
        }

        if (goal.goal_type !== "habit" && goal.goal_type !== "super" && steps.length > 0) {
          const stepsToInsert = steps.map((s, i) => ({
            goal_id: newGoal.id,
            title: s.title,
            order: i + 1,
            status: "pending" as const,
            description: "",
            notes: s.notes || "",
          }));
          await supabase.from("steps").insert(stepsToInsert);
        }

        if (costItems.length > 0) {
          const costToInsert = costItems.map((ci) => ({
            goal_id: newGoal.id,
            name: ci.name,
            price: ci.price,
            category: ci.category,
            step_id: null,
          }));
          await supabase.from("goal_cost_items").insert(costToInsert);
        }

        invalidateGoals();
        toast({ title: "Goal Duplicated", description: "A copy of this goal has been created." });
        navigate(`/goals/${newGoal.id}`);
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to duplicate goal", variant: "destructive" });
      }
    },
    [goal, steps, costItems, userId, invalidateGoals, navigate, toast],
  );

  const handleDeleteGoal = useCallback(async () => {
    if (!goalId) return;
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Goal Deleted", description: "This evolution has been removed from your Pact" });
      navigate("/goals");
    }
  }, [goalId, queryClient, navigate, toast]);

  const toggleFocus = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!goal) return;
      const { error } = await supabase.from("goals").update({ is_focus: !goal.is_focus }).eq("id", goal.id);
      if (!error) {
        setGoal({ ...goal, is_focus: !goal.is_focus });
        queryClient.invalidateQueries({ queryKey: ["goals"] });
      }
    },
    [goal, setGoal, queryClient],
  );

  return {
    handleToggleStep,
    handleToggleHabitCheck,
    handleFullyComplete,
    handlePauseGoal,
    handleResumeGoal,
    handleArchiveGoal,
    handleDuplicateGoal,
    handleDeleteGoal,
    toggleFocus,
  };
}
