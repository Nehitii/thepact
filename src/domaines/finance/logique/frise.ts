import { format, startOfMonth, subMonths } from "date-fns";
import type { Locale } from "date-fns";
import { totalDuMois, montantDuMois } from "@/domaines/finance/logique/cadence";
import type { FinancialItem } from "@/domaines/finance/types";

/* LA FRISE D UNE ANNEE.
 *
 * Douze cases, une serie, et une regle qui decide ce que chaque case
 * MONTRE. Le tout vivait dans le composant, en trois `useMemo`.
 *
 * Ce sont des dates et des sommes : les deux se trompent sans bruit.
 * Une serie fausse est un nombre plausible ; une case qui montre une
 * prevision la ou il existe un constate ressemble a une case correcte.
 */

export const CASES = 12;

/** Une charge est « particuliere » des qu elle ne tombe pas chaque mois. */
export const estMensuelle = (l: FinancialItem) =>
  (l.periode_mois ?? 1) === 1 && l.echeances == null;

/** Ce que la base rend d un mois valide. */
export interface Validation {
  month: string;
  validated_at?: string | null;
  actual_total_income?: number | null;
  actual_total_expenses?: number | null;
}

/** Les mois effectivement valides, par leur cle « aaaa-mm ». */
export function moisValides(validations: Validation[]): Set<string> {
  return new Set(validations.filter((v) => v.validated_at).map((v) => v.month.slice(0, 7)));
}

/* LA SERIE DE MOIS TENUS, EN REMONTANT.
 *
 * LE MOIS EN COURS N A PAS ENCORE EU LIEU : son absence ne compte pas
 * contre la serie. Sans ce recul d un cran, toute serie tomberait a
 * zero le premier de chaque mois — et se retrouverait a son vrai chiffre
 * le jour ou l on valide, ce qui ferait clignoter le compteur.
 */
export function serieDeMoisTenus(valides: Set<string>, maintenant = new Date()): number {
  let n = 0;
  let curseur = startOfMonth(maintenant);
  if (!valides.has(format(curseur, "yyyy-MM"))) curseur = subMonths(curseur, 1);
  while (valides.has(format(curseur, "yyyy-MM"))) {
    n++;
    curseur = subMonths(curseur, 1);
  }
  return n;
}

export interface CaseDeFrise {
  cle: string;
  date: Date;
  premier: string;
  lettre: string;
  libelle: string;
  /** Le solde du mois, ou `null` quand il n y a rien a en dire. */
  solde: number | null;
  /** Le solde vient d un mois CONSTATE, pas d une prevision. */
  reel: boolean;
  valide: boolean;
  encours: boolean;
  choisi: boolean;
  passe: boolean;
  /** Ce que le mois porte d exceptionnel, et qui le rend lourd. */
  surcharge: number;
}

export function construireLaFrise({
  annee, validations, depenses, revenus, moisAffiche, locale, maintenant = new Date(),
}: {
  annee: number;
  validations: Validation[];
  depenses: FinancialItem[];
  revenus: FinancialItem[];
  moisAffiche: Date;
  locale: Locale;
  maintenant?: Date;
}): CaseDeFrise[] {
  const valides = moisValides(validations);
  /* Les charges qui ne tombent pas chaque mois : ce sont elles qui font
     les mois lourds, et elles seules meritent l alerte. */
  const particulieres = depenses.filter((l) => !estMensuelle(l));
  const cleCourante = format(startOfMonth(maintenant), "yyyy-MM");
  const cleAffichee = format(moisAffiche, "yyyy-MM");

  return Array.from({ length: CASES }, (_, i) => {
    const d = new Date(annee, i, 1);
    const cle = format(d, "yyyy-MM");
    const v = validations.find((x) => x.month.slice(0, 7) === cle);
    const valide = valides.has(cle);
    const passe = cle < cleCourante;

    /* LE REEL D ABORD, LA PREVISION ENSUITE.
       Un mois valide a un solde CONSTATE : c est celui qu on montre,
       meme s il s ecarte de ce que la cadence prevoyait — c est
       justement l ecart qui a de la valeur.
       Un mois passe sans validation n a rien a dire : on ne va pas lui
       inventer un resultat apres coup.
       Le reste — le mois en cours et ceux d apres — se calcule. */
    const reel = valide && !!v;
    const solde = reel
      ? (v.actual_total_income ?? 0) - (v.actual_total_expenses ?? 0)
      : passe
        ? null
        : totalDuMois(revenus, d) - totalDuMois(depenses, d);

    return {
      cle,
      date: d,
      premier: format(d, "yyyy-MM-01"),
      lettre: format(d, "MMM", { locale }).slice(0, 1).toUpperCase(),
      libelle: format(d, "MMM yyyy", { locale }),
      solde,
      reel,
      valide,
      encours: cle === cleCourante,
      choisi: cle === cleAffichee,
      passe,
      /* Pas de filtre `tombeEn` avant la somme : `montantDuMois` rend
         deja 0 quand la charge ne tombe pas ce mois-la, et `tombeEn`
         EST `rangEcheance > 0` — le meme predicat. Le filtre etait
         exactement redondant ; une mutation qui le retirait n a jamais
         rien fait tomber, et c est ce qui l a montre. */
      surcharge: particulieres.reduce((s, l) => s + montantDuMois(l, d), 0),
    };
  });
}
