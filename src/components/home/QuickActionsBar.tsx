import { useNavigate } from "react-router-dom";
import { CheckSquare, Book, Heart, Plus, Lock, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface QuickActionsBarProps {
  ownedModules: {
    todo: boolean;
    journal: boolean;
    health: boolean;
  };
  className?: string;
  onNewGoalClick?: () => void;
}

export function QuickActionsBar({ ownedModules, className, onNewGoalClick }: QuickActionsBarProps) {
  const navigate = useNavigate();

  const actions = [
    {
      id: "tasks",
      label: "Tasks",
      sub: "/// SYS.CHK",
      sysCode: "0x1A",
      icon: CheckSquare,
      owned: ownedModules.todo,
      href: "/todo",
      color: "text-cyan-400",
      glow: "hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]",
      borderHover: "hover:border-cyan-400/80",
      bgHover: "hover:bg-cyan-950/40",
    },
    {
      id: "journal",
      label: "Journal",
      sub: "/// DATA.LOG",
      sysCode: "0x2B",
      icon: Book,
      owned: ownedModules.journal,
      href: "/journal",
      color: "text-fuchsia-400",
      glow: "hover:shadow-[0_0_15px_rgba(232,121,249,0.4)]",
      borderHover: "hover:border-fuchsia-400/80",
      bgHover: "hover:bg-fuchsia-950/40",
    },
    {
      id: "health",
      label: "Health",
      sub: "/// BIO.MON",
      sysCode: "0x3C",
      icon: Heart,
      owned: ownedModules.health,
      href: "/health",
      color: "text-rose-500",
      glow: "hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]",
      borderHover: "hover:border-rose-500/80",
      bgHover: "hover:bg-rose-950/40",
    },
  ];

  return (
    <div className={cn("w-full max-w-3xl mx-auto font-rajdhani", className)}>
      {/* Conteneur principal style Terminal/HUD */}
      <div className="relative p-3 bg-[#0a0a0c] border border-white/10 flex items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Scanline Effect (Overlay) */}
        <div
          className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px]"
          aria-hidden="true"
        />

        {/* Ligne de tension supérieure */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        {/* Bouton NEW GOAL */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewGoalClick || (() => navigate("/goals/new"))}
          aria-label="Create a new goal"
          className="group relative flex flex-col items-center justify-center w-28 h-24 bg-[#051515] border-l-2 border-cyan-500 border-t border-b border-r border-white/5 hover:border-cyan-400 transition-all duration-300 overflow-hidden cursor-pointer"
        >
          <NewGoalContent />
        </motion.button>

        {/* Séparateur tech */}
        <div className="flex flex-col gap-1 items-center justify-center" aria-hidden="true">
          <div className="w-1 h-1 bg-cyan-500/50 animate-pulse" />
          <div className="w-px h-16 bg-white/10" />
          <div className="w-1 h-1 bg-cyan-500/50 animate-pulse" />
        </div>

        {/* MODULE LINKS */}
        <div
          className="flex-1 grid grid-cols-3 gap-3 relative z-10"
          role="navigation"
          aria-label="Quick module actions"
        >
          {actions.map((action) =>
            action.owned ? (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.href)}
                aria-label={`Go to ${action.label}`}
                className={cn(
                  "relative flex flex-col items-center justify-center h-24 border border-white/5 bg-white/[0.02] transition-all duration-300 group cursor-pointer",
                  `${action.bgHover} ${action.borderHover} ${action.glow}`,
                )}
              >
                {/* Décoration HUD */}
                <span className="absolute top-1 left-1.5 text-[8px] font-orbitron text-muted-foreground/50">
                  {action.sysCode}
                </span>
                <div className="absolute bottom-1 right-1.5 flex gap-0.5">
                  <div className="w-1 h-1 bg-white/20 group-hover:bg-current transition-colors" />
                  <div className="w-1 h-1 bg-white/20 group-hover:bg-current transition-colors" />
                </div>

                <action.icon
                  className={cn("w-6 h-6 mb-2 transition-transform duration-300 group-hover:scale-110", action.color)}
                  strokeWidth={1.5}
                />

                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold font-orbitron tracking-widest text-foreground group-hover:text-white transition-colors">
                    {action.label.toUpperCase()}
                  </span>
                  <span className={cn("text-[9px] font-rajdhani tracking-[0.2em] opacity-60 mt-0.5", action.color)}>
                    {action.sub}
                  </span>
                </div>
              </motion.button>
            ) : (
              // ETAT VERROUILLÉ (ACCESS DENIED)
              <div
                key={action.id}
                className="relative flex flex-col items-center justify-center h-24 border border-red-900/30 bg-red-950/10 opacity-60 cursor-not-allowed overflow-hidden"
                aria-disabled="true"
                aria-label={`${action.label} — locked`}
              >
                {/* Rayures de zone de danger */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,0,0.03)_10px,rgba(255,0,0,0.03)_20px)]" />

                <Lock className="w-5 h-5 mb-2 text-red-500/50" strokeWidth={1.5} />
                <div className="flex flex-col items-center relative z-10">
                  <span className="text-[10px] font-bold font-orbitron tracking-wide text-red-500/50">ENCRYPTED</span>
                  <span className="text-[8px] text-red-700 mt-1 font-mono">ERR_NO_ACCESS</span>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function NewGoalContent() {
  return (
    <>
      {/* Background Glow */}
      <div
        className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-400/20 transition-colors"
        aria-hidden="true"
      />

      {/* Glitch Overlay (Simulé avec des opacités) */}
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-700 transition-all ease-in-out" />

      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1 text-cyan-500">
          <Terminal className="w-3 h-3" />
          <span className="text-[8px] font-mono tracking-widest animate-pulse">INIT_SEQ</span>
        </div>

        <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 group-hover:bg-cyan-400 group-hover:text-black shadow-[0_0_10px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] transition-all">
          <Plus className="w-5 h-5 stroke-[2]" />
        </div>

        <span className="text-[11px] font-orbitron font-bold text-cyan-100 tracking-[0.15em] mt-1 group-hover:text-white group-hover:shadow-[0_0_8px_#22d3ee]">
          NEW GOAL
        </span>
      </div>
    </>
  );
}
