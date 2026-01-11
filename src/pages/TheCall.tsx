import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Zap, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PactData {
  id: string;
  checkin_total_count: number;
  checkin_streak: number;
  last_checkin_date: string | null;
}

enum RitualState {
  IDLE = "idle",
  PRESSING = "pressing",
  CHARGING = "charging",
  RADIATING = "radiating",
  COMPRESSION = "compression",
  RELEASE = "release",
  SOUL_CONNECTED = "soul_connected",
  LOCKED = "locked",
}

const HOLD_DURATION = 20000;

// Phase boundaries (percentage)
const PHASE_CHARGING_END = 50; // 0-10s
const PHASE_RADIATING_END = 85; // 10-17s
const PHASE_COMPRESSION_END = 100; // 17-20s

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function TheCall() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pactData, setPactData] = useState<PactData | null>(null);
  const [ritualState, setRitualState] = useState<RitualState>(RitualState.IDLE);
  const [progress, setProgress] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSoulConnected, setShowSoulConnected] = useState(false);

  const coreRef = useRef<HTMLButtonElement | null>(null);

  const holdStartRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const isHoldingRef = useRef(false);
  const hasCompletedRef = useRef(false);

  // Progress refs to avoid noisy rerenders
  const progressRef = useRef(0);
  const lastCommittedProgressRef = useRef(0);

  const phaseFromProgress = useCallback((p: number): RitualState => {
    if (p <= 0) return RitualState.IDLE;
    if (p < PHASE_CHARGING_END) return RitualState.CHARGING;
    if (p < PHASE_RADIATING_END) return RitualState.RADIATING;
    if (p < PHASE_COMPRESSION_END) return RitualState.COMPRESSION;
    return RitualState.RELEASE;
  }, []);

  useEffect(() => {
    if (user) fetchPactData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkIfCompletedToday = (lastCheckInDate: string | null): boolean => {
    if (!lastCheckInDate) return false;
    const today = new Date();
    const todayStr = today.toLocaleDateString("en-CA");
    const lastCheckIn = new Date(lastCheckInDate);
    const lastCheckInStr = lastCheckIn.toLocaleDateString("en-CA");
    return todayStr === lastCheckInStr;
  };

  const fetchPactData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("pacts")
      .select("id, checkin_total_count, checkin_streak, last_checkin_date")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching pact data:", error);
      return;
    }

    if (data) {
      setPactData(data);
      const done = checkIfCompletedToday(data.last_checkin_date);
      setCompletedToday(done);
      hasCompletedRef.current = done;
      setRitualState(done ? RitualState.LOCKED : RitualState.IDLE);
      setProgress(done ? 100 : 0);
      progressRef.current = done ? 100 : 0;
      lastCommittedProgressRef.current = done ? 100 : 0;
    }
  };

  const saveCheckInData = async () => {
    if (!pactData) return;

    const today = new Date();
    const todayStr = today.toLocaleDateString("en-CA");

    if (pactData.last_checkin_date) {
      const lastCheckIn = new Date(pactData.last_checkin_date);
      const lastCheckInStr = lastCheckIn.toLocaleDateString("en-CA");
      if (lastCheckInStr === todayStr) return;
    }

    let newStreak = 1;
    if (pactData.last_checkin_date) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString("en-CA");
      const lastCheckIn = new Date(pactData.last_checkin_date);
      const lastCheckInStr = lastCheckIn.toLocaleDateString("en-CA");
      if (lastCheckInStr === yesterdayStr) newStreak = (pactData.checkin_streak || 0) + 1;
    }

    const { error } = await supabase
      .from("pacts")
      .update({
        checkin_total_count: (pactData.checkin_total_count || 0) + 1,
        checkin_streak: newStreak,
        last_checkin_date: todayStr,
      })
      .eq("id", pactData.id);

    if (error) {
      console.error("Error updating check-in:", error);
      return;
    }

    setPactData((prev) =>
      prev
        ? {
            ...prev,
            checkin_total_count: (prev.checkin_total_count || 0) + 1,
            checkin_streak: newStreak,
            last_checkin_date: todayStr,
          }
        : null,
    );
  };

  const stopRaf = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const commitProgress = useCallback((p: number) => {
    progressRef.current = p;

    // commit to React state only when it meaningfully changes (smooth but less jank)
    const last = lastCommittedProgressRef.current;
    if (Math.abs(p - last) >= 0.25 || p === 0 || p === 100) {
      lastCommittedProgressRef.current = p;
      setProgress(p);
    }
  }, []);

  const triggerCompletion = useCallback(async () => {
    setIsProcessing(true);
    setRitualState(RitualState.RELEASE);

    // let collapse/explosion play
    await new Promise((r) => setTimeout(r, 520));

    setRitualState(RitualState.SOUL_CONNECTED);
    setShowSoulConnected(true);

    if (pactData && !completedToday) {
      await saveCheckInData();
    }

    await new Promise((r) => setTimeout(r, 2200));
    setShowSoulConnected(false);

    document.body.classList.add("screen-pulse");
    await new Promise((r) => setTimeout(r, 650));
    document.body.classList.remove("screen-pulse");

    setRitualState(RitualState.LOCKED);
    setCompletedToday(true);
    hasCompletedRef.current = true;
    commitProgress(100);

    setIsProcessing(false);
    toast.success("The Call has been answered.", { duration: 2500 });
  }, [commitProgress, completedToday, pactData]);

  const animateHold = useCallback(() => {
    if (!isHoldingRef.current) return;

    const now = performance.now();
    const elapsed = now - holdStartRef.current;
    const p = clamp((elapsed / HOLD_DURATION) * 100, 0, 100);

    commitProgress(p);

    // Phase selection (including press micro-phase)
    if (elapsed < 140) {
      setRitualState(RitualState.PRESSING);
    } else {
      const phase = phaseFromProgress(p);
      setRitualState(phase);
    }

    if (p >= 100 && !hasCompletedRef.current) {
      isHoldingRef.current = false;
      hasCompletedRef.current = true;
      stopRaf();
      void triggerCompletion();
      return;
    }

    rafRef.current = requestAnimationFrame(animateHold);
  }, [commitProgress, phaseFromProgress, stopRaf, triggerCompletion]);

  const decayToZero = useCallback(() => {
    stopRaf();
    const start = progressRef.current;
    if (start <= 0) {
      commitProgress(0);
      setRitualState(completedToday ? RitualState.LOCKED : RitualState.IDLE);
      return;
    }

    const t0 = performance.now();
    const duration = 420; // nice snap-back
    const tick = () => {
      const t = performance.now() - t0;
      const k = clamp(t / duration, 0, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - k, 3);
      const next = start * (1 - eased);
      commitProgress(next);

      if (k < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        commitProgress(0);
        setRitualState(completedToday ? RitualState.LOCKED : RitualState.IDLE);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [commitProgress, completedToday, stopRaf]);

  const startHolding = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (completedToday || isProcessing || ritualState === RitualState.LOCKED || hasCompletedRef.current) {
        const el = coreRef.current;
        el?.classList.add("locked-pulse");
        setTimeout(() => el?.classList.remove("locked-pulse"), 280);
        return;
      }

      // pointer capture: keeps receiving pointerup even if user drifts
      e.currentTarget.setPointerCapture(e.pointerId);

      isHoldingRef.current = true;
      holdStartRef.current = performance.now();
      setRitualState(RitualState.PRESSING);

      stopRaf();
      rafRef.current = requestAnimationFrame(animateHold);
    },
    [animateHold, completedToday, isProcessing, ritualState, stopRaf],
  );

  const stopHolding = useCallback(() => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    stopRaf();

    const p = progressRef.current;

    if (p >= 50 && p < 100 && !hasCompletedRef.current) {
      toast("Not yet. Hold longer.", { duration: 1800 });
    } else if (p >= 10 && p < 50 && !hasCompletedRef.current) {
      toast("Hold longer to connect.", { duration: 1800 });
    }

    // dissipate class for a clean “energy falloff”
    const el = coreRef.current;
    el?.classList.add("energy-dissipate");
    setTimeout(() => el?.classList.remove("energy-dissipate"), 420);

    decayToZero();
  }, [decayToZero, stopRaf]);

  const triggerDevAnimation = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    hasCompletedRef.current = false;
    isHoldingRef.current = false;

    const play = async (from: number, to: number, ms: number) => {
      const t0 = performance.now();
      return new Promise<void>((resolve) => {
        const tick = () => {
          const t = performance.now() - t0;
          const k = clamp(t / ms, 0, 1);
          const v = from + (to - from) * k;
          commitProgress(v);
          setRitualState(phaseFromProgress(v));
          if (k < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    };

    await play(0, 50, 2000);
    await play(50, 85, 2000);
    await play(85, 100, 1600);

    hasCompletedRef.current = true;
    await triggerCompletion();

    setIsProcessing(false);
  }, [commitProgress, isProcessing, phaseFromProgress, triggerCompletion]);

  useEffect(() => {
    return () => {
      stopRaf();
      isHoldingRef.current = false;
    };
  }, [stopRaf]);

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isCharging = ritualState === RitualState.CHARGING;
  const isRadiating = ritualState === RitualState.RADIATING;
  const isCompression = ritualState === RitualState.COMPRESSION;
  const isRelease = ritualState === RitualState.RELEASE;
  const isLocked = ritualState === RitualState.LOCKED;
  const isActive = isCharging || isRadiating || isCompression || ritualState === RitualState.PRESSING;

  const timeLeft = useMemo(() => {
    const msLeft = HOLD_DURATION - (progress / 100) * HOLD_DURATION;
    return Math.ceil(msLeft / 1000);
  }, [progress]);

  const formatLastCall = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!pactData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary/60 font-rajdhani animate-pulse">Loading ritual...</div>
      </div>
    );
  }

  // CSS progress variable (0..1)
  const p01 = clamp(progress / 100, 0, 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1220] to-[#080c14] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/[0.03] to-transparent rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-nebula-drift" />
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-nebula-drift-reverse" />
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-nebula-pulse" />
        </div>

        <div className="absolute inset-0">
          {[...Array(26)].map((_, i) => (
            <div
              key={i}
              className="absolute w-[1px] h-[1px] bg-primary/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${10 + Math.random() * 15}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 8}s`,
              }}
            />
          ))}
        </div>

        {isLocked && (
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/5"
                style={{
                  width: "200%",
                  height: "200%",
                  animation: `ambient-wave ${10 + i * 3}s ease-in-out infinite`,
                  animationDelay: `${i * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Soul Connected Overlay */}
      {showSoulConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#020408]/90 backdrop-blur-sm" />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-primary/20"
                style={{
                  width: `${90 + i * 70}px`,
                  height: `${90 + i * 70}px`,
                  animation: `ripple-out 2.4s ease-out infinite`,
                  animationDelay: `${i * 0.22}s`,
                }}
              />
            ))}
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {[...Array(14)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary/60 rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                  animation: `fragment-burst 2.0s ease-out forwards`,
                  animationDelay: `${i * 0.07}s`,
                  transform: `rotate(${i * 25}deg)`,
                  // IMPORTANT: provide --r for keyframes if needed
                  ["--r" as any]: `${i * 25}deg`,
                }}
              />
            ))}
          </div>

          <h1 className="relative z-10 text-4xl md:text-6xl font-orbitron font-bold tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary/80 via-white to-primary/80 animate-soul-text">
            Soul Connected
            <span className="absolute inset-0 text-primary/20 blur-lg animate-soul-glow">Soul Connected</span>
          </h1>
        </div>
      )}

      {/* Release Effects */}
      {isRelease && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute w-28 h-28 bg-white/35 rounded-full blur-2xl animate-flash" />

          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: "200vmax",
                height: "200vmax",
                border: `${2 - i * 0.5}px solid rgba(91, 180, 255, ${0.42 - i * 0.12})`,
                animation: `shockwave-blast 1.35s ease-out forwards`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}

          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: `radial-gradient(circle, white 0%, hsl(var(--primary)) 60%, transparent 100%)`,
                animation: `spark-eject 1.1s ease-out forwards`,
                animationDelay: `${i * 0.02}s`,
                transform: `rotate(${i * 15}deg)`,
                ["--r" as any]: `${i * 15}deg`,
              }}
            />
          ))}
        </div>
      )}

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-28 pt-8">
        <div className="absolute top-8 left-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="px-4 py-2 font-rajdhani text-sm text-primary/60 hover:text-primary hover:bg-primary/5"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back</span>
          </Button>
        </div>

        <div className="relative mb-10">
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold tracking-widest">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-primary to-purple-400">
              THE CALL
            </span>
          </h1>
          <div className="absolute inset-0 text-3xl md:text-4xl font-orbitron font-bold tracking-widest text-primary/10 blur-lg">
            THE CALL
          </div>
          <p className="text-center text-primary/40 font-rajdhani text-xs mt-3 tracking-[0.25em] uppercase">
            20-second soul ritual
          </p>
        </div>

        <div className="relative mb-12">
          {/* Outer glow driven by CSS var */}
          <div
            className={`absolute inset-[-55px] rounded-full transition-opacity duration-700 ${
              isActive ? "opacity-100" : isLocked ? "opacity-40" : "opacity-20"
            }`}
            style={{
              ["--p" as any]: p01,
            }}
          >
            <div className="absolute inset-0 bg-primary/8 rounded-full blur-[70px] animate-breathe-slow" />
            <div className="absolute inset-[15px] bg-cyan-500/6 rounded-full blur-[50px] animate-breathe-offset" />
          </div>

          {(isRadiating || isCompression) && (
            <div className="absolute inset-[-72px] rounded-full border border-primary/15 animate-halo-expand" />
          )}

          {(isActive || isLocked) && (
            <div className="absolute inset-[-25px] pointer-events-none">
              {[...Array(isLocked ? 3 : Math.max(2, Math.floor(progress / 22)))].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "radial-gradient(circle, white 0%, hsl(var(--primary)) 70%, transparent 100%)",
                    left: "50%",
                    top: "50%",
                    animation: `orbit-wisp ${4.2 + i * 0.6}s linear infinite`,
                    animationDelay: `${i * 0.55}s`,
                    boxShadow: "0 0 8px rgba(91, 180, 255, 0.55)",
                  }}
                />
              ))}
            </div>
          )}

          <button
            ref={coreRef}
            id="ritual-core"
            onPointerDown={startHolding}
            onPointerUp={stopHolding}
            onPointerCancel={stopHolding}
            onPointerLeave={() => {
              // if still holding but pointer leaves, pointer capture usually prevents losing,
              // but this is a safety.
              if (isHoldingRef.current) stopHolding();
            }}
            disabled={isProcessing}
            className={`ritual-core relative w-52 h-52 md:w-64 md:h-64 rounded-full border-2 cursor-pointer select-none
              flex items-center justify-center transition-[filter,box-shadow,transform,background,border-color] duration-300
              ${isLocked ? "border-primary/50" : isActive ? "border-primary/70" : "border-primary/30 hover:border-primary/50"}
            `}
            style={{
              ["--p" as any]: p01,
              ["--state" as any]: ritualState,
              background: isLocked
                ? "linear-gradient(135deg, rgba(91,180,255,0.18), rgba(91,180,255,0.10), rgba(34,211,238,0.10))"
                : isRelease
                  ? "linear-gradient(135deg, rgba(255,255,255,0.26), rgba(91,180,255,0.40), rgba(34,211,238,0.22))"
                  : isActive
                    ? "linear-gradient(135deg, rgba(91,180,255,0.26), rgba(91,180,255,0.16), rgba(168,85,247,0.12))"
                    : "linear-gradient(135deg, rgba(91,180,255,0.10), rgba(91,180,255,0.05), rgba(0,0,0,0))",
            }}
            aria-label="Hold to connect"
          >
            {/* Progress Ring */}
            {!isLocked && !isRelease && (
              <svg className="absolute inset-[-6px] w-[calc(100%+12px)] h-[calc(100%+12px)] -rotate-90">
                <circle cx="50%" cy="50%" r="90" fill="none" stroke="rgba(91, 180, 255, 0.08)" strokeWidth="3" />
                <circle
                  cx="50%"
                  cy="50%"
                  r="90"
                  fill="none"
                  stroke="url(#ringGlow)"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="90"
                  fill="none"
                  stroke={progress > 95 ? "rgba(255,255,255,0.92)" : "url(#ringGradient)"}
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="ringGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.25" />
                  </linearGradient>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>
            )}

            {isLocked && (
              <div className="absolute inset-[-3px] rounded-full border border-primary/30 animate-locked-shimmer" />
            )}

            {/* Inner core */}
            <div className="absolute inset-10 rounded-full overflow-hidden">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg core-fill" />
              <div className="absolute inset-0 rounded-full core-grain" />
            </div>

            {/* Icon */}
            <div className="relative z-10 flex items-center justify-center">
              {isRelease ? (
                <Zap
                  className="w-24 h-24 md:w-28 md:h-28 text-white"
                  style={{
                    filter: "drop-shadow(0 0 45px white) drop-shadow(0 0 22px rgba(91, 180, 255, 0.85))",
                    animation: "icon-flash 0.55s ease-out",
                  }}
                />
              ) : isLocked ? (
                <Check
                  className="w-20 h-20 md:w-24 md:h-24 text-primary/80"
                  style={{ filter: "drop-shadow(0 0 16px rgba(91, 180, 255, 0.6))" }}
                />
              ) : (
                <div className="relative">
                  <Flame
                    className={`transition-all duration-200 ${isActive ? "text-white" : "text-primary/80"}`}
                    style={{
                      width: `${70 + progress / 4}px`,
                      height: `${70 + progress / 4}px`,
                      filter: `drop-shadow(0 0 ${10 + progress / 3}px rgba(91, 180, 255, ${0.45 + progress / 260}))`,
                    }}
                  />

                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center animate-energy-rotation">
                      <div className="w-1 h-12 bg-gradient-to-t from-transparent via-cyan-400/60 to-transparent rounded-full blur-[2px]" />
                    </div>
                  )}

                  {/* Sparks (fixed: provide --r) */}
                  {isActive && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-0.5 h-0.5 bg-white rounded-full spark"
                          style={{
                            left: "50%",
                            top: "35%",
                            animationDelay: `${i * 0.14}s`,
                            ["--r" as any]: `${i * 60}deg`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fireflies */}
            {(isActive || isLocked) && (
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                {[...Array(isLocked ? 5 : 7 + Math.floor(progress / 14))].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-0.5 rounded-full firefly"
                    style={{
                      left: "50%",
                      top: "50%",
                      animationDelay: `${i * 0.18}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </button>

          {/* Timer */}
          {isActive && !isRelease && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-2xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">
                {timeLeft}
              </span>
              <span className="text-primary/50 font-orbitron text-sm ml-1">s</span>
            </div>
          )}
        </div>

        <div className="text-center mb-8 h-10">
          {isLocked ? (
            <p className="text-primary/50 font-rajdhani text-sm">Connected — next call in {getTimeUntilMidnight()}</p>
          ) : isActive ? (
            <p className="text-primary/70 font-rajdhani text-base tracking-wide animate-pulse">
              {isCompression ? "Almost there..." : isRadiating ? "Energy building..." : "Channeling..."}
            </p>
          ) : ritualState === RitualState.IDLE ? (
            <p className="text-primary/40 font-rajdhani text-sm tracking-wide">Hold to connect</p>
          ) : null}
        </div>

        <div className="flex gap-14 mb-6">
          <div className="text-center">
            <p className="text-[10px] text-primary/35 font-rajdhani uppercase tracking-[0.2em] mb-1.5">Streak</p>
            <p className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">
              {pactData.checkin_streak || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-primary/35 font-rajdhani uppercase tracking-[0.2em] mb-1.5">Total Calls</p>
            <p className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              {pactData.checkin_total_count || 0}
            </p>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-[10px] text-primary/25 font-rajdhani uppercase tracking-[0.15em] mb-0.5">Last Call</p>
          <p className="text-xs text-primary/40 font-rajdhani">{formatLastCall(pactData.last_checkin_date)}</p>
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={triggerDevAnimation}
            disabled={isProcessing}
            className="font-rajdhani text-[10px] text-primary/25 hover:text-primary/50 bg-transparent"
          >
            Replay animation (dev)
          </Button>
        </div>
      </main>

      <style>{`
        /* =========================
           CORE FIX: CSS-driven intensity
           --p in [0..1]
        ========================== */

        .ritual-core{
          --p: 0;
          transform: translateZ(0);
          will-change: transform, filter, box-shadow;
          box-shadow:
            0 0 calc(22px + var(--p) * 55px) rgba(91,180,255, calc(0.18 + var(--p) * 0.55)),
            inset 0 0 calc(14px + var(--p) * 36px) rgba(91,180,255, calc(0.10 + var(--p) * 0.25));
          filter: saturate(calc(1 + var(--p) * 0.25)) brightness(calc(1 + var(--p) * 0.18));
        }

        /* Press micro-interaction */
        .ritual-core:active{
          transform: scale(0.985);
        }

        /* Charging: smooth glow breathing, no random shake */
        #ritual-core[style*="--state: charging"],
        #ritual-core[style*="--state: pressing"]{
          animation: charge-hum 1.8s ease-in-out infinite;
        }

        /* Radiating: stronger breathing + subtle tilt */
        #ritual-core[style*="--state: radiating"]{
          animation: radiate-hum 1.2s ease-in-out infinite;
        }

        /* Compression: controlled shake + collapse hint */
        #ritual-core[style*="--state: compression"]{
          animation: compress-shake 0.16s linear infinite, compress-pulse 0.55s ease-in-out infinite;
        }

        /* Release: collapse quickly (the “button implodes”) */
        #ritual-core[style*="--state: release"]{
          animation: collapse-core 0.52s cubic-bezier(.2,.9,.2,1) forwards;
        }

        @keyframes charge-hum{
          0%,100% { transform: scale(calc(1 + var(--p) * 0.015)); }
          50% { transform: scale(calc(1 + var(--p) * 0.03)); }
        }

        @keyframes radiate-hum{
          0%,100% { transform: scale(calc(1 + var(--p) * 0.03)) rotate(-0.3deg); }
          50% { transform: scale(calc(1 + var(--p) * 0.055)) rotate(0.3deg); }
        }

        @keyframes compress-pulse{
          0%,100% { filter: brightness(calc(1.02 + var(--p) * 0.18)); }
          50% { filter: brightness(calc(0.98 + var(--p) * 0.24)); }
        }

        /* Controlled shake: amplitude increases only near end (var(--p) ~ 0.85..1) */
        @keyframes compress-shake{
          0% { transform: translate(0,0) scale(calc(1 - (var(--p) - 0.85) * 0.20)); }
          25% { transform: translate(calc((var(--p) - 0.85) * 2px), calc((var(--p) - 0.85) * -1px)) scale(calc(1 - (var(--p) - 0.85) * 0.20)); }
          50% { transform: translate(calc((var(--p) - 0.85) * -2px), calc((var(--p) - 0.85) * 2px)) scale(calc(1 - (var(--p) - 0.85) * 0.20)); }
          75% { transform: translate(calc((var(--p) - 0.85) * 1px), calc((var(--p) - 0.85) * 2px)) scale(calc(1 - (var(--p) - 0.85) * 0.20)); }
          100% { transform: translate(0,0) scale(calc(1 - (var(--p) - 0.85) * 0.20)); }
        }

        @keyframes collapse-core{
          0% { transform: scale(1); filter: brightness(1.25); }
          55% { transform: scale(0.78); filter: brightness(1.5); }
          100% { transform: scale(0.0); filter: brightness(2); opacity: 0; }
        }

        /* Inner fill intensity */
        .core-fill{
          opacity: calc(0.22 + var(--p) * 0.55);
        }

        /* Very subtle texture for “energy” */
        .core-grain{
          opacity: 0.18;
          background:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), transparent 55%),
            radial-gradient(circle at 70% 65%, rgba(91,180,255,0.22), transparent 55%);
          mix-blend-mode: screen;
          filter: blur(8px);
        }

        /* Sparks fixed: uses --r */
        .spark{
          animation: spark-escape 0.95s ease-out infinite;
        }

        @keyframes spark-escape{
          0%   { opacity: 0; transform: rotate(var(--r)) translateY(0) translateX(0); }
          25%  { opacity: 0.85; }
          100% { opacity: 0; transform: rotate(var(--r)) translateY(-38px) translateX(10px) scale(0.6); }
        }

        /* Fireflies */
        .firefly{
          background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(91,180,255,0.75) 55%, transparent 100%);
          box-shadow: 0 0 4px rgba(91,180,255,0.55);
          animation: firefly 2.8s ease-in-out infinite;
        }

        @keyframes firefly{
          0% { opacity: 0; transform: translate(-50%, -50%) translateY(0) scale(1); }
          25% { opacity: 0.85; transform: translate(-50%, -50%) translateY(-26px) translateX(16px) scale(1.1); }
          50% { opacity: 0.55; transform: translate(-50%, -50%) translateY(-52px) translateX(-10px) scale(0.75); }
          75% { opacity: 0.35; transform: translate(-50%, -50%) translateY(-74px) translateX(4px) scale(0.55); }
          100% { opacity: 0; transform: translate(-50%, -50%) translateY(-92px) scale(0.2); }
        }

        .animate-energy-rotation{
          animation: energy-rotation calc(6s - var(--p) * 3s) linear infinite;
        }

        @keyframes energy-rotation{
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes float-particle{
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-25px) translateX(8px); opacity: 0.4; }
        }

        @keyframes nebula-drift{
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.05); }
        }
        @keyframes nebula-drift-reverse{
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15px, 20px) scale(1.03); }
        }
        @keyframes nebula-pulse{
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.1); }
        }

        /* Outer glows */
        .animate-breathe-slow{
          animation: breathe-slow 3.6s ease-in-out infinite;
        }
        .animate-breathe-offset{
          animation: breathe-offset 3.1s ease-in-out infinite;
        }

        @keyframes breathe-slow{
          0%, 100% { transform: scale(1); opacity: calc(0.45 + var(--p) * 0.18); }
          50% { transform: scale(calc(1.06 + var(--p) * 0.06)); opacity: calc(0.65 + var(--p) * 0.22); }
        }
        @keyframes breathe-offset{
          0%, 100% { transform: scale(1.03); opacity: calc(0.35 + var(--p) * 0.18); }
          50% { transform: scale(calc(0.98 - var(--p) * 0.03)); opacity: calc(0.55 + var(--p) * 0.22); }
        }

        .animate-halo-expand{
          animation: halo-expand 1.8s ease-in-out infinite;
          box-shadow: 0 0 30px rgba(91,180,255,0.14);
        }
        @keyframes halo-expand{
          0%, 100% { transform: scale(1); opacity: 0.22; }
          50% { transform: scale(1.09); opacity: 0.40; }
        }

        /* SOUL CONNECTED overlay */
        @keyframes soul-text{
          0% { opacity: 0; transform: scale(0.985); letter-spacing: 0.18em; }
          15% { opacity: 1; transform: scale(1); letter-spacing: 0.22em; }
          85% { opacity: 1; transform: scale(1); letter-spacing: 0.22em; }
          100% { opacity: 0; transform: scale(1.02); letter-spacing: 0.25em; }
        }
        .animate-soul-text{ animation: soul-text 2.2s ease-in-out forwards; }

        @keyframes soul-glow{
          0%, 100% { opacity: 0; }
          15%, 85% { opacity: 0.45; }
        }
        .animate-soul-glow{ animation: soul-glow 2.2s ease-in-out forwards; }

        @keyframes ripple-out{
          0% { transform: scale(0.9); opacity: 0.45; }
          100% { transform: scale(1.9); opacity: 0; }
        }

        @keyframes fragment-burst{
          0% { opacity: 0.85; transform: rotate(var(--r)) translateY(0); }
          100% { opacity: 0; transform: rotate(var(--r)) translateY(-150px); }
        }

        @keyframes shockwave-blast{
          0% { transform: scale(0); opacity: 0.85; }
          100% { transform: scale(1); opacity: 0; }
        }

        @keyframes spark-eject{
          0% { opacity: 0.95; transform: rotate(var(--r)) translateY(0) scale(1); }
          100% { opacity: 0; transform: rotate(var(--r)) translateY(-200px) scale(0.2); }
        }

        @keyframes flash{
          0% { opacity: 0.62; transform: scale(1); }
          100% { opacity: 0; transform: scale(2.2); }
        }
        .animate-flash{ animation: flash 0.65s ease-out forwards; }

        @keyframes icon-flash{
          0% { transform: scale(0.92); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        @keyframes ambient-wave{
          0%, 100% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.08; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.03; }
        }

        @keyframes locked-shimmer{
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.52; }
        }

        .energy-dissipate{
          animation: dissipate-energy 0.42s ease-out !important;
        }
        @keyframes dissipate-energy{
          0% { filter: brightness(1.18); }
          60% { filter: brightness(0.98); }
          100% { filter: brightness(1); }
        }

        .locked-pulse{
          animation: locked-tap 0.28s ease-out !important;
        }
        @keyframes locked-tap{
          0% { transform: scale(1); }
          50% { transform: scale(1.015); }
          100% { transform: scale(1); }
        }

        .screen-pulse{
          animation: screen-pulse-soft 0.65s ease-in-out;
        }
        @keyframes screen-pulse-soft{
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.06); }
        }
      `}</style>
    </div>
  );
}
