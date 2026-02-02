import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Check, ArrowLeft, Lock, RefreshCw, Play, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- CONFIGURATION ---
const HOLD_DURATION = 20000; // 20 vraies secondes

// --- TYPES ---
interface PactData {
  id: string;
  checkin_total_count: number;
  checkin_streak: number;
  last_checkin_date: string | null;
}

enum FinalSequenceState {
  IDLE = "idle",
  IMPLOSION = "implosion",
  SINGULARITY = "singularity",
  EXPLOSION = "explosion",
  REVEAL = "reveal",
  LOCKED = "locked",
}

// --- UTILS ---
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
const easeInExpo = (x: number) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10));

export default function TheCall() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- STATE ---
  const [pactData, setPactData] = useState<PactData | null>(null);
  const [sequenceState, setSequenceState] = useState<FinalSequenceState>(FinalSequenceState.IDLE);
  const [completedToday, setCompletedToday] = useState(false);
  const [normalizedProgress, setNormalizedProgress] = useState(0);

  // --- REFS ---
  const screenShakeRef = useRef<HTMLDivElement>(null);
  const backgroundFxRef = useRef<HTMLDivElement>(null);
  const coreButtonRef = useRef<HTMLButtonElement>(null);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isHoldingRef = useRef(false);
  const hasCompletedRef = useRef(false);

  // NOUVEAU: Pour contrôler la vitesse du temps (x1 en normal, x5 en dev)
  const timeSpeedRef = useRef<number>(1);
  // NOUVEAU: Pour savoir si on est en mode "Auto-Play" (sans clic)
  const isAutoPlayingRef = useRef(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (user) fetchPactData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPactData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("pacts")
      .select("id, checkin_total_count, checkin_streak, last_checkin_date")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data && !error) {
      setPactData(data);
      const today = new Date().toLocaleDateString("en-CA");
      const last = data.last_checkin_date ? new Date(data.last_checkin_date).toLocaleDateString("en-CA") : null;
      const done = today === last;

      setCompletedToday(done);
      setSequenceState(done ? FinalSequenceState.LOCKED : FinalSequenceState.IDLE);
      setNormalizedProgress(done ? 1 : 0);
      hasCompletedRef.current = done;
    }
  };

  const saveCheckInData = async () => {
    // En mode Dev/AutoPlay, on évite d'écrire en base pour ne pas polluer les données
    if (isAutoPlayingRef.current || timeSpeedRef.current > 1) {
      console.log("DEV MODE: Database update skipped");
      return;
    }

    if (!pactData) return;
    const todayStr = new Date().toLocaleDateString("en-CA");
    await supabase
      .from("pacts")
      .update({
        checkin_total_count: (pactData.checkin_total_count || 0) + 1,
        checkin_streak: (pactData.checkin_streak || 0) + 1,
        last_checkin_date: todayStr,
      })
      .eq("id", pactData.id);
  };

  // --- DEV TOOLS (Reset & Replay) ---
  const devReset = () => {
    // 1. Stop Loop
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // 2. Reset Refs
    isHoldingRef.current = false;
    hasCompletedRef.current = false;
    isAutoPlayingRef.current = false;
    timeSpeedRef.current = 1; // Retour à vitesse normale

    // 3. Reset State & DOM
    setCompletedToday(false);
    setSequenceState(FinalSequenceState.IDLE);
    setNormalizedProgress(0);
    resetPhysicalEffects();
  };

  const devAutoPlay = (speedMultiplier: number = 1) => {
    devReset();
    // Petit timeout pour laisser React faire le reset avant de lancer
    setTimeout(() => {
      isHoldingRef.current = true;
      isAutoPlayingRef.current = true;
      timeSpeedRef.current = speedMultiplier;
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(animate);
    }, 50);
  };

  // --- MOTEUR PHYSIQUE ---

  const applyCinematicEffects = useCallback(
    (progress: number) => {
      if (hasCompletedRef.current || sequenceState !== FinalSequenceState.IDLE) {
        resetPhysicalEffects();
        return;
      }

      const rawIntensity = easeInExpo(progress);
      const intensity = clamp(rawIntensity, 0, 1);

      if (screenShakeRef.current) {
        const shakeMax = 35 * intensity;
        const rotateMax = 2 * intensity;

        const x = (Math.random() - 0.5) * 2 * shakeMax;
        const y = (Math.random() - 0.5) * 2 * shakeMax;
        const r = (Math.random() - 0.5) * 2 * rotateMax;

        const rgbSplit = 10 * intensity;
        const blurAmount = 3 * intensity;

        screenShakeRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${r}deg) scale(${1 + intensity * 0.05})`;
        screenShakeRef.current.style.textShadow = `
            ${rgbSplit}px 0 rgba(255, 0, 80, ${0.5 * intensity}), 
            -${rgbSplit}px 0 rgba(0, 255, 255, ${0.5 * intensity})
        `;
        if (intensity > 0.1) {
          screenShakeRef.current.style.filter = `blur(${blurAmount}px) contrast(${1 + intensity * 0.2})`;
        } else {
          screenShakeRef.current.style.filter = "none";
        }
      }

      if (coreButtonRef.current) {
        const breatheSpeed = 2 + intensity * 10;
        const breatheDepth = 0.02 + intensity * 0.08;
        const scale = 1 + Math.sin((performance.now() / 1000) * breatheSpeed) * breatheDepth + intensity * 0.15;

        let innerJitterX = 0,
          innerJitterY = 0;
        if (progress > 0.8) {
          const jitterIntensity = (progress - 0.8) * 5;
          innerJitterX = (Math.random() - 0.5) * 10 * jitterIntensity;
          innerJitterY = (Math.random() - 0.5) * 10 * jitterIntensity;
        }

        coreButtonRef.current.style.transform = `scale(${scale}) translate3d(${innerJitterX}px, ${innerJitterY}px, 0)`;
        coreButtonRef.current.style.setProperty("--intensity", intensity.toString());
      }

      if (backgroundFxRef.current) {
        const vignetteOpacity = 0.4 + intensity * 0.6;
        backgroundFxRef.current.style.opacity = vignetteOpacity.toString();
        backgroundFxRef.current.style.transform = `scale(${1 + intensity * 1.5})`;
      }
    },
    [sequenceState],
  );

  const resetPhysicalEffects = () => {
    if (screenShakeRef.current) {
      screenShakeRef.current.style.transform = "none";
      screenShakeRef.current.style.textShadow = "none";
      screenShakeRef.current.style.filter = "none";
    }
    if (coreButtonRef.current && sequenceState !== FinalSequenceState.IMPLOSION) {
      coreButtonRef.current.style.transform = "none";
    }
  };

  // --- BOUCLE D'ANIMATION ---
  const animate = () => {
    if (!isHoldingRef.current || hasCompletedRef.current) return;

    const now = performance.now();
    // ICI : On applique le multiplicateur de vitesse
    const elapsed = (now - startTimeRef.current) * timeSpeedRef.current;

    const progress = clamp(elapsed / HOLD_DURATION, 0, 1);

    setNormalizedProgress(progress);
    applyCinematicEffects(progress);

    if (progress >= 1) {
      finishCinematicSequence();
    } else {
      rafRef.current = requestAnimationFrame(animate);
    }
  };

  // --- GESTIONNAIRES ---
  const startHolding = (e: React.PointerEvent) => {
    if (completedToday || hasCompletedRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isHoldingRef.current = true;
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);
  };

  const stopHolding = () => {
    if (hasCompletedRef.current) return;

    // Si on est en AutoPlay, on ignore le relâchement de souris accidentel
    if (isAutoPlayingRef.current) return;

    isHoldingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    resetPhysicalEffects();

    const snapBack = () => {
      if (isHoldingRef.current || hasCompletedRef.current) return;
      setNormalizedProgress((prev) => {
        const next = prev - 0.05;
        if (next <= 0) return 0;
        rafRef.current = requestAnimationFrame(snapBack);
        return next;
      });
    };
    snapBack();
  };

  // --- SÉQUENCE FINALE ---
  const finishCinematicSequence = async () => {
    isHoldingRef.current = false;
    hasCompletedRef.current = true;
    isAutoPlayingRef.current = false; // Stop auto play
    cancelAnimationFrame(rafRef.current);
    resetPhysicalEffects();

    setSequenceState(FinalSequenceState.IMPLOSION);
    await new Promise((r) => setTimeout(r, 500));

    setSequenceState(FinalSequenceState.SINGULARITY);
    await new Promise((r) => setTimeout(r, 200));

    if (user && !completedToday) saveCheckInData();
    setSequenceState(FinalSequenceState.EXPLOSION);
    await new Promise((r) => setTimeout(r, 100));

    setSequenceState(FinalSequenceState.REVEAL);
    await new Promise((r) => setTimeout(r, 5000));

    setSequenceState(FinalSequenceState.LOCKED);
    setCompletedToday(true);
  };

  // --- CALCUL DES COULEURS ---
  const p = normalizedProgress;
  const isCritical = p > 0.85;

  let currentColor;
  if (p < 0.5) {
    currentColor = `rgb(${lerp(6, 139, p * 2)}, ${lerp(182, 92, p * 2)}, ${lerp(212, 246, p * 2)})`;
  } else if (p < 0.85) {
    const t = (p - 0.5) / 0.35;
    currentColor = `rgb(${lerp(139, 255, t)}, ${lerp(92, 0, t)}, ${lerp(246, 255, t)})`;
  } else {
    const t = (p - 0.85) / 0.15;
    currentColor = `rgb(${lerp(255, 255, t)}, ${lerp(0, 255, t)}, ${lerp(255, 255, t)})`;
  }

  const glowIntensity = isCritical
    ? `0 0 ${40 + p * 60}px ${currentColor}, inset 0 0 ${20 + p * 40}px ${currentColor}`
    : `0 0 ${p * 40}px ${currentColor}`;

  return (
    <div className="min-h-screen bg-[#010102] overflow-hidden flex flex-col relative text-slate-100 font-sans select-none touch-none perspective-[1000px]">
      {/* BACKGROUND FX */}
      <div
        ref={backgroundFxRef}
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-100 ease-out will-change-transform opacity-40"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vmax] h-[120vmax] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_60%)] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.08] mix-blend-overlay"></div>
      </div>

      {/* MAIN CONTAINER */}
      <div
        ref={screenShakeRef}
        className="relative z-10 flex-1 flex flex-col items-center justify-center will-change-transform transform-style-3d"
      >
        {/* HEADER */}
        <header
          className={`absolute top-0 left-0 w-full p-6 flex justify-between items-center transition-opacity duration-500 ${sequenceState === FinalSequenceState.IDLE || sequenceState === FinalSequenceState.LOCKED ? "opacity-100" : "opacity-0"}`}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white/30 hover:text-white hover:bg-white/5 font-mono text-xs tracking-[0.2em]"
          >
            <ArrowLeft className="w-3 h-3 mr-2" /> RETURN
          </Button>
          {pactData && (
            <div className="text-right font-mono">
              <div className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-1">Streak Protocol</div>
              <div className="text-lg text-cyan-300 font-bold">{pactData.checkin_streak}</div>
            </div>
          )}
        </header>

        <div className="relative flex flex-col items-center justify-center">
          {/* FINALS SEQUENCES */}
          <div
            className={`fixed inset-0 bg-black z-[90] pointer-events-none transition-opacity duration-200 ${sequenceState === FinalSequenceState.SINGULARITY ? "opacity-100" : "opacity-0"}`}
          />
          <div
            className={`fixed inset-0 bg-white z-[100] pointer-events-none transition-opacity ease-out ${sequenceState === FinalSequenceState.EXPLOSION ? "duration-75 opacity-100" : "duration-[3000ms] opacity-0"}`}
          />

          {sequenceState === FinalSequenceState.REVEAL && (
            <div className="absolute z-[110] flex flex-col items-center animate-reveal-majestic top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
              <div className="absolute inset-[-300px] bg-gradient-conic from-cyan-200/0 via-cyan-100/20 to-cyan-200/0 animate-god-rays opacity-50 blur-2xl -z-10"></div>
              <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-300 tracking-tighter drop-shadow-[0_0_50px_rgba(255,255,255,0.9)] leading-[0.9] mb-6">
                SOUL
                <br />
                CONNECTED
              </h1>
              <div className="h-[1px] width-0 bg-cyan-400/50 animate-expand-line"></div>
              <p className="text-cyan-200/70 font-mono text-xs uppercase tracking-[0.5em] mt-6 animate-slide-up">
                Ritual Synchronized
              </p>
            </div>
          )}

          {/* BUTTON CORE */}
          <div
            className={`relative transition-all will-change-transform ${sequenceState === FinalSequenceState.IMPLOSION ? "scale-0 opacity-0 duration-500 cubic-bezier(.69,.01,.84,.19)" : "scale-100 opacity-100 duration-100"} ${sequenceState === FinalSequenceState.REVEAL ? "hidden" : "block"}`}
          >
            <button
              ref={coreButtonRef}
              onPointerDown={startHolding}
              onPointerUp={stopHolding}
              onPointerLeave={stopHolding}
              disabled={completedToday}
              className={`
                        relative w-72 h-72 rounded-full flex items-center justify-center overflow-visible
                        border-[1px] transition-all duration-100 outline-none group
                        ${completedToday ? "border-green-500/30 cursor-default bg-green-900/5" : "border-white/10 cursor-pointer bg-black/40"}
                        [--intensity:0]
                    `}
              style={{
                boxShadow: !completedToday && p > 0 ? glowIntensity : "none",
                borderColor: isCritical
                  ? `rgba(255,255,255, ${p})`
                  : completedToday
                    ? "rgba(34,197,94,0.3)"
                    : "rgba(255,255,255,0.1)",
              }}
            >
              {!completedToday && p > 0 && (
                <>
                  <div
                    className="absolute inset-2 rounded-full blur-xl mix-blend-screen transition-colors duration-200 animate-pulse-plasma"
                    style={{ background: currentColor, opacity: 0.4 + p * 0.4 }}
                  />
                  <div
                    className="absolute inset-16 rounded-full blur-md mix-blend-overlay transition-colors duration-200"
                    style={{ background: isCritical ? "white" : currentColor, opacity: p }}
                  />
                </>
              )}

              {!completedToday && p > 0 && (
                <div className="absolute inset-[-100px] pointer-events-none rounded-full overflow-hidden [mask-image:radial-gradient(circle,transparent_30%,black_70%)]">
                  {[...Array(30)].map((_, i) => {
                    const angle = (i / 30) * 360;
                    const duration = lerp(3, 0.5, p);
                    const size = Math.random() * 2 + 1;
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 rounded-full animate-gravity-well mix-blend-screen"
                        style={{
                          width: `${size}px`,
                          height: `${size * 3}px`,
                          background: isCritical ? "white" : currentColor,
                          boxShadow: `0 0 ${size * 2}px ${currentColor}`,
                          transformOrigin: "0 150px",
                          transform: `rotate(${angle}deg) translateY(-150px)`,
                          animationDuration: `${duration}s`,
                          animationDelay: `${Math.random() * -2}s`,
                          opacity: p,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              <div
                className="relative z-20 flex flex-col items-center pointer-events-none"
                style={{ transform: `scale(${1 + p * 0.2})` }}
              >
                {completedToday ? (
                  <div className="flex flex-col items-center animate-pulse-slow text-green-500">
                    <Lock className="w-16 h-16 mb-4 drop-shadow-[0_0_15px_currentColor]" />
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-70">Protocol Locked</span>
                  </div>
                ) : (
                  <>
                    <Zap
                      className={`w-24 h-24 transition-all duration-200 ${isCritical ? "animate-vibrate-wild" : ""}`}
                      style={{
                        fill: p > 0.5 ? currentColor : "transparent",
                        stroke: p < 0.8 ? (p > 0 ? currentColor : "rgba(255,255,255,0.2)") : "transparent",
                        strokeWidth: 1.5,
                        filter: `drop-shadow(0 0 ${p * 30}px ${currentColor})`,
                      }}
                    />
                    <div className="mt-6 h-4 flex items-center justify-center font-mono text-xs tracking-[0.2em]">
                      {p > 0 ? (
                        <span
                          style={{
                            color: isCritical ? "white" : currentColor,
                            textShadow: `0 0 ${p * 20}px currentColor`,
                          }}
                          className="tabular-nums"
                        >
                          {(20 - p * 20).toFixed(2)}s
                        </span>
                      ) : (
                        <span className="text-white/30 group-hover:text-white/60 transition-colors">
                          HOLD TO INITIATE
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </button>
          </div>

          {!completedToday && sequenceState === FinalSequenceState.IDLE && (
            <div className="absolute top-[calc(100%+60px)] w-full text-center overflow-hidden">
              <p
                className="font-mono text-[9px] uppercase tracking-[0.5em] transition-all duration-200"
                style={{
                  color: isCritical ? "white" : currentColor,
                  opacity: p > 0 ? 0.7 + p * 0.3 : 0.3,
                  transform: isCritical ? `translateX(${(Math.random() - 0.5) * 10}px)` : "none",
                  textShadow: isCritical ? "2px 0 rgba(255,0,0,0.8), -2px 0 rgba(0,255,255,0.8)" : "none",
                }}
              >
                {p === 0 && "Awaiting Input"}
                {p > 0 && p < 0.5 && "Synchronizing..."}
                {p >= 0.5 && p < 0.85 && "Energy rising // Hold steady"}
                {p >= 0.85 && "CRITICAL // DO NOT RELEASE"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- DEV TOOLBAR (Pour le test) --- */}
      {/* Affiché discrètement en bas à droite pour tester l'animation à répétition */}
      <div className="fixed bottom-4 right-4 z-[200] flex gap-2 opacity-20 hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="icon" onClick={() => devReset()} title="Hard Reset">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={() => devAutoPlay(1)} title="Auto Play (Normal)">
          <Play className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={() => devAutoPlay(5)} title="Fast Forward (5x)">
          <FastForward className="w-4 h-4" />
        </Button>
      </div>

      <style>{`
        @keyframes pulse-plasma { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 0.8; } }
        .animate-pulse-plasma { animation: pulse-plasma 2s ease-in-out infinite; }
        
        @keyframes gravity-well {
            0% { transform: rotate(var(--start-angle)) translateY(-180px) scale(0.5); opacity: 0; }
            20% { opacity: var(--opacity); }
            100% { transform: rotate(calc(var(--start-angle) + 180deg)) translateY(0px) scale(0.1); opacity: 0; }
        }
        .animate-gravity-well { animation: gravity-well linear infinite; }

        @keyframes vibrate-wild {
            0% { transform: translate(0, 0) rotate(0); } 20% { transform: translate(-4px, 2px) rotate(-2deg); }
            40% { transform: translate(3px, -3px) rotate(1deg); } 60% { transform: translate(-3px, 4px) rotate(3deg); }
            80% { transform: translate(4px, -2px) rotate(-1deg); } 100% { transform: translate(0, 0) rotate(0); }
        }
        .animate-vibrate-wild { animation: vibrate-wild 0.08s linear infinite; }

        @keyframes reveal-majestic { 0% { opacity: 0; transform: translate(-50%, -40%) scale(1.1); filter: blur(20px); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0); } }
        .animate-reveal-majestic { animation: reveal-majestic 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes god-rays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-god-rays { animation: god-rays 60s linear infinite; }
        
        @keyframes expand-line { 0% { width: 0; opacity: 0; } 100% { width: 200px; opacity: 1; } }
        .animate-expand-line { animation: expand-line 1.5s ease-out forwards 0.5s; }
        
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 0.6; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 1s ease-out forwards 1s; opacity: 0; }

        .transform-style-3d { transform-style: preserve-3d; }
        .bg-gradient-conic { background-image: conic-gradient(var(--tw-gradient-stops)); }
      `}</style>
    </div>
  );
}
