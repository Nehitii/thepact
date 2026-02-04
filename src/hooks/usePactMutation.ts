/**
 * Pact mutation hook for updating pact data.
 * Handles optimistic updates and cache invalidation for real-time sync.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface PactUpdateData {
  name?: string;
  mantra?: string;
  symbol?: string;
  color?: string;
  project_start_date?: string | null;
  project_end_date?: string | null;
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
      queryClient.setQueryData(["pact", userId], (old: any) => {
        if (!old) return old;
        return { ...old, ...newData };
      });

      return { previousPact };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousPact) {
        queryClient.setQueryData(["pact", userId], context.previousPact);
      }
      
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update pact",
        variant: "destructive",
      });
      
      options?.onError?.(error instanceof Error ? error : new Error("Unknown error"));
    },
    onSuccess: () => {
      // Invalidate to refetch latest data
      queryClient.invalidateQueries({ queryKey: ["pact", userId] });
      
      toast({
        title: "Pact Updated",
        description: "Your changes have been saved successfully.",
      });
      
      options?.onSuccess?.();
    },
  });

  return {
    updatePact: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
