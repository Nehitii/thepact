import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Maximize, Minimize, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePomodoroTimer, usePomodoroSessions, type CycleAcheve } from "@/hooks/usePomodoro";
import { useGoals } from "@/hooks/useGoals";
import { useTodoList } from "@/hooks/useTodoList";
import { usePact } from "@/hooks/usePact";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { DSPageShell } from "@/components/ds";
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
  FocusSeal,
  FocusStats,
  FocusHistory,
  FocusMedia,
  FocusToolbar,
  FocusConfigPanel,
  FocusAmbientEffects,
  FocusFond,
  type VarianteFond,
  FocusControls,
  type FocusPanel,
} from "@/components/focus";

/* Reglages et objectif lie survivent au demontage, comme la session
   elle-meme : revenir sur la page avec un minuteur de 45 minutes remis a
   25 serait aussi surprenant que de perdre le compte a rebours. */
const CLE_CONFIG = "vowpact.focus.config";
const CLE_LIEN = "vowpact.focus.lien";
const CLE_FOND = "vowpact.focus.fond";

/* L OBJET DE LA CLAUSE
 *
 * Une clause porte UN objet : un objectif, ou une tache, jamais les deux.
 * C etait deja le comportement a l ecran, mais il reposait sur une
 * convention — deux etats separes, et chaque gestionnaire qui pense a
 * vider l autre. Une troisieme voie d ecriture, ou un enregistrement
 * bricole dans le stockage, suffisait a poser les deux : verifie, rien
 * ne refusait { goal, todo } tous deux remplis.
 *
 * Un seul emplacement rend la chose impossible par construction, au lieu
 * de la rendre seulement improbable. Les deux colonnes de la base sont
 * derivees au moment de l ecriture, la ou elles existent vraiment. */
export type ObjetClause = { type: "goal" | "todo"; id: string } | null;

function lireObjet(): ObjetClause {
  try {
    const brut = localStorage.getItem(CLE_LIEN);
    if (!brut) return null;
    const o = JSON.parse(brut);
    if (o && (o.type === "goal" || o.type === "todo") && typeof o.id === "string") return o;
    // Ancien format { goal, todo } : on le replie sur un seul emplacement.
    if (o && typeof o.goal === "string") return { type: "goal", id: o.goal };
    if (o && typeof o.todo === "string") return { type: "todo", id: o.todo };
    return null;
  } catch {
    return null;
  }
}

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
  const objet0 = useRef(lireObjet()).current;

  const [workMin, setWorkMin] = useState(config0.work);
  const [breakMin, setBreakMin] = useState(config0.pause);
  const [longBreakMin, setLongBreakMin] = useState(config0.longue);
  const [objet, setObjet] = useState<ObjetClause>(objet0);
  // Derives, jamais stockes : c est ce qui garantit qu ils ne peuvent pas
  // etre remplis tous les deux.
  const linkedGoalId = objet?.type === "goal" ? objet.id : null;
  const linkedTodoId = objet?.type === "todo" ? objet.id : null;
  /* Le fond vivant, choisi par l utilisateur et retenu. Quatre scenes plus
     « aucune » : imposer une ambiance a quelqu un qui vient chercher le
     calme serait exactement le contraire du but de la page. */
  const [fond, setFond] = useState<VarianteFond>(() => {
    try {
      const lu = localStorage.getItem(CLE_FOND);
      return (lu as VarianteFond) || "mycelium";
    } catch { return "mycelium"; }
  });
  useEffect(() => {
    try { localStorage.setItem(CLE_FOND, fond); } catch { /* stockage indisponible */ }
  }, [fond]);

  const [activePanel, setActivePanel] = useState<FocusPanel>(null);

  /* Les panneaux nont pas la meme hauteur : passer de Stats a Historique
     raccourcit le document, le navigateur ramene le defilement dans les
     bornes, et il ne revient pas. Plutot que de figer une hauteur — ce
     qui rendrait la page vide a nouveau — on amene deliberement le
     panneau ouvert dans le champ. Le mouvement devient une reponse au
     clic au lieu dun effet de bord.
     block: "nearest" ne bouge rien si le panneau est deja visible. */
  const panneauRef = useRef<HTMLDivElement | null>(null);
  /* La plaque ne grandit plus que de la difference entre deux vues, mais
     une vue plus haute que les autres peut encore depasser le bas de
     l ecran. On l amene dans le champ APRES le glissement, et seulement
     si besoin : block "nearest" ne bouge rien quand la plaque tient deja
     entierement. Conditionner au besoin plutot qu a l ouverture evite un
     defilement gratuit a chaque bascule. */
  useEffect(() => {
    const t = setTimeout(() => {
      panneauRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 420);
    return () => clearTimeout(t);
  }, [activePanel]);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);

  useEffect(() => { ecrire(CLE_CONFIG, { work: workMin, pause: breakMin, longue: longBreakMin }); },
    [workMin, breakMin, longBreakMin]);
  useEffect(() => { ecrire(CLE_LIEN, objet); }, [objet]);

  /* Un objectif supprime laissait un champ vide plutot que « Aucun » :
     l identifiant survivait a sa cible. On ne verifie qu une fois la
     liste concernee chargee — la vider pendant le chargement effacerait
     un lien parfaitement valide. */
  useEffect(() => {
    if (!objet) return;
    const liste = objet.type === "goal" ? goals : tasks;
    if (liste.length === 0) return;
    if (!liste.some((x) => x.id === objet.id)) setObjet(null);
  }, [objet, goals, tasks]);

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
  const {
    start: demarrerMinuteur,
    pause: suspendreMinuteur,
    resume: reprendreMinuteur,
    skip: passerPhase,
    reset: reinitialiserMinuteur,
    cycleEnCours,
  } = timer;

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
    const onChange = () => {
      const actif = !!document.fullscreenElement;
      setIsFullscreen(actif);
      if (!actif) setImmersion(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* Mode immersion : le chrome de l application disparait.
     L attribut est pose sur la racine du document plutot que passe en
     propriete, parce que ce qu il faut cacher — barre laterale, palette,
     coach — vit hors de cette page. Il est retire au demontage : quitter
     Focus en immersion laisserait sinon l application sans navigation. */
  const [immersion, setImmersion] = useState(false);
  useEffect(() => {
    const racine = document.documentElement;
    if (immersion) racine.setAttribute("data-immersion", "");
    else racine.removeAttribute("data-immersion");
    return () => racine.removeAttribute("data-immersion");
  }, [immersion]);

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

  /* L immersion ne depend pas du plein ecran : un navigateur peut le
     refuser, et le bouton doit alors faire quelque chose quand meme. On
     bascule l immersion, et on demande le plein ecran par-dessus. */
  const toggleFullscreen = useCallback(() => {
    if (immersion) { setImmersion(false); exitFullscreen(); }
    else { setImmersion(true); enterFullscreen(); }
  }, [immersion, enterFullscreen, exitFullscreen]);

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
  /* Leve avant tout changement de phase provoque a la main. */
  const changementVoulu = useRef(false);
  const derniereNotif = useRef(0);

  useEffect(() => {
    if (timer.phase !== prevPhaseRef.current && timer.phase !== "idle") {
      const voulu = changementVoulu.current;
      changementVoulu.current = false;
      prevPhaseRef.current = timer.phase;

      if (voulu) return;

      if (!mouvementReduit) setShowFlash(true);
      const timeout = setTimeout(() => setShowFlash(false), 500);

      // Deuxieme filet : deux notifications a moins de dix secondes
      // d intervalle n apportent rien, elles s empilent.
      const maintenant = Date.now();
      if (
        "Notification" in window &&
        Notification.permission === "granted" &&
        maintenant - derniereNotif.current > 10_000
      ) {
        derniereNotif.current = maintenant;
        new Notification("THE PACT // Focus System", {
          body:
            timer.phase === "break"
              ? t("focus.notification.breakStart")
              : t("focus.notification.workResume"),
          icon: "/favicon.ico",
          // Une seule notification a l ecran : la suivante remplace la
          // precedente au lieu de s ajouter a la pile.
          tag: "vowpact-focus",
        });
      }

      return () => clearTimeout(timeout);
    }
    prevPhaseRef.current = timer.phase;
  }, [timer.phase, t, mouvementReduit]);

  // ── Handlers (memoized) ──
  const handleStart = useCallback(() => {
    play("ui");
    void demanderNotifications();
    changementVoulu.current = true;
    demarrerMinuteur();
  }, [play, demarrerMinuteur, demanderNotifications]);

  const handlePause = useCallback(() => {
    play("ui");
    suspendreMinuteur();
  }, [play, suspendreMinuteur]);

  const handleResume = useCallback(() => {
    play("ui");
    reprendreMinuteur();
  }, [play, reprendreMinuteur]);

  const confirmEnd = useCallback(() => {
    play("ui");
    // Les cycles acheves sont deja enregistres. Reste le cycle entame,
    // dont on garde la duree reellement ecoulee, marquee incomplete.
    const partiel = cycleEnCours();
    if (partiel) enregistrerCycle(partiel);
    reinitialiserMinuteur();
    setShowAbortConfirm(false);
  }, [play, cycleEnCours, reinitialiserMinuteur, enregistrerCycle]);

  const handleEnd = useCallback(() => {
    setShowAbortConfirm(true);
  }, []);

  const handleSkip = useCallback(() => {
    play("ui");
    changementVoulu.current = true;
    passerPhase();
    toast(t("focus.phaseSkipped"), { duration: 1500 });
  }, [play, passerPhase, t]);

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

  /* Reference du registre : la date du jour et le rang de la clause.
     Pas un numero decoratif — il se lit et il est vrai. */
  const reference = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const jj = String(d.getDate()).padStart(2, "0");
    const rang = String((timer.sessionsCompleted % 4) + 1).padStart(2, "0");
    return `VW·${mm}${jj}·${rang}`;
  }, [timer.sessionsCompleted]);

  /* Les quatre vues, dans l ordre des onglets : c est cet ordre qui donne
     le sens du glissement. */
  const vuesPanneaux = useMemo(
    () => [
      {
        id: "config" as const,
        contenu: (
          <div className="sc-panneau-corps">
            <FocusConfigPanel
              fond={fond}
              onFondChange={setFond}
              breakMin={breakMin}
              longBreakMin={longBreakMin}
              onBreakChange={setBreakMin}
              onLongBreakChange={setLongBreakMin}
            />
          </div>
        ),
      },
      {
        id: "media" as const,
        contenu: (
          <div className="sc-panneau-corps">
            <FocusMedia userId={user?.id} />
          </div>
        ),
      },
      {
        id: "stats" as const,
        contenu: (
          <div className="sc-panneau-corps">
            <FocusStats
              todayCount={todayStats.count}
              todayMinutes={todayStats.totalMinutes}
              streak={streak}
              bestSession={bestSession}
              weeklyData={weeklyStats}
            />
          </div>
        ),
      },
      {
        id: "history" as const,
        contenu: (
          <div className="sc-panneau-corps">
            <FocusHistory sessions={sessions.data || []} goals={goals} todos={tasks} />
          </div>
        ),
      },
    ],
    [fond, breakMin, longBreakMin, user?.id, todayStats.count, todayStats.totalMinutes,
     streak, bestSession, weeklyStats, sessions.data, goals, tasks],
  );

  const isBreak = timer.phase === "break";
  const frameColor = timer.isRunning ? (isBreak ? "border-accent/40" : "border-primary/40") : "border-border/30";
  // 2,15 : 1 mesure sur ces libelles a 11 px, pour un plancher a 4,5.
  // Ils portaient une donnee reelle — le pourcentage d avancement — noyee
  // dans de la telemetrie de decor.
  const textColor = timer.isRunning ? (isBreak ? "text-accent/80" : "text-primary/80") : "text-muted-foreground/60";

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
          {/* Quantifie : l intensite du halo suit l avancement, mais par
              paliers de 5 % au lieu de changer chaque seconde. Le degrade
              et le flou ne sont donc rasterises que vingt fois par
              session, pas mille cinq cents. */}
          <FocusAmbientEffects
            progress={timer.isRunning ? Math.round(timer.progress * 20) / 20 : 0}
            isBreak={isBreak}
            statique={!timer.isRunning}
            sansParticules={fond !== "aucun"}
          />
          <FocusFond
            variante={fond}
            actif={timer.isRunning}
            progress={Math.round(timer.progress * 20) / 20}
            isBreak={isBreak}
          />
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

        {/* Colonnes de telemetrie.
            Decor, et marquees comme telles : la seule donnee reelle qu elles
            portent — l avancement — est exposee proprement sur la barre de
            progression et dans la region vocale. Un lecteur d ecran n a
            rien a faire de « Latency 12 ms ». */}
        {!isMobile && (
          <div aria-hidden="true">
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
          </div>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {annonce}
      </p>

      <div className="flex-1 flex flex-col relative">
        <header className="sc-bandeau">
          <span className="sc-bandeau-marque" aria-hidden="true">◈ {t("focus.doc.mark")}</span>
          <h1 className="sc-bandeau-titre">{t("focus.doc.title")}</h1>
          <span className="sc-bandeau-fil" aria-hidden="true" />
          <span className="sc-bandeau-ref">{reference}</span>
          <button
            type="button"
            className="sc-immersion"
            onClick={toggleFullscreen}
            aria-pressed={immersion}
            aria-label={immersion ? t("focus.immersion.exit") : t("focus.immersion.enter")}
          >
            {immersion ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            <span>{immersion ? t("focus.immersion.exitShort") : t("focus.immersion.enterShort")}</span>
          </button>
        </header>

        <div className="flex flex-col items-center gap-4 sm:gap-6 mt-4 sm:mt-8">
          <FocusSeal
            phase={timer.phase}
            progress={timer.progress}
            secondsLeft={timer.secondsLeft}
            isPaused={timer.isPaused}
            sessionsCompleted={timer.sessionsCompleted}
            workMinutes={workMin}
            totalSeconds={timer.totalSeconds}
            targetName={linkedName}
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
            <motion.div ref={panneauRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex justify-center mt-4">
              <FocusToolbar
                goals={goals}
                todos={tasks}
                workMin={workMin}
                onWorkChange={setWorkMin}
                objet={objet}
                onObjetChange={setObjet}
                activePanel={activePanel}
                onPanelChange={setActivePanel}
                panneaux={vuesPanneaux}
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

          {timer.isRunning && (
            <div className="w-full max-w-lg mx-auto mt-2 relative z-20">
              <FocusMedia userId={user?.id} compact />
            </div>
          )}

        </div>
      </div>

      {/* Abort Confirmation Dialog */}
      <AlertDialog open={showAbortConfirm} onOpenChange={setShowAbortConfirm}>
        <AlertDialogContent className="sc-dialogue">
          <AlertDialogHeader>
            <AlertDialogTitle className="sc-dialogue-titre">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              {t("focus.abort.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="sc-dialogue-texte">
              {t("focus.abort.message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sc-dialogue-pied">
            <AlertDialogCancel className="cyb">{t("focus.abort.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEnd} className="cyb cyb--danger">
              {t("focus.abort.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DSPageShell>
  );
}
