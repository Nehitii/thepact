import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Updates the current user's last_seen_at timestamp periodically.
 * Call once at the app root level.
 */
export function useOnlineStatus(intervalMs = 60_000) {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!user?.id) return;

    const ping = () => {
      supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() } as any)
        .eq("id", user.id)
        .then(() => {});
    };

    ping(); // immediate
    timerRef.current = setInterval(ping, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user?.id, intervalMs]);
}
