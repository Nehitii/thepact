import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminVerificationResult {
  isAdmin: boolean;
  userId?: string;
  verifiedAt?: string;
  error?: string;
}

/**
 * Server-side admin verification hook.
 * Uses edge function to verify admin status, preventing client-side bypass.
 */
export function useServerAdminCheck(enabled: boolean = true) {
  return useQuery<AdminVerificationResult>({
    queryKey: ["server-admin-check"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return { isAdmin: false, error: "Not authenticated" };
      }

      const { data, error } = await supabase.functions.invoke("verify-admin", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Admin verification failed:", error);
        return { isAdmin: false, error: error.message };
      }

      return data as AdminVerificationResult;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
}
