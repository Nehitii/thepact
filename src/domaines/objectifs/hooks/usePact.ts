import type { Pact } from "@/domaines/objectifs/types";
export type { Pact };
/**
 * Pact data hook.
 * 
 * A "pact" represents a user's commitment/project in the app.
 * Respects active_pact_id from profile if set (for shared pacts).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


// Reusable fetcher — used by usePact and by background prefetch.
export async function fetchPact(userId: string | undefined): Promise<Pact | null> {
  if (!userId) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_pact_id")
    .eq("id", userId)
    .single();

  const activePactId = profile?.active_pact_id;

  if (activePactId) {
    const { data, error } = await supabase
      .from("pacts")
      .select("*")
      .eq("id", activePactId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as Pact;
  }

  const { data, error } = await supabase
    .from("pacts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as Pact | null;
}

export function usePact(userId: string | undefined) {
  return useQuery({
    queryKey: ["pact", userId],
    queryFn: () => fetchPact(userId),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}
