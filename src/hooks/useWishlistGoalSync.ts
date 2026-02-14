/**
 * Syncs goal cost items to the pact wishlist.
 * Any cost item in a goal automatically appears as a "required" wishlist item.
 * Deletions/changes in goal costs are reflected in the wishlist.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCostItems } from "@/hooks/useCostItems";
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

        // Get existing synced items (source_type = 'goal_sync')
        const syncedItems = wishlistItems.filter((w) => (w as any).source_type === "goal_sync");
        const syncedByCostId = new Map(
          syncedItems.map((w) => [(w as any).source_goal_cost_id, w])
        );

        const toInsert: any[] = [];
        const toUpdate: any[] = [];
        const seenCostIds = new Set<string>();

        for (const costItem of allCostItems) {
          seenCostIds.add(costItem.id);
          const existing = syncedByCostId.get(costItem.id);
          const goal = goals.find((g) => g.id === costItem.goal_id);

          if (!existing) {
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
            });
          } else {
            // Existing → update if name or price changed
            if (
              existing.name !== costItem.name ||
              Number(existing.estimated_cost) !== costItem.price
            ) {
              toUpdate.push({
                id: existing.id,
                name: costItem.name,
                estimated_cost: costItem.price,
                notes: goal ? `Source: ${goal.name}` : null,
              });
            }
          }
        }

        // Deleted cost items → remove from wishlist
        const toDelete = syncedItems.filter(
          (w) => !(w as any).source_goal_cost_id || !seenCostIds.has((w as any).source_goal_cost_id)
        );

        // Also mark as acquired if goal is completed
        const toMarkAcquired = syncedItems.filter((w) => {
          const goal = goals.find((g) => g.id === w.goal_id);
          return (
            goal &&
            ["completed", "fully_completed", "validated"].includes(goal.status) &&
            !w.acquired
          );
        });

        // Execute mutations
        const promises: PromiseLike<any>[] = [];

        if (toInsert.length > 0) {
          promises.push(supabase.from("wishlist_items").insert(toInsert).then());
        }

        for (const item of toUpdate) {
          promises.push(
            supabase
              .from("wishlist_items")
              .update({ name: item.name, estimated_cost: item.estimated_cost, notes: item.notes })
              .eq("id", item.id)
              .then()
          );
        }

        for (const item of toDelete) {
          promises.push(supabase.from("wishlist_items").delete().eq("id", item.id).then());
        }

        for (const item of toMarkAcquired) {
          promises.push(
            supabase
              .from("wishlist_items")
              .update({ acquired: true, acquired_at: new Date().toISOString() })
              .eq("id", item.id)
              .then()
          );
        }

        if (promises.length > 0) {
          await Promise.all(promises);
          queryClient.invalidateQueries({ queryKey: ["pact-wishlist", userId] });
        }
      } finally {
        syncInProgress.current = false;
      }
    };

    doSync();
  }, [userId, pactId, goals, wishlistItems, queryClient]);
}
