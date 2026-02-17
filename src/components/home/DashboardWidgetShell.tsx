import { ReactNode, useState } from "react";
import { LucideIcon, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";
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

  // Expandable content (for full mode or internal expansion)
  expandableContent?: ReactNode;
  defaultExpanded?: boolean;

  // Styling
  className?: string;
  accentColor?: "primary" | "accent" | "health" | "amber" | "orange" | "indigo" | "cyan" | "teal"; // Added missing colors
  isLoading?: boolean;
}

// Thèmes unifiés avec ActionModuleCard pour une cohérence parfaite
const widgetThemes = {
  primary: {
    glow: "bg-primary/10",
    glowHover: "group-hover:blur-[60px]",
    gradient: "bg-gradient-to-b from-primary/5 via-background/50 to-background/20",
    border: "border-primary/30 group-hover:border-primary/50",
    innerBorder: "border-primary/10",
    iconGlow: "bg-primary/20",
    iconColor: "text-primary",
    headerBorder: "border-primary/20",
    titleGradient: "from-primary via-white to-primary",
  },
  accent: {
    // Often purple/violet in shadcn
    glow: "bg-purple-500/10",
    glowHover: "group-hover:blur-[60px]",
    gradient: "bg-gradient-to-b from-purple-500/5 via-background/50 to-background/20",
    border: "border-purple-500/30 group-hover:border-purple-500/50",
    innerBorder: "border-purple-500/10",
    iconGlow: "bg-purple-500/20",
    iconColor: "text-purple-400",
    headerBorder: "border-purple-500/20",
    titleGradient: "from-purple-400 via-white to-purple-400",
  },
  health: {
    // Often green/emerald
    glow: "bg-emerald-500/10",
    glowHover: "group-hover:blur-[60px]",
    gradient: "bg-gradient-to-b from-emerald-500/5 via-background/50 to-background/20",
    border: "border-emerald-500/30 group-hover:border-emerald-500/50",
    innerBorder: "border-emerald-500/10",
    iconGlow: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    headerBorder: "border-emerald-500/20",
    titleGradient: "from-emerald-400 via-white to-emerald-400",
  },
  amber: {
    glow: "bg-amber-500/10",
    glowHover: "group-hover:blur-[60px]",
    gradient: "bg-gradient-to-b from-amber-500/5 via-background/50 to-background/20",
    border: "border-amber-500/30 group-hover:border-amber-500/50",
    innerBorder: "border-amber-500/10",
    iconGlow: "bg-amber-500/20",
    iconColor: "text-amber-400",
    headerBorder: "border-amber-500/20",
    titleGradient: "from-amber-400 via-white to-amber-400",
  },
  orange: {
    glow: "bg-orange-500/10",
    glowHover: "group-hover:blur-[60px]",
    gradient: "bg-gradient-to-b from-orange-500/5 via-background/50 to-background/20",
    border: "border-orange-500/30 group-hover:border-orange-500/50",
    innerBorder: "border-orange-500/10",
    iconGlow: "bg-orange-500/20",
    iconColor: "text-orange-400",
    headerBorder: "border-orange-500/20",
    titleGradient: "from-orange-400 via-white to-orange-400",
  },
  // Fallbacks for other colors if passed
  indigo: {
    glow: "bg-indigo-500/10",
    glowHover: "group-hover:blur-[60px]",
    gradient: "bg-gradient-to-b from-indigo-500/5 via-background/50 to-background/20",
    border: "border-indigo-500/30 group-hover:border-indigo-500/50",
    innerBorder: "border-indigo-500/10",
    iconGlow: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
    headerBorder: "border-indigo-500/20",
    titleGradient: "from-indigo-400 via-white to-indigo-400",
  },
  cyan: {
    glow: "bg-cyan-500/10",
    glowHover: "group-hover:blur-[60px]",
    gradient: "bg-gradient-to-b from-cyan-500/5 via-background/50 to-background/20",
    border: "border-cyan-500/30 group-hover:border-cyan-500/50",
    innerBorder: "border-cyan-500/10",
    iconGlow: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    headerBorder: "border-cyan-500/20",
    titleGradient: "from-cyan-400 via-white to-cyan-400",
  },
  teal: {
    glow: "bg-teal-500/10",
    glowHover: "group-hover:blur-[60px]",
    gradient: "bg-gradient-to-b from-teal-500/5 via-background/50 to-background/20",
    border: "border-teal-500/30 group-hover:border-teal-500/50",
    innerBorder: "border-teal-500/10",
    iconGlow: "bg-teal-500/20",
    iconColor: "text-teal-400",
    headerBorder: "border-teal-500/20",
    titleGradient: "from-teal-400 via-white to-teal-400",
  },
};

// Fixed widget minimum height for uniformity
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
  // Fallback to primary if color not found
  const theme = widgetThemes[accentColor as keyof typeof widgetThemes] || widgetThemes.primary;
  const isCompact = displayMode === "compact";

  // Internal state for expansion if not controlled by parent via displayMode only
  // If displayMode is provided, we assume parent controls layout, but for inner content we might want local toggle
  const [isInternalExpanded, setIsInternalExpanded] = useState(defaultExpanded);

  const toggleExpansion = () => {
    if (onToggleDisplayMode) {
      onToggleDisplayMode();
    } else {
      setIsInternalExpanded(!isInternalExpanded);
    }
  };

  // Determine if we show expanded content: either we are in full mode OR we are locally expanded
  const showExpandedContent = !isCompact || isInternalExpanded;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("relative group animate-fade-in h-full w-full", className)}>
        <div className={cn("absolute inset-0 rounded-2xl blur-xl transition-all duration-700", theme.glow)} />
        <div
          className={cn(
            "relative backdrop-blur-xl border rounded-2xl overflow-hidden flex flex-col h-full",
            theme.border,
            "bg-card/20",
          )}
          style={{ minHeight: WIDGET_MIN_HEIGHT }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

          {/* Skeleton Header */}
          <div className={cn("p-5 border-b flex items-center gap-4", theme.headerBorder)}>
            <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
              <div className="h-2 w-20 bg-white/5 rounded animate-pulse" />
            </div>
          </div>

          {/* Skeleton Body */}
          <div className="p-5 flex-1 space-y-4">
            <div className="h-24 w-full bg-white/5 rounded-xl animate-pulse" />
            <div className="h-24 w-full bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group animate-fade-in h-full w-full flex flex-col", className)}>
      {/* Outer ambient glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl blur-3xl transition-all duration-700 opacity-60",
          theme.glow,
          theme.glowHover,
        )}
      />

      {/* Main card container */}
      <div
        className={cn(
          "relative flex flex-col flex-1 rounded-2xl overflow-hidden transition-all duration-500 border backdrop-blur-xl shadow-xl",
          theme.border,
          theme.gradient,
        )}
        style={{ minHeight: WIDGET_MIN_HEIGHT }}
      >
        {/* Fine inner border for that "glass" edge look */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className={cn("absolute inset-[1px] border rounded-[14px] opacity-50", theme.innerBorder)} />
        </div>

        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col h-full">
          {/* ===== HEADER ===== */}
          <div
            className={cn(
              "px-5 py-4 border-b flex-shrink-0 flex items-center justify-between gap-3 bg-white/5 relative",
              theme.headerBorder,
            )}
          >
            {/* Header shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Title Section */}
            <div className="flex items-center gap-3 min-w-0 relative z-10">
              <div className="relative group/icon">
                <div
                  className={cn("absolute inset-0 blur-md rounded-lg opacity-60 transition-opacity", theme.iconGlow)}
                />
                <div
                  className={cn(
                    "relative p-2 rounded-lg border border-white/10 bg-black/20 backdrop-blur-md shadow-inner",
                    theme.iconColor,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="flex flex-col min-w-0">
                <h3
                  className={cn(
                    "text-sm font-bold uppercase tracking-[0.15em] font-orbitron truncate bg-clip-text text-transparent bg-gradient-to-r",
                    theme.titleGradient,
                  )}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-[10px] text-muted-foreground font-rajdhani font-medium tracking-wide uppercase truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-1 relative z-10">
              {headerAction}

              {/* Expand/Collapse Toggle */}
              {(showDisplayModeToggle || expandableContent) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleExpansion}
                  className={cn("h-8 w-8 rounded-lg hover:bg-white/10 transition-colors", theme.iconColor)}
                >
                  {showExpandedContent ? (
                    onToggleDisplayMode ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )
                  ) : onToggleDisplayMode ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* ===== BODY ===== */}
          <div className="flex-1 p-0 overflow-hidden flex flex-col relative">
            <div className="flex-1 p-5 overflow-auto custom-scrollbar">{children}</div>

            {/* Expandable Content Area */}
            <AnimatePresence>
              {showExpandedContent && expandableContent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} // Cubic bezier for smooth slide
                  className="border-t border-white/5 bg-black/10"
                >
                  <div className="p-5">{expandableContent}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ===== FOOTER ===== */}
          {footer && (
            <div
              className={cn(
                "px-5 py-3 border-t bg-black/20 backdrop-blur-sm text-xs text-muted-foreground flex-shrink-0",
                theme.headerBorder,
              )}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
