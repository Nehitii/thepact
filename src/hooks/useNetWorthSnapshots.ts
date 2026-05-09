import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_balance: number;
  account_count: number;
  currency: string | null;
  source: string;
  created_at: string;
}

export function useNetWorthSnapshots(limit = 24) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["net-worth-snapshots", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("net_worth_snapshots" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("snapshot_date", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as NetWorthSnapshot[];
    },
    enabled: !!user?.id,
  });
}

export function useTakeNetWorthSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date?: string) => {
      const { data, error } = await supabase.rpc("snapshot_net_worth" as any, date ? { _date: date } : {});
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Snapshot de patrimoine enregistré");
      qc.invalidateQueries({ queryKey: ["net-worth-snapshots"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
