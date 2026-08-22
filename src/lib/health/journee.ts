import { format, subDays, isSameDay, parseISO } from "date-fns";

/* ═══════════════════════════════════════════════════════════════
   ON NE RELEVE PAS UNE JOURNEE QU ON N A PAS FINIE

   Le releve portait sur AUJOURD HUI. On le remplissait donc a un
   moment quelconque — souvent le matin, quand la journee n a rien
   donne encore — et l on notait un sommeil qu on venait de finir a
   cote d une activite qui n avait pas eu lieu. La moitie des champs
   etaient des suppositions.

   Il porte desormais sur LA VEILLE. Une journee close se raconte : on
   sait combien on a dormi, si l on a bouge, comment ca s est passe. Le
   geste du matin devient une lecture, plus une prevision.

   ET LES JOURS MANQUES NE DISPARAISSENT PAS.

   Sauter un matin effacait la journee pour toujours. Elles restent
   maintenant en attente : on peut remonter les rattraper, dans la
   limite d une quinzaine — au-dela, ce ne serait plus un souvenir mais
   une reconstitution.
   ═══════════════════════════════════════════════════════════════ */

/** Combien de jours en arriere on accepte encore de rattraper. */
export const FENETRE_RATTRAPAGE = 14;

export const cleDuJour = (d: Date): string => format(d, "yyyy-MM-dd");

/** La veille : la journee que le releve du matin raconte. */
export const laVeille = (aujourdHui = new Date()): Date => subDays(aujourdHui, 1);

/**
 * Les journees closes qui n ont pas encore ete relevees, de la plus
 * recente a la plus ancienne.
 *
 * AUJOURD HUI N Y FIGURE JAMAIS : la journee n est pas finie, et
 * proposer de la relever ramenerait le probleme qu on vient de
 * corriger.
 */
export function joursARelever(
  datesRelevees: string[],
  aujourdHui = new Date(),
  fenetre = FENETRE_RATTRAPAGE,
): string[] {
  const faites = new Set(datesRelevees.map((d) => d.slice(0, 10)));
  const manques: string[] = [];
  for (let i = 1; i <= fenetre; i++) {
    const cle = cleDuJour(subDays(aujourdHui, i));
    if (!faites.has(cle)) manques.push(cle);
  }
  return manques;
}

/** Le releve de la veille est-il fait ? */
export const veilleRelevee = (datesRelevees: string[], aujourdHui = new Date()): boolean =>
  datesRelevees.map((d) => d.slice(0, 10)).includes(cleDuJour(laVeille(aujourdHui)));

/**
 * Comment nommer une journee sans dire sa date.
 *
 * « Hier » et « avant-hier » se lisent d un coup ; « 2026-08-20 »
 * demande de compter. Au-dela, la date reprend ses droits.
 */
export function nomDuJour(
  cle: string,
  formaterDate: (d: Date) => string,
  mots: { hier: string; avantHier: string },
  aujourdHui = new Date(),
): string {
  const d = parseISO(cle);
  if (isSameDay(d, subDays(aujourdHui, 1))) return mots.hier;
  if (isSameDay(d, subDays(aujourdHui, 2))) return mots.avantHier;
  return formaterDate(d);
}

/* ═══════════════════════════════════════════════════════════════
   L INDICE DE MASSE CORPORELLE

   Il s affichait brut : 23.148148148148149. Quinze decimales pour une
   mesure qui n en supporte pas une seconde — l IMC se lit a la
   decimale pres, et le reste est du bruit de division.
   ═══════════════════════════════════════════════════════════════ */

/** L IMC, arrondi au dixieme. Null si l on ne peut pas le calculer. */
export function imc(tailleCm: number | null | undefined, poidsKg: number | null | undefined): number | null {
  if (!tailleCm || !poidsKg || tailleCm <= 0 || poidsKg <= 0) return null;
  const m = tailleCm / 100;
  return Math.round((poidsKg / (m * m)) * 10) / 10;
}

export type TrancheIMC = "maigreur" | "normal" | "surpoids" | "obesite";

/** Les bornes de l OMS, et rien de plus : ce n est pas un diagnostic. */
export function trancheIMC(valeur: number | null): TrancheIMC | null {
  if (valeur === null) return null;
  if (valeur < 18.5) return "maigreur";
  if (valeur < 25) return "normal";
  if (valeur < 30) return "surpoids";
  return "obesite";
}

/** Ou se place l IMC sur une echelle de 15 a 35, en pourcentage. */
export function placeSurEchelle(valeur: number | null): number {
  if (valeur === null) return 0;
  return Math.min(100, Math.max(0, ((valeur - 15) / 20) * 100));
}
