// Handler functions for GoalDetail - extracted for better code organization
import { supabase } from "@/lib/supabase";

export async function handleFullyComplete(
  goalId: string,
  totalSteps: number,
  onSuccess: () => void,
  onError: (message: string) => void
) {
  try {
    // Get all steps for this goal
    const { data: stepsData } = await supabase
      .from("steps")
      .select("id")
      .eq("goal_id", goalId);

    if (!stepsData) {
      onError("Failed to load steps");
      return;
    }

    // Mark all steps as completed
    const updates = stepsData.map(step => 
      supabase
        .from("steps")
        .update({ 
          status: "completed", 
          validated_at: new Date().toISOString(),
          completion_date: new Date().toISOString()
        })
        .eq("id", step.id)
    );

    await Promise.all(updates);

    // Update goal to fully completed
    const { error: goalError } = await supabase
      .from("goals")
      .update({
        validated_steps: totalSteps,
        status: "fully_completed",
        completion_date: new Date().toISOString()
      })
      .eq("id", goalId);

    if (goalError) {
      onError(goalError.message);
      return;
    }

    onSuccess();
  } catch (error: any) {
    onError(error.message || "Failed to complete goal");
  }
}

export async function handleUpdateGoal(
  goalId: string,
  currentTotalSteps: number,
  updates: {
    name?: string;
    total_steps?: number;
    start_date?: string;
    completion_date?: string;
    image_url?: string;
  },
  onSuccess: () => void,
  onError: (message: string) => void
) {
  try {
    const { error: goalError } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", goalId);

    if (goalError) {
      onError(goalError.message);
      return;
    }

    // If total_steps changed, handle step adjustments
    if (updates.total_steps !== undefined && updates.total_steps !== currentTotalSteps) {
      const newTotal = updates.total_steps;
      
      if (newTotal > currentTotalSteps) {
        // Add new steps
        const stepsToAdd = newTotal - currentTotalSteps;
        const newSteps = Array.from({ length: stepsToAdd }, (_, i) => ({
          goal_id: goalId,
          title: `Step ${currentTotalSteps + i + 1}`,
          order: currentTotalSteps + i + 1,
          status: "pending" as const,
          description: "",
          notes: ""
        }));

        const { error: insertError } = await supabase
          .from("steps")
          .insert(newSteps);

        if (insertError) {
          onError(insertError.message);
          return;
        }
      } else if (newTotal < currentTotalSteps) {
        // Remove excess steps (last ones)
        const { data: allSteps } = await supabase
          .from("steps")
          .select("id")
          .eq("goal_id", goalId)
          .order("order", { ascending: false })
          .limit(currentTotalSteps - newTotal);

        if (allSteps && allSteps.length > 0) {
          const stepIds = allSteps.map(s => s.id);
          const { error: deleteError } = await supabase
            .from("steps")
            .delete()
            .in("id", stepIds);

          if (deleteError) {
            onError(deleteError.message);
            return;
          }
        }
      }
    }

    onSuccess();
  } catch (error: any) {
    onError(error.message || "Failed to update goal");
  }
}
