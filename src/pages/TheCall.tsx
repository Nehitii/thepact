import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Zap, ArrowLeft, Lock, RefreshCw, Play, FastForward, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const HOLD_DURATION = 20000;

// ─── TYPES ─────────────────────────────────────────────────────────────────────
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

// ─── UTILS ─────────────────────────────────────────────────────────────────────
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const lerp = (s: number, e: number, t: number) => s * (1 - t) + e * t;
const easeIn3 = (x: number) => x * x * x;
const easeInExpo = (x: number) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

// ─── PHASE DETECTION ───────────────────────────────────────────────────────────
// Phase 0: 0.00–0.25  → Initialisation — calme / bleu froid
// Phase 1: 0.25–0.50  → Montée en puissance — cyan/vert
// Phase 2: 0.50–0.72  → Surchauffe — orange
// Phase 3: 0.72–0.88  → DANGER — rouge/magenta
// Phase 4: 0.88–1.00  → CRITIQUE — blanc aveuglant / chaos total
const getPhase = (p: number) => {
  if (p < 0.25) return 0;
  if (p < 0.5) return 1;
  if (p < 0.72) return 2;
  if (p < 0.88) return 3;
  return 4;
};

// Couleur noyau — gradient multi-phase
const getCoreColor = (p: number): [number, number, number] => {
  if (p < 0.25) {
    const t = p / 0.25;
    return [lerp(6, 34, t), lerp(182, 211, t), lerp(212, 238, t)];
  } else if (p < 0.5) {
    const t = (p - 0.25) / 0.25;
    return [lerp(34, 16, t), lerp(211, 185, t), lerp(238, 129, t)];
  } else if (p < 0.72) {
    const t = (p - 0.5) / 0.22;
    return [lerp(16, 251, t), lerp(185, 113, t), lerp(129, 3, t)];
  } else if (p < 0.88) {
    const t = (p - 0.72) / 0.16;
    return [lerp(251, 255, t), lerp(113, 0, t), lerp(3, 100, t)];
  } else {
    const t = (p - 0.88) / 0.12;
    return [lerp(255, 255, t), lerp(0, 255, t), lerp(100, 255, t)];
  }
};

const colorToStr = (c: [number, number, number]) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

// ─── DONNÉES CAPTEURS ──────────────────────────────────────────────────────────
const getSensorData = (p: number) => {
  const noise = () => (Math.random() - 0.5) * 0.04;
  const temp = clamp(lerp(288, 6500, easeIn3(p)) + rand(-30, 30), 285, 9999);
  const press = clamp(lerp(1.0, 99.9, easeIn3(p)) + noise() * 10, 0.8, 99.9);
  const stab = clamp(lerp(99, 0, easeIn3(p)) + noise() * 15, 0, 99.5);
  const flux = clamp(lerp(0, 999, easeIn3(p)) + rand(-5, 5), 0, 999);
  return { temp, press, stab, flux };
};

// ─── COMPOSANT PRINCIPAL ────────────────────────────────────────────────────────
export default function TheCall() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pactData, setPactData] = useState<PactData | null>(null);
  const [sequenceState, setSequenceState] = useState<FinalSequenceState>(FinalSequenceState.IDLE);
  const [completedToday, setCompletedToday] = useState(false);
  const [normalizedProgress, setNormalizedProgress] = useState(0);
  const [sensorData, setSensorData] = useState({ temp: 288, press: 1.0, stab: 99.5, flux: 0 });
  const [activeWarnings, setActiveWarnings] = useState<string[]>([]);
  const [arcSeeds, setArcSeeds] = useState<number[]>([]);

  const screenShakeRef = useRef<HTMLDivElement>(null);
  const backgroundFxRef = useRef<HTMLDivElement>(null);
  const coreButtonRef = useRef<HTMLButtonElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const crackLayerRef = useRef<HTMLDivElement>(null);
  const warnBannerRef = useRef<HTMLDivElement>(null);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isHoldingRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const timeSpeedRef = useRef<number>(1);
  const isAutoPlayingRef = useRef(false);
  const lastPhaseRef = useRef<number>(-1);

  // ── DATA FETCHING ────────────────────────────────────────────────────────────
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
      setSequenceState(done ? FinalSequenceState.LOCKED : FinalSequenceState.IDLE);
      setNormalizedProgress(done ? 1 : 0);
      hasCompletedRef.current = done;
    }
  };

  const saveCheckInData = async () => {
    if (isAutoPlayingRef.current || timeSpeedRef.current > 1) return;
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

  // ── AVERTISSEMENTS PAR PHASE ─────────────────────────────────────────────────
  const PHASE_WARNINGS: Record<number, string[]> = {
    1: ["CORE ENERGY RISING", "SYNCHRONIZATION INITIATED"],
    2: ["⚠ THERMAL ANOMALY DETECTED", "PRESSURE EXCEEDING NOMINAL", "CONTAINMENT FIELD ACTIVE"],
    3: ["🔴 CRITICAL OVERLOAD", "EMERGENCY PROTOCOLS ENGAGED", "FIELD INTEGRITY COMPROMISED", "EVACUATE ZONE-3"],
    4: [
      "☢ MELTDOWN IMMINENT",
      "ALL SYSTEMS FAILING",
      "DO NOT RELEASE",
      "CRITICAL — HOLD POSITION",
      "CORE BREACH IN T-∞",
    ],
  };

  // Génération d'arcs électriques (seeds pour stabilité SSR)
  useEffect(() => {
    setArcSeeds(Array.from({ length: 12 }, (_, i) => i));
  }, []);

  // ── EFFETS CINÉMATIQUES ──────────────────────────────────────────────────────
  const applyCinematicEffects = useCallback(
    (progress: number) => {
      if (hasCompletedRef.current || sequenceState !== FinalSequenceState.IDLE) {
        resetPhysicalEffects();
        return;
      }

      const phase = getPhase(progress);
      const rawI = easeInExpo(progress);
      const intensity = clamp(rawI, 0, 1);
      const color = getCoreColor(progress);
      const colorStr = colorToStr(color);

      // Mise à jour des capteurs
      setSensorData(getSensorData(progress));

      // Nouveaux warnings à chaque changement de phase
      if (phase !== lastPhaseRef.current) {
        lastPhaseRef.current = phase;
        const warns = PHASE_WARNINGS[phase] || [];
        setActiveWarnings(warns);
        // flash banner
        if (warnBannerRef.current && warns.length > 0) {
          warnBannerRef.current.style.animation = "none";
          void warnBannerRef.current.offsetHeight;
          warnBannerRef.current.style.animation = "warn-flash 0.3s ease-out";
        }
      }

      // ── SCREEN SHAKE ────────────────────────────────────────────────────────
      if (screenShakeRef.current) {
        const shakeMax = 40 * intensity;
        const rotateMax = 2.5 * intensity;
        const x = (Math.random() - 0.5) * 2 * shakeMax;
        const y = (Math.random() - 0.5) * 2 * shakeMax;
        const r = (Math.random() - 0.5) * 2 * rotateMax;

        const rgbSplit = 14 * intensity;
        const blurAmount = phase >= 3 ? 2 * intensity : 0;

        screenShakeRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${r}deg)`;
        if (phase >= 2) {
          screenShakeRef.current.style.filter = `blur(${blurAmount}px) contrast(${1 + intensity * 0.3})`;
          screenShakeRef.current.style.textShadow = `
          ${rgbSplit}px 0 rgba(255,0,60,${0.6 * intensity}),
          -${rgbSplit}px 0 rgba(0,255,200,${0.6 * intensity})
        `;
        } else {
          screenShakeRef.current.style.filter = "none";
          screenShakeRef.current.style.textShadow = "none";
        }
      }

      // ── CORE BUTTON ─────────────────────────────────────────────────────────
      if (coreButtonRef.current) {
        const breatheSpeed = 1.5 + intensity * 8;
        const breatheDepth = 0.01 + intensity * 0.06;
        const scale = 1 + Math.sin((performance.now() / 1000) * breatheSpeed) * breatheDepth + intensity * 0.12;
        const jX = phase >= 3 ? (Math.random() - 0.5) * 16 * intensity ** 2 : 0;
        const jY = phase >= 3 ? (Math.random() - 0.5) * 16 * intensity ** 2 : 0;
        coreButtonRef.current.style.transform = `scale(${scale}) translate3d(${jX}px, ${jY}px, 0)`;
        coreButtonRef.current.style.setProperty("--intensity", intensity.toString());
      }

      // ── BACKGROUND ──────────────────────────────────────────────────────────
      if (backgroundFxRef.current) {
        backgroundFxRef.current.style.opacity = (0.35 + intensity * 0.65).toString();
        backgroundFxRef.current.style.transform = `scale(${1 + intensity * 1.8})`;
        backgroundFxRef.current.style.filter = phase >= 3 ? `hue-rotate(${intensity * 60}deg)` : "none";
      }

      // ── VIGNETTE ────────────────────────────────────────────────────────────
      if (vignetteRef.current) {
        const vigSize = lerp(80, 20, easeIn3(progress)); // %
        const vigAlpha = lerp(0, 0.95, easeIn3(progress));
        const vigColor = phase >= 3 ? "180,0,0" : "0,0,0";
        vignetteRef.current.style.background = `radial-gradient(ellipse ${vigSize}% ${vigSize}% at 50% 50%, transparent 0%, rgba(${vigColor},${vigAlpha}) 100%)`;
      }

      // ── CRACKS ──────────────────────────────────────────────────────────────
      if (crackLayerRef.current) {
        if (progress >= 0.68) {
          const crackOpacity = clamp((progress - 0.68) / 0.15, 0, 1);
          crackLayerRef.current.style.opacity = crackOpacity.toString();
        } else {
          crackLayerRef.current.style.opacity = "0";
        }
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
    if (vignetteRef.current) vignetteRef.current.style.background = "none";
    if (crackLayerRef.current) crackLayerRef.current.style.opacity = "0";
    setActiveWarnings([]);
    lastPhaseRef.current = -1;
  };

  // ── BOUCLE RAF ───────────────────────────────────────────────────────────────
  const animateLoop = () => {
    if (!isHoldingRef.current || hasCompletedRef.current) return;
    const now = performance.now();
    const elapsed = (now - startTimeRef.current) * timeSpeedRef.current;
    const progress = clamp(elapsed / HOLD_DURATION, 0, 1);

    setNormalizedProgress(progress);
    applyCinematicEffects(progress);

    if (progress >= 1) {
      finishCinematicSequence();
    } else {
      rafRef.current = requestAnimationFrame(animateLoop);
    }
  };

  // ── GESTIONNAIRES ─────────────────────────────────────────────────────────────
  const startHolding = (e: React.PointerEvent) => {
    if (completedToday || hasCompletedRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isHoldingRef.current = true;
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animateLoop);
  };

  const stopHolding = () => {
    if (hasCompletedRef.current || isAutoPlayingRef.current) return;
    isHoldingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    resetPhysicalEffects();

    const snapBack = () => {
      if (isHoldingRef.current || hasCompletedRef.current) return;
      setNormalizedProgress((prev) => {
        const next = prev - 0.04;
        if (next <= 0) return 0;
        rafRef.current = requestAnimationFrame(snapBack);
        return next;
      });
    };
    snapBack();
  };

  // ── SÉQUENCE FINALE ───────────────────────────────────────────────────────────
  const finishCinematicSequence = async () => {
    isHoldingRef.current = false;
    hasCompletedRef.current = true;
    isAutoPlayingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    resetPhysicalEffects();

    setSequenceState(FinalSequenceState.IMPLOSION);
    await new Promise((r) => setTimeout(r, 600));

    setSequenceState(FinalSequenceState.SINGULARITY);
    await new Promise((r) => setTimeout(r, 250));

    if (user && !completedToday) saveCheckInData();
    setSequenceState(FinalSequenceState.EXPLOSION);
    await new Promise((r) => setTimeout(r, 120));

    setSequenceState(FinalSequenceState.REVEAL);
    await new Promise((r) => setTimeout(r, 5500));

    setSequenceState(FinalSequenceState.LOCKED);
    setCompletedToday(true);
  };

  // ── DEV TOOLS ─────────────────────────────────────────────────────────────────
  const devReset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    isHoldingRef.current = false;
    hasCompletedRef.current = false;
    isAutoPlayingRef.current = false;
    timeSpeedRef.current = 1;
    setCompletedToday(false);
    setSequenceState(FinalSequenceState.IDLE);
    setNormalizedProgress(0);
    setSensorData({ temp: 288, press: 1.0, stab: 99.5, flux: 0 });
    setActiveWarnings([]);
    lastPhaseRef.current = -1;
    resetPhysicalEffects();
  };

  const devAutoPlay = (speed = 1) => {
    devReset();
    setTimeout(() => {
      isHoldingRef.current = true;
      isAutoPlayingRef.current = true;
      timeSpeedRef.current = speed;
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(animateLoop);
    }, 50);
  };

  // ── CALCULS VISUELS ───────────────────────────────────────────────────────────
  const p = normalizedProgress;
  const phase = getPhase(p);
  const coreColor = getCoreColor(p);
  const currentColor = colorToStr(coreColor);
  const isCritical = p > 0.85;
  const isDanger = p > 0.72;

  const glowIntensity = isCritical
    ? `0 0 ${50 + p * 80}px ${currentColor}, 0 0 ${20 + p * 40}px ${currentColor}, inset 0 0 ${30 + p * 50}px ${currentColor}`
    : `0 0 ${p * 50}px ${currentColor}, inset 0 0 ${p * 20}px ${currentColor}`;

  // Nombre de particules par phase
  const particleCount = phase === 0 ? 8 : phase === 1 ? 18 : phase === 2 ? 32 : phase === 3 ? 50 : 80;
  // Nombre d'arcs par phase
  const arcCount = phase < 2 ? 0 : phase === 2 ? 3 : phase === 3 ? 6 : 10;

  // ── PHASE LABELS ──────────────────────────────────────────────────────────────
  const getStatusText = () => {
    if (p === 0) return "HOLD TO INITIATE";
    if (phase === 0) return "Synchronizing...";
    if (phase === 1) return "Energy rising // Hold steady";
    if (phase === 2) return "⚠ Thermal anomaly // Maintain contact";
    if (phase === 3) return "🔴 CRITICAL // DO NOT RELEASE";
    return "☢ MELTDOWN // HOLD — HOLD — HOLD";
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#010102] overflow-hidden flex flex-col relative text-slate-100 select-none touch-none">
      {/* ── STYLES ─────────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');

        /* PARTICULE GRAVITY */
        @keyframes gravity-well {
          0%   { transform: rotate(var(--a)) translateY(var(--r)) scale(0.8); opacity: 0; }
          15%  { opacity: var(--op); }
          100% { transform: rotate(calc(var(--a) + 200deg)) translateY(0px) scale(0.1); opacity: 0; }
        }
        .particle { animation: gravity-well var(--dur) linear infinite; }

        /* ARC ÉLECTRIQUE */
        @keyframes arc-flicker {
          0%,100% { opacity: 0; }
          5%,15%  { opacity: 1; }
          20%     { opacity: 0.3; }
          25%,35% { opacity: 0.9; }
          40%     { opacity: 0; }
          60%,70% { opacity: 0.8; }
          75%     { opacity: 0; }
        }
        .arc-bolt { animation: arc-flicker var(--arc-dur) ease-in-out infinite; }

        /* CORE PULSE */
        @keyframes core-pulse {
          0%,100% { transform: scale(1);    opacity: 0.5; }
          50%     { transform: scale(1.06); opacity: 0.85; }
        }
        .core-pulse { animation: core-pulse var(--pulse-spd, 2s) ease-in-out infinite; }

        /* SPIN RING */
        @keyframes ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ring-spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }

        /* CRACKS */
        @keyframes crack-grow {
          0%   { stroke-dashoffset: 300; opacity: 0; }
          30%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.7; }
        }
        .crack-line { 
          stroke-dasharray: 300; 
          animation: crack-grow 0.8s ease-out forwards;
        }

        /* WARN FLASH */
        @keyframes warn-flash {
          0%   { background: rgba(255,0,0,0.5); }
          100% { background: transparent; }
        }

        /* SÉQUENCE FINALE */
        @keyframes implosion-ring {
          0%   { transform: translate(-50%,-50%) scale(1);   opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(0.05); opacity: 0; }
        }
        .animate-implosion { animation: implosion-ring 0.6s cubic-bezier(0.7,0,1,0.9) forwards; }

        @keyframes shockwave {
          0%   { transform: translate(-50%,-50%) scale(0.1); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(4);   opacity: 0; }
        }
        .shockwave { animation: shockwave 0.8s cubic-bezier(0.1,0.5,0.2,1) forwards; }

        @keyframes flash-white {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash { animation: flash-white 1.5s ease-out forwards; }

        @keyframes reveal-majestic {
          0%   { opacity: 0; transform: translate(-50%,-40%) scale(1.1); filter: blur(20px); }
          100% { opacity: 1; transform: translate(-50%,-50%) scale(1);   filter: blur(0); }
        }
        .animate-reveal { animation: reveal-majestic 2.5s cubic-bezier(0.22,1,0.36,1) forwards; }

        @keyframes god-rays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .god-rays { animation: god-rays 60s linear infinite; }

        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .scanline { animation: scanline 4s linear infinite; }

        @keyframes data-glitch {
          0%,100% { transform: none; opacity: 1; }
          92%     { transform: translateX(2px); opacity: 0.8; }
          94%     { transform: translateX(-3px) skewX(5deg); opacity: 0.6; }
          96%     { transform: none; opacity: 1; }
        }
        .data-glitch { animation: data-glitch 1.5s ease-in-out infinite; }

        @keyframes emergency-blink {
          0%,49%  { opacity: 1; }
          50%,100%{ opacity: 0; }
        }
        .emergency-blink { animation: emergency-blink 0.4s linear infinite; }

        @keyframes expand-line {
          0%   { width: 0; opacity: 0; }
          100% { width: 200px; opacity: 1; }
        }
        .expand-line { animation: expand-line 1.5s ease-out forwards 0.5s; }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 0.6; transform: translateY(0); }
        }
        .slide-up { animation: slide-up 1s ease-out forwards 1s; opacity: 0; }

        @keyframes outer-ring-pulse {
          0%,100% { opacity: 0.15; transform: scale(1); }
          50%     { opacity: 0.4;  transform: scale(1.03); }
        }
        .outer-ring-pulse { animation: outer-ring-pulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* ── VIGNETTE DE DANGER ─────────────────────────────────────────────── */}
      <div ref={vignetteRef} className="fixed inset-0 pointer-events-none z-50 transition-all duration-100" />

      {/* ── COUCHE DE FISSURES ──────────────────────────────────────────────── */}
      <div
        ref={crackLayerRef}
        className="fixed inset-0 pointer-events-none z-40 opacity-0 transition-opacity duration-300"
      >
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <g stroke="rgba(255,60,0,0.6)" strokeWidth="0.3" fill="none">
            <line x1="0" y1="20" x2="30" y2="45" className="crack-line" style={{ animationDelay: "0s" }} />
            <line x1="30" y1="45" x2="20" y2="70" className="crack-line" style={{ animationDelay: "0.1s" }} />
            <line x1="100" y1="10" x2="72" y2="35" className="crack-line" style={{ animationDelay: "0.2s" }} />
            <line x1="72" y1="35" x2="85" y2="65" className="crack-line" style={{ animationDelay: "0.3s" }} />
            <line x1="15" y1="90" x2="45" y2="72" className="crack-line" style={{ animationDelay: "0.15s" }} />
            <line x1="85" y1="90" x2="60" y2="68" className="crack-line" style={{ animationDelay: "0.25s" }} />
            <line x1="50" y1="0" x2="48" y2="25" className="crack-line" style={{ animationDelay: "0.05s" }} />
          </g>
        </svg>
      </div>

      {/* ── WARN FLASH BANNER ───────────────────────────────────────────────── */}
      <div ref={warnBannerRef} className="fixed inset-0 pointer-events-none z-30" />

      {/* ── BACKGROUND FX ───────────────────────────────────────────────────── */}
      <div
        ref={backgroundFxRef}
        className="absolute inset-0 pointer-events-none z-0 will-change-transform"
        style={{ opacity: 0.35 }}
      >
        {/* Radial glow — change de couleur avec la progression */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vmax] h-[140vmax] mix-blend-screen transition-all duration-300"
          style={{
            background:
              p > 0
                ? `radial-gradient(circle at center, ${currentColor}22 0%, transparent 55%)`
                : "radial-gradient(circle at center, rgba(6,182,212,0.1) 0%, transparent 55%)",
          }}
        />
        {/* Rayons divins rotatifs */}
        {p > 0.3 && (
          <div
            className="absolute top-1/2 left-1/2 w-[120vmax] h-[120vmax] god-rays"
            style={{ translateX: "-50%", translateY: "-50%", transformOrigin: "center" }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 mix-blend-screen"
                style={{
                  height: "60vmax",
                  background: `linear-gradient(to top, ${currentColor}33, transparent)`,
                  transform: `rotate(${i * 45}deg) translateX(-50%)`,
                  transformOrigin: "top center",
                  opacity: 0.2 + p * 0.3,
                }}
              />
            ))}
          </div>
        )}
        {/* Scanline atmosphérique */}
        <div
          className="scanline absolute left-0 w-full h-[2px] mix-blend-overlay"
          style={{
            background: `linear-gradient(transparent, ${currentColor}44, transparent)`,
            opacity: p * 0.5,
          }}
        />
        {/* Bruit */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: "url('/noise.png')" }}
        />
      </div>

      {/* ── MAIN CONTAINER ──────────────────────────────────────────────────── */}
      <div
        ref={screenShakeRef}
        className="relative z-10 flex-1 flex flex-col items-center justify-center will-change-transform"
        style={{ minHeight: "100vh" }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header
          className={`absolute top-0 left-0 w-full p-6 flex justify-between items-center transition-opacity duration-500 ${
            sequenceState === FinalSequenceState.IDLE || sequenceState === FinalSequenceState.LOCKED
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white/40 hover:text-white/80"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col items-end gap-1">
            {pactData && (
              <>
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/30">Streak</span>
                <span className="font-mono text-sm text-white/60">{pactData.checkin_streak ?? 0} days</span>
              </>
            )}
          </div>
        </header>

        {/* ── ALERTES D'URGENCE ──────────────────────────────────────────── */}
        {activeWarnings.length > 0 && p > 0 && (
          <div className="absolute top-16 left-0 right-0 flex flex-col items-center gap-1 z-20 pointer-events-none">
            {activeWarnings.slice(0, 3).map((warn, i) => (
              <div
                key={warn}
                className="font-mono text-[9px] tracking-[0.4em] uppercase px-3 py-1 rounded"
                style={{
                  color: phase >= 4 ? "#fff" : phase >= 3 ? "#ff4444" : "#ffaa00",
                  background: phase >= 3 ? "rgba(255,0,0,0.12)" : "rgba(255,160,0,0.08)",
                  border: `1px solid ${phase >= 3 ? "rgba(255,0,0,0.3)" : "rgba(255,160,0,0.2)"}`,
                  animation: phase >= 4 ? "emergency-blink 0.4s linear infinite" : "none",
                  animationDelay: `${i * 0.15}s`,
                  opacity: Math.max(0, p * 2 - 0.3),
                }}
              >
                {warn}
              </div>
            ))}
          </div>
        )}

        {/* ── DONNÉES CAPTEURS (HUD) ──────────────────────────────────────── */}
        {p > 0.15 && !completedToday && (
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            style={{ opacity: clamp((p - 0.15) / 0.15, 0, 1) }}
          >
            <div
              className="flex flex-col gap-2 font-mono text-[8px] tracking-wider"
              style={{ color: currentColor, fontFamily: "'Share Tech Mono', monospace" }}
            >
              <div className="data-glitch">
                <div className="text-white/30 text-[7px] mb-0.5">CORE TEMP</div>
                <div
                  style={{
                    color: sensorData.temp > 2000 ? "#ff4444" : sensorData.temp > 500 ? "#ffaa00" : currentColor,
                  }}
                >
                  {sensorData.temp < 1000 ? sensorData.temp.toFixed(1) : Math.round(sensorData.temp)} K
                </div>
              </div>
              <div className="data-glitch" style={{ animationDelay: "0.3s" }}>
                <div className="text-white/30 text-[7px] mb-0.5">PRESSURE</div>
                <div style={{ color: sensorData.press > 60 ? "#ff4444" : currentColor }}>
                  {sensorData.press.toFixed(1)} MPa
                </div>
              </div>
              <div className="data-glitch" style={{ animationDelay: "0.6s" }}>
                <div className="text-white/30 text-[7px] mb-0.5">STABILITY</div>
                <div
                  style={{ color: sensorData.stab < 20 ? "#ff4444" : sensorData.stab < 50 ? "#ffaa00" : currentColor }}
                >
                  {sensorData.stab.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
          style={{ opacity: p > 0.15 ? clamp((p - 0.15) / 0.15, 0, 1) : 0 }}
        >
          <div
            className="flex flex-col gap-2 font-mono text-[8px] tracking-wider items-end"
            style={{ color: currentColor, fontFamily: "'Share Tech Mono', monospace" }}
          >
            <div className="data-glitch text-right">
              <div className="text-white/30 text-[7px] mb-0.5">NEUTRON FLUX</div>
              <div>{Math.round(sensorData.flux)} n/s</div>
            </div>
            <div className="data-glitch text-right" style={{ animationDelay: "0.4s" }}>
              <div className="text-white/30 text-[7px] mb-0.5">FIELD STRENGTH</div>
              <div style={{ color: p > 0.8 ? "#ff4444" : currentColor }}>
                {p > 0.8 ? "BREACH" : (p * 100).toFixed(0) + "%"}
              </div>
            </div>
            <div className="data-glitch text-right" style={{ animationDelay: "0.7s" }}>
              <div className="text-white/30 text-[7px] mb-0.5">PROTOCOL</div>
              <div>
                {p === 0 ? "STANDBY" : phase < 2 ? "ACTIVE" : phase < 3 ? "WARNING" : phase < 4 ? "DANGER" : "CRITICAL"}
              </div>
            </div>
          </div>
        </div>

        {/* ── ZONE CENTRALE ───────────────────────────────────────────────── */}
        <div
          className={`relative flex items-center justify-center transition-all ${
            sequenceState === FinalSequenceState.IMPLOSION
              ? "scale-0 opacity-0 duration-500"
              : "scale-100 opacity-100 duration-100"
          } ${sequenceState === FinalSequenceState.REVEAL ? "hidden" : "block"}`}
        >
          <button
            ref={coreButtonRef}
            onPointerDown={startHolding}
            onPointerUp={stopHolding}
            onPointerLeave={stopHolding}
            disabled={completedToday}
            className={`relative w-72 h-72 rounded-full flex items-center justify-center overflow-visible border-[1px] transition-all duration-100 outline-none group ${
              completedToday
                ? "border-green-500/30 cursor-default bg-green-900/5"
                : "border-white/10 cursor-pointer bg-black/40"
            }`}
            style={{
              boxShadow: !completedToday && p > 0 ? glowIntensity : "none",
              borderColor: isCritical
                ? `rgba(255,255,255,${p})`
                : completedToday
                  ? "rgba(34,197,94,0.3)"
                  : "rgba(255,255,255,0.1)",
            }}
          >
            {/* ── ANNEAUX ORBITAUX ────────────────────────────────────────── */}
            {!completedToday && p > 0.1 && (
              <>
                {/* Anneau externe (tourne dans le sens horaire) */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: `${288 + p * 60}px`,
                    height: `${288 + p * 60}px`,
                    border: `1px solid ${currentColor}`,
                    borderRadius: "50%",
                    opacity: p * 0.3,
                    animation: `ring-spin ${lerp(8, 1.5, easeIn3(p))}s linear infinite`,
                    borderStyle: "dashed",
                  }}
                />
                {/* Anneau intermédiaire (contre-rotation) */}
                {p > 0.25 && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      width: `${240 + p * 40}px`,
                      height: `${240 + p * 40}px`,
                      border: `1.5px solid ${currentColor}`,
                      borderRadius: "50%",
                      opacity: p * 0.5,
                      animation: `ring-spin-rev ${lerp(6, 0.8, easeIn3(p))}s linear infinite`,
                    }}
                  />
                )}
                {/* Anneau critique (triple vitesse) */}
                {p > 0.6 && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      width: `${200 + p * 30}px`,
                      height: `${200 + p * 30}px`,
                      border: `2px solid ${currentColor}`,
                      borderRadius: "50%",
                      opacity: (p - 0.6) * 2,
                      animation: `ring-spin ${lerp(3, 0.3, (p - 0.6) / 0.4)}s linear infinite`,
                      boxShadow: `0 0 ${p * 20}px ${currentColor}`,
                    }}
                  />
                )}
              </>
            )}

            {/* ── PLASMA INTERNE ──────────────────────────────────────────── */}
            {!completedToday && p > 0 && (
              <>
                <div
                  className="absolute inset-2 rounded-full blur-xl mix-blend-screen core-pulse"
                  style={
                    {
                      background: currentColor,
                      opacity: 0.3 + p * 0.5,
                      "--pulse-spd": `${lerp(2.5, 0.4, p)}s`,
                    } as React.CSSProperties
                  }
                />
                <div
                  className="absolute inset-12 rounded-full blur-lg mix-blend-overlay"
                  style={{
                    background: isCritical ? "white" : currentColor,
                    opacity: p * 0.8,
                  }}
                />
              </>
            )}

            {/* ── PARTICULES GRAVITY WELL ─────────────────────────────────── */}
            {!completedToday && p > 0 && (
              <div className="absolute inset-[-120px] pointer-events-none rounded-full overflow-hidden [mask-image:radial-gradient(circle,transparent_28%,black_65%)]">
                {[...Array(particleCount)].map((_, i) => {
                  const angle = (i / particleCount) * 360;
                  const duration = lerp(3.5, 0.4, p) + (i % 3) * 0.3;
                  const radius = `${lerp(180, 120, p)}px`;
                  const size = 1 + (i % 3) * 0.8;
                  const opacity = 0.3 + (i % 5) * 0.14;
                  return (
                    <div
                      key={i}
                      className="particle absolute top-1/2 left-1/2 rounded-full mix-blend-screen"
                      style={
                        {
                          width: `${size}px`,
                          height: `${size * 4}px`,
                          background: isCritical ? "white" : currentColor,
                          boxShadow: `0 0 ${size * 3}px ${currentColor}`,
                          transformOrigin: "0 150px",
                          "--a": `${angle}deg`,
                          "--r": `-${radius}`,
                          "--dur": `${duration}s`,
                          "--op": opacity,
                          animationDelay: `${-(i / particleCount) * duration}s`,
                        } as React.CSSProperties
                      }
                    />
                  );
                })}
              </div>
            )}

            {/* ── ARCS ÉLECTRIQUES (SVG) ──────────────────────────────────── */}
            {!completedToday && arcCount > 0 && (
              <div className="absolute inset-[-40px] pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 400 400">
                  {arcSeeds.slice(0, arcCount).map((seed, i) => {
                    const cx = 200;
                    const cy = 200;
                    const angle = (seed / 12) * Math.PI * 2 + i * 0.5;
                    const r1 = 130;
                    const r2 = 155 + (seed % 4) * 15;
                    const x1 = cx + Math.cos(angle) * r1;
                    const y1 = cy + Math.sin(angle) * r1;
                    const x2 = cx + Math.cos(angle + 0.3) * r2;
                    const y2 = cy + Math.sin(angle + 0.3) * r2;
                    const midX = (x1 + x2) / 2 + Math.cos(angle + Math.PI / 2) * (8 + (seed % 10));
                    const midY = (y1 + y2) / 2 + Math.sin(angle + Math.PI / 2) * (8 + (seed % 10));
                    const dur = 0.15 + (seed % 5) * 0.08;
                    return (
                      <polyline
                        key={i}
                        className="arc-bolt"
                        points={`${x1},${y1} ${midX},${midY} ${x2},${y2}`}
                        stroke={isCritical ? "white" : currentColor}
                        strokeWidth={isCritical ? "1.5" : "1"}
                        fill="none"
                        style={
                          {
                            "--arc-dur": `${dur}s`,
                            animationDelay: `${(i * 0.07) % 0.5}s`,
                            filter: `drop-shadow(0 0 3px ${currentColor})`,
                          } as React.CSSProperties
                        }
                      />
                    );
                  })}
                </svg>
              </div>
            )}

            {/* ── ICÔNE + TIMER ───────────────────────────────────────────── */}
            <div
              className="relative z-20 flex flex-col items-center pointer-events-none"
              style={{ transform: `scale(${1 + p * 0.2})` }}
            >
              {completedToday ? (
                <div
                  className="flex flex-col items-center text-green-500"
                  style={{ animation: "core-pulse 3s ease-in-out infinite" }}
                >
                  <Lock className="w-16 h-16 mb-4 drop-shadow-[0_0_15px_currentColor]" />
                  <span
                    className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-70"
                    style={{ fontFamily: "'Share Tech Mono', monospace" }}
                  >
                    Protocol Locked
                  </span>
                </div>
              ) : (
                <>
                  <Zap
                    className={`w-24 h-24 transition-all duration-100`}
                    style={{
                      fill: p > 0.5 ? currentColor : "transparent",
                      stroke: p < 0.8 ? (p > 0 ? currentColor : "rgba(255,255,255,0.2)") : "transparent",
                      strokeWidth: 1.5,
                      filter: `drop-shadow(0 0 ${p * 35}px ${currentColor})`,
                      animation: phase >= 3 ? "data-glitch 0.3s linear infinite" : "none",
                    }}
                  />
                  <div className="mt-6 h-6 flex items-center justify-center">
                    {p > 0 ? (
                      <span
                        className="tabular-nums font-mono text-sm"
                        style={{
                          color: isCritical ? "white" : currentColor,
                          textShadow: `0 0 ${p * 25}px ${currentColor}`,
                          fontFamily: "'Share Tech Mono', monospace",
                          animation: phase >= 4 ? "emergency-blink 0.5s linear infinite" : "none",
                        }}
                      >
                        {(20 - p * 20).toFixed(2)}s
                      </span>
                    ) : (
                      <span
                        className="text-white/30 group-hover:text-white/60 transition-colors font-mono text-xs tracking-widest"
                        style={{ fontFamily: "'Share Tech Mono', monospace" }}
                      >
                        HOLD TO INITIATE
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── OUTER RING PULSE (idle) ──────────────────────────────────── */}
            {!completedToday && p === 0 && (
              <div className="absolute inset-[-16px] rounded-full border border-white/5 outer-ring-pulse pointer-events-none" />
            )}
          </button>
        </div>

        {/* ── STATUS TEXT ─────────────────────────────────────────────────── */}
        {!completedToday && sequenceState === FinalSequenceState.IDLE && (
          <div className="absolute mt-6 w-full text-center pointer-events-none" style={{ top: "calc(50% + 160px)" }}>
            <p
              className="font-mono text-[9px] uppercase tracking-[0.5em] transition-all duration-200"
              style={{
                color: isCritical ? "white" : currentColor,
                opacity: p > 0 ? 0.6 + p * 0.4 : 0.3,
                fontFamily: "'Share Tech Mono', monospace",
                textShadow: p > 0 ? `0 0 10px ${currentColor}` : "none",
                transform: isCritical ? `translateX(${(Math.random() - 0.5) * 8}px)` : "none",
              }}
            >
              {getStatusText()}
            </p>

            {/* Barre de progression graphique */}
            {p > 0 && (
              <div className="mx-auto mt-4 w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-100 rounded-full"
                  style={{
                    width: `${p * 100}%`,
                    background: `linear-gradient(90deg, ${currentColor}, white)`,
                    boxShadow: `0 0 8px ${currentColor}`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── SÉQUENCE FINALE : IMPLOSION ──────────────────────────────────── */}
        {sequenceState === FinalSequenceState.IMPLOSION && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div
              className="animate-implosion rounded-full"
              style={{
                width: "300px",
                height: "300px",
                background: `radial-gradient(circle, white, ${currentColor}, transparent)`,
                boxShadow: `0 0 100px 50px ${currentColor}`,
              }}
            />
          </div>
        )}

        {/* ── SÉQUENCE FINALE : SINGULARITÉ ──────────────────────────────── */}
        {sequenceState === FinalSequenceState.SINGULARITY && <div className="fixed inset-0 z-50 bg-white" />}

        {/* ── SÉQUENCE FINALE : EXPLOSION ─────────────────────────────────── */}
        {sequenceState === FinalSequenceState.EXPLOSION && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <div
              className="shockwave absolute rounded-full border-4 border-white"
              style={{ width: "100px", height: "100px", left: "50%", top: "50%" }}
            />
            <div
              className="shockwave absolute rounded-full border-2 border-white/60"
              style={{ width: "80px", height: "80px", left: "50%", top: "50%", animationDelay: "0.1s" }}
            />
          </div>
        )}

        {/* ── SÉQUENCE FINALE : REVEAL ─────────────────────────────────────── */}
        {sequenceState === FinalSequenceState.REVEAL && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
            {/* Flash résiduel */}
            <div className="animate-flash absolute inset-0 bg-white pointer-events-none" />

            {/* Rayons divins */}
            <div
              className="absolute top-1/2 left-1/2 w-[200vmax] h-[200vmax] god-rays"
              style={{ transform: "translate(-50%, -50%)", transformOrigin: "center" }}
            >
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-2"
                  style={{
                    height: "100vmax",
                    background: `linear-gradient(to top, rgba(6,182,212,0.15), transparent)`,
                    transform: `rotate(${i * 30}deg) translateX(-50%)`,
                    transformOrigin: "top center",
                  }}
                />
              ))}
            </div>

            {/* Contenu Reveal */}
            <div
              className="animate-reveal absolute"
              style={{ top: "50%", left: "50%", textAlign: "center", minWidth: "320px" }}
            >
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <div
                    className="w-32 h-32 rounded-full border border-cyan-500/30 flex items-center justify-center"
                    style={{ boxShadow: "0 0 60px rgba(6,182,212,0.4), inset 0 0 40px rgba(6,182,212,0.2)" }}
                  >
                    <Zap
                      className="w-16 h-16 text-cyan-400"
                      style={{ filter: "drop-shadow(0 0 20px rgba(6,182,212,0.8))" }}
                    />
                  </div>
                  <div className="absolute inset-[-20px] rounded-full border border-cyan-500/15 outer-ring-pulse" />
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent expand-line" />
                  <h2
                    className="font-mono text-4xl font-black tracking-[0.15em] text-white uppercase"
                    style={{ fontFamily: "'Orbitron', sans-serif", textShadow: "0 0 40px rgba(6,182,212,0.8)" }}
                  >
                    Bond Held
                  </h2>
                  <div
                    className="h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent expand-line"
                    style={{ animationDelay: "0.8s" }}
                  />

                  <p
                    className="slide-up font-mono text-[10px] tracking-[0.4em] uppercase text-white/50 mt-2"
                    style={{ fontFamily: "'Share Tech Mono', monospace" }}
                  >
                    Pact Synchronized — Protocol Complete
                  </p>
                  {pactData && (
                    <p
                      className="slide-up font-mono text-xs tracking-wider text-cyan-400/70 mt-1"
                      style={{ fontFamily: "'Share Tech Mono', monospace", animationDelay: "1.5s", opacity: 0 }}
                    >
                      Streak: {(pactData.checkin_streak || 0) + 1} days
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAT LOCKED ─────────────────────────────────────────────────── */}
        {sequenceState === FinalSequenceState.LOCKED && (
          <div className="flex flex-col items-center justify-center gap-6 py-20">
            <div className="relative">
              <div
                className="w-40 h-40 rounded-full border border-green-500/20 flex items-center justify-center bg-green-900/5"
                style={{ boxShadow: "0 0 30px rgba(34,197,94,0.15), inset 0 0 20px rgba(34,197,94,0.05)" }}
              >
                <Lock
                  className="w-20 h-20 text-green-400 opacity-70"
                  style={{ filter: "drop-shadow(0 0 12px rgba(34,197,94,0.6))" }}
                />
              </div>
              <div className="absolute inset-[-12px] rounded-full border border-green-500/10 outer-ring-pulse" />
            </div>
            <div className="text-center space-y-2">
              <p
                className="font-mono text-xs tracking-[0.5em] uppercase text-green-400/60"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                Protocol Locked
              </p>
              <p
                className="font-mono text-[9px] tracking-widest uppercase text-white/20"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                Return tomorrow
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── DEV TOOLBAR ─────────────────────────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 z-[200] flex gap-2 opacity-10 hover:opacity-100 transition-opacity duration-300">
        <Button variant="secondary" size="icon" onClick={devReset} title="Hard Reset">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={() => devAutoPlay(1)} title="Auto Play (Normal)">
          <Play className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={() => devAutoPlay(5)} title="Fast Forward (5x)">
          <FastForward className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
