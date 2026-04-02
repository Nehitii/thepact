import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMutualFriends() {
  const { user } = useAuth();

  const getMutualCount = async (otherUserId: string): Promise<number> => {
    if (!user?.id) return 0;
    const { data, error } = await supabase.rpc("get_mutual_friends_count", {
      p_user_id: user.id,
      p_other_id: otherUserId,
    });
    if (error) return 0;
    return (data as number) ?? 0;
  };

  return { getMutualCount };
}
