import type { Rang } from "@/domaines/finance/types";
import { restant, totalPointe } from "@/domaines/finance/logique/pointage";

/* CE QU ON CONCLUT D UN MOIS.
 *
 * Quatre valeurs partent en base a la validation, et deux se lisent a
 * l ecran juste avant. Elles vivaient au milieu du parcours, entre le
 * bouton qui les ecrit et le JSX qui les montre.
 */

/* DEUX MONTANTS D ARGENT NE SE COMPARENT PAS AVEC « === ».
 *
 * 19,99 saisi et 19,99 recalcule peuvent differer du dernier bit :
 * l egalite stricte declarerait la ligne corrigee alors que personne
 * n y a touche, et l ecran afficherait une pastille de correction sur
 * douze lignes intactes.
 *
 * Un demi-centime est le bon seuil : c est la moitie de la plus
 * petite somme qu on puisse ecrire. En dessous, aucune saisie
 * possible ne peut tomber ; au-dessus, tout ecart reel est vu. */
export const DEMI_CENTIME = 0.005;

/** La ligne porte-t-elle un montant different de ce qui etait prevu ? */
export function estCorrige(rang: { reel: number; prevu: number }): boolean {
  return Math.abs(rang.reel - rang.prevu) >= DEMI_CENTIME;
}

export interface AvancementDuPointage {
  faits: number;
  total: number;
}

export function avancementDuPointage(rangs: Rang[]): AvancementDuPointage {
  return { faits: rangs.filter((r) => r.pointe).length, total: rangs.length };
}

export interface SoldeDuMois {
  revenus: number;
  depenses: number;
  solde: number;
  /* Le signe sert d attribut au rendu, pas de calcul : un solde nul
     compte comme « plus », parce que ne rien perdre n est pas
     perdre. */
  signe: "plus" | "moins";
}

export function soldeDuMois(rangs: { income: Rang[]; expense: Rang[] }): SoldeDuMois {
  const revenus = totalPointe(rangs.income);
  const depenses = totalPointe(rangs.expense);
  const solde = revenus - depenses;
  return { revenus, depenses, solde, signe: solde >= 0 ? "plus" : "moins" };
}

export interface BilanDuMois {
  confirmed_expenses: boolean;
  confirmed_income: boolean;
  unplanned_expenses: number;
  unplanned_income: number;
  actual_total_income: number;
  actual_total_expenses: number;
}

/* CE QUI PART EN BASE QUAND ON CLOT LE MOIS.
 *
 * Les totaux ne comptent QUE les lignes cochees : une ligne non
 * cochee veut dire « je n ai pas verifie », et non « zero ». C est
 * aussi ce que dit l avertissement affiche juste au-dessus du bouton.
 *
 * LES DEUX COLONNES « IMPREVU » PARTENT TOUJOURS A ZERO. Rien, dans
 * toute l application, n ecrit jamais autre chose : le parcours est
 * leur seul redacteur. L analytique les relit pourtant et en tire une
 * barre « Dont imprevu », qui ne peut donc jamais monter. Elles sont
 * nommees ici plutot que posees en passant, pour que cet ecart cesse
 * de ressembler a un oubli de lecture. */
export function bilanDuMois(rangs: { income: Rang[]; expense: Rang[] }): BilanDuMois {
  const { revenus, depenses } = soldeDuMois(rangs);
  return {
    /* « Confirme » veut dire : plus rien qui ait eu lieu n attend
       d etre coche. Les lignes a venir ne comptent pas — restant()
       les ecarte deja. */
    confirmed_expenses: restant(rangs.expense) === 0,
    confirmed_income: restant(rangs.income) === 0,
    unplanned_expenses: 0,
    unplanned_income: 0,
    actual_total_income: revenus,
    actual_total_expenses: depenses,
  };
}

/** Combien de lignes ayant eu lieu attendent encore d etre cochees. */
export function nonCochees(rangs: { income: Rang[]; expense: Rang[] }): number {
  return restant(rangs.expense) + restant(rangs.income);
}
