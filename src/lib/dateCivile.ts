/**
 * Une date civile — un jour du calendrier, sans heure ni fuseau.
 *
 * Postgres stocke `birthday` en `date` : « 1996-02-02 », rien de plus.
 * Le piege est que `new Date("1996-02-02")` est impose par la norme
 * comme etant *minuit UTC*, alors que `getDate()` rend une composante
 * *locale*. A UTC-5, minuit UTC est la veille a 19 h : le selecteur
 * affichait le 1er fevrier pour une date stockee au 2. Et comme
 * l enregistrement reecrivait ces memes composantes locales, la valeur
 * reculait d un jour a chaque sauvegarde.
 *
 * Ces deux fonctions ne passent jamais par l analyseur de chaines : la
 * date est decoupee, puis reconstruite en heure locale. La composante
 * lue est alors exactement celle qui sera reecrite, sous tous les
 * fuseaux.
 */

/** « 1996-02-02 » → un Date au 2 fevrier 1996, minuit *local*. */
export function dateCivileDepuisTexte(texte: string | null | undefined): Date | undefined {
  if (!texte) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(texte);
  if (!m) return undefined;
  const [, a, mo, j] = m;
  const d = new Date(Number(a), Number(mo) - 1, Number(j));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Un Date → « 1996-02-02 », d apres ses composantes *locales*.
 *
 * Accepte aussi une chaine : la colonne en rend une, un etat serialise
 * en rend une, et une fonction qui explose sur la forme la plus
 * courante de sa propre donnee n est pas une fonction sure.
 */
export function texteDepuisDateCivile(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === "string") {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(d);
    return m ? m[1] : null;
  }
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Aujourd hui, minuit local — la borne haute d une date de naissance. */
export function aujourdHuiCivil(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
