import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Web Push subscription helper.
 * Requires VAPID_PUBLIC_KEY available either as env (VITE_VAPID_PUBLIC_KEY)
 * or persisted in feature_flags meta (future). Currently env-driven.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );
  const [subscribed, setSubscribed] = useState(false);
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  /* LA CLÉ PUBLIQUE EST PUBLIQUE PAR CONSTRUCTION — le navigateur la
     reçoit à l'abonnement et lie l'abonnement à elle. L'écrire ici n'est
     pas une fuite ; c'est sa place.

     CELLE-CI A REMPLACÉ UNE CLÉ MORTE. La précédente venait de Lovable
     et sa moitié privée n'existait nulle part : aucun envoi n'aurait pu
     être signé. Rien n'a été cassé en la changeant — la table
     `push_subscriptions` était vide, vérifié avant. Ce ne sera plus vrai
     au premier abonné : changer cette clé invalidera alors tous les
     abonnements existants, qui devront se refaire. */
  const vapidKey =
    (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ??
    "BK849pGLmnyMvW04Cop-fMuyEW4UchxKQLQBNOHiQfJv-qzPQuxM5gNqVrziIyf42H8VltReS84dwr3EjNLpD4g";

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker?.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported || !user?.id) return { ok: false, reason: "unsupported" as const };
    if (!vapidKey) return { ok: false, reason: "missing-vapid" as const };
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return { ok: false, reason: "denied" as const };
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: "invalid-subscription" as const };
    }
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) return { ok: false, reason: "db-error" as const, error };
    setSubscribed(true);
    return { ok: true as const };
  }, [supported, user?.id, vapidKey]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
    setSubscribed(false);
  }, [supported]);

  return { supported, permission, subscribed, subscribe, unsubscribe, hasVapid: !!vapidKey };
}