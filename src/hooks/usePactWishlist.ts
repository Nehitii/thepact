import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import i18next from "i18next";
export type PactWishlistItemType = "required" | "optional";
export type WishlistPriority = "low" | "med" | "high" | "critical";

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
  image_url: string | null;
  source_type: string;
  source_goal_cost_id: string | null;
  priority: WishlistPriority;
  sort_order: number;
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
          *,
          goal:goals(id,name,type,status)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((d) => ({
        ...d,
        priority: d.priority || "low",
        sort_order: d.sort_order ?? 0,
      })) as PactWishlistItem[];
    },
  });
}

export function useCreatePactWishlistItem() {
  const qc = useQueryClient();
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
      imageUrl?: string | null;
      priority?: WishlistPriority;
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
          image_url: input.imageUrl ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.all(vars.userId) });
      toast.success("Added to Wishlist", { description: "Item saved. You can refine it anytime." });
    },
    onError: (e) => {
      toast.error("Could not add item", { description: e?.message ?? "Please try again." });
    },
  });
}

export function useUpdatePactWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: string;
      id: string;
      /* Le type de la table plutot qu un Record libre : voir
         StepDetail, meme cause, meme erreur TS2345. */
      patch: TablesUpdate<"wishlist_items">;
    }) => {
      const patch = { ...input.patch };
      const marquage = typeof patch.acquired === "boolean" ? patch.acquired : null;
      if (marquage !== null) {
        patch.acquired_at = marquage ? new Date().toISOString() : null;
      }

      const { error } = await supabase
        .from("wishlist_items")
        .update(patch)
        .eq("id", input.id);

      if (error) throw error;

      /* L ACQUISITION EST UNE SEULE VERITE, PAS DEUX.
         Cocher « paye » ici n ecrivait que wishlist_items. Or le
         financement du pacte compte les pieces qui portent
         goal_cost_items.acquired_at : l argent ne bougeait pas.
         Mesure : apres avoir coche « Appareil Epilation Laser »,
         wishlist_items.acquired valait true et la piece de
         l objectif avait toujours acquired_at a null.

         acquired_via_step repasse a faux : c est une main qui
         decide, pas une etape. Annuler l etape plus tard ne doit
         donc pas defaire cette acquisition. */
      if (marquage !== null) {
        const { data: ligne } = await supabase
          .from("wishlist_items")
          .select("source_goal_cost_id")
          .eq("id", input.id)
          .maybeSingle();

        if (ligne?.source_goal_cost_id) {
          const { error: erreurPiece } = await supabase
            .from("goal_cost_items")
            .update({
              acquired_at: marquage ? new Date().toISOString() : null,
              acquired_via_step: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", ligne.source_goal_cost_id);
          if (erreurPiece) throw erreurPiece;
        }
      }

      return true;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.all(vars.userId) });
      /* La piece a peut-etre change de camp : le cout, le detail de
         l objectif et le financement du pacte doivent le savoir. */
      if (typeof vars.patch.acquired === "boolean") {
        qc.invalidateQueries({ queryKey: ["cost-items"] });
        qc.invalidateQueries({ queryKey: ["goals"] });
        qc.invalidateQueries({ queryKey: ["goal-detail"] });
        qc.invalidateQueries({ queryKey: ["wishlist-pieces"] });
      }
    },
    onError: (e) => {
      toast.error(i18next.t("wishlist.erreurMaj", "Modification impossible"), {
        description: e?.message ?? "",
      });
    },
  });
}

/**
 * SUPPRIMER UNE PIECE DU PACTE LA SUPPRIME AUSSI DE L OBJECTIF.
 *
 * Elle n effacait que la ligne de wishlist. Or la synchronisation
 * recree tout article dont la piece d objectif existe encore :
 * supprimer un article synchronise etait donc FUTILE — il revenait au
 * passage suivant. L application le savait d ailleurs, et s en
 * excusait dans sa fenetre de confirmation : « it may be re-created on
 * next sync ».
 *
 * On supprime desormais la piece a la source, puis l article. Dans cet
 * ordre : si la seconde suppression echouait, la synchronisation
 * retirerait d elle-meme l article devenu orphelin.
 *
 * ET LE COUT DE L OBJECTIF SUIT. goals.estimated_cost est la somme de
 * ses pieces — le laisser tel quel apres en avoir retire une ferait
 * mentir le financement du pacte dans l autre sens.
 */
export function useDeletePactWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: string;
      id: string;
      /** Renseigne pour un article venu d un objectif. */
      sourceGoalCostId?: string | null;
      goalId?: string | null;
    }) => {
      if (input.sourceGoalCostId) {
        const { error: erreurPiece } = await supabase
          .from("goal_cost_items")
          .delete()
          .eq("id", input.sourceGoalCostId);
        if (erreurPiece) throw erreurPiece;

        if (input.goalId) {
          const { data: restantes, error: erreurLecture } = await supabase
            .from("goal_cost_items")
            .select("price")
            .eq("goal_id", input.goalId);
          if (erreurLecture) throw erreurLecture;

          const total = (restantes ?? []).reduce((s, p) => s + Number(p.price || 0), 0);
          const { error: erreurObjectif } = await supabase
            .from("goals")
            .update({ estimated_cost: total })
            .eq("id", input.goalId);
          if (erreurObjectif) throw erreurObjectif;
        }
      }

      const { error } = await supabase.from("wishlist_items").delete().eq("id", input.id);
      if (error) throw error;
      return true;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.all(vars.userId) });
      /* L objectif, ses pieces et le compte du pacte ont bouge. */
      if (vars.sourceGoalCostId) {
        qc.invalidateQueries({ queryKey: ["cost-items"] });
        qc.invalidateQueries({ queryKey: ["goals"] });
        qc.invalidateQueries({ queryKey: ["goal-detail"] });
      }
      toast.success(i18next.t("wishlist.delete.done", "Supprimé"));
    },
    onError: (e: Error) => {
      toast.error(i18next.t("wishlist.delete.failed", "Suppression impossible"), { description: e?.message });
    },
  });
}

