/* LES SEUILS DE LA NOTE DU DIABLE.
 *
 * Six nombres decidaient seuls, poses en clair au milieu des
 * gestionnaires d evenements : sept tapes, deux secondes, trois
 * ouvertures, soixante secondes, trois cents millisecondes, six
 * secondes. Aucun n etait nomme, aucun n etait relu.
 *
 * Ils ne comptent pas d argent, mais ils decident si un secret
 * s ouvre — et un seuil decale d une unite le rend soit trivial,
 * soit inatteignable, sans que rien ne le dise.
 */

/* ── LA NUIT PROFONDE ────────────────────────────────────────── */

/* ELLE ENJAMBE MINUIT, et c est pour cela que le test est un OU et
   non un ET : « de 23 h a 4 h » ne s ecrit pas « heure >= 23 &&
   heure < 4 », qui n est jamais vrai. */
export const DEBUT_DE_NUIT = 23;
export const FIN_DE_NUIT = 4;

export function estNuitProfonde(heure: number): boolean {
  return heure >= DEBUT_DE_NUIT || heure < FIN_DE_NUIT;
}

/* ── LES SEPT TAPES ──────────────────────────────────────────── */

export const TAPES_POUR_LE_SECRET = 7;
/** Deux secondes sans taper, et le compte repart de zero. */
export const OUBLI_DES_TAPES = 2000;

export interface SuiteDeTapes {
  compte: number;
  revele: boolean;
}

/* LE COMPTE REPART A ZERO QUAND LE SECRET S OUVRE : sans cela, la
   huitieme tape le rouvrirait, puis la neuvieme, et ce qui devait
   etre rare deviendrait continu. */
export function apresUneTape(compteAvant: number): SuiteDeTapes {
  const compte = compteAvant + 1;
  if (compte >= TAPES_POUR_LE_SECRET) return { compte: 0, revele: true };
  return { compte, revele: false };
}

/* ── LES TROIS OUVERTURES ────────────────────────────────────── */

export const OUVERTURES_POUR_LE_SECRET = 3;
export const FENETRE_DES_OUVERTURES = 60000;

export interface SuiteDOuvertures {
  horodatages: number[];
  revele: boolean;
}

/* ON ECARTE D ABORD CE QUI EST TROP VIEUX, PUIS ON AJOUTE. Ajouter
   avant d ecarter donnerait le meme resultat ici — l ouverture
   courante n est jamais trop vieille — mais l ordre choisi dit ce
   qu on veut : « parmi les ouvertures encore recentes, celle-ci fait
   la troisieme ». */
export function apresUneOuverture(
  horodatages: number[],
  maintenant: number,
): SuiteDOuvertures {
  const recentes = horodatages.filter((t) => maintenant - t < FENETRE_DES_OUVERTURES);
  recentes.push(maintenant);
  if (recentes.length >= OUVERTURES_POUR_LE_SECRET) {
    /* Vide, comme le compte des tapes : le secret ne se rouvre pas a
       chaque ouverture suivante. */
    return { horodatages: [], revele: true };
  }
  return { horodatages: recentes, revele: false };
}

/* ── CE QU UN APPUI ETAIT ────────────────────────────────────── */

/** Sous ce seuil, l appui compte comme une tape. */
export const MS_POUR_UNE_TAPE = 300;
/** Au-dela, l appui long s active et la fiche ne s ouvre plus. */
export const MS_POUR_UN_APPUI_LONG = 6000;

export interface NatureDeLAppui {
  compteCommeTape: boolean;
  ouvreLaFiche: boolean;
}

/* LES DEUX REPONSES SONT INDEPENDANTES, et ce n est pas un oubli :
   un appui bref est A LA FOIS une tape ET une ouverture. C est ce qui
   permet aux deux secrets — sept tapes, trois ouvertures — d avancer
   ensemble sur le meme geste. */
export function natureDeLAppui(dureeMs: number): NatureDeLAppui {
  return {
    compteCommeTape: dureeMs < MS_POUR_UNE_TAPE,
    ouvreLaFiche: dureeMs < MS_POUR_UN_APPUI_LONG,
  };
}

/* ── LE SOUFFLE ──────────────────────────────────────────────── */

/** Un cycle de huit secondes. */
export const CYCLE_DU_SOUFFLE = 8;
/** Tres discret : quinze pour cent d amplitude. */
export const AMPLITUDE_DU_SOUFFLE = 0.15;

/* LE SINUS EST RAMENE DE [-1, 1] A [0, 1] AVANT D ETRE ATTENUE :
   sans ce recentrage, la moitie du cycle donnerait une intensite
   NEGATIVE, et la lueur s inverserait une seconde sur deux. */
export function souffle(secondesEcoulees: number): number {
  const cycle = Math.sin((secondesEcoulees * Math.PI * 2) / CYCLE_DU_SOUFFLE) * 0.5 + 0.5;
  return cycle * AMPLITUDE_DU_SOUFFLE;
}
