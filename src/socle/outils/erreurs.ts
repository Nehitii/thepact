/**
 * CE QU'ON SAIT D'UNE ERREUR, ET RIEN DE PLUS.
 *
 * `catch (e: any)` promet que l'objet attrapé a un `.message`. Rien ne le
 * garantit : on peut lancer une chaîne, un nombre, `undefined`. Le jour où
 * ça arrive, `e.message` vaut `undefined` et l'utilisateur lit « undefined »
 * dans une notification — ou l'accès plante dans le gestionnaire d'erreur
 * lui-même, ce qui est la pire place pour planter.
 *
 * `unknown` dit la vérité : on ne sait pas ce qu'on a attrapé. Ces trois
 * fonctions sont le seul endroit où on le découvre.
 */

/** Le message lisible d'une erreur, quelle que soit sa forme. */
export function messageDErreur(e: unknown, defaut = "Une erreur est survenue."): string {
  if (e instanceof Error) return e.message || defaut;
  if (typeof e === "string") return e || defaut;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return defaut;
}

/**
 * Le code d'erreur PostgREST / Postgres, quand il y en a un.
 * `23505` = doublon sur une contrainte unique, `PGRST116` = zéro ligne
 * là où on en attendait une. C'est sur eux qu'on branche un message
 * particulier, pas sur le texte du message qui, lui, change de langue.
 */
export function codeDErreur(e: unknown): string | undefined {
  if (e && typeof e === "object" && "code" in e) {
    const c = (e as { code: unknown }).code;
    if (typeof c === "string" || typeof c === "number") return String(c);
  }
  return undefined;
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
