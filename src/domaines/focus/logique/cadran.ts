import type { PomodoroPhase } from "@/domaines/focus/types";

/* CE QUE LE CADRAN DIT, ET QUAND IL LE DIT.
 *
 * Trois decisions que la page prenait au milieu de son rendu, sans
 * qu on puisse les relire : quand la region vocale parle, quel rang
 * porte la clause, et de quel pas la barre avance.
 */

const SECONDES_PAR_MINUTE = 60;

/* TROIS ANNONCES PAR PHASE, PAS UNE PAR MINUTE.
 *
 * Une region vocale qui se met a jour chaque minute rediffuse le temps
 * a chaque changement : une session de vingt-cinq minutes produirait
 * vingt-cinq interruptions. On n annonce que l entree dans la phase,
 * puis les DEUX SEULS SEUILS QUI CHANGENT UNE DECISION — cinq
 * minutes, une minute. Le temps restant exact est expose sur la barre
 * de progression, et se lit a la demande.
 */
export const SEUILS = [1, 5] as const;
export type SeuilDAnnonce = (typeof SEUILS)[number];

/* Les minutes sont ARRONDIES AU-DESSUS : a 61 secondes il reste
   « deux minutes », et le seuil d une minute ne s annonce que dans la
   derniere. L arrondi au plus proche le declencherait trente secondes
   trop tot, et l annonce mentirait. */
export function seuilDAnnonce(secondesRestantes: number): SeuilDAnnonce | null {
  const minutes = Math.ceil(secondesRestantes / SECONDES_PAR_MINUTE);
  if (minutes <= 1) return 1;
  if (minutes <= 5) return 5;
  return null;
}

export interface Annonce {
  cle: string;
  valeurs?: { count: number };
}

export function annonceDuCadran(
  phase: PomodoroPhase,
  suspendu: boolean,
  secondesRestantes: number,
): Annonce | null {
  /* AU REPOS, LA REGION SE TAIT. Annoncer « zero minute » a une page
     que personne n a lancee n apprend rien. */
  if (phase === "idle") return null;
  if (suspendu) return { cle: "focus.announce.paused" };

  const seuil = seuilDAnnonce(secondesRestantes);
  const pause = phase === "break";
  if (seuil === null) {
    return { cle: pause ? "focus.announce.breakStarted" : "focus.announce.workStarted" };
  }
  return { cle: pause ? "focus.announce.break" : "focus.announce.work", valeurs: { count: seuil } };
}

/* LA REFERENCE DU REGISTRE SE LIT, ET ELLE EST VRAIE.
 *
 * La date du jour, puis le rang de la clause dans son cycle de
 * quatre. Ce n est pas un numero decoratif : le rang repart a un tous
 * les quatre pomodoros, ce qui est exactement le cycle au bout duquel
 * tombe la longue pause. */
export const CYCLE = 4;

export function referenceDuRegistre(sessionsAchevees: number, quand: Date): string {
  const mm = String(quand.getMonth() + 1).padStart(2, "0");
  const jj = String(quand.getDate()).padStart(2, "0");
  const rang = String((sessionsAchevees % CYCLE) + 1).padStart(2, "0");
  return `VW·${mm}${jj}·${rang}`;
}

/* LA BARRE N AVANCE QUE PAR PAS DE CINQ POUR CENT.
 *
 * L avancement change chaque seconde ; le repeindre a chaque
 * changement fait travailler la page mille cinq cents fois par
 * session pour un deplacement invisible. Vingt pas suffisent a ce que
 * l oeil voie l anneau tourner. */
export const PAS = 20;

export function avancementParPas(avancement: number): number {
  return Math.round(avancement * PAS) / PAS;
}

/* DEUX NOTIFICATIONS A MOINS DE DIX SECONDES N APPORTENT RIEN.
 *
 * Elles s empilent, et la seconde recouvre la premiere avant qu on
 * ait pu la lire. Ce delai est un second filet : le premier est de ne
 * pas notifier un changement de phase provoque a la main — on vient
 * de cliquer, on sait deja. */
export const DELAI_ENTRE_NOTIFS = 10_000;

export function assezEspacee(maintenant: number, derniere: number): boolean {
  return maintenant - derniere > DELAI_ENTRE_NOTIFS;
}

/** Ce que dit la notification de changement de phase. */
export function clefDeNotification(phase: PomodoroPhase): string {
  return phase === "break" ? "focus.notification.breakStart" : "focus.notification.workResume";
}
