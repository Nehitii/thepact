/* CE QUE LE MODELE DEMANDE, ET CE QU ON LUI ACCORDE.
 *
 * Les arguments d un outil viennent du modele, en JSON : rien n est
 * sur. Un nombre peut etre une chaine, une chaine peut faire dix
 * mille caracteres, une duree peut etre negative — et rien de tout
 * cela n est une erreur du point de vue du protocole. Ces bornes
 * etaient posees en clair, une douzaine de fois, chacune avec ses
 * propres min, max et defaut.
 */

/* ── LES NOMBRES ─────────────────────────────────────────────── */

export interface Bornes {
  defaut: number;
  min: number;
  max: number;
}

/* L ORDRE DES DEUX BORNES N EST PAS INDIFFERENT. `Math.min(max,
   Math.max(min, v))` ecrete d abord par le bas puis par le haut :
   le resultat est toujours dans l intervalle, meme si `v` est NaN —
   auquel cas les deux comparaisons echouent et NaN ressort. C est
   pour cela que le defaut est applique AVANT, sur la valeur brute,
   et qu un NaN y retombe aussi. */
export function nombreBorne(brut: unknown, { defaut, min, max }: Bornes): number {
  const n = Number(brut ?? defaut);
  /* UN NOMBRE ILLISIBLE RETOMBE SUR LE DEFAUT, pas sur zero ni sur
     NaN : « combien de jours ? » n a pas de reponse nulle, et un NaN
     traverserait jusqu a la requete. */
  if (!Number.isFinite(n)) return defaut;
  return Math.min(max, Math.max(min, n));
}

/* LES BORNES DE CHAQUE OUTIL, AU MEME ENDROIT. Les voir cote a cote
   est le seul moyen de remarquer qu une manque. */
export const BORNES: Record<string, Bornes> = {
  /* Un objectif a entre une et cinquante etapes. */
  total_steps: { defaut: 1, min: 1, max: 50 },
  /* Une habitude tient entre une semaine et un an. */
  habit_duration_days: { defaut: 21, min: 7, max: 365 },
  /* Le resume de concentration remonte a trois mois au plus. */
  focus_days: { defaut: 7, min: 1, max: 90 },
  /* Celui de sante, a quatre. */
  health_days: { defaut: 14, min: 1, max: 120 },
  /* L agenda regarde derriere jusqu a trois mois, devant jusqu a six. */
  days_back: { defaut: 0, min: 0, max: 90 },
  days_ahead: { defaut: 14, min: 1, max: 180 },
  /* La finance remonte a un an. */
  months: { defaut: 3, min: 1, max: 12 },
};

/* ── COMBIEN DE LIGNES LIRE ──────────────────────────────────── */

/* ═══ CINQ OUTILS LAISSAIENT LE MODELE CHOISIR, SANS AUCUNE BORNE ═══
 *
 * C etait `Number(args?.limit ?? 20)`, et rien d autre. Un modele qui
 * demandait cent mille lignes en obtenait cent mille ; un modele qui
 * repondait « vingt » en toutes lettres produisait NaN, et la requete
 * partait avec `limit=NaN` ; un `limit` a zero rendait une liste vide
 * qui se lisait comme « tu n as rien ». Tous les AUTRES arguments
 * numeriques de ce fichier etaient ecretes — celui-la, non.
 *
 * IL L EST DESORMAIS, comme les autres, et par les memes trois regles :
 * ce qui ne se lit pas comme un nombre retombe sur le defaut, le reste
 * est ramene entre les bornes.
 *
 * LE PLAFOND N EST PAS LA POUR ECONOMISER LA BASE mais le contexte du
 * modele : deux cents lignes d une liste de souhaits pesent deja plus
 * que la question posee. Deux cents couvre largement les comptes
 * releves — le plus fourni porte quatre-vingt-trois articles — sans
 * laisser passer un ordre de grandeur de plus.
 *
 * ET UN PLAFOND ATTEINT SE DIT : voir listes.ts, qui sonde une ligne
 * au-dela pour savoir s il en reste. */
export const LIMITE_MIN = 1;
export const LIMITE_MAX = 200;

export function limiteDemandee(brut: unknown, defaut: number): number {
  /* SEULS UN NOMBRE OU UNE CHAINE QUI SE LIT COMME UN NOMBRE SONT
     ACCEPTES. `Number("")` et `Number([])` valent ZERO, pas NaN : sans
     ce filtre, une limite vide ou un tableau vide seraient remontes au
     minimum, c est-a-dire UNE ligne. Or une chaine vide ne dit pas
     « une seule », elle dit « je n ai pas su remplir » — et la reponse
     a cela est le defaut. */
  if (brut === null || brut === undefined || brut === "" || typeof brut === "object") return defaut;
  /* `Math.floor` et non `Math.round` : demander 2,7 lignes en donne
     deux, jamais trois. Une limite fractionnaire partait telle quelle
     dans l URL. */
  const n = Math.floor(Number(brut));
  if (!Number.isFinite(n)) return defaut;
  return Math.min(Math.max(n, LIMITE_MIN), LIMITE_MAX);
}

/* ── LES TEXTES ──────────────────────────────────────────────── */

/** Deux cents caracteres : la longueur d un nom ou d un titre. */
export const LONGUEUR_NOM = 200;

/* DEUX NORMALISATIONS POUR LA MEME CHOSE, ET C EST CONSTATE, PAS
 * ARBITRE.
 *
 * Cinq creations coupent les blancs autour du nom avant de
 * l enregistrer — un objectif, une habitude, une tache, une entree de
 * journal, un article de liste. DEUX ne le font pas : l ajout d une
 * ETAPE et la creation d un EVENEMENT. Un titre avec une espace de
 * tete part donc en base tel quel pour ces deux-la, et s affichera
 * decale.
 */
export function texteBorne(brut: unknown, max = LONGUEUR_NOM): string {
  return String(brut ?? "").slice(0, max);
}

export function nomBorne(brut: unknown, max = LONGUEUR_NOM): string {
  return String(brut ?? "").trim().slice(0, max);
}

/** Ce qu on garde d une entree de journal remontee au modele. */
export const LONGUEUR_EXTRAIT_JOURNAL = 400;
/** Ce qu on garde d un souvenir retrouve par recherche. */
export const LONGUEUR_EXTRAIT_MEMOIRE = 220;

/* ── LES JOURS ───────────────────────────────────────────────── */

export const MS_PAR_JOUR = 86_400_000;

/* L ECOULE SE TRONQUE, LE RESTANT S ARRONDIT AU-DESSUS, et cette
 * asymetrie est voulue : un jour commence n est pas un jour ECOULE,
 * mais il est un jour qu il RESTE. Les prendre tous les deux dans le
 * meme sens ferait perdre ou gagner une journee au pacte selon
 * l heure a laquelle on regarde.
 */
export function joursEcoules(depuis: number, maintenant: number): number {
  return Math.max(0, Math.floor((maintenant - depuis) / MS_PAR_JOUR));
}

export function joursRestants(jusqua: number, maintenant: number): number {
  return Math.max(0, Math.ceil((jusqua - maintenant) / MS_PAR_JOUR));
}

/** Le jour civil d un horodatage ISO, sans son heure. */
export function jourDe(iso: string): string {
  return String(iso).slice(0, 10);
}

/** La date d il y a N jours, au format d un jour civil. */
export function ilYAJours(jours: number, maintenant: number): string {
  return new Date(maintenant - jours * MS_PAR_JOUR).toISOString().slice(0, 10);
}
