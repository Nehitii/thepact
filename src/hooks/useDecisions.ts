/**
 * Decisions hook — personal decision log with hypothesis tracking and review dates.
 * Drives long-term self-coaching loop.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DecisionStatus = "pending" | "reviewed" | "archived";
export type Reversibility = "reversible" | "hard_to_reverse" | "irreversible";

export interface Decision {
  id: string;
  user_id: string;
  title: string;
  context: string | null;
  hypothesis: string | null;
  decision_text: string;
  expected_outcome: string | null;
  actual_outcome: string | null;
  lesson: string | null;
  status: DecisionStatus;
  confidence: number | null;
  reversibility: Reversibility | null;
  life_area_id: string | null;
  related_goal_id: string | null;
  related_review_id: string | null;
  decided_at: string;
  review_at: string | null;
  reviewed_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const TABLE = "decisions" as const;

export function useDecisions(filters?: { status?: DecisionStatus; lifeAreaId?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["decisions", user?.id, filters?.status, filters?.lifeAreaId],
    queryFn: async () => {
      if (!user?.id) return [] as Decision[];
      let q = (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("user_id", user.id)
        .order("decided_at", { ascending: false });
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.lifeAreaId) q = q.eq("life_area_id", filters.lifeAreaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Decision[];
    },
    enabled: !!user?.id,
  });
}

export function useDecisionsDueForReview() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["decisions-due", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as Decision[];
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .not("review_at", "is", null)
        .lte("review_at", today)
        .order("review_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Decision[];
    },
    enabled: !!user?.id,
  });
}

export function useDecisionMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["decisions", user?.id] });
    qc.invalidateQueries({ queryKey: ["decisions-due", user?.id] });
  };

  const create = useMutation({
    mutationFn: async (input: Partial<Decision> & { title: string; decision_text: string }) => {
      if (!user?.id) throw new Error("Non authentifié");
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Decision;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Décision consignée");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Decision> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Decision;
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  const markReviewed = useMutation({
    mutationFn: async ({ id, actual_outcome, lesson }: { id: string; actual_outcome: string; lesson: string }) => {
      const { error } = await (supabase as any)
        .from(TABLE)
        .update({
          status: "reviewed",
          actual_outcome,
          lesson,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Décision révisée");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  return { create, update, markReviewed, remove };
}