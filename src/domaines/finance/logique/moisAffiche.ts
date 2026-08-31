import { moisLocal } from "@/socle/outils/jour";
/* ═══════════════════════════════════════════════════════════════
   L ETAT D UN MOIS, ET CE QU IL AUTORISE

   La frise ouvrait le pointage pour n importe quelle case : un mois
   valide comme un mois qui n a pas eu lieu. On pouvait donc cocher des
   lignes de decembre en aout, et rouvrir un mois clos sans le vouloir.

   Le probleme n etait pas le bouton, c est qu aucun endroit ne
   repondait a « ou en est ce mois ». Quatre etats suffisent, et les
   droits en decoulent — plutot que d etre decides composant par
   composant, ce qui les aurait fait diverger.
   ═══════════════════════════════════════════════════════════════ */

/** Les quatre situations possibles d un mois, du futur vers le clos. */
export type EtatDuMois = 'venir' | 'cours' | 'retard' | 'valide';

const cle = moisLocal;

/**
 * Ou en est ce mois-la.
 *
 * L ordre des tests compte : un mois valide l est quelle que soit sa
 * place dans le temps — on peut valider le mois en cours avant sa fin,
 * et c est meme le geste attendu.
 */
export function etatDuMois(mois: Date, aujourdHui: Date, estValide: boolean): EtatDuMois {
  if (estValide) return 'valide';
  const m = cle(mois);
  const a = cle(aujourdHui);
  if (m === a) return 'cours';
  return m > a ? 'venir' : 'retard';
}

/**
 * Peut-on pointer ce mois ?
 *
 * Le mois en cours, evidemment. Et un mois passe qu on n a pas valide :
 * le rattrapage est legitime, c est meme la seule facon de reconstituer
 * une serie interrompue. Un mois a venir, non — il n a rien a pointer,
 * et cocher une ligne qui n a pas eu lieu ne veut rien dire. Un mois
 * clos non plus, tant qu on ne l a pas rouvert explicitement.
 */
export const peutPointer = (etat: EtatDuMois): boolean => etat === 'cours' || etat === 'retard';

/**
 * Peut-on modifier les lignes recurrentes depuis ce mois ?
 *
 * UNIQUEMENT DEPUIS LE MOIS EN COURS, et la raison n est pas une regle
 * de prudence : une ligne recurrente N APPARTIENT A AUCUN MOIS. « Loyer
 * et charges » est une seule ligne, lue par les douze. La modifier en
 * regardant octobre ne changerait pas octobre — ca changerait toute
 * l annee, passe compris, y compris des mois deja valides dont le
 * solde constate ne bougerait pas mais dont le previsionnel, lui,
 * mentirait.
 *
 * Rien n empechait ce geste, et rien ne prevenait.
 */
export const peutModifier = (etat: EtatDuMois): boolean => etat === 'cours';

/** Le mois est-il celui d aujourd hui ? */
export const estLeMoisCourant = (mois: Date, aujourdHui: Date): boolean =>
  cle(mois) === cle(aujourdHui);
