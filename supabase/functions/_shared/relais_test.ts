/* ═══════════════════════════════════════════════════════════════
   CE QUE CE TEST PROUVE

   Le relais est du code qui ne s'exécute QUE quand le fournisseur va
   mal — c'est-à-dire jamais pendant qu'on le développe. Sans banc
   d'essai, on ne saurait qu'il est cassé qu'au prochain 503, sur
   l'écran de quelqu'un.

   On remplace donc `fetch` par un guichet qui rend les codes qu'on lui
   dicte, et on compte ce qui a réellement été demandé.

   À lancer :  deno test --allow-env supabase/functions/_shared/relais_test.ts
   ═══════════════════════════════════════════════════════════════ */

import { assertEquals } from "jsr:@std/assert@1";
import { ordreDEssai, verdictDe } from "./relais.ts";
import { chatCompletion } from "./ai.ts";

/** Remplace `fetch` par une suite de statuts dictée d'avance. */
function guichet(statuts: number[]) {
  const demandes: string[] = [];
  const corpsLus: boolean[] = [];
  const vrai = globalThis.fetch;

  globalThis.fetch = ((_url: string | URL | Request, init?: RequestInit) => {
    const modele = JSON.parse(String(init?.body)).model as string;
    demandes.push(modele);
    const statut = statuts[demandes.length - 1] ?? 500;
    const i = corpsLus.length;
    corpsLus.push(false);
    /* Un flux qui note s'il a été refermé : c'est ce qu'on veut vérifier
       des réponses écartées. */
    const body = new ReadableStream({
      start(c) { c.enqueue(new TextEncoder().encode("{}")); c.close(); },
      cancel() { corpsLus[i] = true; },
    });
    return Promise.resolve(new Response(body, { status: statut }));
  }) as typeof fetch;

  return { demandes, corpsLus, rendre: () => { globalThis.fetch = vrai; } };
}

Deno.test("un 503 passager n'est plus un échec définitif", async () => {
  Deno.env.set("AI_CHAT_MODELS", "");
  const g = guichet([503, 200]);
  const res = await chatCompletion({ messages: [] }, "clé");
  g.rendre();
  assertEquals(res.status, 200);
  assertEquals(g.demandes.length, 2, "il faut avoir réessayé");
  assertEquals(g.demandes[0], g.demandes[1], "le même modèle, pas un autre");
  assertEquals(g.corpsLus[0], true, "le flux du 503 doit être refermé");
  await res.body?.cancel();
});

Deno.test("un 429 passe au modèle suivant sans s'acharner", async () => {
  Deno.env.set("AI_CHAT_MODELS", "alpha,beta");
  const g = guichet([429, 200]);
  const res = await chatCompletion({ messages: [] }, "clé");
  g.rendre();
  assertEquals(res.status, 200);
  assertEquals(g.demandes, ["alpha", "beta"], "quota d'alpha → beta, tout de suite");
  await res.body?.cancel();
});

Deno.test("un 402 arrête tout : c'est la clé, pas le modèle", async () => {
  Deno.env.set("AI_CHAT_MODELS", "alpha,beta,gamma");
  const g = guichet([402, 200, 200]);
  const res = await chatCompletion({ messages: [] }, "clé");
  g.rendre();
  assertEquals(res.status, 402);
  assertEquals(g.demandes, ["alpha"], "insister avec beta répéterait le même refus");
  await res.body?.cancel();
});

Deno.test("toute la chaîne saturée : l'appelant reçoit le vrai échec", async () => {
  Deno.env.set("AI_CHAT_MODELS", "alpha,beta");
  const g = guichet([503, 503, 503, 503]);
  const res = await chatCompletion({ messages: [] }, "clé");
  g.rendre();
  assertEquals(res.status, 503, "on ne masque pas un échec réel");
  assertEquals(g.demandes, ["alpha", "alpha", "beta", "beta"]);
  assertEquals(g.corpsLus.slice(0, 3), [true, true, true], "seul le dernier flux reste ouvert");
  await res.body?.cancel();
});

Deno.test("le plafond d'essais est tenu", async () => {
  Deno.env.set("AI_CHAT_MODELS", "a,b,c,d,e,f");
  const g = guichet(new Array(20).fill(503));
  const res = await chatCompletion({ messages: [] }, "clé", { essaisMax: 3 });
  g.rendre();
  assertEquals(g.demandes.length, 3);
  await res.body?.cancel();
});

Deno.test("le modèle demandé passe devant, sans priver des recours", () => {
  assertEquals(ordreDEssai("beta", ["alpha", "beta"]), ["beta", "alpha"]);
  assertEquals(ordreDEssai(null, ["alpha", "beta"]), ["alpha", "beta"]);
});

Deno.test("chaque code a une conduite, et une seule", () => {
  assertEquals(verdictDe(503), "reessayer");
  assertEquals(verdictDe(500), "reessayer");
  assertEquals(verdictDe(429), "changer");
  assertEquals(verdictDe(404), "changer");
  assertEquals(verdictDe(401), "abandonner");
  assertEquals(verdictDe(402), "abandonner");
});
