import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/** Invisible component that pings online status every 60s. Mount once inside AuthProvider. */
export function OnlineStatusPing() {
  useOnlineStatus(60_000);
  return null;
}
