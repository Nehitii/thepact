import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Living Network — subscribes to realtime updates of `profiles.last_seen_at`
 * for the given friend ids and returns:
 *   - lastSeenMap: friendId -> ISO timestamp | null
 *   - onlineCount: number of friends seen within ONLINE_WINDOW_MS
 *
 * Falls back to a 60s poll if realtime is unavailable.
 */
export function useFriendsPresence(friendIds: string[]) {
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string | null>>({});

  // Stable key to avoid effect thrash on identical arrays
  const idsKey = friendIds.slice().sort().join(",");

  useEffect(() => {
    if (!friendIds.length) {
      setLastSeenMap({});
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, last_seen_at")
        .in("id", friendIds);
      if (cancelled) return;
      const map: Record<string, string | null> = {};
      data?.forEach((p: any) => {
        map[p.id] = p.last_seen_at ?? null;
      });
      setLastSeenMap(map);
    };

    fetchAll();

    // Realtime subscription on profiles updates for these ids
    const channel = supabase
      .channel(`friends-presence-${idsKey.slice(0, 32)}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=in.(${friendIds.join(",")})`,
        },
        (payload: any) => {
          const { id, last_seen_at } = payload.new ?? {};
          if (!id) return;
          setLastSeenMap((prev) => ({ ...prev, [id]: last_seen_at ?? null }));
        }
      )
      .subscribe();

    // Safety poll every 60s to refresh stale entries (also drives online → idle/offline transitions)
    const interval = window.setInterval(fetchAll, 60_000);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Tick every 30s to recompute onlineCount as time passes
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const now = Date.now();
  const onlineCount = Object.values(lastSeenMap).filter((ts) => {
    if (!ts) return false;
    return now - new Date(ts).getTime() < ONLINE_WINDOW_MS;
  }).length;

  return { lastSeenMap, onlineCount };
}