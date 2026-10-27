import type { OrdreAffiche } from "@/domaines/accueil/types";

/* CE QUE LES POINTEUSES ECRIVENT D UN ORDRE, hors de tout composant :
 * l heure du tampon, la mesure tapee sur la carte, un nombre sur trois
 * tambours. */

/** L heure du geste d un ordre reclame, telle que le tampon l imprime. */
export function heureDuGeste(o: OrdreAffiche): string | null {
  if (o.status !== "claimed" || !o.updated_at) return null;
  return new Date(o.updated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** « 12/25 min », « 1/2 ». */
export const mesureDe = (o: { progress: number; target: number }, unite: string): string =>
  `${o.progress}/${o.target}${unite ? ` ${unite}` : ""}`;

/** Un nombre sur trois tambours : 15 → « 015 ». */
export const surTrois = (n: number): string => String(Math.max(0, Math.floor(n))).padStart(3, "0");

/** Le jour de la semaine et la date, en abrege d horodateur : « MER 23 SEPT ». */
export const dateDHorodateur = (quand: number): string =>
  new Date(quand)
    .toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
    .replace(/\./g, "")
    .toUpperCase();
