// AI Coach — streaming chat via Lovable AI Gateway (no API key required).
// Persists user + assistant messages in coach_messages, supports tool calls.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es Pacte Coach, un coach personnel exigeant et bienveillant intégré à l'OS Pacte de l'utilisateur.
Tu tutoies. Tu es concis, direct, structuré. Tu cites des données concrètes du user (goals, habits, finance, journal) quand pertinent.
Tu ne donnes jamais de conseil médical/légal/financier réglementé sans rappel de prudence.
Quand l'utilisateur le demande, propose des actions actionnables et utilise les outils disponibles.
Avant de répondre à une question factuelle sur la vie de l'utilisateur (goals, habits, finance, journal, valeurs, mémoire), appelle les tools pour récupérer la donnée à jour. Sinon, réponds directement.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_active_goals",
      description: "Liste les goals actifs de l'utilisateur (max 20). Retourne id, nom, difficulté, progression.",
      parameters: { type: "object", properties: { limit: { type: "number", default: 20 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_habits",
      description: "Liste les complétions d'habitudes des 14 derniers jours.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_transactions",
      description: "Liste les 30 dernières transactions financières (date, libellé, montant, type, catégorie).",
      parameters: { type: "object", properties: { limit: { type: "number", default: 30 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_journal",
      description: "Liste les 10 dernières entrées de journal (titre, mood, extrait).",
      parameters: { type: "object", properties: { limit: { type: "number", default: 10 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "list_user_values",
      description: "Récupère les valeurs et domaines de vie de l'utilisateur.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_memory",
      description: "Recherche sémantique dans la mémoire long-terme du user (journal, reviews, decisions indexés).",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
];

async function runTool(name: string, args: any, supabase: any, userId: string, aiKey: string): Promise<string> {
  try {
    if (name === "list_active_goals") {
      const { data: pacts } = await supabase.from("pacts").select("id").eq("user_id", userId);
      const ids = (pacts ?? []).map((p: any) => p.id);
      if (!ids.length) return JSON.stringify([]);
      const { data } = await supabase
        .from("goals")
        .select("id,name,difficulty,status,validated_steps,total_steps,deadline,is_focus")
        .in("pact_id", ids)
        .eq("status", "active")
        .limit(args?.limit ?? 20);
      return JSON.stringify(data ?? []);
    }
    if (name === "list_recent_habits") {
      const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("habit_logs")
        .select("goal_id,log_date,completed,streak_count")
        .eq("user_id", userId)
        .gte("log_date", since)
        .order("log_date", { ascending: false })
        .limit(200);
      return JSON.stringify(data ?? []);
    }
    if (name === "list_recent_transactions") {
      const { data } = await supabase
        .from("bank_transactions")
        .select("transaction_date,description,amount,transaction_type,category")
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false })
        .limit(args?.limit ?? 30);
      return JSON.stringify(data ?? []);
    }
    if (name === "list_recent_journal") {
      const { data } = await supabase
        .from("journal_entries")
        .select("title,mood,content,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(args?.limit ?? 10);
      const trimmed = (data ?? []).map((e: any) => ({
        ...e,
        content: (e.content ?? "").slice(0, 400),
      }));
      return JSON.stringify(trimmed);
    }
    if (name === "list_user_values") {
      const [{ data: values }, { data: areas }] = await Promise.all([
        supabase.from("user_values").select("label,rank,statement").eq("user_id", userId).order("rank"),
        supabase.from("life_areas").select("name,weight,color").eq("user_id", userId),
      ]);
      return JSON.stringify({ values: values ?? [], life_areas: areas ?? [] });
    }
    if (name === "search_memory") {
      const query = String(args?.query ?? "").trim();
      if (!query) return JSON.stringify([]);
      // Embed the query
      const embRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiKey}` },
        body: JSON.stringify({ model: "openai/text-embedding-3-small", input: query }),
      });
      if (!embRes.ok) return JSON.stringify({ error: "embed_failed" });
      const embJson = await embRes.json();
      const vector = embJson?.data?.[0]?.embedding;
      if (!vector) return JSON.stringify([]);
      const { data } = await supabase.rpc("match_coach_memory", {
        _query: vector,
        _match_count: 6,
      });
      return JSON.stringify(data ?? []);
    }
    return JSON.stringify({ error: "unknown_tool" });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
}

interface ChatBody {
  conversation_id: string;
  message: string;
  model?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = (await req.json()) as ChatBody;
    if (!body?.conversation_id || !body?.message?.trim()) {
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const model = body.model ?? "google/gemini-2.5-flash";

    // Persist user message
    await supabase.from("coach_messages").insert({
      conversation_id: body.conversation_id,
      user_id: userId,
      role: "user",
      content: body.message,
    });

    // Load last 20 messages
    const { data: history } = await supabase
      .from("coach_messages")
      .select("role, content")
      .eq("conversation_id", body.conversation_id)
      .order("created_at", { ascending: true })
      .limit(40);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...((history ?? []).map((m: any) => ({ role: m.role, content: m.content }))),
    ];

    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tool loop (max 3 hops) — non-streaming for tool resolution, then stream final.
    const workMessages: any[] = [...messages];
    for (let hop = 0; hop < 3; hop++) {
      const probe = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiKey}` },
        body: JSON.stringify({ model, messages: workMessages, tools: TOOLS, tool_choice: "auto" }),
      });
      if (!probe.ok) break;
      const probeJson = await probe.json();
      const msg = probeJson?.choices?.[0]?.message;
      const calls = msg?.tool_calls;
      if (!calls || !calls.length) break;
      workMessages.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
      for (const c of calls) {
        let parsedArgs: any = {};
        try { parsedArgs = JSON.parse(c.function?.arguments ?? "{}"); } catch (_) { /* ignore */ }
        const result = await runTool(c.function?.name, parsedArgs, supabase, userId, aiKey);
        workMessages.push({ role: "tool", tool_call_id: c.id, content: result });
      }
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiKey}`,
      },
      body: JSON.stringify({ model, messages: workMessages, stream: true }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Limite atteinte, réessaie dans un instant." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Recharge ton workspace Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: errText || "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tee the stream: forward to client AND buffer to persist
    let fullText = "";
    const decoder = new TextDecoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const encoder = new TextEncoder();
        let leftover = "";
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = leftover + decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            leftover = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) fullText += delta;
              } catch (_) { /* ignore */ }
            }
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
          // Persist assistant final
          await supabase.from("coach_messages").insert({
            conversation_id: body.conversation_id,
            user_id: userId,
            role: "assistant",
            content: fullText,
            model,
          });
          await supabase
            .from("coach_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", body.conversation_id);
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});