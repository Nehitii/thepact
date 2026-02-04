import { useNavigate } from "react-router-dom";
import { Plus, CheckSquare, BookOpen, Heart, ChevronRight } from "lucide-react";
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
      label: "New Goal",
      description: "Create Target",
      icon: Plus,
      onClick: () => navigate("/goals/new"),
      always: true,
      variant: "primary", // Special styling for the main action
    },
    {
      id: "log-todo",
      label: "Tasks",
      description: "Quick Log",
      icon: CheckSquare,
      onClick: () => navigate("/todo"),
      always: false,
      owned: ownedModules.todo,
      variant: "default",
    },
    {
      id: "journal-entry",
      label: "Journal",
      description: "Daily Note",
      icon: BookOpen,
      onClick: () => navigate("/journal"),
      always: false,
      owned: ownedModules.journal,
      variant: "default",
    },
    {
      id: "health-checkin",
      label: "Health",
      description: "Vitals",
      icon: Heart,
      onClick: () => navigate("/health"),
      always: false,
      owned: ownedModules.health,
      variant: "default",
    },
  ];

  const visibleActions = actions.filter((a) => a.always || a.owned);

  // Animation container pour l'effet "cascade"
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn("w-full max-w-5xl mx-auto py-4", className)}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {visibleActions.map((action) => (
          <motion.button
            key={action.id}
            variants={itemVariants}
            onClick={action.onClick}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "group relative flex flex-col items-start justify-between p-4 h-24 rounded-xl border transition-all duration-300 overflow-hidden",
              // Styles conditionnels selon le type d'action
              action.variant === "primary"
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 hover:shadow-primary/40"
                : "bg-card/40 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-card/60 hover:shadow-lg",
            )}
          >
            {/* Background Glow Effect (Subtil) */}
            {action.variant !== "primary" && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            )}

            <div className="flex w-full justify-between items-start z-10">
              <div
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  action.variant === "primary"
                    ? "bg-white/20"
                    : "bg-secondary/50 group-hover:bg-primary/10 group-hover:text-primary",
                )}
              >
                <action.icon size={20} />
              </div>

              {/* Petite flèche qui apparait au hover */}
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-all duration-300 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100",
                  action.variant === "primary" ? "text-white/80" : "text-muted-foreground",
                )}
              />
            </div>

            <div className="text-left z-10 mt-auto">
              <span
                className={cn(
                  "block text-sm font-bold font-orbitron tracking-wide",
                  action.variant === "primary" ? "text-primary-foreground" : "text-foreground",
                )}
              >
                {action.label}
              </span>
              <span
                className={cn(
                  "text-[10px] font-rajdhani uppercase tracking-wider",
                  action.variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground/60",
                )}
              >
                {action.description}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
