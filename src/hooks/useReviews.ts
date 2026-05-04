/**
 * Reviews hook — daily / weekly / monthly / quarterly / annual reflection rituals.
 * Source of truth for the Reflect module.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ReviewType = "daily" | "weekly" | "monthly" | "quarterly" | "annual";
export type ReviewStatus = "in_progress" | "completed" | "abandoned";

export interface Review {
  id: string;
  user_id: string;
  type: ReviewType;
  status: ReviewStatus;
  period_start: string;
  period_end: string;
  prompts: Array<{ key: string; label: string; placeholder?: string }>;
  answers: Record<string, string>;
  mood: number | null;
  alignment_score: number | null;
  life_area_scores: Record<string, number>;
  highlights: string | null;
  lowlights: string | null;
  next_focus: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const TABLE = "reviews" as const;

export function useReviews(filters?: { type?: ReviewType; limit?: number }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reviews", user?.id, filters?.type, filters?.limit],
    queryFn: async () => {
      if (!user?.id) return [] as Review[];
      let q = (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("user_id", user.id)
        .order("period_start", { ascending: false });
      if (filters?.type) q = q.eq("type", filters.type);
      if (filters?.limit) q = q.limit(filters.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Review[];
    },
    enabled: !!user?.id,
  });
}

export function useReviewMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: Partial<Review> & { type: ReviewType; period_start: string; period_end: string }) => {
      if (!user?.id) throw new Error("Non authentifié");
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Review;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", user?.id] }),
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Review> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Review;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", user?.id] }),
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from(TABLE)
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", user?.id] });
      toast.success("Revue clôturée");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", user?.id] }),
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  return { create, update, complete, remove };
}

/**
 * Default prompt templates per review type. UI consumes these to render the steps.
 */
export const REVIEW_PROMPTS: Record<ReviewType, Review["prompts"]> = {
  daily: [
    { key: "wins", label: "Trois victoires d'aujourd'hui", placeholder: "Même petites…" },
    { key: "tensions", label: "Une tension à relâcher", placeholder: "Ce qui te pèse encore" },
    { key: "tomorrow", label: "L'unique chose qui compte demain", placeholder: "Une seule." },
  ],
  weekly: [
    { key: "highlights", label: "Highlights de la semaine" },
    { key: "lowlights", label: "Ce qui n'a pas marché" },
    { key: "learnings", label: "Ce que tu retiens" },
    { key: "next_focus", label: "Focus de la semaine prochaine" },
  ],
  monthly: [
    { key: "wins", label: "Tes 5 plus grandes victoires du mois" },
    { key: "alignment", label: "À quel point ce mois était aligné avec tes valeurs ?" },
    { key: "energy", label: "Où ton énergie a été drainée ?" },
    { key: "investments", label: "Quels investissements ont payé ?" },
    { key: "drop", label: "Que vas-tu cesser de faire ?" },
    { key: "next_month", label: "Le thème du mois prochain" },
  ],
  quarterly: [
    { key: "shipped", label: "Qu'as-tu vraiment fini ce trimestre ?" },
    { key: "patterns", label: "Quels patterns reviennent ?" },
    { key: "identity", label: "En quoi as-tu changé ?" },
    { key: "system_change", label: "Quel système faut-il refondre ?" },
    { key: "next_quarter", label: "La promesse du trimestre prochain" },
  ],
  annual: [
    { key: "year_story", label: "Raconte ton année en 3 phrases" },
    { key: "biggest_win", label: "Ta plus grande victoire" },
    { key: "biggest_lesson", label: "Ta plus grande leçon" },
    { key: "letting_go", label: "Ce que tu laisses derrière toi" },
    { key: "next_year_self", label: "Qui veux-tu être dans 12 mois ?" },
    { key: "north_star", label: "Ton étoile polaire pour l'année qui vient" },
  ],
};