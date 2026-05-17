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
Avant de répondre à une question factuelle sur la vie de l'utilisateur (goals, habits, finance, journal, valeurs, mémoire), appelle les tools pour récupérer la donnée à jour. Sinon, réponds directement.
Format: markdown léger autorisé (titres ##, listes, gras). Quand tu cites un souvenir issu de la mémoire long-terme, mentionne la source en fin de phrase entre parenthèses.
Pour créer un goal/habit, demande d'abord à quel pacte le rattacher si l'utilisateur n'a pas précisé (utilise list_pacts).`;

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
  {
    type: "function",
    function: {
      name: "create_todo",
      description: "Crée une tâche todo pour l'utilisateur. Utiliser uniquement si le user demande explicitement d'ajouter une tâche.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Intitulé de la tâche (max 200 chars)" },
          deadline: { type: "string", description: "Date ISO (YYYY-MM-DD) optionnelle" },
          priority: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
          is_urgent: { type: "boolean", default: false },
          category: { type: "string", default: "general" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_journal_entry",
      description: "Ajoute une entrée de journal. Réservé aux moments où le user demande explicitement de noter une réflexion.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          mood: { type: "string", description: "ex: reflective, joyful, anxious, focused" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_decision",
      description: "Enregistre une décision dans le Decision Log (contexte + hypothèse + confiance).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          context: { type: "string" },
          hypothesis: { type: "string" },
          decision_text: { type: "string", description: "La décision prise" },
          expected_outcome: { type: "string" },
          confidence: { type: "number", description: "1-5" },
          review_at: { type: "string", description: "Date ISO de revue future" },
          reversibility: { type: "string", enum: ["reversible", "hard_to_reverse", "irreversible"] },
        },
        required: ["title", "decision_text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_pacts",
      description: "Liste les pactes du user (id, nom, mantra, couleur). Utile avant create_goal pour choisir le pact_id.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_life_areas",
      description: "Liste les domaines de vie du user (id, nom, poids, couleur). Utile avant create_goal pour rattacher un domaine.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_goal",
      description: "Crée un nouveau goal (mission classique, pas une habitude). Demande pact_id (via list_pacts si inconnu).",
      parameters: {
        type: "object",
        properties: {
          pact_id: { type: "string", description: "UUID du pacte parent" },
          name: { type: "string", description: "Nom du goal (max 200 chars)" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard", "extreme", "epic", "ultimate"], default: "medium" },
          total_steps: { type: "number", description: "Nombre d'étapes prévues (>= 1)", default: 1 },
          deadline: { type: "string", description: "Date ISO YYYY-MM-DD optionnelle" },
          notes: { type: "string", description: "Description / contexte optionnel" },
          life_area_id: { type: "string", description: "UUID du domaine de vie optionnel" },
        },
        required: ["pact_id", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_habit_goal",
      description: "Crée une habitude (goal de type 'habit') avec une durée en jours. Demande pact_id (via list_pacts).",
      parameters: {
        type: "object",
        properties: {
          pact_id: { type: "string" },
          name: { type: "string" },
          habit_duration_days: { type: "number", description: "Durée en jours (7-365)", default: 21 },
          difficulty: { type: "string", enum: ["easy", "medium", "hard", "extreme", "epic", "ultimate"], default: "medium" },
          life_area_id: { type: "string" },
        },
        required: ["pact_id", "name"],
      },
    },
  },
];

interface ToolReceipt {
  citations?: Array<{ source_type: string; source_id: string; snippet: string; similarity?: number }>;
  action?: { tool: string; status: "ok" | "error"; label: string; ref_id?: string; ref_type?: string; error?: string };
}

async function runTool(
  name: string,
  args: any,
  supabase: any,
  userId: string,
  aiKey: string,
  receipts: ToolReceipt,
): Promise<string> {
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
      const rows = (data ?? []) as Array<any>;
      receipts.citations = (receipts.citations ?? []).concat(
        rows.map((r) => ({
          source_type: r.source_type,
          source_id: r.source_id,
          snippet: String(r.content ?? "").slice(0, 220),
          similarity: typeof r.similarity === "number" ? r.similarity : undefined,
        })),
      );
      return JSON.stringify(rows);
    }
    if (name === "list_pacts") {
      const { data } = await supabase
        .from("pacts")
        .select("id,name,mantra,color,symbol")
        .eq("user_id", userId)
        .order("created_at");
      return JSON.stringify(data ?? []);
    }
    if (name === "list_life_areas") {
      const { data } = await supabase
        .from("life_areas")
        .select("id,name,weight,color,icon")
        .eq("user_id", userId)
        .order("sort_order");
      return JSON.stringify(data ?? []);
    }
    if (name === "create_goal") {
      const pact_id = String(args?.pact_id ?? "").trim();
      const nm = String(args?.name ?? "").trim().slice(0, 200);
      if (!pact_id || !nm) return JSON.stringify({ error: "pact_id_and_name_required" });
      // Verify pact belongs to user
      const { data: pact } = await supabase.from("pacts").select("id").eq("id", pact_id).eq("user_id", userId).maybeSingle();
      if (!pact) return JSON.stringify({ error: "pact_not_found" });
      const totalSteps = Math.max(1, Math.min(50, Number(args?.total_steps ?? 1)));
      const payload: any = {
        pact_id,
        name: nm,
        difficulty: args?.difficulty ?? "medium",
        goal_type: "normal",
        total_steps: totalSteps,
        notes: args?.notes ?? null,
        deadline: args?.deadline ?? null,
        life_area_id: args?.life_area_id ?? null,
      };
      const { data, error } = await supabase.from("goals").insert(payload).select("id,name").single();
      if (error) {
        receipts.action = { tool: "create_goal", status: "error", label: nm, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_goal", status: "ok", label: data.name, ref_id: data.id, ref_type: "goal" };
      return JSON.stringify({ ok: true, goal: data });
    }
    if (name === "create_habit_goal") {
      const pact_id = String(args?.pact_id ?? "").trim();
      const nm = String(args?.name ?? "").trim().slice(0, 200);
      if (!pact_id || !nm) return JSON.stringify({ error: "pact_id_and_name_required" });
      const { data: pact } = await supabase.from("pacts").select("id").eq("id", pact_id).eq("user_id", userId).maybeSingle();
      if (!pact) return JSON.stringify({ error: "pact_not_found" });
      const days = Math.max(7, Math.min(365, Number(args?.habit_duration_days ?? 21)));
      const payload: any = {
        pact_id,
        name: nm,
        goal_type: "habit",
        difficulty: args?.difficulty ?? "medium",
        habit_duration_days: days,
        habit_checks: Array(days).fill(false),
        total_steps: days,
        life_area_id: args?.life_area_id ?? null,
      };
      const { data, error } = await supabase.from("goals").insert(payload).select("id,name").single();
      if (error) {
        receipts.action = { tool: "create_habit_goal", status: "error", label: nm, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_habit_goal", status: "ok", label: data.name, ref_id: data.id, ref_type: "goal" };
      return JSON.stringify({ ok: true, habit: data });
    }
    if (name === "create_todo") {
      const nm = String(args?.name ?? "").trim().slice(0, 200);
      if (!nm) return JSON.stringify({ error: "name_required" });
      const { data, error } = await supabase.from("todo_tasks").insert({
        user_id: userId,
        name: nm,
        deadline: args?.deadline ?? null,
        priority: args?.priority ?? "medium",
        is_urgent: !!args?.is_urgent,
        category: args?.category ?? "general",
        task_type: "flexible",
      }).select("id,name").single();
      if (error) {
        receipts.action = { tool: "create_todo", status: "error", label: nm, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_todo", status: "ok", label: data.name, ref_id: data.id, ref_type: "todo" };
      return JSON.stringify({ ok: true, todo: data });
    }
    if (name === "create_journal_entry") {
      const title = String(args?.title ?? "").trim().slice(0, 200);
      const content = String(args?.content ?? "").trim();
      if (!title || !content) return JSON.stringify({ error: "title_and_content_required" });
      const payload: any = { user_id: userId, title, content };
      if (typeof args?.mood === "string" && args.mood.trim()) payload.mood = args.mood.trim();
      const { data, error } = await supabase.from("journal_entries").insert(payload).select("id,title").single();
      if (error) {
        receipts.action = { tool: "create_journal_entry", status: "error", label: title, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_journal_entry", status: "ok", label: data.title, ref_id: data.id, ref_type: "journal" };
      return JSON.stringify({ ok: true, entry: data });
    }
    if (name === "create_decision") {
      const title = String(args?.title ?? "").trim().slice(0, 200);
      const decision_text = String(args?.decision_text ?? "").trim();
      if (!title || !decision_text) return JSON.stringify({ error: "title_and_decision_required" });
      const payload: any = {
        user_id: userId,
        title,
        decision_text,
        context: args?.context ?? null,
        hypothesis: args?.hypothesis ?? null,
        expected_outcome: args?.expected_outcome ?? null,
        confidence: typeof args?.confidence === "number" ? args.confidence : null,
        review_at: args?.review_at ?? null,
        reversibility: args?.reversibility ?? null,
      };
      const { data, error } = await supabase.from("decisions").insert(payload).select("id,title").single();
      if (error) {
        receipts.action = { tool: "create_decision", status: "error", label: title, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_decision", status: "ok", label: data.title, ref_id: data.id, ref_type: "decision" };
      return JSON.stringify({ ok: true, decision: data });
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

    // Tool loop (max 4 hops) — non-streaming for tool resolution, then stream final.
    const workMessages: any[] = [...messages];
    const aggregatedCitations: ToolReceipt["citations"] = [];
    const aggregatedActions: NonNullable<ToolReceipt["action"]>[] = [];
    for (let hop = 0; hop < 4; hop++) {
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
        const receipts: ToolReceipt = {};
        const result = await runTool(c.function?.name, parsedArgs, supabase, userId, aiKey, receipts);
        if (receipts.citations?.length) aggregatedCitations.push(...receipts.citations);
        if (receipts.action) aggregatedActions.push(receipts.action);
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
          // Build metadata payload (dedupe citations by source_id)
          const seen = new Set<string>();
          const citations = aggregatedCitations.filter((c) => {
            const key = `${c.source_type}:${c.source_id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          const metadata =
            citations.length || aggregatedActions.length
              ? { citations, actions: aggregatedActions }
              : null;
          // Persist assistant final
          await supabase.from("coach_messages").insert({
            conversation_id: body.conversation_id,
            user_id: userId,
            role: "assistant",
            content: fullText,
            model,
            metadata,
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