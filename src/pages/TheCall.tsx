import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Check, ArrowLeft, Fingerprint } from "lucide-react";
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
  CHARGING = "charging", // 0-80%
  CRITICAL = "critical", // 80-99% (Intense shake, plasma turns white/magenta)
  ANTICIPATION = "anticipation", // 99-100% (Swells up before collapse)
  COLLAPSE = "collapse", // The actual implosion frame
  EXPLOSION = "explosion", // White flash screen
  SOUL_CONNECTED = "soul_connected", // Final text state
  LOCKED = "locked", // Done for the day
}

const HOLD_DURATION = 20000; // 20 seconds

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// Générateur de tremblement aléatoire
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export default function TheCall() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- State ---
  const [pactData, setPactData] = useState<PactData | null>(null);
  const [ritualState, setRitualState] = useState<RitualState>(RitualState.IDLE);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [completedToday, setCompletedToday] = useState(false);

  // --- Refs ---
  const containerShakeRef = useRef<HTMLDivElement>(null); // Le div qui tremble
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
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

  // --- Animation Loop Principale ---

  const determineState = (p: number): RitualState => {
    if (p <= 0) return RitualState.IDLE;
    if (p < 80) return RitualState.CHARGING;
    if (p < 99) return RitualState.CRITICAL;
    return RitualState.ANTICIPATION;
  };

  // Fonction qui gère les effets physiques frame par frame (tremblement, distorsion)
  const updatePhysicalEffects = useCallback((p: number) => {
    if (!containerShakeRef.current) return;
    const el = containerShakeRef.current;

    if (p > 80 && p < 100) {
      // Intensité exponentielle
      const rawIntensity = (p - 80) / 20; // 0 to 1
      const intensity = Math.pow(rawIntensity, 2) * 25; // Max 25px shake

      const x = randomRange(-intensity, intensity);
      const y = randomRange(-intensity, intensity);
      // Rotation très légère pour désorienter
      const rot = randomRange(-intensity * 0.05, intensity * 0.05);

      // Simulation d'aberration chromatique via text-shadow (marche sur tout le conteneur)
      const rgbSplit = rawIntensity * 4;
      const blur = rawIntensity * 2;

      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
      el.style.filter = `blur(${blur}px) contrast(${1 + rawIntensity / 2})`;
      // L'astuce pour l'aberration chromatique RGB
      el.style.textShadow = `${rgbSplit}px 0 2px rgba(255,0,0,0.5), -${rgbSplit}px 0 2px rgba(0,255,255,0.5)`;
    } else {
      // Reset propre
      el.style.transform = "none";
      el.style.filter = "none";
      el.style.textShadow = "none";
    }
  }, []);

  const animate = useCallback(() => {
    if (!isHoldingRef.current || hasCompletedRef.current) return;

    const elapsed = performance.now() - startRef.current;
    // const p = clamp((elapsed / HOLD_DURATION) * 100, 0, 100);
    // DEV SPEEDUP (Retirer pour la prod)
    const p = clamp(((elapsed * 3) / HOLD_DURATION) * 100, 0, 100);

    setProgress(p);

    // On ne change l'état que si on n'est pas déjà dans la séquence de fin
    if (ritualState !== RitualState.ANTICIPATION) {
      setRitualState(determineState(p));
    }

    updatePhysicalEffects(p);

    if (p >= 100) {
      finishRitualSequence();
    } else {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [ritualState, updatePhysicalEffects]);

  const startHolding = (e: React.PointerEvent) => {
    if (completedToday || hasCompletedRef.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    isHoldingRef.current = true;
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);
  };

  const stopHolding = () => {
    if (hasCompletedRef.current) return;
    isHoldingRef.current = false;
    cancelAnimationFrame(rafRef.current);

    // Reset immédiat des effets physiques
    if (containerShakeRef.current) {
      containerShakeRef.current.style.transform = "none";
      containerShakeRef.current.style.filter = "none";
      containerShakeRef.current.style.textShadow = "none";
    }

    // Animation de retour rapide vers 0 (Snap back)
    const snapBack = () => {
      if (isHoldingRef.current || hasCompletedRef.current) return;
      setProgress((prev) => {
        const next = prev - 5; // Vitesse de retour
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

  // --- La Séquence Climactique ---
  const finishRitualSequence = async () => {
    isHoldingRef.current = false;
    hasCompletedRef.current = true;
    cancelAnimationFrame(rafRef.current);

    // Étape 1 : Anticipation (déjà définie par la boucle d'anim avant 100%)
    // Le bouton est gonflé au max. On attend une fraction de seconde.
    setRitualState(RitualState.ANTICIPATION);
    await new Promise((r) => setTimeout(r, 250));

    // Étape 2 : Implosion violente
    setRitualState(RitualState.COLLAPSE);
    // On laisse le temps à l'animation CSS de collapse de se jouer (env. 300ms)
    await new Promise((r) => setTimeout(r, 350));

    // Étape 3 : Explosion Blanche (Flash)
    setRitualState(RitualState.EXPLOSION);
    if (user && !completedToday) saveCheckInData();

    // Étape 4 : Révélation du texte (après que le flash commence à se dissiper)
    await new Promise((r) => setTimeout(r, 300));
    setRitualState(RitualState.SOUL_CONNECTED);

    // Étape 5 : Retour au calme et état Locked
    await new Promise((r) => setTimeout(r, 4500));
    setRitualState(RitualState.LOCKED);
    setCompletedToday(true);
  };

  // --- Helpers d'état pour le JSX ---
  const isChargingOrHigher = progress > 0 && !completedToday;
  const isCritical = ritualState === RitualState.CRITICAL || ritualState === RitualState.ANTICIPATION;
  const isAnticipation = ritualState === RitualState.ANTICIPATION;
  const isCollapse = ritualState === RitualState.COLLAPSE;
  const isExplosion = ritualState === RitualState.EXPLOSION;
  const isSoul = ritualState === RitualState.SOUL_CONNECTED;
  const isLocked = ritualState === RitualState.LOCKED;

  const pNorm = progress / 100; // Normalized progress 0..1

  // Calcul dynamique de la couleur du coeur (Cyan -> Magenta -> Blanc/Or)
  const getPlasmaColor = () => {
    if (isLocked) return "rgba(34, 197, 94, 0.2)"; // Green
    if (pNorm < 0.5) return `rgba(6, 182, 212, ${0.2 + pNorm})`; // Cyan build up
    if (pNorm < 0.85) return `rgba(${6 + (pNorm - 0.5) * 600}, ${182 - (pNorm - 0.5) * 400}, 212, ${0.5 + pNorm / 2})`; // Transition to Purple
    return `rgba(255, ${200 * (1 - pNorm)}, ${255 * (1 - pNorm)}, ${0.8 + pNorm * 0.2})`; // White hot critical
  };

  return (
    // MAIN WRAPPER : Fond noir profond
    <div className="min-h-screen bg-[#030305] overflow-hidden flex flex-col relative text-slate-100 font-sans selection:bg-white/20">
      {/* BACKGROUND LAYERS (Ambiance statique et dynamique) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Nébuleuse de fond qui réagit à l'intensité */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vmin] h-[100vmin] rounded-full blur-[150px] transition-all duration-700 ease-out"
          style={{
            background: isSoul ? "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" : getPlasmaColor(),
            opacity: isChargingOrHigher ? 0.4 + pNorm * 0.3 : 0.2,
            transform: isChargingOrHigher
              ? `translate(-50%, -50%) scale(${1 + pNorm * 0.5})`
              : "translate(-50%, -50%) scale(1)",
          }}
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* CONTAINER QUI TREMBLE (C'est lui qui subit le transform 3D) */}
      <div
        ref={containerShakeRef}
        className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 will-change-transform backface-hidden"
      >
        {/* HEADER */}
        <header
          className={`absolute top-0 left-0 w-full p-6 flex justify-between items-center transition-opacity duration-500 ${isSoul || isExplosion ? "opacity-0" : "opacity-100"}`}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white/40 hover:text-white hover:bg-white/5 font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> RETURN
          </Button>
          {pactData && (
            <div className="text-right font-mono">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Sync Streak</div>
              <div className="text-xl text-white">{pactData.checkin_streak}</div>
            </div>
          )}
        </header>

        {/* ZONE D'INTERACTION CENTRALE */}
        <div className="relative flex flex-col items-center">
          {/* ÉCRAN FINAL : SOUL CONNECTED */}
          {isSoul && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 animate-appear-slow">
              {/* "God Rays" rotatifs en background */}
              <div className="absolute inset-[-200%] bg-gradient-conic from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 animate-spin-slow opacity-30 blur-xl"></div>

              <h1 className="relative text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_40px_rgba(6,182,212,0.6)] animate-pulse-subtle">
                SOUL
                <br />
                CONNECTED
              </h1>
              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent my-6 animate-expand-width"></div>
              <p className="text-cyan-200/60 tracking-[0.4em] text-xs font-mono uppercase animate-slide-up-fade">
                Ritual Complete
              </p>
            </div>
          )}

          {/* FLASH BLANC D'EXPLOSION */}
          <div
            className={`fixed inset-0 bg-white z-[100] pointer-events-none transition-opacity ${isExplosion ? "opacity-100 duration-75" : "opacity-0 duration-[2500ms] ease-out"}`}
          />

          {/* LE BOUTON CENTRAL (Le Cœur) */}
          {/* Ce conteneur gère l'échelle globale pour l'anticipation et l'implosion */}
          <div
            className={`relative transition-transform cubic-bezier(0.34, 1.56, 0.64, 1)
                    ${isAnticipation ? "scale-110 duration-200" : ""} 
                    ${isCollapse ? "scale-[0.001] duration-300 cubic-bezier(.87,0,.13,1)" : "duration-100"}
                    ${isSoul || isExplosion ? "opacity-0" : "opacity-100"}
                `}
          >
            {/* Anneaux d'ondes de choc externes */}
            {isChargingOrHigher && !isLocked && (
              <>
                <div
                  className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping-slow"
                  style={{ animationDuration: `${3 - pNorm * 2}s` }}
                />
                {pNorm > 0.5 && (
                  <div
                    className="absolute inset-[-20px] rounded-full border border-purple-400/20 animate-ping-slow animation-delay-500"
                    style={{ animationDuration: `${2.5 - pNorm}s` }}
                  />
                )}
              </>
            )}

            <button
              onPointerDown={startHolding}
              onPointerUp={stopHolding}
              onPointerLeave={stopHolding}
              disabled={isLocked}
              className={`
                        relative w-64 h-64 rounded-full flex items-center justify-center overflow-hidden
                        border-[3px] transition-all duration-200 group
                        ${
                          isLocked
                            ? "border-green-500/50 cursor-default"
                            : "border-white/10 cursor-pointer hover:border-white/30"
                        }
                        ${isCritical && !isLocked ? "border-white/80 drop-shadow-[0_0_25px_rgba(255,255,255,0.7)]" : ""}
                    `}
              style={{
                // L'ombre portée change de couleur et d'intensité avec la charge
                boxShadow:
                  isChargingOrHigher && !isLocked
                    ? `0 0 ${30 + pNorm * 50}px ${getPlasmaColor()}, inset 0 0 ${20 + pNorm * 30}px ${getPlasmaColor()}`
                    : isLocked
                      ? "0 0 40px rgba(34,197,94,0.3), inset 0 0 20px rgba(34,197,94,0.1)"
                      : "none",
              }}
            >
              {/* FOND PLASMA INTÉRIEUR */}
              {!isLocked && (
                <div
                  className="absolute inset-[-50%] animate-spin-slow opacity-70 mix-blend-screen blur-2xl transition-colors duration-500"
                  style={{
                    background: isCritical
                      ? "conic-gradient(from 0deg, white, magenta, white, cyan, white)"
                      : "conic-gradient(from 0deg, transparent, cyan, transparent, purple, transparent)",
                  }}
                />
              )}

              {/* Anneau de progression SVG */}
              <svg className="absolute inset-[-3px] w-[calc(100%+6px)] h-[calc(100%+6px)] -rotate-90 pointer-events-none">
                <circle cx="50%" cy="50%" r="98" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                {!isLocked && progress > 0 && (
                  <circle
                    cx="50%"
                    cy="50%"
                    r="98"
                    fill="none"
                    stroke={isCritical ? "white" : pNorm > 0.6 ? "#e879f9" : "#22d3ee"}
                    strokeWidth={4 + pNorm * 4}
                    strokeDasharray={2 * Math.PI * 98}
                    strokeDashoffset={2 * Math.PI * 98 * (1 - pNorm)}
                    strokeLinecap="round"
                    className="transition-all duration-100 ease-linear drop-shadow-[0_0_10px_currentColor]"
                  />
                )}
              </svg>

              {/* Contenu central (Icône/Texte) */}
              <div className="relative z-20 flex flex-col items-center justify-center space-y-3">
                {isLocked ? (
                  <Check className="w-20 h-20 text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,1)] animate-pulse-subtle" />
                ) : (
                  <>
                    {/* L'icône change et vibre en phase critique */}
                    <div
                      className={`${isCritical ? "animate-vibrate-intense text-white drop-shadow-[0_0_25px_white]" : ""}`}
                    >
                      {isCritical ? (
                        <Zap className="w-16 h-16 fill-white" />
                      ) : (
                        <Fingerprint
                          className={`w-16 h-16 transition-all duration-300 ${isChargingOrHigher ? "text-cyan-100 opacity-100" : "text-white/30 opacity-50 group-hover:opacity-80"}`}
                        />
                      )}
                    </div>
                    {/* Timer */}
                    <div className="font-mono text-xs tracking-widest h-4">
                      {isChargingOrHigher ? (
                        <span className={`${isCritical ? "text-white" : "text-cyan-200"}`}>
                          {(20 - pNorm * 20).toFixed(2)}s
                        </span>
                      ) : (
                        <span className="text-white/40 group-hover:text-white/70 transition-colors">HOLD</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* PARTICULES "WARP SPEED" (Aspiration) */}
              {isChargingOrHigher && !isLocked && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      // Traînées au lieu de points
                      className="absolute top-1/2 left-1/2 w-0.5 h-12 bg-gradient-to-b from-transparent via-white to-transparent rounded-full animate-warp-in"
                      style={{
                        transform: `rotate(${i * 22.5}deg) translateY(150px)`,
                        // Plus on charge, plus elles vont vite
                        animationDuration: `${1.5 - pNorm * 1.2}s`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        opacity: pNorm > 0.2 ? 0.6 + pNorm * 0.4 : 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          </div>

          {/* Texte d'état sous le bouton */}
          {!isSoul && !isExplosion && !isLocked && (
            <div className="absolute -bottom-20 left-0 w-full text-center font-mono text-xs tracking-[0.3em] uppercase transition-all duration-300">
              <p
                className={`${isCritical ? "text-white animate-vibrate-intense drop-shadow-[0_0_10px_white]" : "text-white/40"}`}
              >
                {ritualState === RitualState.IDLE && "Initiate"}
                {ritualState === RitualState.CHARGING && "Synchronizing Energy"}
                {ritualState === RitualState.CRITICAL && "Critical Threshold"}
                {ritualState === RitualState.ANTICIPATION && "Release Imminent"}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* --- ANIMATIONS CSS AVANCÉES --- */
        
        /* Rotation lente pour le fond et les "god rays" */
        @keyframes spin-slow {
            100% { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }

        /* Ondes de choc qui s'agrandissent et disparaissent */
        @keyframes ping-slow {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping-slow { animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animation-delay-500 { animation-delay: 0.5s; }

        /* Particules "Warp Speed" : traînées aspirées vers le centre */
        @keyframes warp-in {
            0% { transform: rotate(var(--angle)) translateY(180px) scaleY(1); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: rotate(var(--angle)) translateY(0px) scaleY(4); opacity: 0; }
        }
        .animate-warp-in { animation: warp-in linear infinite; }

        /* Vibration intense pour la phase critique */
        @keyframes vibrate-intense {
            0% { transform: translate(0,0); }
            20% { transform: translate(-3px, 3px); }
            40% { transform: translate(-3px, -3px); }
            60% { transform: translate(3px, 3px); }
            80% { transform: translate(3px, -3px); }
            100% { transform: translate(0,0); }
        }
        .animate-vibrate-intense { animation: vibrate-intense 0.05s linear infinite; }

        /* Pulsation subtile pour le texte final */
        @keyframes pulse-subtle {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; text-shadow: 0 0 50px currentColor; }
        }
        .animate-pulse-subtle { animation: pulse-subtle 4s ease-in-out infinite; }

        /* Apparition lente du conteneur final */
        @keyframes appear-slow {
            0% { opacity: 0; transform: scale(0.95); filter: blur(10px); }
            100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .animate-appear-slow { animation: appear-slow 1.2s ease-out forwards; }

        /* Extension de la ligne de séparation */
        @keyframes expand-width {
            0% { width: 0; opacity: 0; }
            100% { width: 128px; opacity: 1; }
        }
        .animate-expand-width { animation: expand-width 1s ease-out forwards 0.3s; opacity: 0; }

        /* Montée et fondu du sous-texte */
        @keyframes slide-up-fade {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 0.7; transform: translateY(0); }
        }
        .animate-slide-up-fade { animation: slide-up-fade 1s ease-out forwards 0.6s; opacity: 0; }

        /* Utilitaires pour la perspective et le rendu */
        .backface-hidden { backface-visibility: hidden; }
        .bg-gradient-conic { background-image: conic-gradient(var(--tw-gradient-stops)); }
      `}</style>
    </div>
  );
}
