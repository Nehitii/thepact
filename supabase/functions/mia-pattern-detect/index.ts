// Nightly pattern detection.
// Aggregates recent user activity (habits, journal mood, finance, goals) and
// uses an LLM to surface 1-3 actionable insights, persisted as notifications.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { checkAiQuota } from "../_shared/quota.ts";
import { chatCompletion, DEFAULT_CHAT_MODEL, getAiKey } from "../_shared/ai.ts";
import { messageDErreur } from "../_shared/erreurs.ts";
import type { ClientSupabase } from "../_shared/client.ts";

/** Un message envoye au modele. */
interface MessageIA { role: string; content: string }

/** Ce que le modele est cense rendre. Il peut rendre autre chose : on
    verifie avant de s'en servir, au lieu de le supposer. */
interface Constat { title?: string; body?: string; category?: string }
interface ReponseModele { insights?: Constat[] }

interface LigneUtilisateur { user_id: string }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function llm(messages: MessageIA[], aiKey: string) {
  /* Travail de fond : personne n'attend devant un écran, donc on peut
     viser une autre chaîne de modèles et insister plus longtemps. */
  const res = await chatCompletion(
    { model: DEFAULT_CHAT_MODEL, messages, response_format: { type: "json_object" } },
    aiKey,
    { usage: "traitement", essaisMax: 6 },
  );
  if (!res.ok) throw new Error(`llm ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "{}";
}

async function snapshot(supabase: ClientSupabase, userId: string) {
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const [habits, journal, goals, tx] = await Promise.all([
    supabase.from("habit_logs").select("habit_id,date,completed").eq("user_id", userId).gte("date", since.slice(0, 10)),
    supabase.from("journal_entries").select("mood,created_at").eq("user_id", userId).gte("created_at", since).limit(60),
    supabase.from("goals").select("name,status,difficulty,updated_at").eq("user_id", userId).neq("status", "archived").limit(40),
    supabase.from("transactions").select("amount,type,category,date").eq("user_id", userId).gte("date", since.slice(0, 10)).limit(80),
  ]);
  return {
    habits: habits.data ?? [],
    journal: journal.data ?? [],
    goals: goals.data ?? [],
    transactions: tx.data ?? [],
  };
}

async function processUser(supabase: ClientSupabase, userId: string, aiKey: string) {
  // Respect user opt-out
  const { data: prefs } = await supabase
    .from("notification_settings")
    .select("coach_proactive_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (prefs && prefs.coach_proactive_enabled === false) return { skipped: true, reason: "opted_out" };

  const snap = await snapshot(supabase, userId);
  if (
    snap.habits.length === 0 &&
    snap.journal.length === 0 &&
    snap.goals.length === 0 &&
    snap.transactions.length === 0
  ) return { skipped: true };

  const prompt = `Tu es M.I.A, l'intelligence intégrée à Overwrite. Examine les données récentes (14 derniers jours) d'un utilisateur et identifie 1 à 3 patterns actionnables et bienveillants. Réponds en JSON: { "insights": [ { "title": string (max 60 chars), "body": string (max 200 chars, ton tutoyé), "category": "habit"|"mood"|"finance"|"goal" } ] }. Si rien de notable, renvoie une liste vide.`;
  const raw = await llm([
    { role: "system", content: prompt },
    { role: "user", content: JSON.stringify(snap) },
  ], aiKey);
  let parsed: ReponseModele = {};
  try { parsed = JSON.parse(raw); } catch { parsed = { insights: [] }; }
  const insights = Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) : [];

  for (const ins of insights) {
    if (!ins?.title) continue;
    const category = String(ins.category ?? "pattern");
    const severity = ["habit", "mood"].includes(category) ? "warning" : "info";
    await supabase.from("mia_insights").insert({
      user_id: userId,
      type: "pattern",
      severity,
      category,
      title: String(ins.title).slice(0, 80),
      body: String(ins.body ?? "").slice(0, 280),
      source: { module: category },
      expires_at: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    });
    await supabase.from("notifications").insert({
      user_id: userId,
      title: String(ins.title).slice(0, 80),
      description: String(ins.body ?? "").slice(0, 240),
      category: "progress",
      priority: "informational",
      icon_key: "sparkles",
    });
  }
  return { count: insights.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const aiKey = getAiKey();
  if (!aiKey) return new Response(JSON.stringify({ error: "missing AI_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const cronSecret = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("Authorization") ?? "";
  const isCron = cronSecret && auth === `Bearer ${cronSecret}`;

  try {
    if (isCron) {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      // Run for active users with at least one journal/habit/goal in last 30 days.
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data: actives } = await admin
        .from("journal_entries")
        .select("user_id")
        .gte("created_at", since)
        .limit(500)
        .returns<LigneUtilisateur[]>();
      const userIds = Array.from(new Set((actives ?? []).map((r) => r.user_id)));
      const results: Array<Record<string, unknown>> = [];
      for (const uid of userIds.slice(0, 100)) {
        try { results.push({ uid, ...(await processUser(admin, uid, aiKey)) }); }
        catch (e: unknown) { results.push({ uid, error: messageDErreur(e) }); }
      }
      return new Response(JSON.stringify({ ok: true, processed: results.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Per-user invocation (JWT)
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const quotaResp = await checkAiQuota(supabase, "mia-pattern-detect", 20, corsHeaders);
    if (quotaResp) return quotaResp;
    const result = await processUser(supabase, claims.claims.sub, aiKey);
    return new Response(JSON.stringify({ ok: true, ...result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: messageDErreur(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});