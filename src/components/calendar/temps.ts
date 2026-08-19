/* UNE DATE N EST PAS UNE CHAINE
 *
 * Le formulaire composait ses horodatages par collage :
 * `${date}T${heure}:00`. La chaine ainsi obtenue ne porte AUCUN fuseau,
 * et la colonne qui la recoit, elle, en attend un. Postgres la lisait
 * donc dans le sien — UTC — et non dans celui de l utilisateur : un
 * rendez-vous saisi a 14 h depuis Paris partait en base a 14 h UTC, puis
 * se relisait a 16 h. Deux decalages qui s ajoutent, sur la donnee meme
 * que la page existe pour tenir.
 *
 * Tout passe desormais par ici : on construit une vraie date locale, puis
 * on la serialise. La chaine porte alors son decalage, et le serveur n a
 * plus rien a deviner.
 */

/** L instant designe par une date « aaaa-mm-jj » et une heure « hh:mm » locales. */
export function composerInstant(date: string, heure: string): Date | null {
  const [a, m, j] = (date || "").split("-").map(Number);
  const [h, mn] = (heure || "00:00").split(":").map(Number);
  if (!a || !m || !j || Number.isNaN(h) || Number.isNaN(mn)) return null;
  const d = new Date(a, m - 1, j, h, mn, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Le premier instant d une journee locale. */
export function debutDeJournee(date: string): Date | null {
  return composerInstant(date, "00:00");
}

/** Le dernier instant d une journee locale. */
export function finDeJournee(date: string): Date | null {
  const d = composerInstant(date, "00:00");
  if (!d) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Une date du calendrier, ramenee a une heure precise du meme jour local. */
export function aLHeure(jour: Date, heures: number, minutes = 0): Date {
  const d = new Date(jour);
  d.setHours(heures, minutes, 0, 0);
  return d;
}
