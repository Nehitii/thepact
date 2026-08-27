import { chaineDeModeles, ordreDEssai, pause, verdictDe } from "./relais.ts";

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
//   AI_CHAT_MODEL     optional, defaults to gemini-3.5-flash
//   AI_CHAT_MODELS    optional, comma-separated relay chain (see relais.ts)
//   AI_CHAT_MODELS_TRAITEMENT  optional, chain for batch work
//   AI_EMBEDDING_URL  optional, defaults to the Gemini native embed endpoint

const GATEWAY_URL =
  Deno.env.get("AI_GATEWAY_URL") ?? "https://generativelanguage.googleapis.com/v1beta/openai";
const EMBEDDING_BASE =
  Deno.env.get("AI_EMBEDDING_URL") ?? "https://generativelanguage.googleapis.com/v1beta/models";

// gemini-2.5-flash est ferme aux nouvelles cles et s'arrete le 16/10/2026.
// On vise un modele stable et epingle : l'alias gemini-flash-latest changerait
// de comportement et de tarif sans prevenir.
// Surchargeable a chaud via le secret AI_CHAT_MODEL, sans redeploiement.
export const DEFAULT_CHAT_MODEL = Deno.env.get("AI_CHAT_MODEL") ?? "gemini-3.5-flash";
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

/** Un seul aller-retour, sans jugement sur ce qu'il rend. */
function unAppel(body: Record<string, unknown>, apiKey: string, modele: string): Promise<Response> {
  return fetch(`${GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ ...body, model: modele }),
  });
}

export interface OptionsAppel {
  /** « traitement » pour le travail de fond, qui peut viser une autre chaîne. */
  usage?: "conversation" | "traitement";
  /** Plafond d'aller-retours, tous modèles confondus. */
  essaisMax?: number;
}

/**
 * POST to the chat-completions endpoint. Returns the raw Response so callers
 * keep control over streaming vs. buffered reads.
 *
 * ═══ CE QUI A CHANGÉ, ET POURQUOI ═══
 *
 * Cette fonction faisait UN appel et rendait ce qui venait. Un 503 —
 * « modèle surchargé, reviens dans un instant » — remontait donc
 * jusqu'à l'écran sous la forme « Je n'ai pas pu terminer ». Une
 * seconde d'indisponibilité chez le fournisseur devenait un échec
 * définitif pour l'utilisateur.
 *
 * Elle réessaie maintenant, et sait passer à un autre modèle. La
 * conduite à tenir par code HTTP est dans `relais.ts` : elle y est
 * séparée du transport, parce que c'est la seule partie qui demande
 * un jugement.
 *
 * TROIS PRÉCAUTIONS :
 *
 * — LE CORPS D'UNE RÉPONSE ÉCARTÉE EST ANNULÉ. Sans quoi chaque essai
 *   raté laisserait un flux ouvert derrière lui.
 * — UNE PANNE RÉSEAU COMPTE COMME UN 503. `fetch` lève au lieu de
 *   rendre un statut ; ne pas la traiter reviendrait à ne pas
 *   réessayer précisément quand le réseau vacille.
 * — LA DERNIÈRE RÉPONSE EST RENDUE TELLE QUELLE, même en échec :
 *   l'appelant garde son code d'erreur et son message. On ne masque
 *   pas un échec réel derrière un échec inventé.
 */
export async function chatCompletion(
  body: Record<string, unknown>,
  apiKey: string,
  options: OptionsAppel = {},
): Promise<Response> {
  const demande = (body.model as string | undefined) ? normalizeModel(body.model as string) : null;
  const modeles = ordreDEssai(demande, chaineDeModeles(DEFAULT_CHAT_MODEL, options.usage));
  const essaisMax = options.essaisMax ?? 4;

  let derniere: Response | null = null;
  let derniereErreur: unknown = null;
  let essais = 0;

  for (let i = 0; i < modeles.length && essais < essaisMax; i++) {
    const modele = modeles[i];
    /* Deux passages au plus sur un même modèle : au-delà, c'est le
       modèle suivant qui a le plus de chances de répondre. */
    for (let coup = 0; coup < 2 && essais < essaisMax; coup++) {
      essais++;
      let res: Response;
      try {
        res = await unAppel(body, apiKey, modele);
      } catch (e) {
        derniereErreur = e;
        if (coup === 0 && essais < essaisMax) { await pause(coup); continue; }
        break;
      }

      if (res.ok) {
        /* L'échec qui précédait ce succès a laissé un flux ouvert.
           Le refermer ici et pas seulement dans la boucle : c'est
           précisément le cas « 503 puis 200 », le plus fréquent. */
        if (derniere) await derniere.body?.cancel().catch(() => {});
        if (i > 0 || coup > 0) {
          console.log(`[ai] relayé sur « ${modele} » après ${essais} essai(s)`);
        }
        return res;
      }

      const verdict = verdictDe(res.status);
      console.warn(`[ai] ${modele} → ${res.status} (${verdict})`);

      /* On garde la réponse pour l'appelant, mais on referme celle
         qu'on abandonne — sauf la toute dernière, qu'il lira. */
      if (derniere) await derniere.body?.cancel().catch(() => {});
      derniere = res;

      if (verdict === "abandonner") return res;
      if (verdict === "changer") break;
      if (essais < essaisMax) await pause(coup);
    }
  }

  if (derniere) return derniere;
  /* Aucune réponse du tout : le réseau n'a jamais répondu. On fabrique
     un 503, qui est exactement ce que ça veut dire. */
  console.error("[ai] aucun modèle n'a répondu", derniereErreur);
  return new Response(JSON.stringify({ error: "upstream_injoignable" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
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

/**
 * Traduit un échec du fournisseur en phrase lisible.
 *
 * Le message dit ce que la personne peut FAIRE. « Erreur du service
 * IA » ne disait rien : ni si ça revient, ni s'il faut attendre, ni
 * s'il faut prévenir quelqu'un. Ces trois cas-là n'appellent pas la
 * même conduite.
 */
export function upstreamErrorMessage(status: number): string {
  if (status === 429) return "Limite atteinte, réessaie dans un instant.";
  if (status === 402 || status === 403) return "Quota IA épuisé. Vérifie la clé API du serveur.";
  if (status === 401) return "La clé du service IA est refusée. Elle a dû être révoquée.";
  if (status >= 500) {
    return "Les modèles sont saturés — j'ai réessayé sans succès. Retente dans un instant.";
  }
  return "Erreur du service IA.";
}
