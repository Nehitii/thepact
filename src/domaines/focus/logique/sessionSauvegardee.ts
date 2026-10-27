/* CE QUE LE NAVIGATEUR GARDE D UNE SESSION INTERROMPUE.
 *
 * Une minuterie de focus survit a la fermeture de l onglet : ce module
 * ecrit son etat, le relit, et decide s il est encore credible — trop
 * vieux, trop en retard, trop d avances d un coup, on oublie.
 *
 * Sorti de `hooks/usePomodoro.ts`, qui faisait 531 lignes. Rien ici ne
 * connait React : ce sont des lectures de `localStorage` et des
 * comparaisons de dates.
 */

import type { CycleAcheve } from "@/domaines/focus/types";
import type { EtatMinuteur } from "@/domaines/focus/types";

export const CLE_SESSION = "overwrite.focus.session";

/** Au-dela, on considere que l utilisateur a simplement quitte. */
export const AGE_MAX_MS = 12 * 60 * 60 * 1000;

/** Au-dela de l heure de fin, on ne rattrape plus les phases manquees. */
export const RETARD_MAX_MS = 2 * 60 * 60 * 1000;

/** Garde-fou : jamais plus de huit phases rejouees d un coup. */
export const AVANCES_MAX = 8;

export const AU_REPOS = (workMinutes: number): EtatMinuteur => ({
  phase: "idle",
  secondsLeft: workMinutes * 60,
  totalPhase: workMinutes * 60,
  cycles: 0,
  enPause: false,
});

export interface SessionPersistee {
  v: 1;
  phase: "work" | "break";
  finAt: number | null;
  restant: number;
  totalPhase: number;
  cycles: number;
  enPause: boolean;
  debutCycleAt: number;
  debutSessionISO: string;
  ecritAt: number;
}

export interface Reprise {
  etat: EtatMinuteur;
  finAt: number | null;
  debutCycleAt: number;
  debutSessionISO: string;
  aCrediter: CycleAcheve[];
}

/** Duree, en secondes, de la pause qui suit le cycle numero `cycles`. */
export function secondesDePause(cycles: number, breakMinutes: number, longBreakMinutes: number) {
  const longue = cycles > 0 && cycles % 4 === 0;
  return (longue ? longBreakMinutes : breakMinutes) * 60;
}

const compteEntier = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

/* ═══ LA PORTE, ET TOUT CE QU ELLE LAISSAIT PASSER ═══
 *
 * `localStorage` n est pas une source sure : le navigateur le rend a
 * qui le lit, et personne ne garantit que ce qui y est ecrit vienne
 * de cette application. Cette fonction est le seul point de passage
 * vers `restaurer`, donc vers des lignes de `pomodoro_sessions`.
 *
 * Elle ne verifiait que trois choses, et la troisieme ne tenait pas :
 * `Date.now() - undefined` vaut NaN, et `NaN > AGE_MAX_MS` est FAUX.
 * Une session sans `ecritAt`, ou dont l `ecritAt` est une chaine,
 * franchissait donc la limite des douze heures sans la toucher.
 *
 * MESURE AVANT CORRECTION, sur une session forgee a la main :
 * `debutCycleAt` a zero creditait 29 803 432 minutes commencant le
 * 1er janvier 1970 — une ligne en base, et autant dans le compteur
 * `pomodoro_total_minutes` des succes. Un `restant` negatif
 * traversait tel quel, la ou la branche en cours le borne a zero.
 *
 * Les cent quatorze seances reellement enregistrees vont de 1 a 45
 * minutes, aucune avant l an 2000 : le defaut est reste possible, il
 * n a jamais eu lieu. */
export function lireSession(): SessionPersistee | null {
  try {
    const brut = localStorage.getItem(CLE_SESSION);
    if (!brut) return null;
    const s = JSON.parse(brut) as SessionPersistee;
    if (s?.v !== 1 || (s.phase !== "work" && s.phase !== "break")) return null;
    if (!compteEntier(s.ecritAt) || Date.now() - s.ecritAt > AGE_MAX_MS) return null;
    if (!compteEntier(s.restant) || !compteEntier(s.totalPhase) || !compteEntier(s.cycles)) return null;
    /* Un cycle commence avant qu on ecrive son etat, et jamais a
       l epoque Unix : c est ce qui borne la duree creditee. */
    if (!compteEntier(s.debutCycleAt) || s.debutCycleAt === 0 || s.debutCycleAt > s.ecritAt) return null;
    if (s.finAt !== null && !compteEntier(s.finAt)) return null;
    return s;
  } catch {
    return null;
  }
}

export function oublierSession() {
  try { localStorage.removeItem(CLE_SESSION); } catch { /* stockage indisponible */ }
}

/* Reprise apres un demontage.
 *
 * Si l heure de fin est encore devant, on reprend a l identique. Si elle
 * est derriere, la phase s est achevee pendant l absence : on rejoue les
 * phases une a une jusqu a retomber sur celle qui court, et chaque cycle
 * de TRAVAIL franchi est credite — l horloge d un pomodoro tourne qu on
 * la regarde ou non, c est precisement ce qu on lui demande.
 *
 * Passe deux heures apres la fin, on ne rattrape plus rien : personne ne
 * revient deux heures plus tard en pretendant avoir travaille. */
export function restaurer(workMinutes: number, breakMinutes: number, longBreakMinutes: number): Reprise {
  const vide: Reprise = {
    etat: AU_REPOS(workMinutes),
    finAt: null,
    debutCycleAt: 0,
    debutSessionISO: "",
    aCrediter: [],
  };

  const s = lireSession();
  if (!s) return vide;

  const maintenant = Date.now();

  // En pause : rien ne s ecoule pendant l absence, on reprend tel quel.
  if (s.enPause || s.finAt === null) {
    return {
      etat: { phase: s.phase, secondsLeft: s.restant, totalPhase: s.totalPhase, cycles: s.cycles, enPause: true },
      finAt: null,
      debutCycleAt: s.debutCycleAt,
      debutSessionISO: s.debutSessionISO,
      aCrediter: [],
    };
  }

  if (maintenant < s.finAt) {
    return {
      etat: {
        phase: s.phase,
        secondsLeft: Math.max(0, Math.ceil((s.finAt - maintenant) / 1000)),
        totalPhase: s.totalPhase,
        cycles: s.cycles,
        enPause: false,
      },
      finAt: s.finAt,
      debutCycleAt: s.debutCycleAt,
      debutSessionISO: s.debutSessionISO,
      aCrediter: [],
    };
  }

  if (maintenant - s.finAt > RETARD_MAX_MS) {
    oublierSession();
    return vide;
  }

  // Rattrapage des phases franchies pendant l absence.
  let phase: "work" | "break" = s.phase;
  let fin = s.finAt;
  let cycles = s.cycles;
  let total = s.totalPhase;
  let debutCycle = s.debutCycleAt;
  const aCrediter: CycleAcheve[] = [];

  for (let i = 0; i < AVANCES_MAX && maintenant >= fin; i++) {
    if (phase === "work") {
      cycles += 1;
      aCrediter.push({
        minutes: Math.max(1, Math.round((fin - debutCycle) / 60000)),
        debutISO: new Date(debutCycle).toISOString(),
        complet: true,
      });
      total = secondesDePause(cycles, breakMinutes, longBreakMinutes);
      phase = "break";
    } else {
      total = workMinutes * 60;
      phase = "work";
    }
    debutCycle = fin;
    fin = fin + total * 1000;
  }

  if (maintenant >= fin) {
    // Trop de phases manquees pour qu une reprise ait du sens.
    oublierSession();
    return { ...vide, aCrediter };
  }

  return {
    etat: {
      phase,
      secondsLeft: Math.max(0, Math.ceil((fin - maintenant) / 1000)),
      totalPhase: total,
      cycles,
      enPause: false,
    },
    finAt: fin,
    debutCycleAt: debutCycle,
    debutSessionISO: s.debutSessionISO,
    aCrediter,
  };
}
