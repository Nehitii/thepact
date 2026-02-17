import { ReactNode, useState } from "react";
import { LucideIcon, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";
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

// Configuration "Lumière Laser" - Couleurs pures et tranchantes
const themeConfig = {
  primary: "from-primary via-primary/50 to-primary/0 shadow-primary/20 text-primary border-primary/20",
  accent: "from-purple-500 via-purple-500/50 to-purple-500/0 shadow-purple-500/20 text-purple-400 border-purple-500/20",
  health:
    "from-emerald-500 via-emerald-500/50 to-emerald-500/0 shadow-emerald-500/20 text-emerald-400 border-emerald-500/20",
  amber: "from-amber-500 via-amber-500/50 to-amber-500/0 shadow-amber-500/20 text-amber-400 border-amber-500/20",
  orange: "from-orange-500 via-orange-500/50 to-orange-500/0 shadow-orange-500/20 text-orange-400 border-orange-500/20",
  indigo: "from-indigo-500 via-indigo-500/50 to-indigo-500/0 shadow-indigo-500/20 text-indigo-400 border-indigo-500/20",
  cyan: "from-cyan-500 via-cyan-500/50 to-cyan-500/0 shadow-cyan-500/20 text-cyan-400 border-cyan-500/20",
  teal: "from-teal-500 via-teal-500/50 to-teal-500/0 shadow-teal-500/20 text-teal-400 border-teal-500/20",
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
          "relative h-full w-full rounded-xl overflow-hidden bg-black/20 backdrop-blur-sm border border-white/5",
          className,
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-20 animate-pulse" />
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
            <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="flex-1 bg-white/[0.02] rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group relative h-full w-full flex flex-col isolation-auto", className)}>
      {/* 1. Lueur d'ambiance (Holographic Backlight) - Très subtile, activée au survol */}
      <div
        className={cn(
          "absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-gradient-to-b",
          theme.split(" ")[0].replace("from-", "from-").replace("via-", "via-transparent "),
        )}
      />

      {/* 2. Structure Principale (Obsidian Glass) */}
      <div
        className={cn(
          "relative flex flex-col flex-1 rounded-xl overflow-hidden transition-all duration-300",
          "bg-[#050505]/60 backdrop-blur-2xl", // Verre noir profond
          "border border-white/5", // Bordure quasi-invisible par défaut
          "shadow-2xl shadow-black/50", // Profondeur
        )}
        style={{ minHeight: WIDGET_MIN_HEIGHT }}
      >
        {/* 3. Laser Top Line (Signature Cyberpunk) */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r opacity-40 group-hover:opacity-100 transition-opacity duration-500",
            theme.split(" ")[0],
          )}
        />

        {/* ===== HEADER ÉPURÉ ===== */}
        <div className="relative z-10 flex-shrink-0 px-6 pt-6 pb-2 flex items-start justify-between gap-4">
          {/* Titre & Icône */}
          <div className="flex items-center gap-3 min-w-0 group/header cursor-default">
            <div
              className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-md transition-all duration-300",
                "bg-white/[0.03] border border-white/10 group-hover/header:border-white/20",
                "group-hover:shadow-[0_0_15px_-3px_rgba(0,0,0,0.5)]", // Glow interne
                theme.split(" ")[2], // Couleur du texte
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
            </div>

            <div className="flex flex-col">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] font-orbitron text-white/90 group-hover:text-white transition-colors">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[10px] text-white/40 font-rajdhani tracking-wide uppercase mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Contrôles minimalistes */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {headerAction}

            {(showDisplayModeToggle || expandableContent) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpansion}
                className="h-7 w-7 rounded-md hover:bg-white/10 text-white/40 hover:text-white"
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

        {/* ===== CORPS DU MODULE ===== */}
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          {/* Contenu Principal */}
          <div className="flex-1 px-6 py-4 overflow-auto custom-scrollbar relative">{children}</div>

          {/* Zone Extensible (Tiroir) */}
          <AnimatePresence>
            {showExpandedContent && expandableContent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="border-t border-white/5 bg-black/20"
              >
                <div className="px-6 py-4">{expandableContent}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===== FOOTER (Optionnel) ===== */}
        {footer && (
          <div className="relative z-10 px-6 py-3 border-t border-white/5 bg-white/[0.01]">
            <div className="text-[10px] text-white/30 font-rajdhani tracking-wider uppercase flex items-center justify-between">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
