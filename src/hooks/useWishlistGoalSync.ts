/**
 * Syncs goal cost items to the pact wishlist.
 * Any cost item in a goal automatically appears as a "required" wishlist item.
 * Deletions/changes in goal costs are reflected in the wishlist.
 * Uses name+goal fallback matching to handle ID rotation from delete-and-reinsert saves.
 * Step-based acquisition: marks items acquired when their linked step is completed.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useGoals, type Goal } from "@/hooks/useGoals";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";

export function useWishlistGoalSync(
  userId: string | undefined,
  pactId: string | undefined,
  wishlistItems: PactWishlistItem[]
) {
  const queryClient = useQueryClient();
  const { data: goals = [] } = useGoals(pactId);
  const syncInProgress = useRef(false);

  useEffect(() => {
    if (!userId || !pactId || goals.length === 0 || syncInProgress.current) return;

    const doSync = async () => {
      syncInProgress.current = true;
      try {
        // Fetch ALL cost items for all goals in one query
        const goalIds = goals.map((g) => g.id);
        const { data: allCostItems, error } = await supabase
          .from("goal_cost_items")
          .select("*")
          .in("goal_id", goalIds);

        if (error || !allCostItems) {
          syncInProgress.current = false;
          return;
        }

        // Fetch steps for step-based acquisition
        const { data: allSteps } = await supabase
          .from("steps")
          .select("id, status")
          .in("goal_id", goalIds);
        const stepsMap = new Map((allSteps || []).map(s => [s.id, s.status]));

        // Get existing synced items (source_type = 'goal_sync')
        const syncedItems = wishlistItems.filter((w) => (w as any).source_type === "goal_sync");
        const syncedByCostId = new Map(
          syncedItems
            .filter((w) => (w as any).source_goal_cost_id)
            .map((w) => [(w as any).source_goal_cost_id, w])
        );
        // Secondary lookup by normalized name + goal_id for fallback matching
        const syncedByNameGoal = new Map(
          syncedItems.map((w) => [`${w.name?.toLowerCase().trim()}|${w.goal_id}`, w])
        );

        const toInsert: any[] = [];
        const toUpdate: any[] = [];
        const seenCostIds = new Set<string>();
        const matchedWishlistIds = new Set<string>();

        for (const costItem of allCostItems) {
          seenCostIds.add(costItem.id);
          const goal = goals.find((g) => g.id === costItem.goal_id);

          // Determine acquisition from step status
          const isGoalCompleted = goal && ["completed", "fully_completed", "validated"].includes(goal.status);
          const isStepCompleted = costItem.step_id ? stepsMap.get(costItem.step_id) === "completed" : false;
          const shouldBeAcquired = isGoalCompleted || isStepCompleted;

          // Try match by cost ID first, then fallback to name+goal
          let existing = syncedByCostId.get(costItem.id);
          if (!existing) {
            const key = `${costItem.name.toLowerCase().trim()}|${costItem.goal_id}`;
            existing = syncedByNameGoal.get(key);
            // If found by fallback, update the source_goal_cost_id to the new cost item ID
            if (existing) {
              await supabase
                .from("wishlist_items")
                .update({ source_goal_cost_id: costItem.id })
                .eq("id", existing.id);
            }
          }

          if (existing) {
            matchedWishlistIds.add(existing.id);
            // Update if name, price, or acquisition status changed
            const needsUpdate =
              existing.name !== costItem.name ||
              Number(existing.estimated_cost) !== costItem.price ||
              existing.acquired !== shouldBeAcquired;

            if (needsUpdate) {
              toUpdate.push({
                id: existing.id,
                name: costItem.name,
                estimated_cost: costItem.price,
                notes: goal ? `Source: ${goal.name}` : null,
                acquired: shouldBeAcquired,
                acquired_at: shouldBeAcquired ? (existing.acquired ? existing.acquired_at : new Date().toISOString()) : null,
              });
            }
          } else {
            // New cost item → create wishlist entry
            toInsert.push({
              user_id: userId,
              name: costItem.name,
              estimated_cost: costItem.price,
              item_type: "required",
              category: "Goal Equipment",
              goal_id: costItem.goal_id,
              source_type: "goal_sync",
              source_goal_cost_id: costItem.id,
              notes: goal ? `Source: ${goal.name}` : null,
              acquired: shouldBeAcquired,
              acquired_at: shouldBeAcquired ? new Date().toISOString() : null,
            });
          }
        }

        // Deleted cost items → remove from wishlist (only unmatched synced items)
        const toDelete = syncedItems.filter(
          (w) => !matchedWishlistIds.has(w.id) && (!(w as any).source_goal_cost_id || !seenCostIds.has((w as any).source_goal_cost_id))
        );

        // Execute mutations
        const promises: PromiseLike<any>[] = [];

        if (toInsert.length > 0) {
          // Use individual inserts; ignore duplicate errors from the partial unique index
          for (const item of toInsert) {
            promises.push(
              supabase.from("wishlist_items").insert(item).then(
                (res) => {
                  if (res.error && res.error.code === "23505") {
                    // Duplicate — already exists, safe to ignore
                    return;
                  }
                  if (res.error) throw res.error;
                }
              )
            );
          }
        }

        for (const item of toUpdate) {
          promises.push(
            supabase
              .from("wishlist_items")
              .update({
                name: item.name,
                estimated_cost: item.estimated_cost,
                notes: item.notes,
                acquired: item.acquired,
                acquired_at: item.acquired_at,
              })
              .eq("id", item.id)
              .then()
          );
        }

        for (const item of toDelete) {
          promises.push(supabase.from("wishlist_items").delete().eq("id", item.id).then());
        }

        if (promises.length > 0) {
          await Promise.all(promises);
          queryClient.invalidateQueries({ queryKey: ["pact-wishlist"] });
        }
      } finally {
        syncInProgress.current = false;
      }
    };

    doSync();
  }, [userId, pactId, goals, wishlistItems, queryClient]);
}
