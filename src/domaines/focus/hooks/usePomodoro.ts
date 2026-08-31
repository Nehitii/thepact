import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";
import { trackPomodoroCompleted } from "@/domaines/succes";
import type {
  PomodoroPhase, PomodoroSession, CycleAcheve,
} from "@/domaines/focus/types";
import { CLE_SESSION, AU_REPOS, secondesDePause, oublierSession, restaurer, type Reprise, type SessionPersistee } from "@/domaines/focus/logique/sessionSauvegardee";
import { jourLocal } from "@/socle/outils/jour";
import type { EtatMinuteur } from "@/domaines/focus/types";
/* Reexportes : les appelants importaient ces formes depuis ce fichier. */
export type {
  PomodoroPhase, PomodoroSession, CycleAcheve,
};

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
    // Duree totale de la phase en cours : la telemetrie affiche le temps
    // ECOULE, qui ne se deduit pas du seul temps restant.
    totalSeconds: etat.totalPhase,
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
        // Cinquante lignes ne suffisent plus : chaque cycle est desormais
        // sa propre ligne, et la serie se calcule sur ce que rapporte
        // cette requete — elle se serait coupee silencieusement au
        // cinquantieme enregistrement.
        .order("created_at", { ascending: false })
        .limit(400);
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
  const jourDe = (s: PomodoroSession) => (s.completed_at ? jourLocal(new Date(s.completed_at)) : null);

  const todayStats = (() => {
    const aujourdhui = jourLocal(new Date());
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
      const cle = jourLocal(d);
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
      if (jours.has(jourLocal(d))) count++;
      else break;
    }
    return count;
  })();

  // Le plus long cycle mene a son terme. Avant, duration_minutes portait
  // la duree CONFIGUREE : regler 45 minutes et s arreter a 3 donnait un
  // record de 45.
  const bestSession = (() => {
    const completed = (sessions.data || []).filter((s) => s.completed);
    if (completed.length === 0) return 0;
    return Math.max(...completed.map((s) => s.duration_minutes));
  })();

  return { sessions, saveSession, todayStats, weeklyStats, streak, bestSession };
}
