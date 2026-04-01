import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Friend {
  friendship_id: string;
  friend_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: { display_name: string | null; avatar_url: string | null };
}

export function useFriends() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Accepted friends via DB function
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc("get_accepted_friends", {
        p_user_id: user.id,
      });
      if (error) throw error;
      return (data ?? []) as Friend[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // Pending requests received
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["friend-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch sender profiles
      const senderIds = (data ?? []).map((r: any) => r.sender_id);
      if (senderIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", senderIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: any) => [p.id, p])
      );

      return (data ?? []).map((r: any) => ({
        ...r,
        sender_profile: profileMap.get(r.sender_id) ?? null,
      })) as FriendRequest[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // Sent requests (pending)
  const { data: sentRequests = [] } = useQuery({
    queryKey: ["friend-requests-sent", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .eq("sender_id", user.id)
        .eq("status", "pending");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    queryClient.invalidateQueries({ queryKey: ["friend-requests-sent"] });
  };

  // Send friend request
  const sendRequest = useMutation({
    mutationFn: async (receiverId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("friendships").insert({
        sender_id: user.id,
        receiver_id: receiverId,
      } as any);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  // Accept friend request
  const acceptRequest = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" } as any)
        .eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  // Decline friend request
  const declineRequest = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "declined" } as any)
        .eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  // Remove friend
  const removeFriend = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  // Check friendship status with a specific user
  const getFriendshipStatus = (otherUserId: string): "none" | "pending_sent" | "pending_received" | "accepted" => {
    if (friends.some((f) => f.friend_id === otherUserId)) return "accepted";
    if (sentRequests.some((r: any) => r.receiver_id === otherUserId)) return "pending_sent";
    if (pendingRequests.some((r) => r.sender_id === otherUserId)) return "pending_received";
    return "none";
  };

  // Search profiles (filtered by blocked users)
  const searchProfiles = async (query: string) => {
    if (!user?.id || !query.trim()) return [];

    // Get blocked user IDs
    const { data: blocked } = await supabase
      .from("blocked_users")
      .select("blocked_user_id")
      .eq("user_id", user.id);
    const blockedIds = (blocked ?? []).map((b: any) => b.blocked_user_id);

    // Also get users who blocked me
    const { data: blockedBy } = await supabase
      .from("blocked_users")
      .select("user_id")
      .eq("blocked_user_id", user.id);
    const blockedByIds = (blockedBy ?? []).map((b: any) => b.user_id);

    const excludeIds = [...new Set([user.id, ...blockedIds, ...blockedByIds])];

    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .ilike("display_name", `%${query}%`)
      .limit(20);
    if (error) throw error;
    return data ?? [];
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    friendsLoading,
    requestsLoading,
    pendingCount: pendingRequests.length,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    getFriendshipStatus,
    searchProfiles,
  };
}
