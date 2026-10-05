import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DailyQuest {
  id: string;
  user_id: string;
  season_id: string | null;
  date: string;
  kind: string;
  title: string;
  description: string | null;
  target: number;
  progress: number;
  reward_bonds: number;
  status: "active" | "completed" | "claimed" | "expired";
  metadata: any;
  created_at: string;
  updated_at: string;
}

export function useDailyQuests() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["daily-quests", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_quests" as any)
        .select("*")
        .eq("date", today)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as DailyQuest[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

export function useGenerateDailyQuests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-daily-quests");
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => {
      toast.success(d?.count ? `${d.count} quêtes générées` : "Quêtes à jour");
      qc.invalidateQueries({ queryKey: ["daily-quests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useClaimQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (questId: string) => {
      const { data, error } = await supabase.rpc("claim_quest" as any, { _quest_id: questId });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => {
      toast.success(`+${d?.reward ?? 0} Bonds`);
      qc.invalidateQueries({ queryKey: ["daily-quests"] });
      qc.invalidateQueries({ queryKey: ["bond-balance"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}