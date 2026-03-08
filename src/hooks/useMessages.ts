import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  other_user_id: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export function useMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("private_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PrivateMessage[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // Unread message count
  const unreadCount = messages.filter(
    (m) => m.receiver_id === user?.id && !m.is_read
  ).length;

  // Get conversations grouped by other user
  const conversations: Conversation[] = messages.reduce((acc, msg) => {
    const other_user_id = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
    const existing = acc.find((c) => c.other_user_id === other_user_id);
    
    if (!existing) {
      acc.push({
        other_user_id,
        other_user_name: null, // Would need to join with profiles
        other_user_avatar: null,
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread_count: msg.receiver_id === user?.id && !msg.is_read ? 1 : 0,
      });
    } else if (msg.receiver_id === user?.id && !msg.is_read) {
      existing.unread_count++;
    }
    return acc;
  }, [] as Conversation[]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("private_messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", user?.id] });
    },
  });

  // Mark conversation as read
  const markConversationAsRead = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("private_messages")
        .update({ is_read: true })
        .eq("sender_id", otherUserId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", user?.id] });
    },
  });

  return {
    messages,
    conversations,
    unreadCount,
    isLoading,
    sendMessage,
    markConversationAsRead,
  };
}

export function useUserBlocks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch blocked users
  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["user-blocks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_blocks")
        .select("*")
        .eq("blocker_id", user.id);
      if (error) throw error;
      return data as UserBlock[];
    },
    enabled: !!user?.id,
  });

  // Block user
  const blockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_id: blockedId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-blocks", user?.id] });
    },
  });

  // Unblock user
  const unblockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", blockedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-blocks", user?.id] });
    },
  });

  const isBlocked = (userId: string) => blocks.some((b) => b.blocked_id === userId);

  return {
    blocks,
    isLoading,
    blockUser,
    unblockUser,
    isBlocked,
  };
}
