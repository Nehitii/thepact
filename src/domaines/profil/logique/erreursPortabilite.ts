/* LIRE LE MOTIF D UN ECHEC DE PORTABILITE.
 *
 * Deux fonctions pures sorties de `pages/DataPortability.tsx`. Elles
 * relisent le corps d une reponse non-2xx que `functions.invoke` a
 * jete, pour en tirer un code, et traduisent ce code en phrase.
 *
 * A SIGNALER POUR UNE PROCHAINE PASSE : `motifLisible` existe DEUX
 * fois dans le domaine. Ici, une seule condition ecrite en dur ; dans
 * `hooks/useCodesDeSecours`, une table `MOTIFS` exportee par la porte
 * et utilisee par la page du second facteur. Les fusionner changerait
 * un message d authentification — c est une reecriture, pas un
 * rangement, et elle n est pas faite ici.
 */

/* La fonction delete-account exige desormais aal2 quand un second
   facteur est enrole. Son 403 porte un code, pas une phrase — et
   functions.invoke jette le corps de toute reponse non-2xx. On relit
   donc la reponse conservee dans context, comme ailleurs dans
   l application. */
export const motifLisible = (code: string) =>
  code === "second_facteur_requis"
    ? "Ton compte est protégé par un second facteur. Reconnecte-toi en le saisissant, puis réessaie."
    : code;

export const motifDeLEchec = async (error: { message: string; context?: unknown }) => {
  if (error.context instanceof Response) {
    try {
      const corps = await error.context.clone().json();
      if (corps?.error) return motifLisible(corps.error);
    } catch {
      /* Corps illisible : on retombe sur le message d origine. */
    }
  }
  return error.message;
};
