import { ReactNode, useState } from "react";
import { LucideIcon, Maximize2, Minimize2, ChevronDown, ChevronUp, Activity, Hash, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export type WidgetDisplayMode = "compact" | "full";

interface DashboardWidgetShellProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
  showDisplayModeToggle?: boolean;
  expandableContent?: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  accentColor?: "primary" | "accent" | "health" | "amber" | "orange" | "indigo" | "cyan" | "teal";
  isLoading?: boolean;
}

// Configuration des thèmes avec des couleurs "Néon Sombre"
const themeConfig = {
  primary: {
    main: "text-primary",
    border: "group-hover:border-primary/30",
    glow: "bg-primary/10",
    decoration: "bg-primary",
    shadow: "shadow-primary/10",
  },
  accent: {
    main: "text-purple-400",
    border: "group-hover:border-purple-500/30",
    glow: "bg-purple-500/10",
    decoration: "bg-purple-500",
    shadow: "shadow-purple-500/10",
  },
  health: {
    main: "text-emerald-400",
    border: "group-hover:border-emerald-500/30",
    glow: "bg-emerald-500/10",
    decoration: "bg-emerald-500",
    shadow: "shadow-emerald-500/10",
  },
  amber: {
    main: "text-amber-400",
    border: "group-hover:border-amber-500/30",
    glow: "bg-amber-500/10",
    decoration: "bg-amber-500",
    shadow: "shadow-amber-500/10",
  },
  orange: {
    main: "text-orange-400",
    border: "group-hover:border-orange-500/30",
    glow: "bg-orange-500/10",
    decoration: "bg-orange-500",
    shadow: "shadow-orange-500/10",
  },
  indigo: {
    main: "text-indigo-400",
    border: "group-hover:border-indigo-500/30",
    glow: "bg-indigo-500/10",
    decoration: "bg-indigo-500",
    shadow: "shadow-indigo-500/10",
  },
  cyan: {
    main: "text-cyan-400",
    border: "group-hover:border-cyan-500/30",
    glow: "bg-cyan-500/10",
    decoration: "bg-cyan-500",
    shadow: "shadow-cyan-500/10",
  },
  teal: {
    main: "text-teal-400",
    border: "group-hover:border-teal-500/30",
    glow: "bg-teal-500/10",
    decoration: "bg-teal-500",
    shadow: "shadow-teal-500/10",
  },
};

const WIDGET_MIN_HEIGHT = "280px";

export function DashboardWidgetShell({
  title,
  icon: Icon,
  children,
  subtitle,
  headerAction,
  footer,
  displayMode = "compact",
  onToggleDisplayMode,
  showDisplayModeToggle = true,
  expandableContent,
  defaultExpanded = false,
  className,
  accentColor = "primary",
  isLoading = false,
}: DashboardWidgetShellProps) {
  const theme = themeConfig[accentColor as keyof typeof themeConfig] || themeConfig.primary;
  const isCompact = displayMode === "compact";
  const [isInternalExpanded, setIsInternalExpanded] = useState(defaultExpanded);

  const toggleExpansion = () => {
    if (onToggleDisplayMode) {
      onToggleDisplayMode();
    } else {
      setIsInternalExpanded(!isInternalExpanded);
    }
  };

  const showExpandedContent = !isCompact || isInternalExpanded;

  if (isLoading) {
    return (
      <div
        className={cn(
          "relative h-full w-full rounded-xl overflow-hidden bg-card/5 backdrop-blur-sm border border-white/5",
          className,
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent animate-pulse" />
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="flex-1 bg-white/[0.02] rounded border border-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group relative h-full w-full flex flex-col isolation-auto", className)}>
      {/* 1. Structure du Chassis (Main Shell) */}
      <div
        className={cn(
          "relative flex flex-col flex-1 rounded-xl overflow-hidden transition-all duration-500",
          "bg-[#030304]/80 backdrop-blur-3xl", // Fond très sombre
          "border border-white/[0.08]", // Bordure de base subtile
          theme.border, // Bordure colorée au survol
          "shadow-xl hover:shadow-2xl",
          theme.shadow,
        )}
        style={{ minHeight: WIDGET_MIN_HEIGHT }}
      >
        {/* 2. Texture de fond "Dot Grid" (Cyber Texture) */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* 3. Reflet d'ambiance (Interne) */}
        <div
          className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-tr from-transparent via-transparent to-white/[0.02]",
          )}
        />

        {/* ===== ÉLÉMENTS DE DÉCORATION CYBERPUNK (HUD) ===== */}

        {/* Coin Supérieur Droit : Puce Tech */}
        <div className="absolute top-0 right-0 p-3 pointer-events-none z-20">
          <div className="flex gap-1">
            <div
              className={cn(
                "w-1 h-1 rounded-full opacity-20 group-hover:opacity-100 transition-all duration-500",
                theme.decoration,
              )}
            />
            <div
              className={cn(
                "w-1 h-1 rounded-full opacity-20 group-hover:opacity-100 transition-all duration-500 delay-75",
                theme.decoration,
              )}
            />
            <div
              className={cn(
                "w-1 h-1 rounded-full opacity-20 group-hover:opacity-100 transition-all duration-500 delay-150",
                theme.decoration,
              )}
            />
          </div>
        </div>

        {/* Coin Inférieur Gauche : ID Module */}
        <div className="absolute bottom-4 left-4 pointer-events-none z-20 opacity-0 group-hover:opacity-30 transition-opacity duration-500">
          <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Hash className="w-3 h-3" /> MOD_{title.substring(0, 3).toUpperCase()}
          </span>
        </div>

        {/* Marqueurs d'angle (Brackets) - Apparaissent au survol */}
        <div
          className={cn(
            "absolute top-2 left-2 w-2 h-2 border-l border-t border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute top-2 right-2 w-2 h-2 border-r border-t border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute bottom-2 left-2 w-2 h-2 border-l border-b border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute bottom-2 right-2 w-2 h-2 border-r border-b border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100",
          )}
        />

        {/* ===== HEADER ===== */}
        <div className="relative z-10 flex-shrink-0 px-6 pt-6 pb-2 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 group/header cursor-default">
            {/* Icône dans un conteneur Hexagone/Carré technique */}
            <div
              className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded bg-white/[0.03] border border-white/10 transition-all duration-500",
                "group-hover:border-white/20 group-hover:bg-white/[0.05]",
                theme.main,
              )}
            >
              <Icon className="w-4 h-4" />
              {/* Petit glow sous l'icône */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500",
                  theme.decoration,
                )}
              />
            </div>

            <div className="flex flex-col">
              <h3
                className={cn(
                  "text-xs font-bold uppercase tracking-[0.2em] font-orbitron transition-colors duration-300",
                  "text-white/80 group-hover:text-white",
                )}
              >
                {title}
              </h3>
              {subtitle && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Activity className={cn("w-2 h-2 opacity-50", theme.main)} />
                  <p className="text-[10px] text-white/40 font-rajdhani tracking-wide uppercase">{subtitle}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions & Contrôles */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {headerAction}

            {(showDisplayModeToggle || expandableContent) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpansion}
                className="h-7 w-7 rounded hover:bg-white/10 text-white/40 hover:text-white"
              >
                <motion.div
                  animate={{ rotate: showExpandedContent ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  {onToggleDisplayMode ? (
                    showExpandedContent ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </motion.div>
              </Button>
            )}
          </div>
        </div>

        {/* Ligne de séparation technique (fade out sur les bords) */}
        <div className="relative mx-6 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-1 opacity-50" />

        {/* ===== CORPS DU MODULE ===== */}
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          {/* Contenu Principal */}
          <div className="flex-1 px-6 py-4 overflow-auto custom-scrollbar relative">{children}</div>

          {/* Zone Extensible (Tiroir technique) */}
          <AnimatePresence>
            {showExpandedContent && expandableContent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="border-t border-white/[0.05] bg-black/20"
              >
                <div className="px-6 py-4 relative">
                  {/* Accent vertical sur le côté gauche de la zone étendue */}
                  <div className={cn("absolute left-0 top-0 bottom-0 w-[2px]", theme.decoration)} />
                  {expandableContent}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===== FOOTER ===== */}
        {footer && (
          <div className="relative z-10 px-6 py-3 border-t border-white/[0.05] bg-white/[0.01]">
            <div className="text-[10px] text-white/30 font-rajdhani tracking-wider uppercase flex items-center justify-between">
              {footer}
              <div className="flex gap-1 items-center">
                <Zap className="w-2 h-2 opacity-30" />
                <span className="opacity-30">ONLINE</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
