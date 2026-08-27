import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackFriendAdded } from "@/lib/achievements";

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

export interface SentRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  receiver_profile?: { display_name: string | null; avatar_url: string | null };
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

      const senderIds = (data ?? []).map((r) => r.sender_id);
      if (senderIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", senderIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      return (data ?? []).map((r) => ({
        ...r,
        sender_profile: profileMap.get(r.sender_id) ?? null,
      })) as FriendRequest[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // Sent requests (pending) — now with receiver profiles
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
      if (!data || data.length === 0) return [];

      const receiverIds = data.map((r) => r.receiver_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", receiverIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      return data.map((r) => ({
        ...r,
        receiver_profile: profileMap.get(r.receiver_id) ?? null,
      })) as SentRequest[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    queryClient.invalidateQueries({ queryKey: ["friend-requests-sent"] });
  };

  // Send friend request (with self-request guard)
  const sendRequest = useMutation({
    mutationFn: async (receiverId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (receiverId === user.id) throw new Error("Cannot send a friend request to yourself");
      const { error } = await supabase.from("friendships").insert({
        sender_id: user.id,
        receiver_id: receiverId,
      });
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  // Accept friend request
  const acceptRequest = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      if (user?.id) {
        trackFriendAdded(user.id);
      }
    },
  });

  // Decline friend request
  const declineRequest = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "declined" })
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

  // Cancel sent request
  const cancelSentRequest = useMutation({
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
    if (sentRequests.some((r) => r.receiver_id === otherUserId)) return "pending_sent";
    if (pendingRequests.some((r) => r.sender_id === otherUserId)) return "pending_received";
    return "none";
  };

  /* LA RECHERCHE D'ALLIÉS NE POUVAIT RIEN RENDRE.
     Elle interrogeait `profiles` en ilike. Or cette table n'a qu'une
     politique de lecture — « auth.uid() = id » — et la requête
     s'excluait elle-même de ses résultats : elle rendait donc toujours
     zéro ligne, quelle que soit la saisie. Zéro amitié en base : ce
     n'était pas un désintérêt, c'était une impasse.

     Elle filtrait aussi les blocages « dans les deux sens » en lisant
     blocked_users avec blocked_user_id = moi. Cette lecture-là ne rend
     rien non plus, pour la même raison : on ne voit que les blocages
     qu'on a posés. La moitié du filtre était décorative.

     `chercher_profils` fait les deux côté serveur, ne rend que les
     profils qui ont accepté d'être trouvés, et neutralise les jokers
     de la saisie. */
  const searchProfiles = async (query: string) => {
    if (!user?.id || query.trim().length < 2) return [];
    const { data, error } = await supabase.rpc("chercher_profils", { p_requete: query.trim() });
    if (error) throw error;
    return ((data ?? []) as { id: string; nom: string | null; avatar: string | null }[])
      .map((p) => ({ id: p.id, display_name: p.nom, avatar_url: p.avatar }));
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
    cancelSentRequest,
    getFriendshipStatus,
    searchProfiles,
  };
}
