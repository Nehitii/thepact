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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const notifications: Array<{
      user_id: string;
      title: string;
      description: string;
      category: string;
      priority: string;
      icon_key: string;
      module_key: string | null;
    }> = [];

    // ─── 1. Goal Deadline Warnings ───────────────────────────
    // Goals with deadlines approaching in 3 days, 1 day, or overdue
    const { data: goals } = await supabase
      .from("goals")
      .select("id, name, deadline, pact_id, pacts!inner(user_id)")
      .not("deadline", "is", null)
      .in("status", ["not_started", "in_progress"])
      .lte("deadline", new Date(now.getTime() + 3 * 86400000).toISOString().split("T")[0]);

    if (goals) {
      for (const goal of goals) {
        const userId = (goal as any).pacts?.user_id;
        if (!userId) continue;

        const deadlineDate = new Date(goal.deadline!);
        const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / 86400000);

        let title = "";
        let priority = "informational";

        if (diffDays < 0) {
          title = `⚠️ "${goal.name}" is overdue`;
          priority = "critical";
        } else if (diffDays === 0) {
          title = `🔥 "${goal.name}" deadline is today`;
          priority = "important";
        } else if (diffDays === 1) {
          title = `⏰ "${goal.name}" deadline is tomorrow`;
          priority = "important";
        } else if (diffDays <= 3) {
          title = `📅 "${goal.name}" deadline in ${diffDays} days`;
          priority = "informational";
        }

        if (title) {
          // Check if we already sent this notification today
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("title", title)
            .gte("created_at", `${today}T00:00:00`)
            .limit(1);

          if (!existing || existing.length === 0) {
            notifications.push({
              user_id: userId,
              title,
              description: `Your goal "${goal.name}" needs attention.`,
              category: "progress",
              priority,
              icon_key: "Target",
              module_key: null,
            });
          }
        }
      }
    }

    // ─── 2. Health Check-in Reminder ─────────────────────────
    // Users who haven't done a health check-in today
    const { data: healthUsers } = await supabase
      .from("health_settings")
      .select("user_id");

    if (healthUsers && now.getHours() >= 18) {
      for (const hu of healthUsers) {
        const { data: todayEntry } = await supabase
          .from("health_data")
          .select("id")
          .eq("user_id", hu.user_id)
          .eq("entry_date", today)
          .limit(1);

        if (!todayEntry || todayEntry.length === 0) {
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", hu.user_id)
            .eq("title", "💚 Daily health check-in reminder")
            .gte("created_at", `${today}T00:00:00`)
            .limit(1);

          if (!existing || existing.length === 0) {
            notifications.push({
              user_id: hu.user_id,
              title: "💚 Daily health check-in reminder",
              description: "You haven't logged your health data today. Take a minute to check in!",
              category: "progress",
              priority: "informational",
              icon_key: "Heart",
              module_key: "track-health",
            });
          }
        }
      }
    }

    // ─── 3. Finance Month-End Validation ─────────────────────
    // Remind users to validate their month on the last 3 days of the month
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();

    if (dayOfMonth >= lastDayOfMonth - 2) {
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const { data: financeUsers } = await supabase
        .from("recurring_expenses")
        .select("user_id")
        .eq("is_active", true);

      const uniqueUserIds = [...new Set(financeUsers?.map((f) => f.user_id) || [])];

      for (const userId of uniqueUserIds) {
        const { data: validation } = await supabase
          .from("monthly_finance_validations")
          .select("id, validated_at")
          .eq("user_id", userId)
          .eq("month", currentMonth)
          .limit(1);

        if (!validation || validation.length === 0 || !validation[0].validated_at) {
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("title", "💰 Validate your monthly finances")
            .gte("created_at", `${today}T00:00:00`)
            .limit(1);

          if (!existing || existing.length === 0) {
            notifications.push({
              user_id: userId,
              title: "💰 Validate your monthly finances",
              description: "Month-end is approaching. Confirm your income and expenses to keep your records accurate.",
              category: "progress",
              priority: "informational",
              icon_key: "Wallet",
              module_key: "finance",
            });
          }
        }
      }
    }

    // ─── 4. Streak At Risk (The Call) ────────────────────────
    // Users with active streaks who haven't checked in today
    if (now.getHours() >= 20) {
      const { data: pacts } = await supabase
        .from("pacts")
        .select("user_id, checkin_streak, last_checkin_date")
        .gt("checkin_streak", 0)
        .neq("last_checkin_date", today);

      if (pacts) {
        for (const pact of pacts) {
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", pact.user_id)
            .eq("title", "🔥 Your streak is at risk!")
            .gte("created_at", `${today}T00:00:00`)
            .limit(1);

          if (!existing || existing.length === 0) {
            notifications.push({
              user_id: pact.user_id,
              title: "🔥 Your streak is at risk!",
              description: `You have a ${pact.checkin_streak}-day streak. Don't break the chain — complete The Call today!`,
              category: "progress",
              priority: "important",
              icon_key: "Zap",
              module_key: "the-call",
            });
          }
        }
      }
    }

    // ─── 5. Todo Due Today ───────────────────────────────────
    const { data: dueTasks } = await supabase
      .from("todo_tasks")
      .select("user_id, name, deadline")
      .eq("status", "active")
      .eq("deadline", today);

    if (dueTasks) {
      // Group by user
      const tasksByUser = new Map<string, string[]>();
      for (const t of dueTasks) {
        if (!tasksByUser.has(t.user_id)) tasksByUser.set(t.user_id, []);
        tasksByUser.get(t.user_id)!.push(t.name);
      }

      for (const [userId, tasks] of tasksByUser) {
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .like("title", "📋 %task%due today%")
          .gte("created_at", `${today}T00:00:00`)
          .limit(1);

        if (!existing || existing.length === 0) {
          notifications.push({
            user_id: userId,
            title: `📋 ${tasks.length} task${tasks.length > 1 ? "s" : ""} due today`,
            description: tasks.slice(0, 3).join(", ") + (tasks.length > 3 ? ` and ${tasks.length - 3} more` : ""),
            category: "progress",
            priority: "informational",
            icon_key: "ListTodo",
            module_key: "todo-list",
          });
        }
      }
    }

    // ─── Insert all notifications ────────────────────────────
    if (notifications.length > 0) {
      // Respect notification settings
      for (const notif of notifications) {
        const { data: settings } = await supabase
          .from("notification_settings")
          .select("progress_enabled, focus_mode")
          .eq("user_id", notif.user_id)
          .maybeSingle();

        // Skip if user disabled this category or is in focus mode
        if (settings?.focus_mode) continue;
        if (notif.category === "progress" && settings?.progress_enabled === false) continue;

        await supabase.from("notifications").insert(notif);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: notifications.length,
        timestamp: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
