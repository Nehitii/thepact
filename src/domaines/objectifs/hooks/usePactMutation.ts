/**
 * Pact mutation hook for updating pact data.
 * Handles optimistic updates and cache invalidation for real-time sync.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { toast } from "sonner";
import { trackPactEdited } from "@/domaines/succes";

interface PactUpdateData {
  name?: string;
  mantra?: string;
  symbol?: string;
  color?: string;
  project_start_date?: string | null;
  project_end_date?: string | null;
  title_font?: string;
  title_effect?: string;
}

interface UsePactMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePactMutation(
  userId: string | undefined,
  pactId: string | null,
  options?: UsePactMutationOptions
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: PactUpdateData) => {
      if (!pactId) throw new Error("No pact ID provided");

      const { error } = await supabase
        .from("pacts")
        .update(data)
        .eq("id", pactId);

      if (error) throw error;
      return data;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["pact", userId] });

      // Snapshot the previous value
      const previousPact = queryClient.getQueryData(["pact", userId]);

      // Optimistically update the cache
      /* La valeur en cache est celle que « usePact » y a mise. On ne la
         connaît pas d'ici, mais on ne fait que la recopier en y posant
         les champs modifiés : « unknown » dit exactement ça. */
      queryClient.setQueryData(["pact", userId], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...old, ...newData };
      });

      return { previousPact };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousPact) {
        queryClient.setQueryData(["pact", userId], context.previousPact);
      }
      
      toast.error("Enregistrement impossible", { description: error instanceof Error ? error.message : "Le pacte n’a pas pu être mis à jour." });
      
      options?.onError?.(error instanceof Error ? error : new Error("Unknown error"));
    },
    onSuccess: () => {
      // Invalidate to refetch latest data
      queryClient.invalidateQueries({ queryKey: ["pact", userId] });

      /* « Gardien du serment » se gagne en revenant modifier son pacte.
         Le succès existait, sa condition aussi ; seul l'appel manquait. */
      if (userId) trackPactEdited(userId);

      toast.success("Pacte mis à jour", { description: "Tes changements sont enregistrés." });
      
      options?.onSuccess?.();
    },
  });

  return {
    updatePact: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
