import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Cron auth: require CRON_SECRET header for non-admin invocations
    const cronSecret = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    const authedAsCron = cronSecret && provided && provided === cronSecret;

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    if (!authedAsCron) {
      // Allow admin users to invoke manually
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Find seasons that have ended but not yet snapshotted
    const { data: ended, error: e1 } = await admin
      .from("seasons")
      .select("id, slug, name, ends_at, leaderboard_snapshot")
      .lt("ends_at", new Date().toISOString())
      .is("leaderboard_snapshot", null);
    if (e1) throw e1;

    const results: Array<{ season_id: string; slug: string; snapshotted: number }> = [];
    for (const s of ended ?? []) {
      const { data, error } = await admin.rpc("snapshot_season_leaderboard", {
        _season_id: s.id,
        _top: 100,
      });
      if (error) {
        console.error("snapshot error", s.id, error);
        continue;
      }
      results.push({ season_id: s.id, slug: s.slug, snapshotted: (data as number) ?? 0 });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});