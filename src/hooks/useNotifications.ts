import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationCategory = "system" | "progress" | "social" | "marketing";
export type NotificationPriority = "critical" | "important" | "informational" | "social" | "silent";

export interface Notification {
  id: string;
  user_id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  description: string | null;
  icon_key: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  reward_type: string | null;
  reward_amount: number | null;
  module_key: string | null;
  is_read: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  system_enabled: boolean;
  progress_enabled: boolean;
  social_enabled: boolean;
  marketing_enabled: boolean;
  push_enabled: boolean;
  focus_mode: boolean;
  created_at: string;
  updated_at: string;
}

type EnabledCategoryMap = Record<NotificationCategory, boolean>;

function buildEnabledMap(settings: NotificationSettings | null | undefined): EnabledCategoryMap {
  return {
    system: settings?.system_enabled ?? true,
    progress: settings?.progress_enabled ?? true,
    social: settings?.social_enabled ?? true,
    marketing: settings?.marketing_enabled ?? true,
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notification settings for filtering (enforceable scope: categories only)
  const { data: settings } = useQuery({
    queryKey: ["notification-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as NotificationSettings | null;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // Fetch all notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const enabled = buildEnabledMap(settings);
  const filteredNotifications = notifications.filter((n) => enabled[n.category]);

  // Unread count
  const unreadCount = filteredNotifications.filter((n) => !n.is_read).length;

  // Unread by module (for badge display)
  const unreadByModule = filteredNotifications.reduce((acc, n) => {
    if (!n.is_read && n.module_key) {
      acc[n.module_key] = (acc[n.module_key] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Mark module notifications as read
  const markModuleAsRead = useMutation({
    mutationFn: async (moduleKey: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("module_key", moduleKey)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Clear all notifications
  const clearAll = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  return {
    notifications: filteredNotifications,
    settings,
    unreadCount,
    unreadByModule,
    isLoading,
    markAsRead,
    markAllAsRead,
    markModuleAsRead,
    deleteNotification,
    clearAll,
  };
}

export function useNotificationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["notification-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as NotificationSettings | null;
    },
    enabled: !!user?.id,
  });

  // Create or update settings
  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      // Check if settings exist
      const { data: existing } = await supabase
        .from("notification_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("notification_settings")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_settings")
          .insert({ user_id: user.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings", user?.id] });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
  };
}
