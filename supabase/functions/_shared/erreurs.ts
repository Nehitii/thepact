/**
 * CE QU'ON SAIT D'UNE ERREUR, ET RIEN DE PLUS. — version Deno.
 *
 * Jumelle de `src/lib/erreurs.ts`, recopiée plutôt qu'importée : les
 * fonctions Edge tournent sous Deno et ne voient pas `src/`. Vingt lignes
 * en double valent mieux qu'un chemin d'import qui ne résout que dans un
 * des deux mondes.
 *
 * `catch (e: any)` promet un `.message` que rien ne garantit. Une fonction
 * Edge qui plante DANS son gestionnaire d'erreur ne renvoie plus de JSON du
 * tout : l'appelant reçoit une 500 muette au lieu du motif du refus.
 */

/** Le message lisible d'une erreur, quelle que soit sa forme. */
export function messageDErreur(e: unknown, defaut = "Erreur inattendue."): string {
  if (e instanceof Error) return e.message || defaut;
  if (typeof e === "string") return e || defaut;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return defaut;
}

/** Le code HTTP porté par une erreur de transport, quand il y en a un. */
export function statutDErreur(e: unknown): number | undefined {
  if (e && typeof e === "object") {
    for (const cle of ["statusCode", "status"] as const) {
      if (cle in e) {
        const v = (e as Record<string, unknown>)[cle];
        if (typeof v === "number") return v;
      }
    }
  }
  return undefined;
}
