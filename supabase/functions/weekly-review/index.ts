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
    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const wsStr = weekStart.toISOString().split("T")[0];
    const weStr = weekEnd.toISOString().split("T")[0];

    // 1. Goals progressed this week (steps completed this week)
    const { data: stepsData } = await supabase
      .from("steps")
      .select("id, goal_id, validated_at")
      .gte("validated_at", `${wsStr}T00:00:00`)
      .lte("validated_at", `${weStr}T23:59:59`);

    // Filter to user's goals via pacts
    const { data: userPacts } = await supabase
      .from("pacts")
      .select("id")
      .eq("user_id", user_id);
    const pactIds = (userPacts || []).map((p: any) => p.id);

    const { data: userGoals } = await supabase
      .from("goals")
      .select("id")
      .in("pact_id", pactIds);
    const goalIds = new Set((userGoals || []).map((g: any) => g.id));

    const userSteps = (stepsData || []).filter((s: any) => goalIds.has(s.goal_id));
    const stepsCompleted = userSteps.length;
    const goalsProgressed = new Set(userSteps.map((s: any) => s.goal_id)).size;

    // 2. Health average score
    const { data: healthData } = await supabase
      .from("health_data")
      .select("mood_level, sleep_quality, activity_level")
      .eq("user_id", user_id)
      .gte("entry_date", wsStr)
      .lte("entry_date", weStr);

    let healthAvg = null;
    if (healthData && healthData.length > 0) {
      const scores = healthData.map((h: any) => {
        const values = [h.mood_level, h.sleep_quality, h.activity_level].filter(Boolean);
        return values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : null;
      }).filter(Boolean);
      if (scores.length > 0) {
        healthAvg = Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10;
      }
    }

    // 3. Finance net (from recurring income/expenses)
    const { data: income } = await supabase
      .from("recurring_income")
      .select("amount")
      .eq("user_id", user_id)
      .eq("is_active", true);
    const { data: expenses } = await supabase
      .from("recurring_expenses")
      .select("amount")
      .eq("user_id", user_id)
      .eq("is_active", true);
    
    const totalIncome = (income || []).reduce((s: number, i: any) => s + Number(i.amount), 0);
    const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
    const financeNet = totalIncome - totalExpenses;

    // 4. Journal entries count
    const { count: journalCount } = await supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user_id)
      .gte("created_at", `${wsStr}T00:00:00`)
      .lte("created_at", `${weStr}T23:59:59`);

    // 5. Todo completed
    const { count: todoCount } = await supabase
      .from("todo_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user_id)
      .gte("completed_at", `${wsStr}T00:00:00`)
      .lte("completed_at", `${weStr}T23:59:59`);

    // 6. Generate AI insights
    let aiInsights = null;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      try {
        const prompt = `You are a concise personal coach for a productivity/life-management app called "The Pact". Based on this week's data, provide 2-3 brief actionable insights (max 150 words total). Be encouraging but direct.

This week's summary:
- Goals progressed: ${goalsProgressed} goals, ${stepsCompleted} steps completed
- Health average score: ${healthAvg !== null ? `${healthAvg}/10` : "No data"}
- Monthly finance net: ${financeNet >= 0 ? "+" : ""}${financeNet}
- Journal entries written: ${journalCount || 0}
- Tasks completed: ${todoCount || 0}

Give practical advice based on patterns you notice. Use short bullet points.`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are a concise personal development coach. Keep responses under 150 words." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          aiInsights = aiData.choices?.[0]?.message?.content || null;
        }
      } catch (e) {
        console.error("AI insights error:", e);
      }
    }

    // Upsert the review
    const { data: review, error } = await supabase
      .from("weekly_reviews")
      .upsert({
        user_id,
        week_start: wsStr,
        week_end: weStr,
        goals_progressed: goalsProgressed,
        steps_completed: stepsCompleted,
        health_avg_score: healthAvg,
        finance_net: financeNet,
        journal_entries_count: journalCount || 0,
        todo_completed: todoCount || 0,
        ai_insights: aiInsights,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,week_start" })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(review), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-review error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
