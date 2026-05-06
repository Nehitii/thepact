import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Resolve a feature flag for the current user.
 * Order: per-user override > global enabled flag > false.
 */
export function useFeatureFlag(key: string): { enabled: boolean; isLoading: boolean } {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["feature-flag", key, user?.id ?? "anon"],
    queryFn: async () => {
      const [{ data: flag }, override] = await Promise.all([
        supabase.from("feature_flags" as any).select("enabled").eq("key", key).maybeSingle(),
        user?.id
          ? supabase
              .from("user_feature_overrides" as any)
              .select("enabled")
              .eq("user_id", user.id)
              .eq("key", key)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const ov = (override as any)?.data?.enabled;
      if (typeof ov === "boolean") return ov;
      return !!(flag as any)?.enabled;
    },
    staleTime: 60_000,
  });

  return { enabled: !!data, isLoading };
}