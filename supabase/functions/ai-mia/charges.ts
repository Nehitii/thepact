/* CE QUE LES ARGUMENTS DU MODELE DEVIENNENT EN BASE.
 *
 * Les arguments d un outil viennent du modele, en JSON : rien n y est
 * sur. Les bornes numeriques sont dans `bornes.ts`, les longueurs de
 * texte aussi. Restaient trois familles de conversions, ecrites en
 * clair au milieu de vingt appels Supabase, et jamais relues ensemble :
 * les instants, les drapeaux, et les choix fermes.
 *
 * Une conversion fausse ici n echoue pas : elle ECRIT. La ligne part en
 * base avec la mauvaise valeur, et personne ne la relit.
 */

/* ── LES INSTANTS ────────────────────────────────────────────── */

/** Une heure : la duree d un evenement dont on n a pas dit la fin. */
export const DUREE_PAR_DEFAUT_MS = 3_600_000;

/* UNE DATE ILLISIBLE SE RECONNAIT A SON TEMPS : `new Date("n importe
 * quoi")` ne leve pas, elle rend une date dont `getTime()` vaut NaN.
 * C est la seule facon de la distinguer.
 *
 * LE PREMIER TEST EST UN TEST DE VERITE, PAS UN TEST DE PRESENCE, et ce
 * n est pas un raccourci : le code d avant ecrivait
 * `args?.start_time ? ... : null`. La difference se voit sur un seul
 * argument — le nombre zero. `String(0)` vaut « 0 », et `new Date("0")`
 * vaut le premier janvier 2000. Avec un test de presence, un
 * `start_time: 0` deviendrait donc un evenement de l an 2000 ; avec le
 * test de verite, il est refuse comme avant.
 *
 * LE PASSAGE PAR `String` N EST PAS DECORATIF NON PLUS : il decide
 * qu un horodatage en millisecondes est REFUSE. `new Date(1767225600000)`
 * serait une date valide ; `new Date("1767225600000")` n en est pas
 * une. Le modele doit repondre une date ecrite, jamais un nombre. */
export function instantLu(valeur: unknown): Date | null {
  if (!valeur) return null;
  const d = new Date(String(valeur));
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface BornesDEvenement {
  debut: Date;
  fin: Date;
}

/* ═══════════════════════════════════════════════════════════════
   LE DEBUT EST VERIFIE, LA FIN NE L EST PAS.

   Un debut illisible rend `null`, et l appelant repond « start_time
   invalide » sans rien ecrire. Une FIN illisible, elle, traverse : elle
   ressort en date invalide, et le `toISOString()` de l appelant LEVE
   une RangeError. Un seul mot mal forme dans un argument suffit donc a
   faire tomber le tour d outil — la ou le meme mot, cote debut, donne
   un refus propre.

   RIEN NE VERIFIE NON PLUS QUE LA FIN SUIT LE DEBUT. Un evenement qui
   se termine avant de commencer part en base tel quel.

   CONSTATE, NON CORRIGE : refuser une fin illisible, ou remettre les
   bornes dans l ordre, changerait ce que l outil accepte. Les deux
   ecarts sont epingles par un test.
   ═══════════════════════════════════════════════════════════════ */
export function bornesDeLEvenement(debutBrut: unknown, finBrut: unknown): BornesDEvenement | null {
  const debut = instantLu(debutBrut);
  if (!debut) return null;
  const fin = finBrut ? new Date(String(finBrut)) : new Date(debut.getTime() + DUREE_PAR_DEFAUT_MS);
  return { debut, fin };
}

/* ── LES DRAPEAUX ────────────────────────────────────────────── */

/* `!!` NE LIT PAS UN BOOLEEN, IL LIT UNE VERITE. Le modele repond
 * normalement `true` ou `false` — le schema le demande. Mais s il
 * renvoie la CHAINE « false », ou « 0 », ou « non », toutes sont vraies
 * pour JavaScript, et la ligne part en base avec le drapeau leve.
 *
 * CONSTATE, NON CORRIGE : n accepter que le booleen changerait ce que
 * l outil enregistre pour un modele qui repond en texte. */
export function drapeau(valeur: unknown): boolean {
  return !!valeur;
}

/* ── LES CHOIX FERMES ────────────────────────────────────────── */

/* CE N EST PAS UNE VALIDATION, C EST UN DEFAUT.
 *
 * `difficulty`, `priority`, `category` sont des listes fermees dans le
 * schema d outil — et rien ici ne les verifie. Un modele qui repond
 * « impossible » plutot que « hard » ecrit « impossible » dans la
 * colonne. Le schema est une demande, pas une garantie : il est envoye
 * au modele, il n est jamais applique au retour.
 *
 * CONSTATE, NON CORRIGE : filtrer sur la liste changerait ce qui est
 * enregistre. La fonction existe pour que l absence de controle soit
 * ECRITE quelque part plutot que dispersee dans vingt appels. */
export function choixOuDefaut(valeur: unknown, defaut: string): string {
  return (valeur ?? defaut) as string;
}

/** Ce qui n est pas donne vaut `null` en base, pas la chaine vide. */
export function valeurOuNulle<T>(valeur: T | undefined | null): T | null {
  return valeur ?? null;
}
