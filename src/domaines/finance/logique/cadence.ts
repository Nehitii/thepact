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

/* Reexporte : le motif annuel a son fichier, mais six appelants
   l importaient d ici — et un motif EST une cadence, vue depuis la
   grille de douze cases. */
export {
  PERIODES_ADMISES, moisDuMotif, moisDeChute, tombeDansLAnnee,
  motifDepuisMois, regulariser, type MotifAnnuel,
} from "@/domaines/finance/logique/motif";

export interface LigneCadencee {
  amount: number;
  is_active: boolean;
  periode_mois?: number | null;
  mois_ancre?: string | null;
  echeances?: number | null;
  montant_total?: number | null;
  /** Le jour du mois ou l argent bouge. Nul si on ne le sait pas. */
  jour_echeance?: number | null;
  /** De combien de mois le mouvement suit le mois concerne. */
  decalage_mois?: number | null;
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

export const periodeDe = (l: LigneCadencee) => (l.periode_mois && l.periode_mois > 0 ? l.periode_mois : 1);

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

  return partsDeLEcheancier(ligne.montant_total, n)[rang - 1];
}

/* DEUX ET SOIXANTE : les bornes du nombre d echeances. En deca ce n est
   pas un echeancier ; au-dela, cinq ans de prelevements saisis par
   erreur. */
export const nombreDEcheances = (saisie: string) =>
  Math.max(2, Math.min(60, parseInt(saisie, 10) || 2));

/* LES ECHEANCES, TOUTES, DANS L ORDRE.
 *
 * CETTE REGLE ETAIT ECRITE DEUX FOIS. Ici pour ce qui part reellement
 * chaque mois, et dans le formulaire de ligne pour l apercu montre
 * AVANT d enregistrer. Deux ecritures de la meme division, donc deux
 * facons de deriver — et c est l apercu qui sert a decider.
 *
 * Une seule fonction, deux lecteurs : `montantDuMois` y prend son rang,
 * le formulaire la liste entiere.
 */
export function partsDeLEcheancier(montantTotal: number, n: number): number[] {
  const total = centimes(montantTotal);
  const part = Math.floor(total / n);
  /* La DERNIERE echeance absorbe le reste de la division. Sans cela, la
     somme des prelevements ne ferait pas le prix paye — et c est
     exactement le genre d ecart d un centime qui fait douter de tout le
     tableau. */
  return Array.from({ length: n }, (_, i) =>
    euros(i < n - 1 ? part : total - part * (n - 1)));
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
export type NomCadence =
  | "mensuel" | "bimestriel" | "trimestriel" | "quadrimestriel"
  | "semestriel" | "annuel" | "echeancier";

export function cadenceDe(ligne: LigneCadencee): NomCadence {
  if (ligne.echeances != null) return "echeancier";
  switch (periodeDe(ligne)) {
    case 2: return "bimestriel";
    case 3: return "trimestriel";
    case 4: return "quadrimestriel";
    case 6: return "semestriel";
    case 12: return "annuel";
    default: return "mensuel";
  }
}

/* ═══════════════════════════════════════════════════════════════
   LE JOUR OU L ARGENT BOUGE

   Une ligne tombait DANS son mois, point. Aucun moyen de dire qu un
   loyer d aout arrive le 3 septembre.

   La consequence n etait pas cosmetique. Au pointage, ces lignes-la
   restaient decochees alors qu elles n etaient pas en retard : elles
   n avaient simplement pas encore eu lieu. Le parcours ne savait pas
   distinguer « pas encore » de « manquant » — et c est exactement la
   difference qui compte quand on valide un mois.
   ═══════════════════════════════════════════════════════════════ */

/** Le jour du mois, borne au dernier jour reel de ce mois-la. */
function jourReel(annee: number, mois: number, jour: number): number {
  /* Le 31 d un mois de trente jours n existe pas : on retombe sur le
     dernier. Un prelevement au 31 tombe le 28 en fevrier, ce que fait
     aussi la banque. */
  const dernier = new Date(annee, mois + 1, 0).getDate();
  return Math.min(Math.max(1, jour), dernier);
}

/**
 * La date a laquelle l argent bouge, pour le mois donne.
 *
 * Sans jour d echeance, on ne sait pas : on rend null plutot que de
 * supposer le premier du mois, ce qui ferait croire a une precision
 * qu on n a pas.
 */
export function dateDeMouvement(ligne: LigneCadencee, mois: Date | string): Date | null {
  if (!tombeEn(ligne, mois)) return null;
  if (ligne.jour_echeance == null) return null;

  const base = debutDeMois(mois);
  /* Le decalage porte sur le MOIS, pas sur le jour : le loyer d aout
     arrive le 3 septembre, et non le 34 aout. */
  const cible = new Date(base.getFullYear(), base.getMonth() + (ligne.decalage_mois ?? 0), 1);
  return new Date(
    cible.getFullYear(),
    cible.getMonth(),
    jourReel(cible.getFullYear(), cible.getMonth(), ligne.jour_echeance),
  );
}

/**
 * L argent a-t-il deja bouge, a la date d aujourd hui ?
 *
 * Rend null quand la ligne ne dit pas son jour : on ne peut alors ni
 * l affirmer ni le nier, et pretendre le contraire serait pire que se
 * taire. Le parcours s en sert pour ne pas reprocher un retard a une
 * ligne qui n a pas encore eu lieu.
 */
export function dejaPasse(ligne: LigneCadencee, mois: Date | string, aujourdHui = new Date()): boolean | null {
  const d = dateDeMouvement(ligne, mois);
  if (!d) return null;
  const jour = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), aujourdHui.getDate());
  return d.getTime() <= jour.getTime();
}
