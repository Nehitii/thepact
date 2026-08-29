/* CE QU ON ACCEPTE COMME AVATAR.
 *
 * Deux regles, et elles sont le seul filtre entre un fichier depose et
 * le stockage : un format lisible par un navigateur, et une taille qui
 * ne fasse pas de la fiche publique un telechargement.
 *
 * UN FILTRE QUI LAISSE TOUT PASSER NE SE VOIT PAS. Le depot reussit, la
 * fiche s affiche — et c est trois mois plus tard, sur une connexion
 * lente, que le poids se remarque.
 */

/** Les quatre formats qu un navigateur affiche sans rien installer. */
export const FORMATS_ADMIS = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

/** Cinq mega-octets : au-dela, ce n est plus un avatar. */
export const POIDS_MAX = 5 * 1024 * 1024;

export type RefusDImage = "format" | "poids" | null;

/** La raison de refuser ce fichier, ou rien. */
export function refuserLImage(fichier: { type?: string; size?: number } | null | undefined): RefusDImage {
  if (!fichier) return null;
  if (!FORMATS_ADMIS.includes(fichier.type as typeof FORMATS_ADMIS[number])) return "format";
  /* STRICTEMENT PLUS GRAND : un fichier de exactement cinq mega-octets
     respecte la limite annoncee. Refuser a la limite ferait mentir le
     message qui dit « 5 Mo au maximum ». */
  if ((fichier.size ?? 0) > POIDS_MAX) return "poids";
  return null;
}

/* FORCER LE NAVIGATEUR A RELIRE L IMAGE.
 *
 * L adresse signee d un avatar ne change pas quand l image derriere
 * change : le navigateur reaffiche donc l ancienne, et l utilisateur
 * croit que son depot a echoue. Un parametre d horodatage suffit — a
 * condition de le coller correctement selon que l adresse porte deja
 * une requete ou non.
 */
export const antiCache = (url: string, maintenant = Date.now()): string =>
  url.includes("?") ? `${url}&t=${maintenant}` : `${url}?t=${maintenant}`;

/** L extension a donner au fichier optimise. */
export const extensionDe = (type: string): "gif" | "webp" => (type === "image/gif" ? "gif" : "webp");
