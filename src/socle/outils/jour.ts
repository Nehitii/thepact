/* LE JOUR TEL QU ON LE VIT, ET LE SEUL ENDROIT QUI SACHE LE DIRE.
 *
 * Une base rend deux choses tres differentes sous le meme mot.
 *
 *   Une colonne « date »        rend « 2026-09-08 ». C est un JOUR
 *                               CIVIL : il n a pas d heure, pas de
 *                               fuseau, et il ne designe pas un
 *                               instant. Vingt-neuf colonnes de ce
 *                               depot sont dans ce cas — l echeance
 *                               d un objectif, le jour d une habitude,
 *                               le mois d une charge, la derniere
 *                               connexion.
 *   Une colonne « timestamptz » rend « 2026-09-08T22:00:00+00 ». C est
 *                               un INSTANT, et le rendre dans le
 *                               fuseau du lecteur est exactement juste.
 *
 * LES DEUX FAUTES QUE CE MODULE EXISTE POUR EMPECHER.
 *
 * `new Date("2026-09-08")` lit un jour civil a MINUIT UTC. A l ouest
 * de Greenwich, la date locale qui en ressort est celle de la VEILLE ;
 * et meme a l est, l heure obtenue est 1 h ou 2 h du matin, ce qui
 * fausse tout calcul qui touche aux heures.
 *
 * `d.toISOString().slice(0, 10)` rend le jour d UTC, pas celui du
 * lecteur. Entre minuit et deux heures du matin a Paris, il rend la
 * veille — et une serie se lit comme rompue, un total du jour se vide,
 * un message quotidien se rejoue.
 *
 * Ces deux idiomes ont ete corriges quatre fois dans ce depot, chaque
 * fois separement : dans la bande des series, dans les gestes de
 * M.I.A., dans la journee de connexion, dans la minuterie de focus.
 * Deux versions du meme « jour vecu » vivaient dans deux domaines.
 * Elles sont ici, une seule fois, et `scripts/verifier-temps.mjs`
 * refuse desormais les deux idiomes partout ailleurs.
 */

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/** Le jour civil du lecteur, au format que la base emploie. */
export function jourLocal(quand: Date = new Date()): string {
  return `${quand.getFullYear()}-${deuxChiffres(quand.getMonth() + 1)}-${deuxChiffres(quand.getDate())}`;
}

/** Le mois civil du lecteur — « 2026-09 ». */
export function moisLocal(quand: Date = new Date()): string {
  return `${quand.getFullYear()}-${deuxChiffres(quand.getMonth() + 1)}`;
}

/**
 * Un jour civil, ramene a MIDI dans le fuseau du lecteur.
 *
 * Midi et non minuit : c est le seul instant de la journee qui reste
 * dans le bon jour quel que soit le fuseau, et qui survit aux deux
 * heures que les changements d heure ajoutent ou retirent. Un jour lu
 * a minuit local bascule sur la veille dans les zones ou le passage a
 * l heure d ete supprime la premiere heure.
 */
export function duJourNu(jour: string): Date {
  /* Une valeur qui porte deja une heure est un INSTANT : on n y touche
     pas. Sans cette garde, appliquer la fonction a une colonne
     « timestamptz » fabriquerait « ...+00T12:00:00 », c est-a-dire une
     date invalide — et le remede serait pire que le mal. */
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(jour.trim()) ? jour.trim() + "T12:00:00" : jour);
}

/** Vrai si deux instants tombent le meme jour pour le lecteur. */
export const memeJour = (a: Date, b: Date): boolean => jourLocal(a) === jourLocal(b);

/**
 * Le nombre de jours CIVILS de `depuis` a `jusqua`, tous deux nus.
 *
 * Compter en millisecondes puis arrondir donne un resultat qui depend
 * de l heure qu il est : a onze heures du matin, la veille d une
 * echeance, il reste « 0,54 jour ». Deux jours civils, eux, se
 * soustraient exactement. Les deux bornes sont lues a midi, ou aucun
 * changement d heure ne vient retirer une heure a la journee.
 */
export function joursEntre(depuis: string, jusqua: string): number {
  const a = duJourNu(depuis), b = duJourNu(jusqua);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/* ── LA DATE CIVILE D UN SELECTEUR ────────────────────────────────
 *
 * Venues de `domaines/profil/logique/dateCivile.ts`, qui resolvait le
 * meme probleme dans son coin. Un selecteur de date a un besoin de
 * plus : la composante qu il LIT doit etre exactement celle qu il
 * REECRIT, sinon la valeur recule d un jour a chaque enregistrement.
 * Ces trois-la ne passent donc jamais par l analyseur de chaines — la
 * date est decoupee, puis reconstruite en heure locale.
 * ──────────────────────────────────────────────────────────────── */

/** « 1996-02-02 » → un Date au 2 fevrier 1996, minuit LOCAL. */
export function dateCivileDepuisTexte(texte: string | null | undefined): Date | undefined {
  if (!texte) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(texte);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Un Date → « 1996-02-02 », d apres ses composantes LOCALES.
 *
 * Accepte aussi une chaine : la colonne en rend une, un etat serialise
 * en rend une, et une fonction qui explose sur la forme la plus
 * courante de sa propre donnee n est pas une fonction sure.
 */
export function texteDepuisDateCivile(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === "string") return /^(\d{4}-\d{2}-\d{2})/.exec(d)?.[1] ?? null;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return jourLocal(d);
}

/** Aujourd hui, minuit local — la borne haute d une date de naissance. */
export function aujourdHuiCivil(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Le jour civil, decale de `n` jours — sans jamais passer par les millisecondes. */
export function jourDecale(n: number, depuis: Date = new Date()): string {
  const d = new Date(depuis);
  d.setDate(d.getDate() + n);
  return jourLocal(d);
}
