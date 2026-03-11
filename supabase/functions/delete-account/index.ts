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

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    // Admin client for deletion
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete user data in FK-safe order
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
      { table: "goal_cost_items", column: "goal_id", nested: true },
      { table: "goal_tags", column: "goal_id", nested: true },
      { table: "pact_spending", column: "user_id" },
      { table: "bond_transactions", column: "user_id" },
      { table: "bond_balance", column: "user_id" },
      { table: "promo_code_redemptions", column: "user_id" },
      { table: "user_achievements", column: "user_id" },
      { table: "achievement_tracking", column: "user_id" },
      { table: "user_cosmetics", column: "user_id" },
      { table: "user_module_purchases", column: "user_id" },
      { table: "journal_entries", column: "user_id" },
      { table: "health_data", column: "user_id" },
      { table: "health_settings", column: "user_id" },
      { table: "health_streaks", column: "user_id" },
      { table: "health_challenges", column: "user_id" },
      { table: "finance", column: "user_id" },
      { table: "monthly_finance_validations", column: "user_id" },
      { table: "recurring_income", column: "user_id" },
      { table: "recurring_expenses", column: "user_id" },
      { table: "notification_settings", column: "user_id" },
      { table: "notifications", column: "user_id" },
      { table: "private_messages", column: "sender_id" },
      { table: "private_messages", column: "receiver_id" },
      { table: "security_events", column: "user_id" },
      { table: "blocked_users", column: "user_id" },
      { table: "blocked_users", column: "blocked_user_id" },
      { table: "friendships", column: "sender_id" },
      { table: "friendships", column: "receiver_id" },
      { table: "guild_invites", column: "inviter_id" },
      { table: "guild_invites", column: "invitee_id" },
      { table: "guild_members", column: "user_id" },
      { table: "ranks", column: "user_id" },
      { table: "user_2fa_settings", column: "user_id" },
      { table: "user_roles", column: "user_id" },
    ];

    // First delete goals (which cascade steps etc.)
    // Get pact ids
    const { data: pacts } = await adminClient.from("pacts").select("id").eq("user_id", userId);
    const pactIds = pacts?.map((p: any) => p.id) || [];

    if (pactIds.length > 0) {
      // Delete goals (cascades steps, tags, cost_items via FK)
      await adminClient.from("goals").delete().in("pact_id", pactIds);
    }

    // Delete from all tables
    for (const t of tables) {
      await adminClient.from(t.table).delete().eq(t.column, userId);
    }

    // Delete pacts
    await adminClient.from("pacts").delete().eq("user_id", userId);

    // Delete guilds owned by user
    await adminClient.from("guilds").delete().eq("owner_id", userId);

    // Delete profile
    await adminClient.from("profiles").delete().eq("id", userId);

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete auth user" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err: any) {
    console.error("delete-account error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
