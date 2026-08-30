/* CE QUI ARRIVE DANS LE CORPS, ET CE QU ON EN GARDE.
 *
 * Le corps d une requete est du JSON venu du client : rien n y est
 * sur, et un champ peut manquer, valoir un nombre, ou faire dix mille
 * caracteres. Ces lectures etaient ecrites SIX FOIS, chacune avec sa
 * propre normalisation — deux d entre elles ne s accordant pas.
 */

/* LE DEFAUT EST LA CHAINE VIDE, PAS `undefined`.
 *
 * Tout ce qui suit compare, hache ou mesure la valeur : une chaine
 * vide traverse ces trois operations sans rien casser, la ou
 * `undefined` ferait lever le hachage. C est ce qui permet aux gardes
 * en aval — six chiffres, empreinte en attente, nom exact — de
 * refuser proprement plutot que de planter. */
export function texteDuCorps(valeur: unknown): string {
  return typeof valeur === "string" ? valeur : "";
}

/** Deux cents caracteres : la longueur d une etiquette d appareil. */
export const LONGUEUR_ETIQUETTE = 200;

/* UNE ETIQUETTE ABSENTE VAUT `null`, PAS LA CHAINE VIDE — la colonne
   est nullable, et une chaine vide y ferait un appareil nomme « rien »
   plutot qu un appareil sans nom. */
export function etiquetteDuCorps(valeur: unknown, max = LONGUEUR_ETIQUETTE): string | null {
  return typeof valeur === "string" ? valeur.slice(0, max) : null;
}

/* ═══════════════════════════════════════════════════════════════
   DEUX LECTURES DU MEME CHAMP, ET ELLES NE S ACCORDENT PAS.

   Le chemin « verify » lit `body.code` TEL QUEL et coupe les blancs
   plus loin, au moment de hacher. Le chemin « confirm_email_2fa » les
   coupe DES LA LECTURE. Sur un code colle avec une espace, les deux
   finissent par s accorder — mais seulement parce que le premier
   trime ailleurs. Retirer l un des deux trims casserait un chemin
   sans toucher l autre.

   Cette fonction porte la lecture qui coupe ; `texteDuCorps` porte
   celle qui ne coupe pas. Les deux existent pour que l ecart soit
   visible plutot que dissemine.
   ═══════════════════════════════════════════════════════════════ */
export function texteCoupeDuCorps(valeur: unknown): string {
  return texteDuCorps(valeur).trim();
}

/* ── LES APPAREILS DE CONFIANCE ──────────────────────────────── */

/* TRENTE JOURS. Au-dela, le second facteur redemande — meme sur un
   appareil qu on a dit connaitre. */
export const JOURS_DE_CONFIANCE = 30;
export const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
export const DUREE_DE_CONFIANCE_MS = JOURS_DE_CONFIANCE * MS_PAR_JOUR;

export function expirationDeLAppareil(maintenant: number): Date {
  return new Date(maintenant + DUREE_DE_CONFIANCE_MS);
}

export interface LigneAppareil {
  id?: string | null;
  expires_at?: string | null;
}

/* TROIS CONDITIONS, COMME POUR UN CODE PAR COURRIEL : il faut que la
 * ligne existe, qu elle porte une expiration, et que celle-ci ne soit
 * pas passee. Retirer la troisieme rendrait un appareil de confiance
 * valable pour toujours — et un appareil vole ne perdrait jamais son
 * acces.
 *
 * LA GARDE NE DIT PAS SEULEMENT OUI : ELLE DIT CE QU ELLE A ETABLI.
 * L appelant enchaine sur un `update().eq("id", ligne.id)`. Ecrite en
 * `boolean`, cette fonction lui faisait perdre le retrecissement que
 * le `data?.id &&` en ligne lui donnait, et `deno check` refusait le
 * fichier — a raison : rien ne disait plus que l identifiant existe.
 * Le predicat le redit. */
export function appareilEncoreValide(
  ligne: LigneAppareil | null | undefined,
  maintenant: number,
): ligne is LigneAppareil & { id: string } {
  if (!ligne?.id) return false;
  if (!ligne.expires_at) return false;
  return new Date(ligne.expires_at).getTime() > maintenant;
}
