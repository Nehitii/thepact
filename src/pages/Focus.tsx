import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Maximize, Minimize } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePomodoroTimer, usePomodoroSessions, type CycleAcheve } from "@/hooks/usePomodoro";
import { useGoals } from "@/hooks/useGoals";
import { useTodoList } from "@/hooks/useTodoList";
import { usePact } from "@/hooks/usePact";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { DSPageShell, DSPageHeader } from "@/components/ds";
import "@/styles/focus.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FocusTimerRing,
  FocusStats,
  FocusHistory,
  SpotifyPlayer,
  FocusToolbar,
  FocusConfigPanel,
  FocusAmbientEffects,
  FocusControls,
  type FocusPanel,
} from "@/components/focus";

/* Reglages et objectif lie survivent au demontage, comme la session
   elle-meme : revenir sur la page avec un minuteur de 45 minutes remis a
   25 serait aussi surprenant que de perdre le compte a rebours. */
const CLE_CONFIG = "vowpact.focus.config";
const CLE_LIEN = "vowpact.focus.lien";

function lire<T>(cle: string, defaut: T): T {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? ({ ...defaut, ...(JSON.parse(brut) as object) } as T) : defaut;
  } catch {
    return defaut;
  }
}

function ecrire(cle: string, valeur: unknown) {
  try { localStorage.setItem(cle, JSON.stringify(valeur)); }
  catch { /* stockage indisponible */ }
}

export default function Focus() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const { tasks } = useTodoList();
  const { play } = useSound();
  const isMobile = useIsMobile();
  const mouvementReduit = useReducedMotion();

  const config0 = useRef(lire(CLE_CONFIG, { work: 25, pause: 5, longue: 15 })).current;
  const lien0 = useRef(lire(CLE_LIEN, { goal: null as string | null, todo: null as string | null })).current;

  const [workMin, setWorkMin] = useState(config0.work);
  const [breakMin, setBreakMin] = useState(config0.pause);
  const [longBreakMin, setLongBreakMin] = useState(config0.longue);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(lien0.goal);
  const [linkedTodoId, setLinkedTodoId] = useState<string | null>(lien0.todo);
  const [activePanel, setActivePanel] = useState<FocusPanel>(null);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);

  useEffect(() => { ecrire(CLE_CONFIG, { work: workMin, pause: breakMin, longue: longBreakMin }); },
    [workMin, breakMin, longBreakMin]);
  useEffect(() => { ecrire(CLE_LIEN, { goal: linkedGoalId, todo: linkedTodoId }); },
    [linkedGoalId, linkedTodoId]);

  const { saveSession, todayStats, weeklyStats, streak, bestSession, sessions } = usePomodoroSessions();

  /* Un cycle acheve = une ligne, ecrite au moment ou il s acheve.
   *
   * Avant, une seule ligne etait ecrite a la main sur TERMINER, avec la
   * duree CONFIGUREE : quatre pomodoros de 25 minutes enregistraient 25
   * minutes, et une session menee a son terme mais quittee sans clic
   * n enregistrait rien du tout. */
  const enregistrerCycle = useCallback((c: CycleAcheve) => {
    saveSession.mutate({
      duration_minutes: c.minutes,
      break_minutes: breakMin,
      completed: c.complet,
      linked_goal_id: linkedGoalId,
      linked_todo_id: linkedTodoId,
      started_at: c.debutISO,
    });
  }, [saveSession, breakMin, linkedGoalId, linkedTodoId]);

  const timer = usePomodoroTimer(workMin, breakMin, longBreakMin, enregistrerCycle);

  // Cycles franchis pendant que la page n etait pas montee.
  const cyclesFlushes = useRef(false);
  useEffect(() => {
    if (cyclesFlushes.current) return;
    cyclesFlushes.current = true;
    const rattrapes = timer.prendreCyclesRattrapes();
    if (rattrapes.length === 0) return;
    rattrapes.forEach(enregistrerCycle);
    toast(t("focus.resumed", { count: rattrapes.length }), { duration: 3000 });
  }, [timer, enregistrerCycle, t]);

  // ── Fullscreen (manual only) ──
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch { /* browser blocked */ }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch { /* ignored */ }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  /* ── Notifications ──
   *
   * La permission etait demandee au chargement, sans geste utilisateur :
   * les navigateurs refusent ou penalisent ces demandes, et rien
   * n indiquait ensuite que l alerte de fin n arriverait jamais. On la
   * demande au premier demarrage — un geste explicite — et on dit
   * clairement ce qu il se passe quand elle est refusee. */
  const [permNotif, setPermNotif] = useState<NotificationPermission | "absent">(
    () => ("Notification" in window ? Notification.permission : "absent"),
  );

  const demanderNotifications = useCallback(async () => {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    try { setPermNotif(await Notification.requestPermission()); }
    catch { /* refus silencieux du navigateur */ }
  }, []);

  // ── Session completion sound ──
  const prevSessionsRef = useRef(timer.sessionsCompleted);
  useEffect(() => {
    if (timer.sessionsCompleted > prevSessionsRef.current) {
      play("success", "reward");
    }
    prevSessionsRef.current = timer.sessionsCompleted;
  }, [timer.sessionsCompleted, play]);

  // ── Phase-change flash + notification ──
  const [showFlash, setShowFlash] = useState(false);
  const prevPhaseRef = useRef(timer.phase);

  useEffect(() => {
    if (timer.phase !== prevPhaseRef.current && timer.phase !== "idle") {
      if (!mouvementReduit) setShowFlash(true);
      const timeout = setTimeout(() => setShowFlash(false), 500);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("THE PACT // Focus System", {
          body:
            timer.phase === "break"
              ? t("focus.notification.breakStart")
              : t("focus.notification.workResume"),
          icon: "/favicon.ico",
        });
      }

      prevPhaseRef.current = timer.phase;
      return () => clearTimeout(timeout);
    }
    prevPhaseRef.current = timer.phase;
  }, [timer.phase, t, mouvementReduit]);

  // ── Handlers (memoized) ──
  const handleStart = useCallback(() => {
    play("ui");
    void demanderNotifications();
    timer.start();
  }, [play, timer, demanderNotifications]);

  const handlePause = useCallback(() => {
    play("ui");
    timer.pause();
  }, [play, timer]);

  const handleResume = useCallback(() => {
    play("ui");
    timer.resume();
  }, [play, timer]);

  const confirmEnd = useCallback(() => {
    play("ui");
    // Les cycles acheves sont deja enregistres. Reste le cycle entame,
    // dont on garde la duree reellement ecoulee, marquee incomplete.
    const partiel = timer.cycleEnCours();
    if (partiel) enregistrerCycle(partiel);
    timer.reset();
    setShowAbortConfirm(false);
  }, [play, timer, enregistrerCycle]);

  const handleEnd = useCallback(() => {
    setShowAbortConfirm(true);
  }, []);

  const handleSkip = useCallback(() => {
    play("ui");
    timer.skip();
    toast(t("focus.phaseSkipped", "Phase skipped"), { duration: 1500 });
  }, [play, timer, t]);

  // ── Terminal Overrides (Keyboard shortcuts) ──
  useEffect(() => {
    if (!timer.isRunning) return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (timer.isPaused) handleResume();
        else handlePause();
      } else if (e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSkip();
      } else if (e.key === "Escape") {
        e.preventDefault();
        // If in fullscreen, just exit fullscreen first
        if (document.fullscreenElement) {
          exitFullscreen();
        } else {
          handleEnd();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [timer.isRunning, timer.isPaused, handleSkip, handlePause, handleResume, handleEnd, exitFullscreen]);

  // ── Derived state ──
  const linkedGoal = linkedGoalId ? goals.find((g) => g.id === linkedGoalId) : null;
  const linkedName = linkedGoal?.name ?? (linkedTodoId ? tasks.find((t) => t.id === linkedTodoId)?.name : null);
  const linkedImageUrl = linkedGoal?.image_url ?? null;

  /* Region vocale : trois annonces par phase, pas une par minute.
     Une region qui se met a jour chaque minute diffuse encore le temps,
     et une session de vingt-cinq minutes produirait vingt-cinq
     interruptions. On annonce l entree dans la phase, puis les deux
     seuls seuils qui changent une decision : cinq minutes, une minute.
     Le temps restant exact, lui, est expose sur la barre de progression
     et se lit a la demande. */
  const annonce = (() => {
    if (timer.phase === "idle") return "";
    if (timer.isPaused) return t("focus.announce.paused");
    const minutes = Math.ceil(timer.secondsLeft / 60);
    const seuil = minutes <= 1 ? 1 : minutes <= 5 ? 5 : null;
    if (seuil === null) {
      return timer.phase === "break"
        ? t("focus.announce.breakStarted")
        : t("focus.announce.workStarted");
    }
    return timer.phase === "break"
      ? t("focus.announce.break", { count: seuil })
      : t("focus.announce.work", { count: seuil });
  })();

  const isBreak = timer.phase === "break";
  const frameColor = timer.isRunning ? (isBreak ? "border-accent/40" : "border-primary/40") : "border-border/30";
  const textColor = timer.isRunning ? (isBreak ? "text-accent/40" : "text-primary/40") : "text-muted-foreground/30";

  return (
    <DSPageShell
      width="sm"
      padding="tight"
      background={
        <>
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundColor: timer.isRunning
                ? isBreak
                  ? "rgba(var(--accent-rgb), 0.03)"
                  : "rgba(var(--primary-rgb), 0.03)"
                : "#050508",
            }}
            initial={{ backgroundColor: "#050508" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          {timer.isRunning && (
            // Quantifie : l intensite du halo suit l avancement, mais par
            // paliers de 5 % au lieu de changer chaque seconde. Le
            // degrade et le flou ne sont donc rasterises que vingt fois
            // par session, pas mille cinq cents.
            <FocusAmbientEffects
              progress={Math.round(timer.progress * 20) / 20}
              isBreak={isBreak}
            />
          )}
        </>
      }
      className="flex flex-col"
    >
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            aria-hidden="true"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: `radial-gradient(circle at center, hsl(var(--${isBreak ? "accent" : "primary"}) / 0.4) 0%, transparent 80%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-4 pointer-events-none z-0 border border-transparent" aria-hidden="true">
        {/* Corner Brackets */}
        <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 transition-colors duration-1000 ${frameColor}`} />
        <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 transition-colors duration-1000 ${frameColor}`} />
        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 transition-colors duration-1000 ${frameColor}`} />
        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 transition-colors duration-1000 ${frameColor}`} />

        {/* Vertical Data Streams */}
        {!isMobile && (
          <>
            <div className="absolute left-1 top-12 bottom-12 flex items-center justify-center w-6">
              <span className={`ds-t-label font-mono tracking-[0.3em] uppercase whitespace-nowrap -rotate-90 transition-colors duration-1000 ${textColor}`}>
                {t("focus.sideData.uplink")} {isBreak ? "B-RK" : "F-CS"}
              </span>
            </div>
            <div className="absolute right-1 top-12 bottom-12 flex items-center justify-center w-6">
              <span className={`ds-t-label font-mono tracking-[0.3em] uppercase whitespace-nowrap rotate-90 transition-colors duration-1000 ${textColor}`}>
                {t("focus.sideData.vitals")} {Math.round(timer.progress * 100)}%
              </span>
            </div>
          </>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {annonce}
      </p>

      <div className="flex-1 flex flex-col relative">
        {/* Le bouton vivait dans la couche des equerres, en z-0, tandis que
            l en-tete est en z-10 : des que le titre s elargissait par
            rapport a la fenetre, il passait par-dessus et le bouton
            devenait inatteignable au doigt. Mesure a 320 et 375 px :
            elementFromPoint renvoyait le titre, pas le bouton. Il vit
            maintenant dans le meme contexte d empilement que l en-tete. */}
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? t("focus.fullscreen.exit") : t("focus.fullscreen.enter")}
          className="absolute top-0 right-0 z-20 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/40 border border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-all duration-200 text-primary/60 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
          style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>

        <DSPageHeader
          variant="hud"
          title={t("focus.title")}
          titleAccent={t("focus.titleAccent")}
          systemLabel={t("focus.systemLabel")}
        />

        <div className="flex flex-col items-center gap-4 sm:gap-6 mt-4 sm:mt-8">
          {/* Target badge + session counter */}
          <div className="h-6 flex items-center justify-center gap-3">
            <AnimatePresence>
              {timer.isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-3"
                >
                  {linkedName && (
                    <div
                      className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-primary/30"
                      style={{ clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)" }}
                    >
                      <span className="ds-t-label font-mono text-primary/60 uppercase tracking-widest">{t("focus.target")}:</span>
                      <span className="ds-t-label font-mono text-primary font-bold tracking-wider truncate max-w-[200px] uppercase">
                        {linkedName}
                      </span>
                    </div>
                  )}
                  <div className="px-2 py-0.5 bg-black/40 border border-accent/30 text-accent ds-t-label font-mono uppercase tracking-widest">
                    {t("focus.session")} {(timer.sessionsCompleted % 4) + 1}/4
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <FocusTimerRing
            phase={timer.phase}
            progress={timer.progress}
            secondsLeft={timer.secondsLeft}
            isPaused={timer.isPaused}
            goalImageUrl={linkedImageUrl}
            onStart={handleStart}
          />

          {/* Une alerte qui n arrivera pas doit se dire. Sans ce repli,
              l utilisateur attend une notification que le navigateur a
              refusee, et il ne l apprend qu a ses depens. */}
          {timer.isRunning && permNotif === "denied" && (
            <p className="ds-t-label font-mono uppercase tracking-[0.14em] text-amber-300/70 text-center max-w-xs">
              {t("focus.notifications.blocked")}
            </p>
          )}

          {!timer.isRunning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex justify-center mt-4">
              <FocusToolbar
                goals={goals}
                todos={tasks}
                linkedGoalId={linkedGoalId}
                linkedTodoId={linkedTodoId}
                onLinkGoal={setLinkedGoalId}
                onLinkTodo={setLinkedTodoId}
                activePanel={activePanel}
                onPanelChange={setActivePanel}
              />
            </motion.div>
          )}

          {timer.isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[280px] sm:max-w-none sm:w-auto mx-auto mt-4 z-20 relative"
            >
              <FocusControls
                phase={timer.phase}
                isPaused={timer.isPaused}
                onPause={handlePause}
                onResume={handleResume}
                onSkip={handleSkip}
                onEnd={handleEnd}
              />
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activePanel && (!timer.isRunning || activePanel === "spotify") && (
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full flex justify-center z-20 relative mt-4"
              >
                <div
                  className="w-full max-w-lg relative bg-[#0a0a0c] border border-primary/20 p-2"
                  style={{
                    clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3 border-b border-primary/20 pb-2" aria-hidden="true">
                    <div className="w-1 h-3 bg-primary" />
                    <span className="ds-t-label font-mono text-primary uppercase tracking-[0.2em]">
                      {" >> "}{" "}
                      {activePanel === "spotify" ? "AUDIO_LINK_ESTABLISHED" : `${activePanel.toUpperCase()}_SYS`}
                    </span>
                  </div>

                  <div className="p-1">
                    {activePanel === "config" && !timer.isRunning && (
                      <FocusConfigPanel
                        workMin={workMin}
                        breakMin={breakMin}
                        longBreakMin={longBreakMin}
                        onWorkChange={setWorkMin}
                        onBreakChange={setBreakMin}
                        onLongBreakChange={setLongBreakMin}
                      />
                    )}
                    {activePanel === "spotify" && <SpotifyPlayer className="w-full compact-player" compact={false} userId={user?.id} />}
                    {activePanel === "stats" && !timer.isRunning && (
                      <FocusStats
                        todayCount={todayStats.count}
                        todayMinutes={todayStats.totalMinutes}
                        streak={streak}
                        bestSession={bestSession}
                        weeklyData={weeklyStats}
                      />
                    )}
                    {activePanel === "history" && !timer.isRunning && (
                      <FocusHistory
                        sessions={sessions.data || []}
                        goals={goals}
                        todos={tasks}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Abort Confirmation Dialog */}
      <AlertDialog open={showAbortConfirm} onOpenChange={setShowAbortConfirm}>
        <AlertDialogContent className="bg-card border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("focus.abort.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("focus.abort.message")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("focus.abort.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEnd} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("focus.abort.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DSPageShell>
  );
}
