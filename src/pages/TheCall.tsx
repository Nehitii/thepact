import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Check, ArrowLeft, Fingerprint, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Configuration ---
const HOLD_DURATION = 20000; // 20 secondes réelles

interface PactData {
  id: string;
  checkin_total_count: number;
  checkin_streak: number;
  last_checkin_date: string | null;
}

enum RitualState {
  IDLE = "idle",
  CHARGING = "charging", // 0-85%
  CRITICAL = "critical", // 85-99.9% (Tremblements violents)
  IMPLOSION = "implosion", // 100% (Le bouton disparaît)
  EXPLOSION = "explosion", // Flash blanc
  SOUL_CONNECTED = "soul_connected",
  LOCKED = "locked",
}

// Fonction utilitaire pour limiter les valeurs
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function TheCall() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- State React (Pour l'affichage UI) ---
  const [pactData, setPactData] = useState<PactData | null>(null);
  const [ritualState, setRitualState] = useState<RitualState>(RitualState.IDLE);
  const [completedToday, setCompletedToday] = useState(false);
  const [progress, setProgress] = useState(0);

  // --- Refs (Pour la performance et la physique) ---
  const containerShakeRef = useRef<HTMLDivElement>(null); // Le conteneur qui tremble
  const btnRef = useRef<HTMLButtonElement>(null); // Le bouton lui-même
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isHoldingRef = useRef(false);
  const hasCompletedRef = useRef(false);

  // --- Data Fetching ---
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
      setRitualState(done ? RitualState.LOCKED : RitualState.IDLE);
      setProgress(done ? 100 : 0);
      hasCompletedRef.current = done;
    }
  };

  const saveCheckInData = async () => {
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

  // --- Moteur Physique (Animation Loop) ---

  // Cette fonction gère le tremblement directement sur le DOM sans re-rendu React
  const applyPhysicalEffects = (p: number) => {
    if (!containerShakeRef.current) return;

    // Le tremblement commence doucement à 50% et devient fou à 85%+
    if (p > 50 && p < 100) {
      const intensityFactor = Math.max(0, (p - 50) / 50); // 0 à 1
      // Courbe exponentielle pour l'intensité (cube)
      const shakeAmount = Math.pow(intensityFactor, 3) * 20;

      const x = (Math.random() - 0.5) * shakeAmount;
      const y = (Math.random() - 0.5) * shakeAmount;
      const rot = (Math.random() - 0.5) * (shakeAmount * 0.1);

      // Appliquer les transfos
      containerShakeRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;

      // Aberration chromatique (RGB Split) vers la fin
      if (p > 85) {
        const split = (p - 85) * 0.3;
        containerShakeRef.current.style.textShadow = `${split}px 0 rgba(255,0,0,0.5), -${split}px 0 rgba(0,255,255,0.5)`;
        containerShakeRef.current.style.filter = `blur(${split * 0.1}px) contrast(1.1)`;
      }
    } else {
      // Reset propre
      containerShakeRef.current.style.transform = "none";
      containerShakeRef.current.style.textShadow = "none";
      containerShakeRef.current.style.filter = "none";
    }
  };

  const animate = () => {
    if (!isHoldingRef.current || hasCompletedRef.current) return;

    const now = performance.now();
    const elapsed = now - startTimeRef.current;

    // Calcul précis de la progression (0 à 100)
    const rawProgress = (elapsed / HOLD_DURATION) * 100;
    const p = clamp(rawProgress, 0, 100);

    // Mise à jour de l'état React (Progress Bar & Visuels)
    setProgress(p);

    // Gestion des phases
    if (p < 85) {
      setRitualState(RitualState.CHARGING);
    } else if (p < 100) {
      setRitualState(RitualState.CRITICAL);
    } else {
      // FIN DU RITUEL
      finishSequence();
      return; // On arrête la boucle ici
    }

    // Application des effets physiques (DOM direct)
    applyPhysicalEffects(p);

    // Boucle suivante
    rafRef.current = requestAnimationFrame(animate);
  };

  // --- Gestionnaires d'événements ---

  const startHolding = (e: React.PointerEvent) => {
    if (completedToday || hasCompletedRef.current) return;

    // Capture du pointeur CRUCIALE : permet de continuer même si la souris sort du bouton
    e.currentTarget.setPointerCapture(e.pointerId);

    isHoldingRef.current = true;
    startTimeRef.current = performance.now(); // On démarre le chrono à 0
    rafRef.current = requestAnimationFrame(animate);
  };

  const stopHolding = () => {
    if (hasCompletedRef.current) return;

    isHoldingRef.current = false;
    cancelAnimationFrame(rafRef.current);

    // Reset immédiat des effets physiques
    if (containerShakeRef.current) {
      containerShakeRef.current.style.transform = "none";
      containerShakeRef.current.style.textShadow = "none";
      containerShakeRef.current.style.filter = "none";
    }

    // Animation de retour (Snap back)
    const snapBack = () => {
      if (isHoldingRef.current || hasCompletedRef.current) return;

      setProgress((prev) => {
        const next = prev - 3; // Vitesse de retour
        if (next <= 0) {
          setRitualState(RitualState.IDLE);
          return 0;
        }
        rafRef.current = requestAnimationFrame(snapBack);
        return next;
      });
    };
    snapBack();
  };

  const finishSequence = async () => {
    isHoldingRef.current = false;
    hasCompletedRef.current = true;
    cancelAnimationFrame(rafRef.current);

    // 1. Implosion
    setRitualState(RitualState.IMPLOSION);
    await new Promise((r) => setTimeout(r, 400)); // Temps de l'implosion CSS

    // 2. Explosion (Flash)
    setRitualState(RitualState.EXPLOSION);
    if (user && !completedToday) saveCheckInData();
    await new Promise((r) => setTimeout(r, 100)); // Flash instantané

    // 3. Soul Connected
    setRitualState(RitualState.SOUL_CONNECTED);
    await new Promise((r) => setTimeout(r, 4000)); // Durée de l'affichage

    // 4. Locked
    setRitualState(RitualState.LOCKED);
    setCompletedToday(true);
  };

  // --- Valeurs dérivées pour le rendu ---
  const pNorm = progress / 100; // 0.0 à 1.0
  const isCharging = progress > 0 && !completedToday;
  const isCritical = ritualState === RitualState.CRITICAL;

  // Couleurs dynamiques
  const plasmaColor = isCritical
    ? "rgba(255, 255, 255, 0.9)" // Blanc pur en critique
    : `rgba(${6 + pNorm * 200}, ${182 - pNorm * 100}, 212, ${0.4 + pNorm * 0.6})`; // Cyan -> Violet

  return (
    <div className="min-h-screen bg-[#020203] overflow-hidden flex flex-col relative text-slate-100 font-sans select-none touch-none">
      {/* --- BACKGROUND AMBIANT --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Halo central qui grossit */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full blur-[100px] transition-all duration-100 ease-linear"
          style={{
            background: `radial-gradient(circle, ${plasmaColor} 0%, transparent 70%)`,
            opacity: isCharging ? 0.1 + pNorm * 0.3 : 0.05,
            transform: `translate(-50%, -50%) scale(${1 + pNorm * 0.5})`,
          }}
        />
        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E")',
          }}
        ></div>
      </div>

      {/* --- CONTENEUR PHYSIQUE (Tremblement) --- */}
      <div
        ref={containerShakeRef}
        className="relative z-10 flex-1 flex flex-col items-center justify-center will-change-transform"
      >
        {/* Header */}
        <header
          className={`absolute top-0 left-0 w-full p-6 flex justify-between items-center transition-opacity duration-300 ${ritualState === RitualState.SOUL_CONNECTED ? "opacity-0" : "opacity-100"}`}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white/30 hover:text-white hover:bg-white/5 font-mono text-xs tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> ABORT
          </Button>
          {pactData && (
            <div className="text-right font-mono">
              <div className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-1">Sync Streak</div>
              <div className="text-lg text-white font-bold">{pactData.checkin_streak}</div>
            </div>
          )}
        </header>

        {/* --- ZONE DU RITUEL --- */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Flash Blanc */}
          <div
            className={`fixed inset-0 bg-white z-50 pointer-events-none transition-opacity ${ritualState === RitualState.EXPLOSION ? "duration-75 opacity-100" : "duration-[2000ms] opacity-0"}`}
          />

          {/* Texte Final */}
          {ritualState === RitualState.SOUL_CONNECTED && (
            <div className="absolute z-40 flex flex-col items-center animate-appear">
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
                SOUL
                <br />
                CONNECTED
              </h1>
            </div>
          )}

          {/* Le Bouton (Cœur) */}
          <div
            className={`relative transition-all cubic-bezier(0.4, 0, 0.2, 1)
                ${ritualState === RitualState.IMPLOSION ? "scale-0 opacity-0 duration-300" : "scale-100 opacity-100 duration-100"}
                ${ritualState === RitualState.SOUL_CONNECTED ? "hidden" : "block"}
                `}
          >
            <button
              ref={btnRef}
              onPointerDown={startHolding}
              onPointerUp={stopHolding}
              onPointerLeave={stopHolding}
              disabled={completedToday}
              className={`
                        relative w-64 h-64 rounded-full flex items-center justify-center
                        border-[2px] transition-all duration-75 outline-none
                        ${
                          completedToday
                            ? "border-green-500/30 cursor-default bg-green-900/10"
                            : "border-white/10 cursor-pointer bg-black/20 hover:border-white/20 active:scale-[0.98]"
                        }
                    `}
              style={{
                boxShadow: isCharging
                  ? `0 0 ${pNorm * 60}px ${plasmaColor}, inset 0 0 ${pNorm * 40}px ${plasmaColor}`
                  : "none",
              }}
            >
              {/* Intérieur Plasma (CSS Pur) */}
              {!completedToday && isCharging && (
                <div
                  className="absolute inset-0 rounded-full opacity-50 blur-xl pointer-events-none mix-blend-screen animate-spin-slow"
                  style={{
                    background: `conic-gradient(from 0deg, transparent, ${plasmaColor}, transparent)`,
                  }}
                />
              )}

              {/* Anneau de Progression */}
              {!completedToday && (
                <svg className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90 pointer-events-none">
                  <circle cx="50%" cy="50%" r="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  {progress > 0 && (
                    <circle
                      cx="50%"
                      cy="50%"
                      r="100"
                      fill="none"
                      stroke={isCritical ? "#ffffff" : "#22d3ee"}
                      strokeWidth={2 + pNorm * 4}
                      strokeDasharray={2 * Math.PI * 100}
                      strokeDashoffset={2 * Math.PI * 100 * (1 - pNorm)}
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_8px_currentColor]"
                    />
                  )}
                </svg>
              )}

              {/* Icône / Contenu */}
              <div className="relative z-10 flex flex-col items-center pointer-events-none">
                {completedToday ? (
                  <div className="flex flex-col items-center animate-pulse-slow">
                    <Lock className="w-12 h-12 text-green-500/50 mb-2" />
                    <span className="text-green-500/50 text-[10px] tracking-widest uppercase">Sync Complete</span>
                  </div>
                ) : (
                  <>
                    {isCritical ? (
                      <Zap className="w-16 h-16 text-white animate-vibrate fill-white drop-shadow-[0_0_15px_white]" />
                    ) : (
                      <Fingerprint
                        className={`w-16 h-16 transition-all duration-500 ${isCharging ? "text-cyan-200" : "text-white/20"}`}
                        style={{ opacity: 0.3 + pNorm * 0.7 }}
                      />
                    )}

                    <div className="mt-4 h-4 flex items-center justify-center font-mono text-xs tracking-widest">
                      {isCharging ? (
                        <span className={isCritical ? "text-white" : "text-cyan-400"}>
                          {(20 - pNorm * 20).toFixed(1)}s
                        </span>
                      ) : (
                        <span className="text-white/20">HOLD</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Particules d'Aspiration (Warp Lines) */}
              {!completedToday && isCharging && (
                <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-[1px] h-[50px] origin-bottom bg-gradient-to-t from-transparent to-white animate-warp"
                      style={{
                        transform: `rotate(${i * 30}deg) translateY(-140px)`,
                        animationDuration: `${1.5 - pNorm}s`, // Accélère avec le temps
                        animationDelay: `${i * 0.1}s`,
                        opacity: pNorm, // Devient plus visible avec le temps
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          </div>

          {/* Texte de statut */}
          {!completedToday && ritualState !== RitualState.SOUL_CONNECTED && (
            <div className="absolute top-[calc(100%+40px)] w-full text-center">
              <p
                className={`font-mono text-[10px] uppercase tracking-[0.4em] transition-colors duration-300 ${isCritical ? "text-red-100 animate-vibrate" : "text-white/20"}`}
              >
                {ritualState === RitualState.IDLE && "Initiate Link"}
                {ritualState === RitualState.CHARGING && "Synchronizing..."}
                {ritualState === RitualState.CRITICAL && "Do not release"}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
            100% { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }

        @keyframes warp {
            0% { transform: rotate(var(--r)) translateY(-160px) scaleY(0); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: rotate(var(--r)) translateY(-30px) scaleY(1); opacity: 0; }
        }
        .animate-warp { animation: warp linear infinite; }

        @keyframes vibrate {
            0% { transform: translate(0, 0); }
            20% { transform: translate(-2px, 1px); }
            40% { transform: translate(2px, -1px); }
            60% { transform: translate(-1px, 2px); }
            80% { transform: translate(1px, -2px); }
            100% { transform: translate(0, 0); }
        }
        .animate-vibrate { animation: vibrate 0.05s linear infinite; }

        @keyframes pulse-slow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        
        @keyframes appear {
            0% { opacity: 0; transform: scale(0.9); filter: blur(10px); }
            100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .animate-appear { animation: appear 1s ease-out forwards; }
      `}</style>
    </div>
  );
}
