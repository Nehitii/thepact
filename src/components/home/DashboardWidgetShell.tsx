import { ReactNode, useState } from "react";
import { LucideIcon, Maximize2, Minimize2, ChevronDown, ChevronUp, Activity, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export type WidgetDisplayMode = "compact" | "full";

interface DashboardWidgetShellProps {
  // Content
  title: string;
  icon: LucideIcon;
  children: ReactNode;

  // Optional sections
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;

  // Display mode
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
  showDisplayModeToggle?: boolean;

  // Expandable content
  expandableContent?: ReactNode;
  defaultExpanded?: boolean;

  // Styling
  className?: string;
  accentColor?: "primary" | "accent" | "health" | "amber" | "orange" | "indigo" | "cyan" | "teal";
  isLoading?: boolean;
}

// Configuration ultra-détaillée des thèmes
const widgetThemes = {
  primary: {
    glow: "bg-primary/5",
    glowHover: "group-hover:bg-primary/10 group-hover:blur-[50px]",
    border: "border-primary/20 group-hover:border-primary/40",
    corner: "border-primary/50",
    iconBox: "bg-primary/10 border-primary/20 text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]",
    title: "text-primary",
    separator: "from-primary/0 via-primary/30 to-primary/0",
    statusLight: "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]",
  },
  accent: {
    glow: "bg-purple-500/5",
    glowHover: "group-hover:bg-purple-500/10 group-hover:blur-[50px]",
    border: "border-purple-500/20 group-hover:border-purple-500/40",
    corner: "border-purple-500/50",
    iconBox: "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]",
    title: "text-purple-400",
    separator: "from-purple-500/0 via-purple-500/30 to-purple-500/0",
    statusLight: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]",
  },
  health: {
    glow: "bg-emerald-500/5",
    glowHover: "group-hover:bg-emerald-500/10 group-hover:blur-[50px]",
    border: "border-emerald-500/20 group-hover:border-emerald-500/40",
    corner: "border-emerald-500/50",
    iconBox: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    title: "text-emerald-400",
    separator: "from-emerald-500/0 via-emerald-500/30 to-emerald-500/0",
    statusLight: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
  },
  amber: {
    glow: "bg-amber-500/5",
    glowHover: "group-hover:bg-amber-500/10 group-hover:blur-[50px]",
    border: "border-amber-500/20 group-hover:border-amber-500/40",
    corner: "border-amber-500/50",
    iconBox: "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
    title: "text-amber-400",
    separator: "from-amber-500/0 via-amber-500/30 to-amber-500/0",
    statusLight: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
  },
  orange: {
    glow: "bg-orange-500/5",
    glowHover: "group-hover:bg-orange-500/10 group-hover:blur-[50px]",
    border: "border-orange-500/20 group-hover:border-orange-500/40",
    corner: "border-orange-500/50",
    iconBox: "bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]",
    title: "text-orange-400",
    separator: "from-orange-500/0 via-orange-500/30 to-orange-500/0",
    statusLight: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]",
  },
  // Fallbacks
  indigo: {
    glow: "bg-indigo-500/5",
    glowHover: "group-hover:bg-indigo-500/10 group-hover:blur-[50px]",
    border: "border-indigo-500/20 group-hover:border-indigo-500/40",
    corner: "border-indigo-500/50",
    iconBox: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]",
    title: "text-indigo-400",
    separator: "from-indigo-500/0 via-indigo-500/30 to-indigo-500/0",
    statusLight: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]",
  },
  cyan: {
    glow: "bg-cyan-500/5",
    glowHover: "group-hover:bg-cyan-500/10 group-hover:blur-[50px]",
    border: "border-cyan-500/20 group-hover:border-cyan-500/40",
    corner: "border-cyan-500/50",
    iconBox: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]",
    title: "text-cyan-400",
    separator: "from-cyan-500/0 via-cyan-500/30 to-cyan-500/0",
    statusLight: "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
  },
  teal: {
    glow: "bg-teal-500/5",
    glowHover: "group-hover:bg-teal-500/10 group-hover:blur-[50px]",
    border: "border-teal-500/20 group-hover:border-teal-500/40",
    corner: "border-teal-500/50",
    iconBox: "bg-teal-500/10 border-teal-500/20 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]",
    title: "text-teal-400",
    separator: "from-teal-500/0 via-teal-500/30 to-teal-500/0",
    statusLight: "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]",
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
  const theme = widgetThemes[accentColor as keyof typeof widgetThemes] || widgetThemes.primary;
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
      <div className={cn("relative h-full w-full p-[1px] rounded-2xl overflow-hidden bg-card/10", className)}>
        <div className="absolute inset-0 animate-pulse bg-white/5" />
        <div className="h-full w-full flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-xs font-orbitron text-muted-foreground animate-pulse">SYSTEM LOADING...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group relative h-full w-full flex flex-col", className)}>
      {/* ===== BACKGROUND LAYERS ===== */}

      {/* 1. Ambient Glow behind the card */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
          theme.glowHover,
        )}
      />

      {/* 2. Base Glow */}
      <div className={cn("absolute inset-0 rounded-2xl transition-all duration-500 opacity-100", theme.glow)} />

      {/* ===== MAIN CARD STRUCTURE ===== */}
      <div
        className={cn(
          "relative flex flex-col flex-1 rounded-2xl overflow-hidden transition-all duration-300",
          "bg-[#09090b]/80 backdrop-blur-md", // Fond très sombre mais translucide
          "border border-white/5", // Bordure de base très subtile
          theme.border, // Bordure colorée au survol
        )}
        style={{ minHeight: WIDGET_MIN_HEIGHT }}
      >
        {/* HUD CORNERS (Les équerres tactiques) */}
        <div
          className={cn(
            "absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 rounded-tl-lg transition-colors duration-300 opacity-40 group-hover:opacity-100",
            theme.corner,
          )}
        />
        <div
          className={cn(
            "absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 rounded-tr-lg transition-colors duration-300 opacity-40 group-hover:opacity-100",
            theme.corner,
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 rounded-bl-lg transition-colors duration-300 opacity-40 group-hover:opacity-100",
            theme.corner,
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 rounded-br-lg transition-colors duration-300 opacity-40 group-hover:opacity-100",
            theme.corner,
          )}
        />

        {/* SCANLINE EFFECT (Subtile texture tech) */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]"
          style={{ backgroundSize: "100% 2px, 3px 100%" }}
        />

        {/* ===== HEADER ===== */}
        <div className="relative z-10 flex-shrink-0">
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            {/* Left: Icon & Title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Tech Icon Box */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-9 h-9 rounded-lg border backdrop-blur-xl shadow-lg transition-all duration-300 group-hover:scale-105",
                  theme.iconBox,
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      "text-sm font-bold uppercase tracking-[0.15em] font-orbitron truncate transition-colors",
                      theme.title,
                    )}
                  >
                    {title}
                  </h3>
                  {/* Status Light */}
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", theme.statusLight)} />
                </div>

                {subtitle && (
                  <div className="flex items-center gap-1.5 opacity-60">
                    <span className="w-0.5 h-2 bg-muted-foreground/50 rounded-full" />
                    <p className="text-[10px] text-muted-foreground font-rajdhani font-semibold tracking-wide uppercase truncate">
                      {subtitle}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {headerAction}

              {(showDisplayModeToggle || expandableContent) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleExpansion}
                  className={cn(
                    "h-8 w-8 rounded-lg hover:bg-white/5 transition-all duration-300",
                    showExpandedContent && "bg-white/5", // Active state
                  )}
                >
                  <motion.div
                    animate={{ rotate: showExpandedContent ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    {onToggleDisplayMode ? (
                      showExpandedContent ? (
                        <Minimize2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Maximize2 className="h-4 w-4 text-muted-foreground" />
                      )
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </motion.div>
                </Button>
              )}
            </div>
          </div>

          {/* Tech Separator Line */}
          <div className="relative h-[1px] w-full bg-white/5">
            <div className={cn("absolute inset-0 bg-gradient-to-r opacity-50", theme.separator)} />
          </div>
        </div>

        {/* ===== CONTENT BODY ===== */}
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          {/* Main Content */}
          <div className="flex-1 p-5 overflow-auto custom-scrollbar relative">{children}</div>

          {/* Expandable Section */}
          <AnimatePresence>
            {showExpandedContent && expandableContent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="border-t border-white/5 bg-black/20"
              >
                {/* Inner shadow for depth */}
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

                <div className="p-5 relative">
                  {/* Decorative tech marker */}
                  <div className={cn("absolute top-0 left-0 w-1 h-full opacity-20", theme.glow)} />
                  {expandableContent}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===== FOOTER ===== */}
        {footer && (
          <div className="relative z-10 border-t border-white/5 bg-white/[0.02]">
            <div className="px-5 py-3 text-xs text-muted-foreground/70 font-rajdhani tracking-wide flex items-center justify-between">
              {footer}
              {/* Footer micro-decor */}
              <MoreHorizontal className="w-3 h-3 opacity-20" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
