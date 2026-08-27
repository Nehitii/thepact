/* ═══════════════════════════════════════════════════════════════
   LE RELAIS DE MODÈLES

   M.I.A rendait « Je n'ai pas pu terminer : le modèle a refusé la suite
   (503) ». Un 503 ne veut pas dire que la demande était mauvaise : il
   veut dire que le modèle était surchargé À CET INSTANT. L'application
   faisait UN appel, à UN modèle, sans réessayer — donc une seconde
   d'indisponibilité côté fournisseur devenait un échec définitif côté
   utilisateur.

   Trois manques, pas un :

     1. AUCUN RÉESSAI. Une panne passagère n'était jamais retentée.
     2. AUCUN RELAIS. Un seul modèle : son quota était le quota de
        l'application entière, sa panne la panne de tout.
     3. AUCUNE DISTINCTION. 503 (« reviens dans un instant ») et 402
        (« ta clé n'a plus de crédit ») échouaient de la même façon,
        alors que le premier se rattrape et le second non.

   Ce fichier décide QUOI FAIRE de chaque échec. Il ne devine rien : la
   liste des modèles est une configuration, pas une constante du code —
   seul le porteur de la clé sait à quels modèles elle donne accès.

   ═══ POURQUOI LA CHAÎNE N'EST PAS ÉCRITE EN DUR ═══

   Le commentaire de `ai.ts` le rappelle : gemini-2.5-flash est fermé
   aux nouvelles clés. Écrire une chaîne de secours dans le code, c'est
   promettre des modèles qu'une clé donnée ne peut peut-être pas
   atteindre — et transformer un 503 rattrapable en 404 silencieux.

   Par défaut, la chaîne ne contient donc QUE le modèle courant : le
   comportement ne change pas, on gagne seulement les réessais. Le
   relais s'arme en posant un secret :

     supabase secrets set AI_CHAT_MODELS="gemini-3.5-flash,gemini-2.0-flash"

   Un modèle inconnu de la clé n'est pas fatal : la chaîne passe au
   suivant.
   ═══════════════════════════════════════════════════════════════ */

/** Ce qu'on fait d'un échec. */
export type Verdict = "reessayer" | "changer" | "abandonner";

/**
 * Traduit un code HTTP en conduite à tenir.
 *
 * « reessayer » — le même modèle, après une pause. La panne est du côté
 *   du fournisseur et ne dit rien de la demande.
 * « changer »   — un autre modèle, tout de suite. Soit ce modèle-là est
 *   saturé (son quota lui est propre), soit il ne connaît pas cette
 *   requête.
 * « abandonner » — la clé elle-même est en cause. Insister avec un autre
 *   modèle ne ferait que répéter le même refus, plus lentement.
 */
export function verdictDe(status: number): Verdict {
  if (status === 429) return "changer";                 // quota de CE modèle
  if (status === 408 || status === 425) return "reessayer";
  if (status >= 500) return "reessayer";                // 500, 502, 503, 504
  if (status === 400 || status === 404) return "changer"; // modèle inconnu, requête refusée par lui
  return "abandonner";                                   // 401, 402, 403 : la clé
}

/** La chaîne de modèles, du plus souhaité au dernier recours. */
export function chaineDeModeles(defaut: string, usage: "conversation" | "traitement" = "conversation"): string[] {
  const brut = usage === "traitement"
    ? (Deno.env.get("AI_CHAT_MODELS_TRAITEMENT") ?? Deno.env.get("AI_CHAT_MODELS"))
    : Deno.env.get("AI_CHAT_MODELS");

  const liste = (brut ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  return liste.length ? liste : [defaut];
}

/**
 * L'ordre réellement tenté.
 *
 * Un modèle demandé explicitement par l'appelant passe devant — c'est un
 * choix, pas une suggestion — mais il ne prive pas des recours : la
 * chaîne le suit, débarrassée du doublon.
 */
export function ordreDEssai(demande: string | null, chaine: string[]): string[] {
  if (!demande) return chaine;
  return [demande, ...chaine.filter((m) => m !== demande)];
}

/** Attente avant un réessai : courte, et croissante. */
export function pause(essai: number): Promise<void> {
  const ms = essai === 0 ? 250 : 900;
  return new Promise((r) => setTimeout(r, ms));
}
