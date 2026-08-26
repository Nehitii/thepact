import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Dices, Target, Focus, RotateCcw, Zap, Lock, Crosshair, RotateCw, X } from "lucide-react";
import { Goal } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useThemeSombre } from "@/hooks/useThemeSombre";
import { selonTheme } from "@/lib/encrePapier";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMission, DeadlineType } from "@/hooks/useActiveMission";
import { DeadlineSelector } from "./DeadlineSelector";
import { ActiveMissionCard } from "./ActiveMissionCard";
import { CornerBrackets } from "@/components/home/CornerBrackets";
import { getDifficultyColor } from "@/lib/utils";

const ITEM_HEIGHT = 80;
const SPIN_DURATION = 2.5;
const REEL_ITEMS = 40;

interface MissionRandomizerProps {
  allGoals: Goal[];
  className?: string;
  /* LE TIRAGE EST UN OUTIL, PAS UN RELEVE.

     Il occupait 380 px du tableau de bord en permanence pour un geste
     qu on fait quand on le decide — et il n a rien a dire tant qu on
     ne l a pas lance : un viseur gris et un bouton SCAN. Il s ouvre
     desormais depuis la barre d acces rapide.

     LA MISSION EN COURS, ELLE, N EST PAS UN OUTIL : c est un
     engagement avec une echeance. Elle reste donc sur la page, que
     l on ait ouvert le tirage ou non. */
  ouvert?: boolean;
  onFermer?: () => void;
}

interface PendingMission {
  goal: Goal;
  stepTitle: string;
  stepId: string | null;
}

type ViewState = "idle" | "spinning" | "confirm" | "deadline";

const DIFF_FILTERS = [
  { key: "easy", label: "EASY", color: "#22c55e" },
  { key: "medium", label: "MED", color: "#eab308" },
  { key: "hard", label: "HARD", color: "#f97316" },
  { key: "extreme", label: "EXT", color: "#ef4444" },
  { key: "impossible", label: "IMP", color: "#ec4899" },
];

const SlotReel = ({ candidates, winner, onSpinComplete }: { candidates: Goal[]; winner: Goal; onSpinComplete: () => void }) => {
  const controls = useAnimation();
  const reelStrip = useMemo(() => {
    const strip: Goal[] = [];
    for (let i = 0; i < REEL_ITEMS - 1; i++) strip.push(candidates[Math.floor(Math.random() * candidates.length)]);
    strip.push(winner);
    return strip;
  }, [candidates, winner]);

  useEffect(() => {
    const animate = async () => {
      await controls.set({ y: 0, filter: "blur(0px)" });
      const targetY = -((REEL_ITEMS - 1) * ITEM_HEIGHT);
      await controls.start({ y: targetY, filter: ["blur(0px)", "blur(8px)", "blur(0px)"], transition: { duration: SPIN_DURATION, ease: [0.25, 1, 0.5, 1] } });
      setTimeout(() => onSpinComplete(), 400);
    };
    animate();
  }, [controls, onSpinComplete]);

  return (
    <div className="relative h-[80px] w-full overflow-hidden border-y border-primary/20 bg-[var(--nexus-inner-bg-deep)] shadow-inner">
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-between px-2">
        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
      </div>
      <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      <motion.div animate={controls} className="flex flex-col w-full">
        {reelStrip.map((goal, index) => (
          <div key={index} className="h-[80px] flex items-center justify-center px-4 w-full">
            <span className={cn("text-lg md:text-xl font-bold uppercase tracking-wider text-center truncate w-full", index === reelStrip.length - 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500" : "text-muted-foreground/30")}>
              {goal.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export function MissionRandomizer({ allGoals, className, ouvert = false, onFermer }: MissionRandomizerProps) {
  const navigate = useNavigate();
  const sombre = useThemeSombre();

  /* L en-tete est peint en dur a l orange neon #ff8c00, et chacune des
     cinq difficultes recoit sa couleur en style INLINE : hors de portee
     de toute feuille de style. Sur du papier, STANDBY tombait a 2,0:1 et
     le titre a 2,1:1. La teinte est conservee, sa clarte descend. */
  const orange = selonTheme("#ff8c00", sombre);
  const orangeRgb = sombre ? "255,140,0" : "140,74,0";
  const { activeMission, hasMission, isLoading, focusMission, abandonMission, completeMissionStep } = useActiveMission();
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [targetMission, setTargetMission] = useState<PendingMission | null>(null);
  const [tempWinner, setTempWinner] = useState<Goal | null>(null);
  const [isFocusing, setIsFocusing] = useState(false);
  const [diffFilter, setDiffFilter] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  const eligibleGoals = useMemo(() => allGoals.filter((g) => {
    if (g.goal_type === "habit") return false;
    const remaining = (g.total_steps || 0) - (g.validated_steps || 0);
    if (remaining <= 0 || g.status === "fully_completed" || g.status === "validated") return false;
    if (diffFilter && g.difficulty !== diffFilter) return false;
    return true;
  }), [allGoals, diffFilter]);

  const hasEligibleGoals = eligibleGoals.length > 0;
  /* Le pere passe deja la brigade quand elle existe : on le reconnait
     a ce que tous les objectifs recus la portent. */
  const vivierBrigade = hasEligibleGoals && allGoals.every((g) => g.is_focus);

  const handleSpinStart = async () => {
    if (!hasEligibleGoals) return;
    const winner = eligibleGoals[Math.floor(Math.random() * eligibleGoals.length)];
    setTempWinner(winner);
    setViewState("spinning");
    setScanCount((c) => c + 1);
    try {
      const { data: steps } = await supabase.from("steps").select("id, title").eq("goal_id", winner.id).eq("status", "pending").eq("exclude_from_spin", false).order("order", { ascending: true }).limit(1);
      const stepData = steps && steps.length > 0 ? { goal: winner, stepTitle: steps[0].title, stepId: steps[0].id } : { goal: winner, stepTitle: "Continue working on this goal", stepId: null };
      setTargetMission(stepData);
    } catch (e) {
      console.error("Error fetching step", e);
      setTargetMission({ goal: winner, stepTitle: "Goal Selected", stepId: null });
    }
  };

  const handleSpinEnd = () => setViewState("confirm");
  const handleConfirm = () => setViewState("deadline");
  const handleReroll = () => { setViewState("idle"); setTargetMission(null); setTempWinner(null); };

  const handleDeadlineSelect = async (deadline: DeadlineType) => {
    if (!targetMission) return;
    setIsFocusing(true);
    const success = await focusMission(targetMission.goal.id, targetMission.goal.name, targetMission.stepId, targetMission.stepTitle, deadline);
    if (success) { setTargetMission(null); setViewState("idle"); }
    setIsFocusing(false);
  };

  /* Ferme, on n annonce rien pendant le chargement : un tourniquet
     permanent pour un outil qui n est pas la remettrait sur la page
     ce qu on vient d en retirer. */
  if (isLoading) return ouvert ? (
    <div className="p-8 flex justify-center">
      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  ) : null;

  if (hasMission && activeMission) return <ActiveMissionCard mission={activeMission} onAbandon={abandonMission} onComplete={completeMissionStep} className={className} />;

  if (!ouvert) return null;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ borderRadius: 4, border: "1px solid var(--nexus-mission-border)", background: "var(--nexus-mission-bg)", boxShadow: "var(--nexus-shadow)" }}
    >
      <CornerBrackets />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(${orangeRgb},0.4), transparent)` }} />
      <style>{`@keyframes rotateSlow { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: "14px 24px", background: `rgba(${orangeRgb},0.05)`, borderBottom: `1px solid rgba(${orangeRgb},0.14)` }}>
        <div className="flex items-center gap-[10px]">
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke={orange} strokeWidth="1.5" style={{ animation: "rotateSlow 6s linear infinite" }}>
            <polygon points="8,1 15,4.5 15,11.5 8,15 1,11.5 1,4.5" />
            <circle cx="8" cy="8" r="2.5" />
          </svg>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "max(11px, 0.6875rem)", fontWeight: 700, letterSpacing: 4, color: orange, textShadow: sombre ? "0 0 8px rgba(255,140,0,0.7), 0 0 30px rgba(255,140,0,0.25)" : "none", textTransform: "uppercase" as const }}>
            Mission Randomizer
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "max(11px, 0.6875rem)", letterSpacing: 2, padding: "3px 10px", border: `1px solid rgba(${orangeRgb},0.34)`, color: orange, background: `rgba(${orangeRgb},0.06)`, clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}>
            STANDBY
          </div>
          {/* Un outil qu on ouvre doit pouvoir se fermer de l endroit
              ou on le regarde, pas seulement d ou on l a ouvert. */}
          {onFermer && (
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer le tirage de mission"
              title="Fermer"
              className="mr-tirage-fermer"
              style={{ color: orange }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewState === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 flex flex-col items-center justify-center py-10 rounded-sm border border-[var(--nexus-separator)] bg-[var(--nexus-inner-bg)] min-h-[180px]">
                <Crosshair className="w-10 h-10 text-[var(--nexus-text-dimmer)] mb-4" />
                <span className="ds-t-label font-orbitron uppercase tracking-[0.15em] text-[var(--nexus-text-dimmer)]">
                  INITIALISER LE SCAN DE MISSION
                </span>
                {/* Le vivier du tirage se dit. Il se retrecissait deja a
                    la brigade quand elle existait, mais en silence : on
                    pouvait croire le tirage casse en le voyant proposer
                    trois fois le meme objectif. */}
                <span className="ds-t-label mt-2 uppercase tracking-[0.12em] text-[var(--nexus-text-dimmer)] opacity-70">
                  {vivierBrigade
                    ? `▸ BRIGADE · ${eligibleGoals.length} OBJECTIF${eligibleGoals.length > 1 ? "S" : ""}`
                    : `▸ TOUT LE PACTE · ${eligibleGoals.length} OBJECTIFS`}
                </span>
              </div>

              <div className="w-full md:w-[200px] flex flex-col gap-3">
                <Button onClick={handleSpinStart} disabled={!hasEligibleGoals} className="w-full h-12 bg-transparent border border-primary/40 text-primary hover:bg-primary hover:text-black font-orbitron text-sm uppercase tracking-[0.15em] shadow-[0_0_12px_rgba(0,210,255,0.15)] hover:shadow-[0_0_20px_rgba(0,210,255,0.4)] transition-all" style={{ borderRadius: 4 }}>
                  {hasEligibleGoals ? "SCAN" : "NO GOALS"}
                </Button>

                <div className="rounded-sm border border-[var(--nexus-separator)] bg-[var(--nexus-inner-bg)] p-3">
                  <span className="ds-t-label font-orbitron uppercase tracking-[0.15em] text-[var(--nexus-text-dimmer)] block mb-2">STATISTIQUES</span>
                  <div className="space-y-1.5 ds-t-label font-mono">
                    <div className="flex justify-between text-[var(--nexus-text-dimmer)]">
                      <span>GÉNÉRÉES:</span>
                      <span className="text-primary tabular-nums">{scanCount}</span>
                    </div>
                    <div className="h-px bg-[var(--nexus-separator)]" />
                    <div className="flex justify-between text-[var(--nexus-text-dimmer)]">
                      <span>ÉLIGIBLES:</span>
                      <span className="text-primary tabular-nums">{eligibleGoals.length}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-sm border border-[var(--nexus-separator)] bg-[var(--nexus-inner-bg)] p-3">
                  <span className="ds-t-label font-orbitron uppercase tracking-[0.15em] text-[var(--nexus-text-dimmer)] block mb-2">FILTRE DIFF.</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DIFF_FILTERS.map((f) => (
                      <button key={f.key} onClick={() => setDiffFilter(diffFilter === f.key ? null : f.key)}
                        className={cn("ds-t-label font-orbitron font-bold uppercase tracking-wider py-1 rounded-sm border transition-all", diffFilter === f.key ? "border-current bg-current/10" : "border-[var(--nexus-separator)] hover:border-current/30")}
                        style={{ color: selonTheme(f.color, sombre) }}
                      >{f.label}</button>
                    ))}
                    <button onClick={() => setDiffFilter(null)} className="ds-t-label font-orbitron uppercase tracking-wider py-1 rounded-sm border border-[var(--nexus-separator)] text-[var(--nexus-text-dimmer)] hover:text-[var(--nexus-text-label)] transition-all">
                      <RotateCw className="w-2.5 h-2.5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewState === "spinning" && tempWinner && (
          <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 flex flex-col items-center gap-4">
            <div className="ds-t-label font-mono text-primary animate-pulse tracking-[0.3em] uppercase">Running Algorithm...</div>
            <SlotReel candidates={eligibleGoals} winner={tempWinner} onSpinComplete={handleSpinEnd} />
            <div className="flex gap-2 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </motion.div>
        )}

        {viewState === "confirm" && targetMission && (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-5">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="ds-t-label font-orbitron font-bold text-amber-500 uppercase tracking-[0.15em]">Target Locked</span>
              </div>
            </div>
            <div className="space-y-1 mb-4">
              <span className="ds-t-label text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-1">
                <Target className="w-3 h-3" /> Mission Objective
              </span>
              <h2 className="text-xl font-bold text-foreground leading-tight tracking-wide">{targetMission.goal.name}</h2>
            </div>
            <div className="p-4 bg-[var(--nexus-inner-bg-deep)] border-l-2 border-amber-500 rounded-sm mb-4">
              <span className="ds-t-label text-amber-400 uppercase tracking-wider font-mono block mb-1">{">"} Next Actionable Step</span>
              <p className="text-sm font-medium text-foreground/80">{targetMission.stepTitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleConfirm} className="bg-amber-500 hover:bg-amber-400 text-black font-bold tracking-wider border border-amber-400" style={{ borderRadius: 4 }}>
                <Focus className="w-4 h-4 mr-2" /> ENGAGE
              </Button>
              <Button onClick={handleReroll} variant="outline" className="border-border hover:bg-muted/50" style={{ borderRadius: 4 }}>
                <RotateCcw className="w-4 h-4 mr-2" /> DISMISS
              </Button>
            </div>
          </motion.div>
        )}

        {viewState === "deadline" && targetMission && (
          <motion.div key="deadline" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-5">
            <div className="mb-4 pb-4 border-b border-[var(--nexus-separator)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Set Timeline</h3>
            </div>
            <DeadlineSelector onSelect={handleDeadlineSelect} onCancel={() => setViewState("confirm")} isLoading={isFocusing} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
