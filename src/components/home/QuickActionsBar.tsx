"use client";

// CORRECTION : On utilise le hook de navigation de React Router
import { useNavigate } from "react-router-dom";
import { CheckSquare, Book, Heart, Plus } from "lucide-react";
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
  const navigate = useNavigate(); // Le moteur de navigation rapide

  const actions = [
    {
      id: "tasks",
      label: "Tasks",
      sub: "/// CHECK",
      icon: CheckSquare,
      owned: ownedModules.todo,
      href: "/todo",
      color: "text-blue-400",
      bgHover: "hover:bg-blue-400/10",
      borderHover: "hover:border-blue-400/50",
    },
    {
      id: "journal",
      label: "Journal",
      sub: "/// RECORD",
      icon: Book,
      owned: ownedModules.journal,
      href: "/journal",
      color: "text-indigo-400",
      bgHover: "hover:bg-indigo-400/10",
      borderHover: "hover:border-indigo-400/50",
    },
    {
      id: "health",
      label: "Health",
      sub: "/// VITALS",
      icon: Heart,
      owned: ownedModules.health,
      href: "/health",
      color: "text-rose-400",
      bgHover: "hover:bg-rose-400/10",
      borderHover: "hover:border-rose-400/50",
    },
  ];

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div className="relative p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-between gap-3 shadow-2xl">
        {/* BOUTON NEW GOAL */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          // Si onNewGoalClick est fourni on l'utilise, sinon on navigue
          onClick={onNewGoalClick || (() => navigate("/goals/new"))}
          className="group relative flex flex-col items-center justify-center w-24 h-20 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-300 overflow-hidden cursor-pointer"
        >
          <NewGoalContent />
        </motion.button>

        {/* Separator */}
        <div className="w-px h-12 bg-white/10" />

        {/* MODULES LINKS */}
        <div className="flex-1 grid grid-cols-3 gap-2">
          {actions.map((action) =>
            action.owned ? (
              <motion.div
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                // Navigation instantanée (Client Side Routing)
                onClick={() => navigate(action.href)}
                className={cn(
                  "relative flex flex-col items-center justify-center h-20 rounded-xl border border-transparent transition-all duration-300 group cursor-pointer",
                  `bg-white/5 ${action.bgHover} ${action.borderHover}`,
                )}
              >
                <action.icon
                  className={cn("w-6 h-6 mb-1 transition-transform group-hover:-translate-y-1", action.color)}
                  strokeWidth={1.5}
                />
                <div className="flex flex-col items-center">
                  <span className={cn("text-[10px] font-bold font-orbitron tracking-wide text-foreground")}>
                    {action.label.toUpperCase()}
                  </span>
                  <span className="text-[8px] font-rajdhani text-muted-foreground tracking-widest opacity-60">
                    {action.sub}
                  </span>
                </div>

                <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-white/20 group-hover:bg-white/60" />
              </motion.div>
            ) : (
              <div
                key={action.id}
                className="relative flex flex-col items-center justify-center h-20 rounded-xl border border-transparent opacity-30 cursor-not-allowed bg-black/20 grayscale"
              >
                <action.icon className="w-6 h-6 mb-1 text-muted-foreground" strokeWidth={1.5} />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold font-orbitron tracking-wide text-muted-foreground">
                    {action.label.toUpperCase()}
                  </span>
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
      <div className="absolute inset-0 bg-cyan-400/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
      <div className="relative z-10 flex flex-col items-center gap-1">
        <div className="p-1.5 rounded-full bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] transition-shadow">
          <Plus className="w-5 h-5 stroke-[3]" />
        </div>
        <span className="text-[10px] font-orbitron font-bold text-cyan-100 tracking-wider mt-1">NEW GOAL</span>
      </div>
    </>
  );
}
