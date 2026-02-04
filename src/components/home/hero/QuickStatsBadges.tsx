import { Target, Star, Calendar, ArrowUpRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStatsBadgesProps {
  totalGoals: number;
  completedGoals: number;
  focusGoalName: string | null;
  daysRemaining: number | null;
  className?: string;
}

/**
 * Modern Dashboard Stats Row
 * Features: Glassmorphism, Visual Progress Bars, and Hover Effects.
 */
export function QuickStatsBadges({
  totalGoals,
  completedGoals,
  focusGoalName,
  daysRemaining,
  className,
}: QuickStatsBadgesProps) {
  // Calcul du pourcentage pour la barre de progression
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mx-auto py-2", className)}>
      {/* 1. Carte Objectifs (Avec Barre de Progression) */}
      <StatCard
        icon={Target}
        label="Progression Globale"
        value={`${completedGoals} / ${totalGoals}`}
        subtext={totalGoals > 0 ? "Objectifs atteints" : "Aucun objectif"}
        variant="primary"
        progress={completionRate}
      />

      {/* 2. Carte Focus (Mise en avant du texte) */}
      <StatCard
        icon={Star}
        label="Focus Principal"
        value={focusGoalName || "Aucun Focus"}
        subtext={focusGoalName ? "Cible prioritaire active" : "Définissez votre cap"}
        variant="amber"
        isFocus
      />

      {/* 3. Carte Timeline (Urgence) */}
      <StatCard
        icon={Calendar}
        label="Temps Restant"
        value={daysRemaining !== null ? `${daysRemaining} Jours` : "∞"}
        subtext={daysRemaining !== null ? "Avant l'échéance" : "Pas de date limite"}
        variant="cyan"
      />
    </div>
  );
}

/* --- Sub-Components --- */

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  variant: "primary" | "amber" | "cyan";
  progress?: number;
  isFocus?: boolean;
}

function StatCard({ icon: Icon, label, value, subtext, variant, progress, isFocus = false }: StatCardProps) {
  // Configuration des thèmes de couleur
  const variants = {
    primary: {
      wrapper: "from-primary/10 via-primary/5 to-transparent border-primary/20 hover:border-primary/50",
      icon: "text-primary bg-primary/10",
      text: "text-primary",
      bar: "bg-primary",
    },
    amber: {
      wrapper: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/50",
      icon: "text-amber-500 bg-amber-500/10",
      text: "text-amber-500",
      bar: "bg-amber-500",
    },
    cyan: {
      wrapper: "from-cyan-500/10 via-cyan-500/5 to-transparent border-cyan-500/20 hover:border-cyan-500/50",
      icon: "text-cyan-400 bg-cyan-400/10",
      text: "text-cyan-400",
      bar: "bg-cyan-400",
    },
  };

  const theme = variants[variant];

  return (
    <div
      className={cn(
        "relative group overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg",
        theme.wrapper,
      )}
    >
      {/* Background Glow Effect */}
      <div
        className={cn(
          "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500",
          theme.bar,
        )}
      />

      <div className="p-5 flex flex-col justify-between h-full relative z-10">
        {/* Header: Icon & Label */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg flex items-center justify-center transition-colors", theme.icon)}>
              <Icon size={18} className={cn(isFocus && "animate-pulse")} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70 font-orbitron">
              {label}
            </span>
          </div>
          {/* Petite flèche indicative qui apparait au hover */}
          <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </div>

        {/* Main Value */}
        <div className="mb-2">
          <h3 className={cn("text-2xl font-bold font-orbitron tracking-tight truncate", theme.text)}>{value}</h3>
        </div>

        {/* Footer: Progress Bar OR Subtext */}
        <div className="mt-auto">
          {progress !== undefined ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-rajdhani font-medium text-muted-foreground">
                <span>Avancement</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out", theme.bar)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] font-rajdhani font-medium text-muted-foreground/60 flex items-center gap-1.5">
              <Activity size={10} />
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
