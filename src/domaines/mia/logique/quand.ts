/* DIRE QUAND, EN FRANCAIS.
 *
 * Deux fonctions pures sorties de `MiaConsole.tsx` : l une date une
 * conversation dans la liste (« a l instant », « hier »), l autre
 * horodate un message dans le fil. Elles ne connaissent ni React ni la
 * base — elles se testent donc seules, ce que la console de 978 lignes
 * ne permettait pas.
 */

export function quand(iso: string): string {
  const d = new Date(iso);
  const ecart = Date.now() - d.getTime();
  if (ecart < 120_000) return "à l'instant";
  const auj = new Date();
  const memeJour = d.toDateString() === auj.toDateString();
  if (memeJour) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const hier = new Date(auj);
  hier.setDate(auj.getDate() - 1);
  if (d.toDateString() === hier.toDateString()) return "hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Quand une chose a été dite.
 *
 * Une conversation qu'on relit trois jours plus tard sans savoir quand
 * elle a eu lieu n'est pas un souvenir, c'est un texte. L'heure suffit
 * pour aujourd'hui ; au-delà, il faut la date, et au-delà de l'année,
 * l'année aussi.
 */
export function quandDit(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const jour = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const aujourdhui = new Date();
  const zero = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate()).getTime();
  const ecart = Math.round((zero - jour) / 86_400_000);
  if (ecart === 0) return heure;
  if (ecart === 1) return `hier, ${heure}`;
  if (d.getFullYear() === aujourdhui.getFullYear()) {
    return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}, ${heure}`;
  }
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}, ${heure}`;
}
