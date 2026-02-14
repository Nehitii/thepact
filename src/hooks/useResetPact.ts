import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to reset all pact data (goals, steps, missions, counters).
 * Preserves the pact identity (name, mantra, symbol).
 */
export function useResetPact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pactId: string) => {
      const { data, error } = await supabase.rpc("reset_pact_data", {
        p_pact_id: pactId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pact"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["ranks"] });
      queryClient.invalidateQueries({ queryKey: ["active-mission"] });
      queryClient.invalidateQueries({ queryKey: ["achievement-tracking"] });
      toast({
        title: "Pact reset",
        description: "All goals, steps and progress have been cleared.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
