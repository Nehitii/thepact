// Coach cron runner — orchestrates periodic invocations of coach sub-functions
// (index-memory, pattern-detect) for active users. Called by pg_cron with a
// shared secret header.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const FUNCTIONS_BASE = `${SUPABASE_URL.replace(".supabase.co", ".functions.supabase.co")}`;

async function callFn(path: string, secret: string, useHeader: "auth" | "x-cron") {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (useHeader === "auth") headers["Authorization"] = `Bearer ${secret}`;
  else headers["x-cron-secret"] = secret;
  const res = await fetch(`${FUNCTIONS_BASE}/${path}`, { method: "POST", headers, body: "{}" });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || headerSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const started = Date.now();
  const errors: any[] = [];
  let usersProcessed = 0;
  let insightsCreated = 0;

  const { data: runRow } = await admin
    .from("coach_cron_runs")
    .insert({ job: "coach-cron-runner" })
    .select("id")
    .single();

  try {
    // Fan out — sub-functions handle their own user iteration (already do).
    const [indexRes, patternRes] = await Promise.allSettled([
      callFn("coach-index-memory", cronSecret, "x-cron"),
      callFn("coach-pattern-detect", cronSecret, "auth"),
    ]);

    if (indexRes.status === "rejected") errors.push({ fn: "index-memory", err: String(indexRes.reason) });
    else usersProcessed += Number((indexRes.value as any)?.users ?? 0);

    if (patternRes.status === "rejected") errors.push({ fn: "pattern-detect", err: String(patternRes.reason) });
    else usersProcessed += Number((patternRes.value as any)?.processed ?? 0);

    // Count fresh insights from this window
    const since = new Date(started - 60_000).toISOString();
    const { count } = await admin
      .from("coach_insights")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);
    insightsCreated = count ?? 0;
  } catch (e: any) {
    errors.push({ fatal: e?.message ?? String(e) });
  }

  const duration = Date.now() - started;
  if (runRow?.id) {
    await admin.from("coach_cron_runs").update({
      finished_at: new Date().toISOString(),
      users_processed: usersProcessed,
      insights_created: insightsCreated,
      errors,
      duration_ms: duration,
    }).eq("id", runRow.id);
  }

  return new Response(
    JSON.stringify({ ok: errors.length === 0, users_processed: usersProcessed, insights_created: insightsCreated, duration_ms: duration, errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});