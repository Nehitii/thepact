/**
 * User Values hook — declared personal values powering coach + analytics.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserValue {
  id: string;
  user_id: string;
  label: string;
  statement: string | null;
  rank: number;
  created_at: string;
  updated_at: string;
}

const TABLE = "user_values" as const;

export function useUserValues() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["user_values", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as UserValue[];
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("user_id", user.id)
        .order("rank", { ascending: true });
      if (error) throw error;
      return (data ?? []) as UserValue[];
    },
    enabled: !!user?.id,
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<UserValue> & { label: string }) => {
      if (!user?.id) throw new Error("Non authentifié");
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .upsert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as UserValue;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_values", user?.id] }),
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_values", user?.id] }),
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  return {
    values: query.data ?? [],
    isLoading: query.isLoading,
    upsert: upsert.mutateAsync,
    remove: remove.mutateAsync,
  };
}