import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const DEVICE_TOKEN_KEY = "pacte_trusted_device_token";
const SESSION_VERIFIED_KEY_PREFIX = "pacte_2fa_verified:";

function getSessionVerifiedKey(userId: string) {
  return `${SESSION_VERIFIED_KEY_PREFIX}${userId}`;
}

export function getTrustedDeviceToken(): string {
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setTrustedDeviceToken(token: string) {
  try {
    if (!token) localStorage.removeItem(DEVICE_TOKEN_KEY);
    else localStorage.setItem(DEVICE_TOKEN_KEY, token);
  } catch {
    // ignore storage errors
  }
}

export function clearTrustedDeviceToken() {
  setTrustedDeviceToken("");
}

export function useTwoFactor() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const sessionVerified = useMemo(() => {
    if (!user) return false;
    try {
      return sessionStorage.getItem(getSessionVerifiedKey(user.id)) === "true";
    } catch {
      return false;
    }
  }, [user]);

  const setSessionVerified = useCallback(
    (value: boolean) => {
      if (!user) return;
      try {
        sessionStorage.setItem(getSessionVerifiedKey(user.id), value ? "true" : "false");
      } catch {
        // ignore
      }
      qc.invalidateQueries({ queryKey: ["twofactor", "status", user.id] });
    },
    [qc, user],
  );

  const statusQuery = useQuery({
    queryKey: ["twofactor", "status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const deviceToken = getTrustedDeviceToken();
      const { data, error } = await supabase.functions.invoke("two-factor", {
        body: { action: "status", deviceToken },
      });
      if (error) throw error;
      return data as { enabled: boolean; trusted: boolean };
    },
    staleTime: 15_000,
  });

  const enabled = statusQuery.data?.enabled ?? false;
  const trusted = statusQuery.data?.trusted ?? false;
  const isRequired = !!user && enabled && !trusted && !sessionVerified;

  return {
    enabled,
    trusted,
    sessionVerified,
    setSessionVerified,
    isRequired,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,
    refetch: statusQuery.refetch,
  };
}
