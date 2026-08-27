/**
 * CE QU'UNE FONCTION SQL RÉPOND QUAND ELLE REND UN COMPTE-RENDU.
 *
 * Plusieurs fonctions de la base renvoient un `jsonb` de la forme
 * `{ success: false, error: "…" }` plutôt que de lever : le refus est une
 * réponse, pas une panne. Côté client, ce jsonb arrive typé `Json` — et le
 * réflexe était `(data as any).success`, qui éteint la vérification sur
 * tout ce qui touche `data`, y compris les champs dont on est sûr.
 *
 * Une fonction, un endroit, et le contrôle reste allumé partout ailleurs.
 */

/** Le compte-rendu, tel qu'on le lit — jamais plus que ce qui est là. */
export interface CompteRenduRpc {
  success?: boolean;
  error?: string;
}

/** Relit une réponse de RPC comme un compte-rendu, si c'en est un. */
export function compteRendu(data: unknown): CompteRenduRpc | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const o = data as Record<string, unknown>;
  return {
    success: typeof o.success === "boolean" ? o.success : undefined,
    error: typeof o.error === "string" ? o.error : undefined,
  };
}

/**
 * Lève si la fonction a répondu un refus. Sinon, ne fait rien.
 *
 * `if (data && data.success === false)` : le `=== false` compte. Une
 * fonction qui ne rend pas de champ `success` n'a pas échoué — elle rend
 * autre chose, et l'appelant sait quoi.
 */
export function refuserSiEchec(data: unknown, defaut: string): void {
  const r = compteRendu(data);
  if (r?.success === false) throw new Error(r.error || defaut);
}
