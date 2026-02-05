"use client";

import { Target, Star, Calendar, ArrowUpRight, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";

interface QuickStatsBadgesProps {
  totalGoals: number;
  completedGoals: number;
  focusGoalName: string | null;
  daysRemaining: number | null;
  className?: string;
}

const AnimatedCounter = ({ value }: { value: number }) => {
  const spring = useSpring(0, { bounce: 0, duration: 2000 });
  const display = useTransform(spring, (current) => Math.round(current));

  // Petit hack pour déclencher l'animation au mount
  useMemo(() => spring.set(value), [spring, value]);

  return <motion.span>{display}</motion.span>;
};
import { useEffect, useMemo } from "react";

export function QuickStatsBadges({
  totalGoals,
  completedGoals,
  focusGoalName,
  daysRemaining,
  className,
}: QuickStatsBadgesProps) {
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mx-auto py-2 relative", className)}>
      {/* Visual Connector Line (Circuit board style) - Behind cards */}
      <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent -z-10" />

      {/* 1. Carte Objectifs */}
      <StatCard
        icon={Target}
        label="Progression"
        value={
          <span className="flex items-baseline gap-1">
            <AnimatedCounter value={completedGoals} />
            <span className="text-lg text-white/40 font-normal">/ {totalGoals}</span>
          </span>
        }
        subtext={totalGoals > 0 ? "Objectifs atteints" : "Aucun objectif"}
        variant="indigo"
        progress={completionRate}
      />

      {/* 2. Carte Focus (Avec gestion du texte long) */}
      <StatCard
        icon={Star}
        secondaryIcon={Sparkles}
        label="Focus Principal"
        value={focusGoalName || "Aucun Focus"}
        subtext={focusGoalName ? "Cible prioritaire" : "Définissez un cap"}
        variant="amber"
        isFocus
        // Si le texte est long (> 18 chars), on réduit la taille de la font
        valueClassName={focusGoalName && focusGoalName.length > 18 ? "text-xl leading-tight" : "text-2xl"}
      />

      {/* 3. Carte Timeline */}
      <StatCard
        icon={Calendar}
        secondaryIcon={Clock}
        label="Temps Restant"
        value={
          daysRemaining !== null ? (
            <span className="flex items-baseline gap-1">
              <AnimatedCounter value={daysRemaining} />
              <span className="text-lg font-rajdhani font-medium text-white/50">Jours</span>
            </span>
          ) : (
            "∞"
          )
        }
        subtext={daysRemaining !== null ? "Avant échéance" : "Pas de date limite"}
        variant="teal"
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  secondaryIcon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  subtext: string;
  variant: "indigo" | "amber" | "teal";
  progress?: number;
  isFocus?: boolean;
  valueClassName?: string;
}

function StatCard({
  icon: Icon,
  secondaryIcon: SecondaryIcon,
  label,
  value,
  subtext,
  variant,
  progress,
  isFocus = false,
  valueClassName,
}: StatCardProps) {
  const variants = {
    indigo: {
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      border: "hover:border-blue-500/40 border-white/5",
      iconBox: "bg-blue-500/20 text-blue-400",
      text: "text-blue-100",
      bar: "bg-blue-500",
    },
    amber: {
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      border: "hover:border-amber-500/40 border-white/5",
      iconBox: "bg-amber-500/20 text-amber-400",
      text: "text-amber-100",
      bar: "bg-amber-500",
    },
    teal: {
      gradient: "from-cyan-500/10 via-cyan-500/5 to-transparent",
      border: "hover:border-cyan-500/40 border-white/5",
      iconBox: "bg-cyan-500/20 text-cyan-400",
      text: "text-cyan-100",
      bar: "bg-cyan-500",
    },
  };

  const theme = variants[variant];
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-black/40 backdrop-blur-xl transition-all duration-300",
        theme.border,
        theme.gradient,
      )}
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [x, y],
            ([latestX, latestY]) =>
              `radial-gradient(400px circle at ${latestX}px ${latestY}px, rgba(255,255,255,0.05), transparent 40%)`,
          ),
        }}
      />

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />

      <div className="relative z-10 flex h-full flex-col p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg flex items-center justify-center transition-colors", theme.iconBox)}>
              <Icon size={16} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 font-orbitron">
              {label}
            </span>
          </div>
          {isFocus && <ArrowUpRight className="w-4 h-4 text-amber-500/50" />}
        </div>

        <div className="mb-4 min-h-[2rem] flex items-center">
          <div className={cn("font-orbitron font-bold tracking-tight truncate w-full", theme.text, valueClassName)}>
            {value}
          </div>
        </div>

        <div className="mt-auto">
          {progress !== undefined ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-rajdhani font-medium text-muted-foreground">
                <span>Avancement</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out", theme.bar)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[10px] font-rajdhani font-medium text-muted-foreground/60 flex items-center gap-1.5">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
