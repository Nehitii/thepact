import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Zap, Check, ArrowLeft, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// --- Types & Constants ---

interface PactData {
  id: string;
  checkin_total_count: number;
  checkin_streak: number;
  last_checkin_date: string | null;
}

enum RitualState {
  IDLE = "idle",
  PRESSING = "pressing", // 0-2%
  CHARGING = "charging", // 2-50%
  RADIATING = "radiating", // 50-85%
  CRITICAL = "critical", // 85-99% (Screen shake, distortion)
  IMPLOSION = "implosion", // 99-100% (Sucks in)
  EXPLOSION = "explosion", // 100% (White flash)
  SOUL_CONNECTED = "soul_connected",
  LOCKED = "locked",
}

const HOLD_DURATION = 20000;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// Fonction pour générer un nombre aléatoire pour le tremblement
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export default function TheCall() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- State ---
  const [pactData, setPactData] = useState<PactData | null>(null);
  const [ritualState, setRitualState] = useState<RitualState>(RitualState.IDLE);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);

  // --- Refs ---
  const containerRef = useRef<HTMLDivElement>(null); // Pour faire trembler tout l'écran
  const coreRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const isHoldingRef = useRef(false);
  const hasCompletedRef = useRef(false);

  // --- Data Fetching ---
  useEffect(() => {
    if (user) fetchPactData();
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
      setRitualState(done ? RitualState.LOCKED : RitualState.IDLE);
      setProgress(done ? 100 : 0);
      hasCompletedRef.current = done;
    }
  };

  const saveCheckInData = async () => {
    if (!pactData) return;
    const todayStr = new Date().toLocaleDateString("en-CA");

    // Optimistic UI update logic handled here or simple fetch refresh
    // For brevity, assuming update works:
    const { error } = await supabase
      .from("pacts")
      .update({
        checkin_total_count: (pactData.checkin_total_count || 0) + 1,
        checkin_streak: (pactData.checkin_streak || 0) + 1, // Simplified logic
        last_checkin_date: todayStr,
      })
      .eq("id", pactData.id);

    if (error) console.error("Save error", error);
  };

  // --- Animation Loop ---

  const determineState = (p: number): RitualState => {
    if (p <= 0) return RitualState.IDLE;
    if (p < 2) return RitualState.PRESSING;
    if (p < 50) return RitualState.CHARGING;
    if (p < 85) return RitualState.RADIATING;
    if (p < 99.5) return RitualState.CRITICAL;
    return RitualState.IMPLOSION;
  };

  const updateVisuals = useCallback((p: number) => {
    // Gestion du tremblement d'écran (Camera Shake)
    if (containerRef.current) {
      if (p > 85 && p < 100) {
        // Intensité exponentielle vers la fin
        const intensity = Math.pow((p - 85) / 15, 3) * 15;
        const x = randomRange(-intensity, intensity);
        const y = randomRange(-intensity, intensity);
        const rot = randomRange(-intensity * 0.1, intensity * 0.1);

        // Aberration Chromatique simulée via text-shadow ou filter
        const blur = (p - 85) / 10; // Slight blur

        containerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
        containerRef.current.style.filter = `blur(${blur}px) contrast(${1 + blur / 5})`;
      } else {
        containerRef.current.style.transform = "none";
        containerRef.current.style.filter = "none";
      }
    }
  }, []);

  const animate = useCallback(() => {
    if (!isHoldingRef.current) return;

    const elapsed = performance.now() - startRef.current;
    let p = clamp((elapsed / HOLD_DURATION) * 100, 0, 100);

    // Dev acceleration for testing (optional)
    // p = clamp(p * 2, 0, 100);

    setProgress(p);
    setRitualState(determineState(p));
    updateVisuals(p);

    if (p >= 100 && !hasCompletedRef.current) {
      finishRitual();
    } else {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [updateVisuals]);

  const startHolding = (e: React.PointerEvent) => {
    if (completedToday || isProcessing || hasCompletedRef.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    isHoldingRef.current = true;
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);
  };

  const stopHolding = () => {
    if (hasCompletedRef.current) return;
    isHoldingRef.current = false;
    cancelAnimationFrame(rafRef.current);

    // Clean reset visuals
    if (containerRef.current) {
      containerRef.current.style.transform = "none";
      containerRef.current.style.filter = "none";
    }

    // Snap back animation
    const snapBack = () => {
      setProgress((prev) => {
        const next = prev - 4; // Vitesse de retour
        if (next <= 0) {
          setRitualState(RitualState.IDLE);
          return 0;
        }
        requestAnimationFrame(snapBack);
        return next;
      });
    };
    snapBack();
  };

  const finishRitual = async () => {
    isHoldingRef.current = false;
    hasCompletedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    setIsProcessing(true);

    // 1. Implosion (handled by CSS via state change)
    setRitualState(RitualState.IMPLOSION);

    // 2. Wait for implosion crunch
    await new Promise((r) => setTimeout(r, 400));

    // 3. EXPLOSION (Flash White)
    setRitualState(RitualState.EXPLOSION);
    if (user && !completedToday) saveCheckInData();

    // 4. Soul Connected Text Reveal
    await new Promise((r) => setTimeout(r, 200)); // Short delay white screen
    setRitualState(RitualState.SOUL_CONNECTED);

    // 5. Reset to Locked after display
    await new Promise((r) => setTimeout(r, 4000));
    setRitualState(RitualState.LOCKED);
    setCompletedToday(true);
    setIsProcessing(false);
  };

  // --- Derived Values ---

  const circumference = 2 * Math.PI * 90; // r=90
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Helpers for CSS logic
  const isIdle = ritualState === RitualState.IDLE;
  const isCharging = [RitualState.PRESSING, RitualState.CHARGING, RitualState.RADIATING, RitualState.CRITICAL].includes(
    ritualState,
  );
  const isCritical = ritualState === RitualState.CRITICAL;
  const isExplosion = ritualState === RitualState.EXPLOSION;
  const isSoul = ritualState === RitualState.SOUL_CONNECTED;
  const isLocked = ritualState === RitualState.LOCKED;

  return (
    // MAIN WRAPPER: Handles the background and the "Shake" effect via ref
    <div className="min-h-screen bg-[#050505] overflow-hidden flex flex-col relative text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* BACKGROUND LAYERS */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Dynamic Nebula */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] transition-all duration-1000"
          style={{
            background: isCritical
              ? "radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(0,0,0,0) 70%)"
              : isSoul
                ? "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(0,0,0,0) 70%)"
                : "radial-gradient(circle, rgba(6,182,212,0.03) 0%, rgba(0,0,0,0) 70%)",
            transform: isCharging
              ? `translate(-50%, -50%) scale(${1 + progress / 50})`
              : "translate(-50%, -50%) scale(1)",
          }}
        />
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      </div>

      {/* SHAKE CONTAINER (Ref applied here) */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 will-change-transform"
      >
        {/* HEADER */}
        <header
          className={`absolute top-0 left-0 w-full p-6 flex justify-between items-center transition-opacity duration-500 ${isSoul || isExplosion ? "opacity-0" : "opacity-100"}`}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white/40 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-500/50">Streak</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{pactData?.checkin_streak || 0}</div>
          </div>
        </header>

        {/* CORE INTERACTION AREA */}
        <div className="relative">
          {/* SOUL CONNECTED TEXT (Appears after explosion) */}
          {isSoul && (
            <div className="absolute inset-0 flex items-center justify-center z-50 animate-in fade-in zoom-in duration-1000">
              <div className="text-center">
                <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 tracking-tighter drop-shadow-[0_0_30px_rgba(6,182,212,0.8)] animate-pulse-slow">
                  SOUL
                  <br />
                  CONNECTED
                </h1>
                <p className="text-cyan-200/60 mt-4 tracking-[0.5em] text-sm font-mono uppercase animate-slide-up">
                  Frequency Harmonized
                </p>
              </div>
            </div>
          )}

          {/* WHITE FLASH OVERLAY */}
          <div
            className={`fixed inset-0 bg-white pointer-events-none z-[100] transition-opacity duration-[2000ms] ${isExplosion ? "opacity-100 duration-75" : "opacity-0"}`}
          />

          {/* THE BUTTON */}
          <div
            className={`relative group transition-all duration-300 ${isSoul ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
            style={{
              // Pass current progress to CSS for advanced control
              ["--p" as any]: progress / 100,
            }}
          >
            {/* Shockwaves (CSS Generated) */}
            {isCharging && (
              <>
                <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping-slow" />
                <div className="absolute inset-[-20px] rounded-full border border-purple-500/10 animate-ping-slower animation-delay-500" />
              </>
            )}

            {/* Main Button */}
            <button
              ref={coreRef}
              onPointerDown={startHolding}
              onPointerUp={stopHolding}
              onPointerLeave={stopHolding}
              className={`
                        relative w-64 h-64 rounded-full flex items-center justify-center
                        border-2 backdrop-blur-md transition-all duration-100
                        ${
                          isLocked
                            ? "border-green-500/30 bg-green-900/10 cursor-default"
                            : "border-cyan-500/30 bg-black/40 cursor-pointer hover:border-cyan-400/50"
                        }
                        ${ritualState === RitualState.IMPLOSION ? "scale-[0.01] opacity-0 duration-300 ease-in-expo" : ""}
                    `}
              style={{
                boxShadow: isCharging
                  ? `0 0 ${20 + progress}px rgba(6,182,212, ${0.2 + progress / 200}), inset 0 0 ${progress / 2}px rgba(168,85,247, ${progress / 300})`
                  : isLocked
                    ? "0 0 30px rgba(34,197,94,0.2)"
                    : "0 0 0 transparent",
              }}
            >
              {/* Progress SVG Ring */}
              {!isLocked && (
                <svg className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90 pointer-events-none overflow-visible">
                  {/* Glow Filter Def */}
                  <defs>
                    <filter id="glow-ring">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Track */}
                  <circle cx="50%" cy="50%" r="90" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                  {/* Active Progress */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r="90"
                    fill="transparent"
                    stroke={progress > 85 ? "#a855f7" : "#06b6d4"} // Cyan to Purple
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    filter="url(#glow-ring)"
                    style={{ transition: "stroke-dashoffset 0ms linear, stroke 0.3s ease" }}
                  />
                </svg>
              )}

              {/* Inner Content */}
              <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                {isLocked ? (
                  <Check className="w-16 h-16 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                ) : (
                  <>
                    {/* Dynamic Icon */}
                    <div className={`transition-transform duration-100 ${isCritical ? "animate-vibrate" : ""}`}>
                      {progress > 85 ? (
                        <Zap className="w-16 h-16 text-white fill-purple-200 drop-shadow-[0_0_20px_rgba(168,85,247,1)]" />
                      ) : (
                        <Fingerprint
                          className={`w-16 h-16 transition-colors duration-300 ${isCharging ? "text-cyan-200" : "text-cyan-500/50"}`}
                          style={{ opacity: 0.5 + progress / 200 }}
                        />
                      )}
                    </div>

                    {/* Timer / Text */}
                    <div className="mt-4 font-mono text-sm tracking-widest text-cyan-100/70 h-6">
                      {isCharging ? (
                        <span className="tabular-nums">{(20 - (progress / 100) * 20).toFixed(1)}s</span>
                      ) : (
                        <span className="opacity-50">HOLD</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Particles (CSS generated) */}
              {isCharging && (
                <div className="absolute inset-0 overflow-hidden rounded-full mask-image-radial">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full animate-implode-particle"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `rotate(${i * 30}deg) translateY(${120}px)`,
                        animationDelay: `${Math.random() * 2}s`,
                        opacity: progress / 100,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          </div>

          {/* Status Text Below */}
          {!isSoul && !isExplosion && (
            <div className="absolute -bottom-24 left-0 w-full text-center">
              <p
                className={`text-sm font-light tracking-[0.2em] transition-colors duration-300 ${isCritical ? "text-red-300 animate-pulse" : "text-slate-500"}`}
              >
                {ritualState === RitualState.IDLE && "INITIATE LINK"}
                {ritualState === RitualState.CHARGING && "SYNCHRONIZING..."}
                {ritualState === RitualState.RADIATING && "ENERGY RISING"}
                {ritualState === RitualState.CRITICAL && "CRITICAL MASS"}
                {ritualState === RitualState.LOCKED && "LINK ESTABLISHED"}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* --- ANIMATIONS CUSTOMES --- */
        
        @keyframes ping-slow {
            0% { transform: scale(1); opacity: 0.4; border-color: rgba(6,182,212,0.4); }
            100% { transform: scale(1.5); opacity: 0; border-color: rgba(6,182,212,0); }
        }
        
        @keyframes ping-slower {
            0% { transform: scale(1); opacity: 0.3; }
            100% { transform: scale(1.8); opacity: 0; }
        }

        @keyframes implode-particle {
            0% { transform: rotate(var(--angle)) translateY(120px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: rotate(var(--angle)) translateY(0px); opacity: 0; }
        }

        @keyframes vibrate {
            0% { transform: translate(0,0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
            100% { transform: translate(0,0); }
        }

        @keyframes pulse-slow {
            0%, 100% { opacity: 0.8; filter: brightness(1); }
            50% { opacity: 1; filter: brightness(1.2); }
        }

        @keyframes slide-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }

        .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-ping-slower { animation: ping-slower 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-vibrate { animation: vibrate 0.1s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 1s ease-out forwards 0.5s; opacity: 0; }
        
        .ease-in-expo { transition-timing-function: cubic-bezier(0.95, 0.05, 0.795, 0.035); }
        
        /* Utility to rotate particles via style prop */
        .mask-image-radial {
            mask-image: radial-gradient(circle, transparent 30%, black 100%);
        }
      `}</style>
    </div>
  );
}
