import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayHealth } from "@/hooks/useHealth";
import { supabase } from "@/lib/supabase";

/**
 * Creates a daily health check-in reminder notification
 * if the user hasn't checked in today and it's past a threshold hour.
 * This runs client-side on Health page mount.
 */
export function useHealthReminders() {
  const { user } = useAuth();
  const { data: todayData, isLoading } = useTodayHealth(user?.id);

  useEffect(() => {
    if (!user?.id || isLoading) return;

    const now = new Date();
    const hour = now.getHours();

    // Only create reminder after 6 PM if no check-in today
    if (todayData || hour < 18) return;

    // Check if we already created a reminder today
    const storageKey = `health-reminder-${user.id}-${now.toISOString().slice(0, 10)}`;
    if (localStorage.getItem(storageKey)) return;

    // Insert a notification
    supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        category: "progress",
        priority: "informational",
        title: "Health Check-in Reminder",
        description: "You haven't logged your wellness data today. A quick check-in keeps your streak alive!",
        icon_key: "heart",
        module_key: "health",
        cta_label: "Check in now",
        cta_url: "/health",
      })
      .then(({ error }) => {
        if (!error) localStorage.setItem(storageKey, "1");
      });
  }, [user?.id, todayData, isLoading]);
}
