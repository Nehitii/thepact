// Central AI provider configuration for every Edge Function.
//
// Chat goes through an OpenAI-compatible endpoint, so swapping providers is a
// URL + key change. Embeddings go through the Gemini native endpoint instead:
// the OpenAI-compatibility layer does not expose an output-dimension control,
// and we need exactly 1536 dims to match the vector(1536) columns.
//
// Secrets (supabase secrets set NAME=value):
//   AI_API_KEY        required
//   AI_GATEWAY_URL    optional, defaults to the Gemini OpenAI-compatible layer
//   AI_CHAT_MODEL     optional, defaults to gemini-2.5-flash
//   AI_EMBEDDING_URL  optional, defaults to the Gemini native embed endpoint

const GATEWAY_URL =
  Deno.env.get("AI_GATEWAY_URL") ?? "https://generativelanguage.googleapis.com/v1beta/openai";
const EMBEDDING_BASE =
  Deno.env.get("AI_EMBEDDING_URL") ?? "https://generativelanguage.googleapis.com/v1beta/models";

export const DEFAULT_CHAT_MODEL = Deno.env.get("AI_CHAT_MODEL") ?? "gemini-2.5-flash";
export const EMBEDDING_MODEL = Deno.env.get("AI_EMBEDDING_MODEL") ?? "gemini-embedding-001";

// Must stay in sync with the vector(1536) columns in coach_embeddings.
export const EMBEDDING_DIMENSIONS = 1536;

export function getAiKey(): string | null {
  return Deno.env.get("AI_API_KEY") ?? null;
}

// Historic model ids carried a provider prefix ("google/gemini-2.5-flash") because
// the old gateway multiplexed providers. Clients may still send those, so strip it.
export function normalizeModel(model?: string | null): string {
  const raw = (model ?? "").trim();
  if (!raw) return DEFAULT_CHAT_MODEL;
  const slash = raw.indexOf("/");
  return slash === -1 ? raw : raw.slice(slash + 1);
}

/**
 * POST to the chat-completions endpoint. Returns the raw Response so callers
 * keep control over streaming vs. buffered reads.
 */
export function chatCompletion(
  body: Record<string, unknown>,
  apiKey: string,
): Promise<Response> {
  const payload = { ...body, model: normalizeModel(body.model as string | undefined) };
  return fetch(`${GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
  });
}

/** L2-normalize. gemini-embedding-001 does not normalize truncated dimensions itself. */
function normalize(vector: number[]): number[] {
  let sum = 0;
  for (const v of vector) sum += v * v;
  const norm = Math.sqrt(sum);
  return norm > 0 ? vector.map((v) => v / norm) : vector;
}

export type EmbeddingTask = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

/**
 * Embed several strings in one round-trip. Throws on failure so batch callers
 * can abort a whole indexing run rather than persist half of it.
 *
 * taskType steers the asymmetric query/document embedding spaces: use
 * RETRIEVAL_QUERY for a search query, RETRIEVAL_DOCUMENT for content to store.
 */
export async function embedBatch(
  inputs: string[],
  apiKey: string,
  taskType: EmbeddingTask = "RETRIEVAL_DOCUMENT",
): Promise<number[][]> {
  if (!inputs.length) return [];
  const res = await fetch(
    `${EMBEDDING_BASE}/${EMBEDDING_MODEL}:batchEmbedContents?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: inputs.map((text) => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
          taskType,
        })),
      }),
    },
  );
  if (!res.ok) throw new Error(`embed ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const embeddings = json?.embeddings;
  if (!Array.isArray(embeddings) || embeddings.length !== inputs.length) {
    throw new Error(`embed: expected ${inputs.length} vectors, got ${embeddings?.length}`);
  }
  return embeddings.map((e: { values?: number[] }, i: number) => {
    const values = e?.values;
    if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`embed: vector ${i} has ${values?.length} dims, expected ${EMBEDDING_DIMENSIONS}`);
    }
    return normalize(values);
  });
}

/**
 * Embed a single string into a unit-length 1536-dim vector.
 * Returns null on any failure — callers decide whether that is fatal.
 */
export async function embed(
  input: string,
  apiKey: string,
  taskType: EmbeddingTask = "RETRIEVAL_DOCUMENT",
): Promise<number[] | null> {
  try {
    const [vector] = await embedBatch([input], apiKey, taskType);
    return vector ?? null;
  } catch (e) {
    console.error("[ai:embed] failed", e);
    return null;
  }
}

/** Maps an upstream failure to a user-facing message, in French like the rest of the app. */
export function upstreamErrorMessage(status: number): string {
  if (status === 429) return "Limite atteinte, réessaie dans un instant.";
  if (status === 402 || status === 403) return "Quota IA épuisé. Vérifie la clé API du serveur.";
  return "Erreur du service IA.";
}
