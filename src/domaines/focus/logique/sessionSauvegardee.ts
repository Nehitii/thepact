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

/* ── Journees locales ──────────────────────────────────────────
 *
 * toISOString() produit une date UTC. Comparee a des journees
 * construites en heure locale, elle classait tout ce qui est fait entre
 * minuit et le decalage horaire sur la veille : total du jour faux, et
 * serie rompue sans raison pour quiconque travaille tard.
 * ────────────────────────────────────────────────────────────── */
export function cleJour(d: Date): string {
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

/** Duree, en secondes, de la pause qui suit le cycle numero `cycles`. */
export function secondesDePause(cycles: number, breakMinutes: number, longBreakMinutes: number) {
  const longue = cycles > 0 && cycles % 4 === 0;
  return (longue ? longBreakMinutes : breakMinutes) * 60;
}

export function lireSession(): SessionPersistee | null {
  try {
    const brut = localStorage.getItem(CLE_SESSION);
    if (!brut) return null;
    const s = JSON.parse(brut) as SessionPersistee;
    if (s?.v !== 1 || (s.phase !== "work" && s.phase !== "break")) return null;
    if (Date.now() - s.ecritAt > AGE_MAX_MS) return null;
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
