import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export type PactWishlistItemType = "required" | "optional";

export interface PactWishlistGoalLink {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface PactWishlistItem {
  id: string;
  user_id: string;
  goal_id: string | null;
  name: string;
  category: string | null;
  estimated_cost: number;
  item_type: PactWishlistItemType;
  acquired: boolean;
  acquired_at: string | null;
  notes: string | null;
  url: string | null;
  source_type: string;
  source_goal_cost_id: string | null;
  created_at: string;
  updated_at: string;
  goal?: PactWishlistGoalLink | null;
}

const queryKeys = {
  all: (userId: string | undefined) => ["pact-wishlist", userId] as const,
};

export function usePactWishlistItems(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.all(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("wishlist_items")
        .select(
          `
          id,
          user_id,
          goal_id,
          name,
          category,
          estimated_cost,
          item_type,
          acquired,
          acquired_at,
          notes,
          url,
          source_type,
          source_goal_cost_id,
          created_at,
          updated_at,
          goal:goals(id,name,type,status)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []) as PactWishlistItem[];
    },
  });
}

export function useCreatePactWishlistItem() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      name: string;
      estimatedCost?: number;
      itemType: PactWishlistItemType;
      category?: string | null;
      goalId?: string | null;
      notes?: string | null;
      url?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .insert({
          user_id: input.userId,
          name: input.name.trim(),
          estimated_cost: input.estimatedCost ?? 0,
          item_type: input.itemType,
          category: input.category ?? null,
          goal_id: input.goalId ?? null,
          notes: input.notes ?? null,
          url: input.url ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.all(vars.userId) });
      toast({
        title: "Added to Wishlist",
        description: "Item saved. You can refine it anytime.",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Could not add item",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePactWishlistItem() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      id: string;
      patch: Partial<Pick<PactWishlistItem, "name" | "category" | "estimated_cost" | "item_type" | "goal_id" | "acquired" | "notes" | "url">>;
    }) => {
      const { error } = await supabase
        .from("wishlist_items")
        .update({
          ...input.patch,
          ...(typeof input.patch.acquired === "boolean"
            ? { acquired_at: input.patch.acquired ? new Date().toISOString() : null }
            : {}),
        })
        .eq("id", input.id);

      if (error) throw error;
      return true;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.all(vars.userId) });
    },
    onError: (e: any) => {
      toast({
        title: "Update failed",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeletePactWishlistItem() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { userId: string; id: string }) => {
      const { error } = await supabase.from("wishlist_items").delete().eq("id", input.id);
      if (error) throw error;
      return true;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.all(vars.userId) });
      toast({ title: "Removed", description: "Wishlist item deleted." });
    },
    onError: (e: any) => {
      toast({
        title: "Delete failed",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });
}
