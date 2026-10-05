import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePendingFriendCount() {
  const { user } = useAuth();

  const { data: count = 0 } = useQuery({
    queryKey: ["friend-request-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user?.id,
    // Aligned with the global 5 min cache: the badge updates after
    // mutations (accept/decline/send invalidate this key) and on natural
    // remount; no aggressive polling needed for a sidebar badge.
    staleTime: 5 * 60 * 1000,
  });

  return { count };
}
