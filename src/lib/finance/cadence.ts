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
   LE MOTIF DE L ANNEE

   Regler une cadence demandait deux gestes qui ne se ressemblent
   pas : choisir « trimestriel » dans une liste, puis designer un mois
   d ancrage — et comprendre que le second decidait des trois autres.

   Une grille de douze cases dit la meme chose d un seul geste : on
   coche les mois ou la charge tombe. Encore faut-il traduire dans les
   deux sens, et c est tout l objet de ce qui suit.

   UN MOTIF REGULIER A FORCEMENT UNE PERIODE QUI DIVISE DOUZE.

   C est la contrainte, et elle est structurelle : un motif qui se
   repete a l identique d une annee sur l autre revient n fois par an
   a intervalle constant, donc sa periode vaut 12/n. Cocher n cases
   determine donc la periode sans ambiguite — il ne reste qu a
   verifier qu elles sont bien equidistantes.
   ═══════════════════════════════════════════════════════════════ */

/** Les periodes qu un motif annuel peut prendre, des plus frequentes. */
export const PERIODES_ADMISES = [1, 2, 3, 4, 6, 12] as const;

/** Le motif d une annee : la periode, et le premier mois concerne. */
export interface MotifAnnuel {
  /** Le nombre de mois entre deux echeances. */
  periode: number;
  /** L indice du premier mois concerne dans l annee, de 0 a 11. */
  ancre: number;
}

/** Les mois de l annee ou ce motif tombe, par indice croissant. */
export function moisDuMotif({ periode, ancre }: MotifAnnuel): number[] {
  if (periode < 1 || periode > 12) return [];
  const premier = ancre % periode;
  const mois: number[] = [];
  for (let m = premier; m < 12; m += periode) mois.push(m);
  return mois;
}

/**
 * Les mois de l annee ou cette ligne tombe.
 *
 * Un echeancier n a pas de motif annuel : ses echeances se suivent
 * mois apres mois et peuvent franchir le 31 decembre. On rend donc un
 * tableau vide plutot qu un motif qui mentirait.
 */
export function moisDeChute(ligne: LigneCadencee): number[] {
  if (ligne.echeances != null) return [];
  const periode = periodeDe(ligne);
  if (periode === 1) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  if (!ligne.mois_ancre) return [];
  return moisDuMotif({ periode, ancre: debutDeMois(ligne.mois_ancre).getMonth() });
}

/**
 * Le motif que forment ces mois — ou rien s ils n en forment aucun.
 *
 * Douze cases cochees a la main peuvent tres bien ne rien vouloir
 * dire : janvier, mars et aout ne se repetent pas. On le dit alors
 * franchement au lieu de deviner, et l interface propose de
 * regulariser.
 */
export function motifDepuisMois(mois: number[]): MotifAnnuel | null {
  const tries = [...new Set(mois)].sort((a, b) => a - b);
  if (tries.length === 0) return null;

  /* n echeances par an imposent la periode : 12/n. Si ce n est pas un
     entier admis, la selection ne peut pas se repeter d une annee sur
     l autre. */
  const periode = 12 / tries.length;
  if (!PERIODES_ADMISES.includes(periode as typeof PERIODES_ADMISES[number])) return null;

  /* Reste a verifier l equidistance : tous les mois doivent tomber sur
     le meme reste modulo la periode. */
  const reste = tries[0] % periode;
  if (tries.some((m) => m % periode !== reste)) return null;

  return { periode, ancre: tries[0] };
}

/**
 * Le motif regulier le plus proche de cette selection.
 *
 * C est ce qui rend la grille utilisable en deux gestes : cocher
 * janvier puis avril suffit, et le motif se complete tout seul en
 * janvier, avril, juillet, octobre.
 *
 * ON NOTE CHAQUE MOTIF CANDIDAT, ET LES DEUX ERREURS NE SE VALENT PAS.
 *
 * Oublier un mois qui a ete coche est une faute lourde : on contredit
 * un geste explicite. Ajouter un mois qui ne l a pas ete est au
 * contraire l objet meme de la manoeuvre — qui coche deux cases en
 * attend quatre. Le premier travers pese donc trois fois, le second
 * une seule.
 *
 * Une premiere version prenait l ecart median entre les mois coches.
 * Elle tombait des qu une case etait de trop : janvier, avril, mai,
 * juillet, octobre a pour ecarts 3, 1, 2, 3 — de mediane 2, et le
 * trimestre evident devenait un bimestre.
 */
export function regulariser(mois: number[]): MotifAnnuel | null {
  const tries = [...new Set(mois)].sort((a, b) => a - b);
  if (tries.length === 0) return null;

  const dejaBon = motifDepuisMois(tries);
  if (dejaBon) return dejaBon;

  const coches = new Set(tries);
  let meilleur: MotifAnnuel | null = null;
  let meilleureNote = -Infinity;

  for (const periode of PERIODES_ADMISES) {
    for (const ancre of tries) {
      const motif = moisDuMotif({ periode, ancre });
      let tenus = 0;
      for (const m of motif) if (coches.has(m)) tenus++;
      const oublies = tries.length - tenus;
      const ajoutes = motif.length - tenus;
      const note = 3 * tenus - 3 * oublies - ajoutes;
      /* A egalite, la periode la plus longue : mieux vaut proposer
         trop peu d echeances, qu on voit et qu on corrige, que trop,
         qu on paie. */
      if (note > meilleureNote || (note === meilleureNote && periode > (meilleur?.periode ?? 0))) {
        meilleureNote = note;
        meilleur = { periode, ancre: motif[0] };
      }
    }
  }
  return meilleur;
}
