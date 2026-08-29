import type { FinancialItem, Rang, Pointage } from "@/domaines/finance/types";
import { tombeEn, montantDuMois, dateDeMouvement, dejaPasse } from "@/domaines/finance/logique/cadence";

/* LE POINTAGE D UN MOIS.
 *
 * Ce que la console de fin de mois compte, et ce qu elle en conclut.
 * Sorti du composant : ce sont des sommes d argent et une distinction
 * qui decide si l application te reproche un retard.
 */

/* CE QU ON POINTE : CE QUI TOMBE CE MOIS-LA.
   Une charge trimestrielle n a rien a faire dans la liste d aout si
   elle tombe en octobre — la cocher n aurait aucun sens, et la laisser
   non cochee ferait croire a un oubli. */
export function construireLesRangs({
  depenses, revenus, pointages, dateMois,
}: {
  depenses: FinancialItem[];
  revenus: FinancialItem[];
  pointages: Pointage[];
  dateMois: Date;
}): { expense: Rang[]; income: Rang[] } {
  const parLigne = new Map(pointages.filter((p) => p.ligne_id).map((p) => [p.ligne_id!, p]));
    const construire = (items: FinancialItem[]): Rang[] => items
      .filter((i) => i.is_active && tombeEn(i, dateMois))
      .map((item) => {
        const p = parLigne.get(item.id);
        const prevu = montantDuMois(item, dateMois);
        return {
          item, prevu, reel: p ? p.montant_reel : prevu, pointe: !!p?.pointe,
          quand: dateDeMouvement(item, dateMois),
          passe: dejaPasse(item, dateMois),
        };
      });
    return { expense: construire(depenses), income: construire(revenus) };
}

/* L ARGENT SE COMPTE EN CENTIMES, PUIS SE REND EN EUROS.
   Additionner des flottants donne 0,30000000000000004 ; la somme
   s affiche alors avec quinze decimales, ou pire, deux montants egaux
   se comparent inegaux. */
const enEuros = (rs: Rang[], garder: (r: Rang) => boolean) =>
  Math.round(rs.filter(garder).reduce((s, r) => s + r.reel * 100, 0)) / 100;

export const totalReel = (rs: Rang[]) => enEuros(rs, () => true);
export const totalPointe = (rs: Rang[]) => enEuros(rs, (r) => r.pointe);

/* CE QUI RESTE N EST PAS CE QUI MANQUE.
 *
 * Une ligne non pointee dont l argent n a pas encore bouge n est pas un
 * oubli : le loyer d aout encaisse le 3 septembre ne peut pas etre
 * coche le 21 aout. Les compter ensemble faisait reprocher un retard a
 * qui n avait rien oublie — et poussait a cocher pour faire taire le
 * compteur, ce qui est exactement ce qu un pointage ne doit pas
 * encourager.
 *
 * On les separe donc : « a venir » d un cote, « oubliees » de l autre,
 * et seules les secondes appellent une action.
 *
 * « passe === false » et « passe !== false » ne sont pas symetriques
 * par hasard : « passe » vaut undefined quand la date de mouvement est
 * inconnue, et une ligne dont on ignore la date n est PAS a venir. */
export const aVenir = (rs: Rang[]) => rs.filter((r) => !r.pointe && r.passe === false);
export const oubliees = (rs: Rang[]) => rs.filter((r) => !r.pointe && r.passe !== false);
export const restant = (rs: Rang[]) => oubliees(rs).length;
