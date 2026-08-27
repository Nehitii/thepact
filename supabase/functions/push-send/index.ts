// Push notification sender (Web Push, VAPID).
// Requires secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. "mailto:owner@vowpact.app").
// Optional: ADMIN_SHARED_SECRET to gate cron callers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// @ts-types="./web-push.d.ts"
import webpush from "https://esm.sh/web-push@3.6.7";
import { statutDErreur } from "../_shared/erreurs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendBody {
  user_id: string;
  title: string;
  body?: string;
  url?: string;
  icon?: string;
  /** Envoi demandé explicitement par l'utilisateur — le bouton « Envoyer
   *  un test ». Une demande directe n'est pas une notification : elle
   *  passe outre les préférences, sinon le bouton ne prouverait rien. */
  force?: boolean;
}

/**
 * La plage de silence, bornes comprises côté début, exclue côté fin.
 * Elle peut enjamber minuit : 22:00 → 07:00 est une seule plage, pas
 * deux. Les heures sont comparées en « HH:MM », ce qui suffit puisque
 * l'ordre lexicographique et l'ordre chronologique coïncident sur ce
 * format.
 */
function dansLesHeuresCalmes(debut: string | null, fin: string | null, maintenant: string) {
  if (!debut || !fin) return false;
  const d = debut.slice(0, 5), f = fin.slice(0, 5);
  return d <= f ? maintenant >= d && maintenant < f : maintenant >= d || maintenant < f;
}

/** L'heure qu'il est chez l'utilisateur, pas chez le serveur. */
function heureLocale(fuseau: string | null) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: fuseau || "UTC", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date());
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY");
  const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY");
  const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:owner@vowpact.app";
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth: either a logged-in user (own pushes) or shared cron secret.
  const authHeader = req.headers.get("Authorization") ?? "";
  const cronSecret = req.headers.get("x-cron-secret");
  const sharedOk = !!cronSecret && cronSecret === Deno.env.get("CRON_SECRET");
  let callerUserId: string | null = null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (!sharedOk) {
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    callerUserId = data.user.id;
  }

  let body: SendBody;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!body?.user_id || !body?.title) {
    return new Response(JSON.stringify({ error: "user_id and title required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!sharedOk && callerUserId !== body.user_id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // LES PRÉFÉRENCES SONT ENFIN CONSULTÉES.
  //
  // Cette fonction envoyait sans rien lire. Trois réglages de l'écran
  // « Notifications » ne servaient donc à rien : « Notifications push »,
  // « Mode concentration » — pour le push — et toute la plage d'heures
  // calmes, qui promet pourtant noir sur blanc qu'« aucune notification
  // n'est poussée pendant cette plage ».
  //
  // On répond 200 avec un motif plutôt qu'une erreur : ne pas envoyer
  // est un succès quand l'utilisateur l'a demandé.
  if (!body.force) {
    const [{ data: prefs }, { data: profil }] = await Promise.all([
      supabase
        .from("notification_settings")
        .select("push_enabled, focus_mode, quiet_hours_start, quiet_hours_end")
        .eq("user_id", body.user_id)
        .maybeSingle(),
      supabase.from("profiles").select("timezone").eq("id", body.user_id).maybeSingle(),
    ]);

    if (prefs) {
      let motif: string | null = null;
      if (prefs.push_enabled === false) motif = "push_desactive";
      else if (prefs.focus_mode === true) motif = "mode_concentration";
      else if (dansLesHeuresCalmes(prefs.quiet_hours_start, prefs.quiet_hours_end, heureLocale(profil?.timezone)))
        motif = "heures_calmes";

      if (motif) {
        return new Response(JSON.stringify({ sent: 0, skipped: motif }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const { data: subs, error: subsErr } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", body.user_id);
  if (subsErr) {
    return new Response(JSON.stringify({ error: subsErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = JSON.stringify({
    title: body.title, body: body.body ?? "", url: body.url ?? "/", icon: body.icon,
  });
  let sent = 0; const dead: string[] = [];
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      sent++;
    } catch (err: unknown) {
      /* 404 / 410 : l'abonnement n'existe plus chez le navigateur. */
      const statut = statutDErreur(err);
      if (statut === 404 || statut === 410) dead.push(s.id);
    }
  }
  if (dead.length) {
    await supabase.from("push_subscriptions").delete().in("id", dead);
  }

  return new Response(JSON.stringify({ sent, pruned: dead.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});