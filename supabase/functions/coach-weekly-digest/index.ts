// Coach Weekly Digest — cron-driven Sunday recap.
// For each user with coach_proactive_enabled=true:
//   - compute current + previous week stats
//   - upsert weekly_reviews
//   - insert coach_insight (type='digest')
//   - insert notification (category=system)
//   - fire push if subscription exists
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const FUNCTIONS_BASE = SUPABASE_URL.replace(".supabase.co", ".functions.supabase.co");

function weekBounds(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1) - offsetWeeks * 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return {
    startStr: start.toISOString().slice(0, 10),
    endStr: end.toISOString().slice(0, 10),
  };
}

async function statsForUser(sb: any, userId: string, ws: string, we: string) {
  const { data: userPacts } = await sb.from("pacts").select("id").eq("user_id", userId);
  const pactIds = (userPacts || []).map((p: any) => p.id);
  const goalsRes = pactIds.length
    ? await sb.from("goals").select("id").in("pact_id", pactIds)
    : { data: [] };
  const goalIds = new Set((goalsRes.data || []).map((g: any) => g.id));

  const stepsCompleted = goalIds.size
    ? (await sb
        .from("steps")
        .select("id,goal_id")
        .gte("validated_at", `${ws}T00:00:00`)
        .lte("validated_at", `${we}T23:59:59`)).data?.filter((s: any) => goalIds.has(s.goal_id)).length ?? 0
    : 0;

  const { count: habitLogs } = await sb
    .from("habit_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("completed", true)
    .gte("log_date", ws)
    .lte("log_date", we);

  const { count: journalCount } = await sb
    .from("journal_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", `${ws}T00:00:00`)
    .lte("created_at", `${we}T23:59:59`);

  const { count: todoCount } = await sb
    .from("todo_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("completed_at", `${ws}T00:00:00`)
    .lte("completed_at", `${we}T23:59:59`);

  return {
    stepsCompleted,
    habitLogs: habitLogs ?? 0,
    journalCount: journalCount ?? 0,
    todoCount: todoCount ?? 0,
  };
}

function deltaLabel(curr: number, prev: number) {
  if (prev === 0 && curr === 0) return "stable";
  if (prev === 0) return `+${curr}`;
  const diff = curr - prev;
  const pct = Math.round((diff / Math.max(prev, 1)) * 100);
  if (diff === 0) return "stable";
  return `${diff > 0 ? "+" : ""}${diff} (${pct > 0 ? "+" : ""}${pct}%)`;
}

async function generateInsight(curr: any, prev: any): Promise<string> {
  if (!LOVABLE_API_KEY) {
    return `Cette semaine : ${curr.stepsCompleted} étape(s), ${curr.habitLogs} habitude(s), ${curr.journalCount} entrée(s) journal, ${curr.todoCount} tâche(s). Compare à la semaine passée : étapes ${deltaLabel(curr.stepsCompleted, prev.stepsCompleted)}, habitudes ${deltaLabel(curr.habitLogs, prev.habitLogs)}.`;
  }
  const prompt = `Tu es Pacte Coach. Rédige un digest hebdo (max 120 mots, ton direct, tutoie, markdown léger). Compare la semaine à la précédente, salue les progrès, pointe 1 levier concret.

Semaine actuelle : étapes ${curr.stepsCompleted}, habitudes ${curr.habitLogs}, journal ${curr.journalCount}, tâches ${curr.todoCount}.
Semaine précédente : étapes ${prev.stepsCompleted}, habitudes ${prev.habitLogs}, journal ${prev.journalCount}, tâches ${prev.todoCount}.`;
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu es un coach personnel concis et direct. Tutoie. Markdown léger." },
          { role: "user", content: prompt },
        ],
      }),
    });
    const j = await r.json();
    return j?.choices?.[0]?.message?.content ?? "Digest indisponible cette semaine.";
  } catch {
    return "Digest indisponible cette semaine.";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: either cron secret OR an authenticated user requesting their own digest
  const headerSecret = req.headers.get("x-cron-secret");
  const isCron = !!CRON_SECRET && headerSecret === CRON_SECRET;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let targetUsers: string[] = [];

  if (isCron) {
    const { data } = await admin
      .from("notification_settings")
      .select("user_id")
      .eq("coach_proactive_enabled", true);
    targetUsers = (data ?? []).map((r: any) => r.user_id);
  } else {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data } = await anon.auth.getClaims(authHeader.slice(7));
    const uid = data?.claims?.sub;
    if (!uid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    targetUsers = [uid];
  }

  const curr = weekBounds(0);
  const prev = weekBounds(1);
  let processed = 0, errors = 0, pushed = 0;

  for (const userId of targetUsers) {
    try {
      const [c, p] = await Promise.all([
        statsForUser(admin, userId, curr.startStr, curr.endStr),
        statsForUser(admin, userId, prev.startStr, prev.endStr),
      ]);
      const insight = await generateInsight(c, p);

      await admin.from("weekly_reviews").upsert({
        user_id: userId,
        week_start: curr.startStr,
        week_end: curr.endStr,
        steps_completed: c.stepsCompleted,
        journal_entries_count: c.journalCount,
        todo_completed: c.todoCount,
        ai_insights: insight,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,week_start" });

      await admin.from("coach_insights").insert({
        user_id: userId,
        type: "digest",
        severity: "info",
        category: "weekly",
        title: `Digest semaine ${curr.startStr}`,
        body: insight,
        source: { week_start: curr.startStr, week_end: curr.endStr, current: c, previous: p },
        expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      await admin.from("notifications").insert({
        user_id: userId,
        category: "system",
        priority: "informational",
        title: "Ton digest hebdo est prêt",
        description: `${c.stepsCompleted} étape(s) · ${c.habitLogs} habitude(s) · ${c.journalCount} entrée(s) journal cette semaine.`,
        icon_key: "sparkles",
        cta_label: "Ouvrir le coach",
        cta_url: "/coach",
        module_key: "coach",
      });

      // Fire push (best-effort)
      try {
        const r = await fetch(`${FUNCTIONS_BASE}/push-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-cron-secret": CRON_SECRET ?? "" },
          body: JSON.stringify({
            user_id: userId,
            title: "Digest hebdo Pacte",
            body: "Ouvre ton Coach pour voir tes insights de la semaine.",
            url: "/coach",
          }),
        });
        if (r.ok) pushed++;
      } catch { /* ignore */ }

      processed++;
    } catch (e) {
      errors++;
      console.error("digest error for", userId, e);
    }
  }

  return new Response(JSON.stringify({ ok: true, processed, errors, pushed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});