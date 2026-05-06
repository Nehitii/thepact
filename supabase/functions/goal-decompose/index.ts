// goal-decompose — Suggests steps + supporting habits for a goal description, via Lovable AI Gateway.
// Returns structured JSON via tool calling. No DB writes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOOL = {
  type: "function",
  function: {
    name: "decompose_goal",
    description: "Décompose un objectif en étapes concrètes et habitudes de soutien.",
    parameters: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          description: "5-10 étapes concrètes ordonnées",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              estimated_days: { type: "number" },
            },
            required: ["title"],
          },
        },
        habits: {
          type: "array",
          description: "1-3 habitudes quotidiennes/hebdo qui soutiennent le goal",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              cadence: { type: "string", enum: ["daily", "weekly"] },
            },
            required: ["name", "cadence"],
          },
        },
        rationale: { type: "string", description: "Explication courte (2 phrases) du découpage" },
      },
      required: ["steps", "habits", "rationale"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: u, error: ue } = await supabase.auth.getUser();
    if (ue || !u.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, description, deadline, difficulty } = await req.json();
    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sys = `Tu es un coach de productivité. Décompose les objectifs en étapes claires (5-10) et 1-3 habitudes de soutien réalistes. Tutoie. Réponds en français.`;
    const userMsg = `Objectif: ${name}\nDescription: ${description ?? "—"}\nDeadline: ${deadline ?? "—"}\nDifficulté: ${difficulty ?? "—"}\nDécompose-le.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "decompose_goal" } },
      }),
    });
    if (!res.ok) {
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit, réessaie plus tard." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: await res.text() }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await res.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = null;
    try { parsed = JSON.parse(call?.function?.arguments ?? "{}"); } catch (_) { /* ignore */ }
    if (!parsed?.steps) {
      return new Response(JSON.stringify({ error: "no_decomposition" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});