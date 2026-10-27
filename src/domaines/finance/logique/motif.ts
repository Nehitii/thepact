import { debutDeMois, periodeDe, tombeEn, type LigneCadencee } from "@/domaines/finance/logique/cadence";

/* LE MOTIF ANNUEL D UNE CHARGE.
 *
 * Sorti de `cadence.ts`, qui melait deux sujets voisins : ce qui tombe
 * ce mois-ci et combien, d un cote ; de l autre, lire une grille de
 * douze cases comme une periode et une ancre — et l inverse.
 *
 * Le second ne sert qu au formulaire, ou l on coche des mois ; le
 * premier sert partout ailleurs.
 */
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
/**
 * Les mois d une ANNEE PRECISE ou cette ligne tombe.
 *
 * moisDeChute rend le motif d une annee quelconque, et ne sait donc
 * rien dire d un echeancier : ses echeances se suivent, franchissent
 * le 31 decembre, et n existent que dans les annees qu elles
 * traversent. La vue calendrier a besoin de l autre lecture — celle
 * d une annee datee — et l obtient en interrogeant les douze mois un
 * par un plutot qu en refaisant le calcul a cote.
 */
export function tombeDansLAnnee(ligne: LigneCadencee, annee: number): number[] {
  const mois: number[] = [];
  for (let m = 0; m < 12; m++) if (tombeEn(ligne, new Date(annee, m, 1))) mois.push(m);
  return mois;
}

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
