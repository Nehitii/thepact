/**
 * Life Areas hook — domains that goals, habits, and transactions are
 * attributed to. Source of truth for the "alignement" radar on Home.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LifeArea {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  weight: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const TABLE = "life_areas" as const;

export function useLifeAreas() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["life_areas", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as LifeArea[];
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LifeArea[];
    },
    enabled: !!user?.id,
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<LifeArea> & { name: string }) => {
      if (!user?.id) throw new Error("Non authentifié");
      const payload = { ...input, user_id: user.id };
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as LifeArea;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["life_areas", user?.id] });
      toast.success("Domaine sauvegardé");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["life_areas", user?.id] });
      toast.success("Domaine supprimé");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  return {
    areas: query.data ?? [],
    isLoading: query.isLoading,
    upsert: upsert.mutateAsync,
    remove: remove.mutateAsync,
  };
}