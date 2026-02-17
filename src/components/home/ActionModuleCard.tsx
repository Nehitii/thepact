import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ModuleSize } from "@/hooks/useModuleLayout";
import { LucideIcon } from "lucide-react";

interface ActionModuleCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon | ReactNode;
  onClick: () => void;
  size?: ModuleSize;
  accentColor: "orange" | "amber" | "indigo" | "cyan" | "teal" | "primary";
  children?: ReactNode;
  className?: string;
}

const colorThemes = {
  orange: {
    glow: "bg-orange-500/10",
    glowHover: "group-hover:blur-[40px]",
    gradient: "bg-gradient-to-r from-orange-500/5 via-amber-500/10 to-orange-500/5",
    border: "border-orange-500/40 hover:border-orange-400/60",
    shadow: "hover:shadow-[0_0_40px_rgba(249,115,22,0.4),inset_0_0_30px_rgba(249,115,22,0.1)]",
    innerBorder: "border-orange-500/20",
    iconGlow: "bg-orange-500/30",
    iconColor: "text-orange-400",
    iconDrop: "drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]",
    textGradient: "from-orange-400 via-amber-400 to-orange-400",
    subtitleColor: "text-orange-400/60",
    cornerBorder: "border-orange-500/50",
    cardBg: "from-card/30 via-orange-950/20 to-card/30",
  },
  amber: {
    glow: "bg-amber-500/10",
    glowHover: "group-hover:blur-[40px]",
    gradient: "bg-gradient-to-r from-amber-500/5 via-yellow-500/10 to-amber-500/5",
    border: "border-amber-500/40 hover:border-amber-400/60",
    shadow: "hover:shadow-[0_0_40px_rgba(245,158,11,0.4),inset_0_0_30px_rgba(245,158,11,0.1)]",
    innerBorder: "border-amber-500/20",
    iconGlow: "bg-amber-500/30",
    iconColor: "text-amber-400",
    iconDrop: "drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]",
    textGradient: "from-amber-400 via-yellow-400 to-amber-400",
    subtitleColor: "text-amber-400/60",
    cornerBorder: "border-amber-500/50",
    cardBg: "from-card/30 via-amber-950/20 to-card/30",
  },
  indigo: {
    glow: "bg-indigo-500/10",
    glowHover: "group-hover:blur-[40px]",
    gradient: "bg-gradient-to-r from-indigo-500/5 via-purple-500/10 to-indigo-500/5",
    border: "border-indigo-500/40 hover:border-indigo-400/60",
    shadow: "hover:shadow-[0_0_40px_rgba(99,102,241,0.4),inset_0_0_30px_rgba(99,102,241,0.1)]",
    innerBorder: "border-indigo-500/20",
    iconGlow: "bg-indigo-500/30",
    iconColor: "text-indigo-400",
    iconDrop: "drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]",
    textGradient: "from-indigo-400 via-purple-400 to-indigo-400",
    subtitleColor: "text-indigo-400/60",
    cornerBorder: "border-indigo-500/50",
    cardBg: "from-card/30 via-indigo-950/20 to-card/30",
  },
  cyan: {
    glow: "bg-cyan-500/10",
    glowHover: "group-hover:blur-[40px]",
    gradient: "bg-gradient-to-r from-cyan-500/5 via-teal-500/10 to-cyan-500/5",
    border: "border-cyan-500/40 hover:border-cyan-400/60",
    shadow: "hover:shadow-[0_0_40px_rgba(6,182,212,0.4),inset_0_0_30px_rgba(6,182,212,0.1)]",
    innerBorder: "border-cyan-500/20",
    iconGlow: "bg-cyan-500/30",
    iconColor: "text-cyan-400",
    iconDrop: "drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]",
    textGradient: "from-cyan-400 via-teal-400 to-cyan-400",
    subtitleColor: "text-cyan-400/60",
    cornerBorder: "border-cyan-500/50",
    cardBg: "from-card/30 via-cyan-950/20 to-card/30",
  },
  teal: {
    glow: "bg-teal-500/10",
    glowHover: "group-hover:blur-[40px]",
    gradient: "bg-gradient-to-r from-teal-500/5 via-emerald-500/10 to-teal-500/5",
    border: "border-teal-500/40 hover:border-teal-400/60",
    shadow: "hover:shadow-[0_0_40px_rgba(20,184,166,0.4),inset_0_0_30px_rgba(20,184,166,0.1)]",
    innerBorder: "border-teal-500/20",
    iconGlow: "bg-teal-500/30",
    iconColor: "text-teal-400",
    iconDrop: "drop-shadow-[0_0_15px_rgba(20,184,166,0.6)]",
    textGradient: "from-teal-400 via-emerald-400 to-teal-400",
    subtitleColor: "text-teal-400/60",
    cornerBorder: "border-teal-500/50",
    cardBg: "from-card/30 via-teal-950/20 to-card/30",
  },
  primary: {
    glow: "bg-primary/10",
    glowHover: "group-hover:blur-[40px]",
    gradient: "bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5",
    border: "border-primary/40 hover:border-primary/60",
    shadow: "hover:shadow-[0_0_40px_hsl(var(--primary)/0.35),inset_0_0_30px_hsl(var(--primary)/0.12)]",
    innerBorder: "border-primary/20",
    iconGlow: "bg-primary/25",
    iconColor: "text-primary",
    iconDrop: "drop-shadow-[0_0_15px_hsl(var(--primary)/0.6)]",
    textGradient: "from-primary via-accent to-primary",
    subtitleColor: "text-primary/60",
    cornerBorder: "border-primary/50",
    cardBg: "from-card/30 via-primary/10 to-card/30",
  },
};

export function ActionModuleCard({
  title,
  subtitle,
  icon,
  onClick,
  size = "half",
  accentColor,
  children,
  className,
}: ActionModuleCardProps) {
  const theme = colorThemes[accentColor];

  const isIconComponent =
    typeof icon === "function" || (typeof icon === "object" && icon !== null && "$$typeof" in icon);

  return (
    <div className="animate-fade-in relative group h-full w-full">
      {/* Glow effects */}
      <div
        className={cn("absolute inset-0 rounded-lg blur-3xl transition-all duration-500", theme.glow, theme.glowHover)}
      />
      <div className={cn("absolute inset-0 rounded-lg blur-2xl", theme.gradient)} />

      <button
        onClick={onClick}
        className={cn(
          "relative w-full h-full min-h-[140px] flex flex-col bg-gradient-to-br backdrop-blur-xl border-2 rounded-lg overflow-hidden transition-all duration-500",
          theme.cardBg,
          theme.border,
          theme.shadow,
          className,
        )}
      >
        {/* Inner border */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn("absolute inset-[2px] border rounded-[6px]", theme.innerBorder)} />
        </div>

        {/* Main content - Centered but flexible */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 gap-3">
          {/* Icon */}
          <div className="relative shrink-0">
            <div className={cn("absolute inset-0 blur-lg rounded-full", theme.iconGlow)} />
            {isIconComponent ? (
              React.createElement(icon as LucideIcon, {
                className: cn("w-8 h-8 relative z-10", theme.iconColor, theme.iconDrop),
              })
            ) : (
              <span className={cn("text-2xl relative z-10", theme.iconDrop)}>{icon as React.ReactNode}</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-1">
            {/* Title */}
            <span
              className={cn(
                "font-bold uppercase tracking-[0.12em] font-orbitron text-transparent bg-clip-text bg-gradient-to-r text-sm text-center leading-tight",
                theme.textGradient,
              )}
            >
              {title}
            </span>

            {/* Subtitle */}
            {subtitle && size !== "quarter" && (
              <span
                className={cn(
                  "text-xs font-rajdhani tracking-wide text-center leading-tight line-clamp-2",
                  theme.subtitleColor,
                )}
              >
                {subtitle}
              </span>
            )}
          </div>

          {children}
        </div>

        {/* Corner accents */}
        <div className={cn("absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 rounded-tl", theme.cornerBorder)} />
        <div className={cn("absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 rounded-tr", theme.cornerBorder)} />
        <div className={cn("absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 rounded-bl", theme.cornerBorder)} />
        <div className={cn("absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 rounded-br", theme.cornerBorder)} />
      </button>
    </div>
  );
}
