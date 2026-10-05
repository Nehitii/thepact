import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete all user content data but keep account, profile, and auth
    const tables = [
      { table: "active_missions", column: "user_id" },
      { table: "pomodoro_sessions", column: "user_id" },
      { table: "habit_logs", column: "user_id" },
      { table: "community_reactions", column: "user_id" },
      { table: "community_replies", column: "user_id" },
      { table: "community_reports", column: "reporter_id" },
      { table: "community_posts", column: "user_id" },
      { table: "victory_reels", column: "user_id" },
      { table: "shared_goals", column: "owner_id" },
      { table: "shared_pacts", column: "owner_id" },
      { table: "shared_pacts", column: "member_id" },
      { table: "pact_spending", column: "user_id" },
      { table: "bond_transactions", column: "user_id" },
      { table: "bond_balance", column: "user_id" },
      { table: "promo_code_redemptions", column: "user_id" },
      { table: "user_achievements", column: "user_id" },
      { table: "achievement_tracking", column: "user_id" },
      { table: "journal_entries", column: "user_id" },
      { table: "health_data", column: "user_id" },
      { table: "health_settings", column: "user_id" },
      { table: "health_streaks", column: "user_id" },
      { table: "health_challenges", column: "user_id" },
      { table: "finance", column: "user_id" },
      { table: "monthly_finance_validations", column: "user_id" },
      { table: "recurring_income", column: "user_id" },
      { table: "recurring_expenses", column: "user_id" },
      { table: "notifications", column: "user_id" },
      { table: "private_messages", column: "sender_id" },
      { table: "private_messages", column: "receiver_id" },
      { table: "security_events", column: "user_id" },
      { table: "blocked_users", column: "user_id" },
      { table: "ranks", column: "user_id" },
    ];

    // Delete goals via pacts
    const { data: pacts } = await adminClient.from("pacts").select("id").eq("user_id", userId);
    const pactIds = pacts?.map((p: any) => p.id) || [];
    if (pactIds.length > 0) {
      await adminClient.from("goals").delete().in("pact_id", pactIds);
    }

    for (const t of tables) {
      await adminClient.from(t.table).delete().eq(t.column, userId);
    }

    // Reset pacts instead of deleting
    if (pactIds.length > 0) {
      for (const pactId of pactIds) {
        await adminClient.from("pacts").update({
          points: 0,
          global_progress: 0,
          checkin_streak: 0,
          checkin_total_count: 0,
        }).eq("id", pactId);
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err: any) {
    console.error("delete-all-data error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
