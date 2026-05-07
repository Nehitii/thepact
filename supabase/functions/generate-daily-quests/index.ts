// Generates 3 daily quests for a user based on their active goals/habits.
// Per-user invocation (JWT) or cron mode (CRON_SECRET) to seed all active users.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Quest = { kind: string; title: string; description: string; target: number; reward_bonds: number };

async function buildQuests(supabase: any, userId: string): Promise<Quest[]> {
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: existing }, { data: goals }, { data: habits }] = await Promise.all([
    supabase.from("daily_quests").select("kind").eq("user_id", userId).eq("date", today),
    supabase.from("goals").select("id,name").eq("user_id", userId).neq("status", "completed").neq("status", "archived").limit(5),
    supabase.from("habits").select("id,name").eq("user_id", userId).limit(5),
  ]);
  const have = new Set((existing ?? []).map((r: any) => r.kind));
  const out: Quest[] = [];

  if (!have.has("complete_steps") && (goals?.length ?? 0) > 0) {
    out.push({ kind: "complete_steps", title: "Avancer un pas", description: "Termine 1 étape d'une de tes missions.", target: 1, reward_bonds: 15 });
  }
  if (!have.has("log_habit") && (habits?.length ?? 0) > 0) {
    out.push({ kind: "log_habit", title: "Tenir le rituel", description: "Valide 2 habitudes aujourd'hui.", target: 2, reward_bonds: 12 });
  }
  if (!have.has("journal_entry")) {
    out.push({ kind: "journal_entry", title: "Conscience écrite", description: "Note une pensée dans le Chronolog.", target: 1, reward_bonds: 10 });
  }
  if (out.length < 3 && !have.has("focus_minutes")) {
    out.push({ kind: "focus_minutes", title: "Focus profond", description: "Cumule 25 min en Focus.", target: 25, reward_bonds: 18 });
  }
  return out.slice(0, 3);
}

async function seedUser(supabase: any, userId: string) {
  const quests = await buildQuests(supabase, userId);
  if (quests.length === 0) return { count: 0 };
  const { data: season } = await supabase.from("seasons").select("id").lte("starts_at", new Date().toISOString()).gte("ends_at", new Date().toISOString()).maybeSingle();
  const rows = quests.map((q) => ({ ...q, user_id: userId, season_id: season?.id ?? null }));
  const { error } = await supabase.from("daily_quests").insert(rows);
  if (error) throw error;
  return { count: rows.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET");
  const isCron = cronSecret && auth === `Bearer ${cronSecret}`;
  try {
    if (isCron) {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
      const { data: actives } = await admin.from("habit_logs").select("user_id").gte("date", since.slice(0, 10)).limit(2000);
      const ids = Array.from(new Set((actives ?? []).map((r: any) => r.user_id)));
      let total = 0;
      for (const uid of ids.slice(0, 200)) {
        try { total += (await seedUser(admin, uid)).count; } catch (_) { /* skip */ }
      }
      return new Response(JSON.stringify({ ok: true, users: ids.length, quests: total }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const result = await seedUser(supabase, claims.claims.sub);
    return new Response(JSON.stringify({ ok: true, ...result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});