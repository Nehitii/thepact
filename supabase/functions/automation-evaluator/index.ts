// Automation Evaluator — cron-driven rule engine.
// Evaluates active user_automation_rules and executes their action.
//
// Supported triggers:
//   - streak_broken      { habit_goal_id?, min_streak_days?: 2 }
//   - goal_overdue       { goal_id?, days_overdue?: 0 }
//   - budget_exceeded    { category?, threshold_pct?: 100 }
//   - low_focus_week     { min_minutes?: 60 }
//   - daily_schedule     { hour_utc: number }
//
// Supported actions:
//   - send_notification  { title, description, cta_url?, priority? }
//   - coach_insight      { title, body, severity?: 'info'|'warn'|'critical' }
//   - grant_bonds        { amount }
//
// Cooldown: a rule never fires twice in the same UTC day.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");

function sameUtcDay(a: Date, b: Date) {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

async function evalTrigger(sb: any, userId: string, rule: any): Promise<boolean> {
  const cfg = rule.trigger_config ?? {};
  switch (rule.trigger_type) {
    case "streak_broken": {
      const minStreak = Number(cfg.min_streak_days ?? 2);
      const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const q = sb.from("habit_logs").select("goal_id,log_date,streak_count,completed").eq("user_id", userId).gte("log_date", since).order("log_date", { ascending: false });
      const { data } = cfg.habit_goal_id ? await q.eq("goal_id", cfg.habit_goal_id) : await q;
      if (!data?.length) return false;
      // streak considered broken if today missing AND yesterday's streak >= minStreak
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const todayLog = data.find((d: any) => d.log_date === today && d.completed);
      if (todayLog) return false;
      const yesterdayBest = Math.max(0, ...data.filter((d: any) => d.log_date === yesterday).map((d: any) => d.streak_count ?? 0));
      return yesterdayBest >= minStreak;
    }
    case "goal_overdue": {
      const today = new Date().toISOString().slice(0, 10);
      const { data: pacts } = await sb.from("pacts").select("id").eq("user_id", userId);
      const ids = (pacts ?? []).map((p: any) => p.id);
      if (!ids.length) return false;
      let q = sb.from("goals").select("id,deadline,status,name").in("pact_id", ids).in("status", ["in_progress", "not_started"]).lt("deadline", today);
      if (cfg.goal_id) q = q.eq("id", cfg.goal_id);
      const { data } = await q.limit(1);
      return (data?.length ?? 0) > 0;
    }
    case "budget_exceeded": {
      const monthStart = new Date(); monthStart.setUTCDate(1);
      const ws = monthStart.toISOString().slice(0, 10);
      const { data } = await sb.from("bank_transactions").select("amount,category,transaction_type").eq("user_id", userId).gte("transaction_date", ws).eq("transaction_type", "expense");
      const total = (data ?? []).filter((t: any) => !cfg.category || t.category === cfg.category).reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
      const threshold = Number(cfg.threshold ?? 0);
      return threshold > 0 && total >= threshold;
    }
    case "low_focus_week": {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await sb.from("focus_sessions").select("duration_seconds").eq("user_id", userId).gte("started_at", since);
      const minutes = (data ?? []).reduce((s: number, r: any) => s + Number(r.duration_seconds ?? 0), 0) / 60;
      return minutes < Number(cfg.min_minutes ?? 60);
    }
    case "daily_schedule": {
      const hourUtc = Number(cfg.hour_utc ?? 8);
      return new Date().getUTCHours() === hourUtc;
    }
    default:
      return false;
  }
}

async function runAction(sb: any, userId: string, rule: any): Promise<string> {
  const cfg = rule.action_config ?? {};
  switch (rule.action_type) {
    case "send_notification": {
      await sb.from("notifications").insert({
        user_id: userId,
        category: "system",
        priority: cfg.priority ?? "informational",
        title: cfg.title ?? rule.name,
        description: cfg.description ?? rule.description ?? null,
        cta_label: cfg.cta_label ?? null,
        cta_url: cfg.cta_url ?? null,
        icon_key: "zap",
        module_key: "automation",
      });
      return "notification_sent";
    }
    case "coach_insight": {
      await sb.from("coach_insights").insert({
        user_id: userId,
        type: "automation",
        severity: cfg.severity ?? "info",
        category: "rule",
        title: cfg.title ?? rule.name,
        body: cfg.body ?? rule.description ?? "",
        source: { rule_id: rule.id, trigger: rule.trigger_type },
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      return "insight_created";
    }
    case "grant_bonds": {
      const amount = Math.max(0, Math.min(500, Number(cfg.amount ?? 0)));
      if (amount > 0) {
        await sb.rpc("award_bonds", { p_amount: amount, p_reason: `Automation: ${rule.name}` }).catch(() => null);
      }
      return `bonds_${amount}`;
    }
    default:
      return "noop";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const headerSecret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || headerSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: rules } = await sb
    .from("user_automation_rules")
    .select("*")
    .eq("is_active", true);

  let fired = 0, skipped = 0, errors = 0;
  const now = new Date();

  for (const rule of rules ?? []) {
    try {
      // Cooldown: skip if already fired today
      if (rule.last_run_at && sameUtcDay(now, new Date(rule.last_run_at)) && rule.last_status?.startsWith("fired")) {
        skipped++;
        continue;
      }
      const triggered = await evalTrigger(sb, rule.user_id, rule);
      if (!triggered) {
        await sb.from("user_automation_rules").update({ last_run_at: now.toISOString(), last_status: "no_trigger" }).eq("id", rule.id);
        continue;
      }
      const status = await runAction(sb, rule.user_id, rule);
      await sb.from("user_automation_rules").update({
        last_run_at: now.toISOString(),
        last_status: `fired:${status}`,
        run_count: (rule.run_count ?? 0) + 1,
      }).eq("id", rule.id);
      fired++;
    } catch (e) {
      errors++;
      await sb.from("user_automation_rules").update({ last_run_at: now.toISOString(), last_status: `error:${String(e).slice(0, 80)}` }).eq("id", rule.id);
    }
  }

  return new Response(JSON.stringify({ ok: true, evaluated: rules?.length ?? 0, fired, skipped, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});