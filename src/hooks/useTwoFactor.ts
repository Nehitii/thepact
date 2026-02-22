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
  const { user, session } = useAuth();
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
    queryKey: ["twofactor", "status", user?.id, session?.access_token],
    enabled: !!user && !!session?.access_token,
    queryFn: async () => {
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("No valid session");

      const deviceToken = getTrustedDeviceToken();

      const invokeStatus = async (token: string) => {
        return await supabase.functions.invoke("two-factor", {
          body: { action: "status", deviceToken },
          headers: { Authorization: `Bearer ${token}` },
        });
      };

      const is401 = (err: unknown) => {
        const anyErr = err as any;
        const status = anyErr?.context?.status ?? anyErr?.status;
        const msg = typeof anyErr?.message === "string" ? anyErr.message : "";
        return status === 401 || /invalid or expired token/i.test(msg);
      };

      // First try with the current access token
      let { data, error } = await invokeStatus(accessToken);

      // If the token is stale/expired, refresh once and retry.
      if (error && is401(error)) {
        const refreshed = await supabase.auth.refreshSession();
        const newToken = refreshed.data.session?.access_token;
        if (newToken) {
          ({ data, error } = await invokeStatus(newToken));
        }

        // If refresh didn't help, force re-auth instead of crashing the app.
        if (error && is401(error)) {
          await supabase.auth.signOut();
          return { enabled: false, emailEnabled: false, trusted: false };
        }
      }

      if (error) throw error;
      return data as { enabled: boolean; emailEnabled: boolean; trusted: boolean };
    },
    staleTime: 15_000,
    retry: false, // Don't retry on auth errors
  });

  const enabled = statusQuery.data?.enabled ?? false;
  const emailEnabled = statusQuery.data?.emailEnabled ?? false;
  const trusted = statusQuery.data?.trusted ?? false;
  const isRequired = !!user && (enabled || emailEnabled) && !trusted && !sessionVerified;

  return {
    enabled,
    emailEnabled,
    trusted,
    sessionVerified,
    setSessionVerified,
    isRequired,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,
    refetch: statusQuery.refetch,
  };
}
