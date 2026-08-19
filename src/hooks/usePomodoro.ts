import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackPomodoroCompleted } from "@/lib/achievements";

export type PomodoroPhase = "work" | "break" | "idle";

export interface PomodoroSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  break_minutes: number;
  completed: boolean;
  linked_todo_id: string | null;
  linked_goal_id: string | null;
  linked_step_id: string | null;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

/** Un cycle de travail acheve, tel que le minuteur le rapporte. */
export interface CycleAcheve {
  minutes: number;
  debutISO: string;
  complet: boolean;
}

/* ── Persistance de la session en cours ────────────────────────
 *
 * L etat du minuteur vivait dans le composant : cliquer sur un lien de
 * la barre laterale demontait la page et effacait le compte a rebours,
 * sans avertissement et sans rien enregistrer. Vingt-cinq minutes de
 * travail disparaissaient sur un clic ordinaire.
 *
 * Ce qu on ecrit est l HEURE DE FIN, pas le temps restant. C est la meme
 * raison qui rend le minuteur insensible a la derive : une heure absolue
 * reste vraie pendant qu on ne la regarde pas. La reprise est donc juste,
 * que l absence ait dure trois secondes ou dix minutes.
 * ────────────────────────────────────────────────────────────── */

const CLE_SESSION = "vowpact.focus.session";

/** Au-dela, on considere que l utilisateur a simplement quitte. */
const AGE_MAX_MS = 12 * 60 * 60 * 1000;
/** Au-dela de l heure de fin, on ne rattrape plus les phases manquees. */
const RETARD_MAX_MS = 2 * 60 * 60 * 1000;
/** Garde-fou : jamais plus de huit phases rejouees d un coup. */
const AVANCES_MAX = 8;

interface SessionPersistee {
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

interface EtatMinuteur {
  phase: PomodoroPhase;
  secondsLeft: number;
  totalPhase: number;
  cycles: number;
  enPause: boolean;
}

const AU_REPOS = (workMinutes: number): EtatMinuteur => ({
  phase: "idle",
  secondsLeft: workMinutes * 60,
  totalPhase: workMinutes * 60,
  cycles: 0,
  enPause: false,
});

function lireSession(): SessionPersistee | null {
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

function oublierSession() {
  try { localStorage.removeItem(CLE_SESSION); } catch { /* stockage indisponible */ }
}

/** Duree, en secondes, de la pause qui suit le cycle numero `cycles`. */
function secondesDePause(cycles: number, breakMinutes: number, longBreakMinutes: number) {
  const longue = cycles > 0 && cycles % 4 === 0;
  return (longue ? longBreakMinutes : breakMinutes) * 60;
}

interface Reprise {
  etat: EtatMinuteur;
  finAt: number | null;
  debutCycleAt: number;
  debutSessionISO: string;
  aCrediter: CycleAcheve[];
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
function restaurer(workMinutes: number, breakMinutes: number, longBreakMinutes: number): Reprise {
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

export function usePomodoroTimer(
  workMinutes = 25,
  breakMinutes = 5,
  longBreakMinutes = 15,
  onCycleAcheve?: (c: CycleAcheve) => void,
) {
  const reprise = useRef<Reprise | null>(null);
  if (reprise.current === null) {
    reprise.current = restaurer(workMinutes, breakMinutes, longBreakMinutes);
  }

  const [etat, setEtat] = useState<EtatMinuteur>(reprise.current.etat);

  const endTimeRef = useRef<number | null>(reprise.current.finAt);
  const debutCycleRef = useRef<number>(reprise.current.debutCycleAt);
  const debutSessionRef = useRef<string>(reprise.current.debutSessionISO);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Les valeurs lues par le tic passent par des refs : sans elles, le
  // rappel de l intervalle capturerait l etat du rendu qui l a cree.
  const etatRef = useRef(etat);
  etatRef.current = etat;

  const dureesRef = useRef({ workMinutes, breakMinutes, longBreakMinutes });
  dureesRef.current = { workMinutes, breakMinutes, longBreakMinutes };

  const onCycleRef = useRef(onCycleAcheve);
  onCycleRef.current = onCycleAcheve;

  const progress = etat.totalPhase > 0 ? 1 - etat.secondsLeft / etat.totalPhase : 0;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /** Ecrit l etat courant, pour qu un demontage ne le perde pas. */
  const memoriser = useCallback((e: EtatMinuteur) => {
    if (e.phase === "idle") { oublierSession(); return; }
    const s: SessionPersistee = {
      v: 1,
      phase: e.phase,
      finAt: e.enPause ? null : endTimeRef.current,
      restant: e.secondsLeft,
      totalPhase: e.totalPhase,
      cycles: e.cycles,
      enPause: e.enPause,
      debutCycleAt: debutCycleRef.current,
      debutSessionISO: debutSessionRef.current,
      ecritAt: Date.now(),
    };
    try { localStorage.setItem(CLE_SESSION, JSON.stringify(s)); }
    catch { /* stockage indisponible */ }
  }, []);

  useEffect(() => { memoriser(etat); }, [etat, memoriser]);

  /* Passage a la phase suivante.
   *
   * Cette fonction ecrit dans des refs et declenche un enregistrement :
   * elle ne peut donc pas vivre dans un calculateur passe a setState, que
   * React exige pur et appelle deux fois en mode strict — c est ce qui
   * doublait le compteur de cycles en developpement. */
  const avancer = useCallback((maintenant: number) => {
    const { workMinutes: w, breakMinutes: b, longBreakMinutes: lb } = dureesRef.current;
    const courant = etatRef.current;
    if (courant.phase === "idle") return;

    if (courant.phase === "work") {
      const cycles = courant.cycles + 1;
      const total = secondesDePause(cycles, b, lb);
      onCycleRef.current?.({
        minutes: Math.max(1, Math.round((maintenant - debutCycleRef.current) / 60000)),
        debutISO: new Date(debutCycleRef.current || maintenant).toISOString(),
        complet: true,
      });
      debutCycleRef.current = maintenant;
      endTimeRef.current = maintenant + total * 1000;
      setEtat({ phase: "break", secondsLeft: total, totalPhase: total, cycles, enPause: false });
    } else {
      const total = w * 60;
      debutCycleRef.current = maintenant;
      endTimeRef.current = maintenant + total * 1000;
      setEtat({ ...courant, phase: "work", secondsLeft: total, totalPhase: total, enPause: false });
    }
  }, []);

  /** Recale l affichage sur l heure de fin. Un onglet d arriere-plan voit
   *  ses minuteries bridees a un tic par minute ; au retour, l affichage
   *  doit etre juste tout de suite, sans attendre le tic suivant. */
  const recaler = useCallback(() => {
    if (!endTimeRef.current || etatRef.current.enPause || etatRef.current.phase === "idle") return;
    const maintenant = Date.now();
    const restant = Math.max(0, Math.ceil((endTimeRef.current - maintenant) / 1000));
    if (restant <= 0) avancer(maintenant);
    else if (restant !== etatRef.current.secondsLeft) {
      setEtat((e) => ({ ...e, secondsLeft: restant }));
    }
  }, [avancer]);

  const startTicking = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(recaler, 1000);
  }, [clearTimer, recaler]);

  const start = useCallback(() => {
    const total = dureesRef.current.workMinutes * 60;
    const maintenant = Date.now();
    endTimeRef.current = maintenant + total * 1000;
    debutCycleRef.current = maintenant;
    debutSessionRef.current = new Date(maintenant).toISOString();
    setEtat({ phase: "work", secondsLeft: total, totalPhase: total, cycles: 0, enPause: false });
  }, []);

  const pause = useCallback(() => {
    clearTimer();
    const restant = endTimeRef.current
      ? Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      : etatRef.current.secondsLeft;
    endTimeRef.current = null;
    setEtat((e) => ({ ...e, secondsLeft: restant, enPause: true }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    endTimeRef.current = Date.now() + etatRef.current.secondsLeft * 1000;
    setEtat((e) => ({ ...e, enPause: false }));
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    endTimeRef.current = null;
    debutCycleRef.current = 0;
    debutSessionRef.current = "";
    oublierSession();
    setEtat(AU_REPOS(dureesRef.current.workMinutes));
  }, [clearTimer]);

  const skip = useCallback(() => {
    clearTimer();
    avancer(Date.now());
  }, [clearTimer, avancer]);

  useEffect(() => {
    if (etat.phase === "idle" || etat.enPause) {
      clearTimer();
      return;
    }
    startTicking();
    return () => clearTimer();
  }, [etat.phase, etat.enPause, startTicking, clearTimer]);

  useEffect(() => {
    const auRetour = () => { if (document.visibilityState === "visible") recaler(); };
    document.addEventListener("visibilitychange", auRetour);
    return () => document.removeEventListener("visibilitychange", auRetour);
  }, [recaler]);

  /** Cycles acheves pendant que la page n etait pas montee, a enregistrer
   *  une seule fois au montage. */
  const cyclesRattrapes = useRef(reprise.current.aCrediter);
  const prendreCyclesRattrapes = useCallback(() => {
    const c = cyclesRattrapes.current;
    cyclesRattrapes.current = [];
    return c;
  }, []);

  /** Le cycle de travail en cours, tel qu il serait enregistre si on
   *  arretait maintenant. Null hors phase de travail, ou sous la minute. */
  const cycleEnCours = useCallback((): CycleAcheve | null => {
    if (etatRef.current.phase !== "work" || !debutCycleRef.current) return null;
    const minutes = Math.round((Date.now() - debutCycleRef.current) / 60000);
    if (minutes < 1) return null;
    return { minutes, debutISO: new Date(debutCycleRef.current).toISOString(), complet: false };
  }, []);

  return {
    phase: etat.phase,
    secondsLeft: etat.secondsLeft,
    progress,
    sessionsCompleted: etat.cycles,
    isPaused: etat.enPause,
    start,
    pause,
    resume,
    reset,
    skip,
    isRunning: etat.phase !== "idle",
    isActive: etat.phase !== "idle" && !etat.enPause,
    debutSessionISO: debutSessionRef.current,
    prendreCyclesRattrapes,
    cycleEnCours,
  };
}

/* ── Journees locales ──────────────────────────────────────────
 *
 * toISOString() produit une date UTC. Comparee a des journees
 * construites en heure locale, elle classait tout ce qui est fait entre
 * minuit et le decalage horaire sur la veille : total du jour faux, et
 * serie rompue sans raison pour quiconque travaille tard.
 * ────────────────────────────────────────────────────────────── */
function cleJour(d: Date): string {
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

export function usePomodoroSessions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: ["pomodoro-sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as PomodoroSession[];
    },
    enabled: !!user?.id,
  });

  const saveSession = useMutation({
    mutationFn: async (session: {
      duration_minutes: number;
      break_minutes: number;
      completed: boolean;
      linked_goal_id?: string | null;
      linked_todo_id?: string | null;
      started_at: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("pomodoro_sessions").insert({
        ...session,
        user_id: user.id,
        completed_at: session.completed ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pomodoro-sessions"] });
      if (user?.id && variables.completed) {
        trackPomodoroCompleted(user.id, variables.duration_minutes);
      }
    },
  });

  /** Journee d une session, en heure locale. */
  const jourDe = (s: PomodoroSession) => (s.completed_at ? cleJour(new Date(s.completed_at)) : null);

  const todayStats = (() => {
    const aujourdhui = cleJour(new Date());
    const duJour = (sessions.data || []).filter((s) => s.completed && jourDe(s) === aujourdhui);
    return {
      count: duJour.length,
      totalMinutes: duJour.reduce((acc, s) => acc + s.duration_minutes, 0),
    };
  })();

  const weeklyStats = (() => {
    const now = new Date();
    const days: { label: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const cle = cleJour(d);
      const dayLabel = d.toLocaleDateString(undefined, { weekday: "short" });
      const mins = (sessions.data || [])
        .filter((s) => s.completed && jourDe(s) === cle)
        .reduce((acc, s) => acc + s.duration_minutes, 0);
      days.push({ label: dayLabel, minutes: mins });
    }
    return days;
  })();

  const streak = (() => {
    const jours = new Set(
      (sessions.data || []).filter((s) => s.completed).map(jourDe).filter(Boolean) as string[],
    );
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (jours.has(cleJour(d))) count++;
      else break;
    }
    return count;
  })();

  const bestSession = (() => {
    const completed = (sessions.data || []).filter((s) => s.completed);
    if (completed.length === 0) return 0;
    return Math.max(...completed.map((s) => s.duration_minutes));
  })();

  return { sessions, saveSession, todayStats, weeklyStats, streak, bestSession };
}
