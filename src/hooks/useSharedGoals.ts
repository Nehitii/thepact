import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SharedGoalEntry {
  id: string;
  goal_id: string;
  owner_id: string;
  shared_with_id: string;
  shared_at: string;
  owner_name?: string;
}

export function useSharedGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Goals shared WITH me
  const receivedQuery = useQuery({
    queryKey: ["shared-goals-received", user?.id],
    queryFn: async (): Promise<SharedGoalEntry[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("shared_goals")
        .select("*")
        .eq("shared_with_id", user.id);
      if (error) throw error;
      if (!data?.length) return [];

      const ownerIds = [...new Set(data.map((s: any) => s.owner_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ownerIds);
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p.display_name]) || []);

      return data.map((s: any) => ({ ...s, owner_name: profileMap.get(s.owner_id) || "Unknown" }));
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Goals I shared
  const sentQuery = useQuery({
    queryKey: ["shared-goals-sent", user?.id],
    queryFn: async (): Promise<SharedGoalEntry[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("shared_goals")
        .select("*")
        .eq("owner_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const shareGoal = useMutation({
    mutationFn: async ({ goalId, friendId }: { goalId: string; friendId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("shared_goals")
        .insert({ goal_id: goalId, owner_id: user.id, shared_with_id: friendId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared-goals-sent"] });
      qc.invalidateQueries({ queryKey: ["shared-goals-received"] });
    },
  });

  const unshareGoal = useMutation({
    mutationFn: async (sharedGoalId: string) => {
      const { error } = await supabase.from("shared_goals").delete().eq("id", sharedGoalId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared-goals-sent"] });
      qc.invalidateQueries({ queryKey: ["shared-goals-received"] });
    },
  });

  return {
    receivedSharedGoals: receivedQuery.data || [],
    sentSharedGoals: sentQuery.data || [],
    loading: receivedQuery.isLoading,
    shareGoal,
    unshareGoal,
  };
}
