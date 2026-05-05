// Coach memory indexer.
// Embeds recent journal entries, reviews, and decisions into coach_embeddings.
// Can be invoked manually (per-user via JWT) or by cron (with service role).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMBED_MODEL = "openai/text-embedding-3-small";
const BATCH_SIZE = 16;

async function embed(texts: string[], aiKey: string): Promise<number[][]> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiKey}` },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`embed ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json.data ?? []).map((d: any) => d.embedding);
}

interface Item { source_type: string; source_id: string; content: string; metadata: any }

async function indexUser(supabase: any, userId: string, aiKey: string) {
  // Find latest indexed timestamps per source type
  const { data: latest } = await supabase
    .from("coach_embeddings")
    .select("source_type, source_id")
    .eq("user_id", userId);
  const seen = new Set<string>((latest ?? []).map((r: any) => `${r.source_type}:${r.source_id}`));

  const items: Item[] = [];

  // Journal entries
  const { data: journal } = await supabase
    .from("journal_entries")
    .select("id,title,content,mood,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  for (const j of journal ?? []) {
    if (seen.has(`journal:${j.id}`)) continue;
    items.push({
      source_type: "journal",
      source_id: j.id,
      content: `[Journal — ${j.mood}] ${j.title}\n${(j.content ?? "").slice(0, 1500)}`,
      metadata: { created_at: j.created_at, mood: j.mood },
    });
  }

  // Reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id,type,answers,mood,alignment_score,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  for (const r of reviews ?? []) {
    if (seen.has(`review:${r.id}`)) continue;
    const summary = Object.entries(r.answers ?? {})
      .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join("\n")
      .slice(0, 1500);
    if (!summary) continue;
    items.push({
      source_type: "review",
      source_id: r.id,
      content: `[Review ${r.type}] mood=${r.mood ?? "n/a"} align=${r.alignment_score ?? "n/a"}\n${summary}`,
      metadata: { type: r.type, created_at: r.created_at },
    });
  }

  // Decisions
  const { data: decisions } = await supabase
    .from("decisions")
    .select("id,title,context,hypothesis,outcome,lesson,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  for (const d of decisions ?? []) {
    if (seen.has(`decision:${d.id}`)) continue;
    items.push({
      source_type: "decision",
      source_id: d.id,
      content: `[Decision] ${d.title}\nContexte: ${d.context ?? ""}\nHypothèse: ${d.hypothesis ?? ""}\nRésultat: ${d.outcome ?? ""}\nLeçon: ${d.lesson ?? ""}`.slice(0, 1500),
      metadata: { created_at: d.created_at },
    });
  }

  if (!items.length) return { indexed: 0 };

  let inserted = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const vectors = await embed(batch.map((b) => b.content), aiKey);
    const rows = batch.map((b, idx) => ({
      user_id: userId,
      source_type: b.source_type,
      source_id: b.source_id,
      content: b.content,
      embedding: vectors[idx] as any,
      metadata: b.metadata,
    }));
    const { error } = await supabase.from("coach_embeddings").insert(rows);
    if (error) throw error;
    inserted += rows.length;
  }
  return { indexed: inserted };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cronSecret = Deno.env.get("CRON_SECRET");
    const headerSecret = req.headers.get("x-cron-secret");
    const isCron = !!cronSecret && headerSecret === cronSecret;

    if (isCron) {
      // Cron mode: index all users
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: users } = await admin
        .from("profiles")
        .select("id")
        .limit(500);
      let total = 0;
      for (const u of users ?? []) {
        try {
          const r = await indexUser(admin, u.id, aiKey);
          total += r.indexed;
        } catch (e) {
          console.error("user index failed", u.id, e);
        }
      }
      return new Response(JSON.stringify({ ok: true, total_indexed: total, users: users?.length ?? 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-user mode: require JWT
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
    const { data: userData, error: ue } = await supabase.auth.getUser();
    if (ue || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = await indexUser(supabase, userData.user.id, aiKey);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});