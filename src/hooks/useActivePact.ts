import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useActivePact() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const setActivePact = useMutation({
    mutationFn: async (pactId: string | null) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ active_pact_id: pactId } as any)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["pact"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return { setActivePact };
}
