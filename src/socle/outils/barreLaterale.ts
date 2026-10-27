/* CE QUE LA BARRE LATERALE DECIDE.
 *
 * Quatre choses, qui vivaient au milieu de six cents lignes de
 * rendu : ce que porte une pastille, quelles pages entrent dans
 * quelle section, quand les ombres de debordement s allument, et
 * comment l etat replie se retient d une visite a l autre.
 */

/* ── L ETAT REPLIE, RETENU ───────────────────────────────────── */

/* IL SE RANGE EN TEXTE, PAS EN BOOLEEN. « oui » et « non » plutot que
   « true » et « false » : le stockage local ne connait que des
   chaines, et une valeur ecrite par une version anterieure — ou par
   une main — ne doit pas se lire de travers. Tout ce qui n est pas
   exactement « oui » vaut deplie. */
export const CLE_REPLI = "overwrite-barre-repliee";
export const REPLIEE = "oui";
export const DEPLIEE = "non";

export function estRepliee(retenu: string | null): boolean {
  return retenu === REPLIEE;
}

export function marqueDeRepli(repliee: boolean): string {
  return repliee ? REPLIEE : DEPLIEE;
}

/* ── CE QUE PORTE UNE PASTILLE ───────────────────────────────── */

export interface EntreeAvecPastille {
  badge?: string;
  module?: string;
}

export interface ComptesNonLus {
  demandesAllies: number;
  messagesNonLus: number;
  boiteDeReception: number;
  parModule: Record<string, number>;
}

/* LA PASTILLE ET LE MODULE S ADDITIONNENT.
 *
 * C EST LA SEULE ADDITION QUI COMPTE, et un balayage de mutations a
 * corrige ce commentaire : mettre les TROIS branches de pastille en
 * cascade ne change rien, puisque `badge` ne porte qu une valeur —
 * deux d entre elles ne peuvent pas etre vraies a la fois. La
 * derniere ligne, elle, doit rester un `if` separe : une entree peut
 * porter A LA FOIS une pastille et un module, et l ecrire en cascade
 * ferait disparaitre le second compte sans que rien ne le dise.
 *
 * LA BOITE DE RECEPTION ADDITIONNE LES MESSAGES ET LE RESTE : c est
 * ce qu elle contient. Une entree « messages » et une entree
 * « inbox » affichent donc toutes deux les messages non lus — ce
 * n est pas un double comptage, ce sont deux portes vers la meme
 * chose. */
export function pastilleDe(entree: EntreeAvecPastille, comptes: ComptesNonLus): number {
  let n = 0;
  if (entree.badge === "friends") n += comptes.demandesAllies;
  if (entree.badge === "messages") n += comptes.messagesNonLus;
  if (entree.badge === "inbox") n += comptes.messagesNonLus + comptes.boiteDeReception;
  if (entree.module && comptes.parModule[entree.module]) n += comptes.parModule[entree.module];
  return n;
}

/* ── QUELLES PAGES SOCIALES SONT OUVERTES ────────────────────── */

export interface FonctionsSociales {
  community: boolean;
  friends: boolean;
  leaderboard: boolean;
}

/* TROIS PAGES SE COUPENT, LES AUTRES RESTENT. Le defaut est de
   GARDER : une page sociale ajoutee plus tard apparaitra sans qu on
   ait a la declarer ici, ce qui vaut mieux que de la voir disparaitre
   en silence. */
export const PAGES_SOCIALES: Record<string, keyof FonctionsSociales> = {
  "/community": "community",
  "/friends": "friends",
  "/leaderboard": "leaderboard",
};

export function pageSocialeOuverte(chemin: string, social: FonctionsSociales): boolean {
  const cle = PAGES_SOCIALES[chemin];
  return cle ? social[cle] : true;
}

/* ── LES OMBRES DE DEBORDEMENT ───────────────────────────────── */

/* DEUX PIXELS DE TOLERANCE, ET ILS SERVENT.
 *
 * Un defilement n atteint presque jamais zero ni le fond exactement :
 * les navigateurs rendent des hauteurs fractionnaires, et un demi-
 * pixel de reste ferait clignoter l ombre du bas en permanence sur un
 * contenu qui tient pourtant. */
export const TOLERANCE_DEBORD = 2;

export interface Debord {
  haut: boolean;
  bas: boolean;
}

export function debordDe(
  defilement: number,
  hauteurDuContenu: number,
  hauteurVisible: number,
): Debord {
  const reste = hauteurDuContenu - hauteurVisible - defilement;
  return {
    haut: defilement > TOLERANCE_DEBORD,
    bas: reste > TOLERANCE_DEBORD,
  };
}

/* ON NE REPOSE L ETAT QUE S IL CHANGE : ce lecteur tourne a chaque
   pixel de defilement, et rendre un objet neuf a chaque fois
   redessinerait la barre entiere mille fois par glissement. */
export function memeDebord(a: Debord, b: Debord): boolean {
  return a.haut === b.haut && a.bas === b.bas;
}
