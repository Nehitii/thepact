import { useNavigate } from "react-router-dom";
import { Plus, CheckSquare, BookOpen, Heart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface QuickActionsBarProps {
  ownedModules: {
    todo: boolean;
    journal: boolean;
    health: boolean;
  };
  className?: string;
}

export function QuickActionsBar({ ownedModules, className }: QuickActionsBarProps) {
  const navigate = useNavigate();

  const actions = [
    {
      id: "new-goal",
      label: "NEW GOAL",
      sub: "Initiate",
      icon: Plus,
      onClick: () => navigate("/goals/new"),
      always: true,
      variant: "primary",
    },
    {
      id: "log-todo",
      label: "TASKS",
      sub: "Check",
      icon: CheckSquare,
      onClick: () => navigate("/todo"),
      always: false,
      owned: ownedModules.todo,
      variant: "glass",
    },
    {
      id: "journal-entry",
      label: "JOURNAL",
      sub: "Record",
      icon: BookOpen,
      onClick: () => navigate("/journal"),
      always: false,
      owned: ownedModules.journal,
      variant: "glass",
    },
    {
      id: "health-checkin",
      label: "HEALTH",
      sub: "Vitals",
      icon: Heart,
      onClick: () => navigate("/health"),
      always: false,
      owned: ownedModules.health,
      variant: "glass",
    },
  ];

  const visibleActions = actions.filter((a) => a.always || a.owned);

  return (
    <div className={cn("w-full max-w-5xl mx-auto py-6", className)}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleActions.map((action, i) => (
          <QuantumButton key={action.id} action={action} index={i} />
        ))}
      </div>
    </div>
  );
}

// --- Le Composant Bouton Ultra-Avancé ---

function QuantumButton({ action, index }: { action: any; index: number }) {
  const isPrimary = action.variant === "primary";

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, type: "spring" }}
      whileHover="hover"
      whileTap="tap"
      onClick={action.onClick}
      className={cn(
        "relative group h-28 w-full overflow-hidden rounded-2xl border transition-all duration-500",
        // Base styles
        isPrimary
          ? "border-primary/50 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.5)]"
          : "border-white/10 bg-black/20 hover:border-white/20",
      )}
    >
      {/* 1. L'arrière-plan abstrait animé (Plasma Effect) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className={cn(
            "absolute -top-[50%] -left-[50%] w-[200%] h-[200%] blur-[60px]",
            isPrimary
              ? "bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,hsl(var(--primary))_100%)]"
              : "bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,rgba(255,255,255,0.1)_100%)]",
          )}
        />
      </div>

      {/* 2. Glass Layer & Noise */}
      <div className="absolute inset-0 backdrop-blur-xl bg-card/10 group-hover:bg-card/20 transition-colors duration-300" />

      {/* 3. Contenu au premier plan */}
      <div className="relative h-full flex flex-col justify-between p-5 z-10">
        {/* Header: Icon & Indicator */}
        <div className="flex justify-between items-start">
          <motion.div
            variants={{
              hover: { scale: 1.1, rotate: isPrimary ? 90 : 0 },
              tap: { scale: 0.9 },
            }}
            className={cn(
              "p-2.5 rounded-xl backdrop-blur-md border border-white/10 transition-colors duration-300",
              isPrimary
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground group-hover:text-white group-hover:bg-white/10",
            )}
          >
            <action.icon size={22} strokeWidth={1.5} />
          </motion.div>

          {/* Abstract Dot that glows */}
          <div className="flex gap-1">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn("w-1.5 h-1.5 rounded-full", isPrimary ? "bg-primary-foreground" : "bg-white/40")}
            />
            <div className={cn("w-1.5 h-1.5 rounded-full", isPrimary ? "bg-primary-foreground/30" : "bg-white/10")} />
          </div>
        </div>

        {/* Footer: Text Content */}
        <div className="text-left space-y-0.5">
          <motion.div
            variants={{ hover: { x: 5 } }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex items-center gap-2"
          >
            <span
              className={cn(
                "text-sm font-bold font-orbitron tracking-widest",
                isPrimary ? "text-primary-foreground" : "text-foreground group-hover:text-white",
              )}
            >
              {action.label}
            </span>
            {/* Arrow appears on hover */}
            <motion.div variants={{ hover: { opacity: 1, x: 0 }, initial: { opacity: 0, x: -10 } }} initial="initial">
              <ArrowRight size={14} className={isPrimary ? "text-primary-foreground" : "text-white"} />
            </motion.div>
          </motion.div>

          <p
            className={cn(
              "text-[10px] font-rajdhani uppercase tracking-wider font-medium",
              isPrimary ? "text-primary-foreground/70" : "text-muted-foreground group-hover:text-white/60",
            )}
          >
            /// {action.sub}
          </p>
        </div>
      </div>

      {/* 4. Bordure brillante qui se déplace au survol (Scanline effect) */}
      <motion.div
        variants={{
          hover: { top: "150%" },
          initial: { top: "-50%" },
        }}
        initial="initial"
        transition={{ duration: 0.6 }}
        className="absolute left-0 right-0 h-[30%] bg-gradient-to-b from-transparent via-white/10 to-transparent skew-y-12 pointer-events-none"
      />
    </motion.button>
  );
}
