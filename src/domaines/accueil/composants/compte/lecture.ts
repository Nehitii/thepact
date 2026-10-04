import { datePleine } from "@/domaines/accueil/composants/bandeau/lecture";
import type { EtatDuCompte, LectureDuCompte } from "@/domaines/accueil/logique/compteARebours";

/* CE QUE LES REFONTES DU COMPTE A REBOURS ECRIVENT, hors de tout
 * composant : les jours a afficher, les dates, la phrase lue a voix
 * haute. Les bornes de la lecture sont des minuits ; un jour s affiche
 * depuis son milieu, qui ne bascule jamais sur la veille. */

const JOUR = 86_400_000;

export const premierJour = (l: LectureDuCompte): Date => new Date(l.debut + JOUR / 2);
export const dernierJour = (l: LectureDuCompte): Date => new Date(l.fin - JOUR / 2);

/** « 24 juin 2026 ». */
export const dateLongue = (d: Date): string => datePleine(d);

/** « 24.06.2026 ». */
export const dateCourte = (d: Date): string =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".");

/** Arrondi par defaut : « 100 % » ne se lit qu au terme, pas trente-six heures avant. */
export const pourcentEcoule = (l: LectureDuCompte): number => Math.floor(l.part * 100);

/** Les jours avant le premier jour, pour un pacte a venir. */
export const joursAvantLeDebut = (l: LectureDuCompte): number => Math.ceil(l.avantLeDebutMs / JOUR);

const MOTS_DES_ETATS: Readonly<Record<EtatDuCompte, string>> = {
  "a-venir": "à venir",
  nominal: "nominal",
  attention: "attention",
  critique: "critique",
  termine: "terme atteint",
};

export const motDeLEtat = (etat: EtatDuCompte): string => MOTS_DES_ETATS[etat];

/** Ce que le panneau dit a voix haute, d une traite. */
export function phraseDuCompte(l: LectureDuCompte): string {
  if (l.etat === "termine") return `Pacte : terme atteint le ${dateLongue(dernierJour(l))}.`;
  const reste = `${l.gros.valeur} ${l.gros.mot}`;
  if (l.etat === "a-venir") return `Pacte : commence dans ${joursAvantLeDebut(l)} jours, ${reste}.`;
  return `Pacte : ${reste}, ${pourcentEcoule(l)} % écoulé, ${motDeLEtat(l.etat)}.`;
}
