/**
 * LA CADENCE D UNE CHARGE.
 *
 * Tout etait implicitement mensuel. Une assurance annuelle de six
 * cents euros gonflait donc chaque mois de six cents, ou bien il
 * fallait la saisir lissee a cinquante — et perdre a la fois le vrai
 * montant et le mois ou il part.
 *
 * Un paiement en plusieurs fois et un abonnement trimestriel sont la
 * meme mecanique : une charge qui ne tombe pas tous les mois. Une
 * seule notion les porte donc tous les deux.
 *
 *   periode_mois  le nombre de mois entre deux echeances
 *   mois_ancre    le mois de la premiere, qui dit lesquels sont
 *                 concernes — sans lui, « tous les trois mois » ne
 *                 designe aucun mois en particulier
 *   echeances     leur nombre, ou rien pour une charge sans fin :
 *                 c est la seule difference entre un abonnement et un
 *                 echeancier
 *
 * DEUX LECTURES, ET ELLES NE DISENT PAS LA MEME CHOSE.
 *
 * Le total du mois est la tresorerie : ce qui part reellement en
 * mars. Il repond a « ai-je de quoi ce mois-ci », et c est lui qui
 * commande le solde.
 *
 * La provision est ce qu il faudrait mettre de cote chaque mois pour
 * absorber les echeances a venir — six cents euros annuels valent
 * cinquante euros de provision. Elle repond a une autre question, et
 * ne se melange donc pas au total.
 */

export interface LigneCadencee {
  amount: number;
  is_active: boolean;
  periode_mois?: number | null;
  mois_ancre?: string | null;
  echeances?: number | null;
  montant_total?: number | null;
}

/** Le premier du mois, en local, a partir d une date ou d une chaine. */
export function debutDeMois(v: Date | string): Date {
  const d = typeof v === "string" ? new Date(v.length <= 7 ? `${v}-01T00:00:00` : v) : v;
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Nombre de mois de a vers b. Negatif si b precede a. */
export function moisEntre(a: Date | string, b: Date | string): number {
  const x = debutDeMois(a);
  const y = debutDeMois(b);
  return (y.getFullYear() - x.getFullYear()) * 12 + (y.getMonth() - x.getMonth());
}

const periodeDe = (l: LigneCadencee) => (l.periode_mois && l.periode_mois > 0 ? l.periode_mois : 1);

/**
 * Le rang de l echeance qui tombe ce mois-la, a partir de 1 — ou zero
 * si la charge ne tombe pas ce mois-ci.
 *
 * Une ligne mensuelle sans ancre tombe toujours : c est le cas de
 * loin le plus courant, et lui demander une ancre serait exiger une
 * information que personne n a envie de saisir.
 */
export function rangEcheance(ligne: LigneCadencee, mois: Date | string): number {
  if (!ligne.is_active) return 0;
  const periode = periodeDe(ligne);

  if (!ligne.mois_ancre) {
    /* Sans ancre, seule une cadence mensuelle a un sens ; une cadence
       plus longue ne saurait pas quels mois designer. La base l interdit
       deja, on refuse ici aussi plutot que de deviner. */
    return periode === 1 ? 1 : 0;
  }

  const ecart = moisEntre(ligne.mois_ancre, mois);
  if (ecart < 0) return 0;
  if (ecart % periode !== 0) return 0;

  const rang = ecart / periode + 1;
  if (ligne.echeances != null && rang > ligne.echeances) return 0;
  return rang;
}

/** La charge tombe-t-elle ce mois-ci ? */
export const tombeEn = (ligne: LigneCadencee, mois: Date | string): boolean =>
  rangEcheance(ligne, mois) > 0;

const centimes = (n: number) => Math.round(n * 100);
const euros = (c: number) => c / 100;

/**
 * Ce qui part reellement ce mois-ci.
 *
 * Pour un echeancier, la derniere echeance absorbe le reste de la
 * division : deux cents euros en trois fois font 66,66 puis 66,66
 * puis 66,68. Sans cela, la somme des prelevements ne ferait pas le
 * prix paye — et c est exactement le genre d ecart d un centime qui
 * fait douter de tout le tableau.
 */
export function montantDuMois(ligne: LigneCadencee, mois: Date | string): number {
  const rang = rangEcheance(ligne, mois);
  if (rang === 0) return 0;

  const n = ligne.echeances;
  if (n == null || ligne.montant_total == null) return ligne.amount;

  const total = centimes(ligne.montant_total);
  const part = Math.floor(total / n);
  return rang < n ? euros(part) : euros(total - part * (n - 1));
}

/** Le mois de la prochaine echeance apres celui-ci, ou rien. */
export function prochaineEcheance(ligne: LigneCadencee, mois: Date | string): Date | null {
  if (!ligne.is_active) return null;
  const periode = periodeDe(ligne);
  if (!ligne.mois_ancre) return periode === 1 ? debutDeMois(mois) : null;

  const depart = debutDeMois(ligne.mois_ancre);
  const ecart = moisEntre(depart, mois);
  /* On cherche la premiere echeance strictement apres le mois donne. */
  const rangSuivant = ecart < 0 ? 1 : Math.floor(ecart / periode) + 2;
  if (ligne.echeances != null && rangSuivant > ligne.echeances) return null;

  const d = new Date(depart);
  d.setMonth(d.getMonth() + (rangSuivant - 1) * periode);
  return d;
}

/** Le total qui part ce mois-ci, sur un lot de lignes. */
export function totalDuMois(lignes: LigneCadencee[], mois: Date | string): number {
  const c = lignes.reduce((s, l) => s + centimes(montantDuMois(l, mois)), 0);
  return euros(c);
}

/**
 * La provision : ce qu il faudrait mettre de cote chaque mois pour
 * absorber les echeances a venir.
 *
 * Seules les cadences plus longues qu un mois en demandent une. Un
 * echeancier n en demande pas : il est deja en train d etre paye, mois
 * apres mois — provisionner par-dessus reviendrait a compter la meme
 * somme deux fois.
 */
export function provisionMensuelle(lignes: LigneCadencee[]): number {
  const c = lignes.reduce((s, l) => {
    if (!l.is_active) return s;
    if (l.echeances != null) return s;
    const periode = periodeDe(l);
    if (periode <= 1) return s;
    return s + centimes(l.amount) / periode;
  }, 0);
  return euros(Math.round(c));
}

/** Comment se nomme cette cadence. */
export type NomCadence = "mensuel" | "trimestriel" | "semestriel" | "annuel" | "echeancier";

export function cadenceDe(ligne: LigneCadencee): NomCadence {
  if (ligne.echeances != null) return "echeancier";
  switch (periodeDe(ligne)) {
    case 3: return "trimestriel";
    case 6: return "semestriel";
    case 12: return "annuel";
    default: return "mensuel";
  }
}
