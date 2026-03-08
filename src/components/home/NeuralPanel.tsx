import { ReactNode } from "react";
import { LucideIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export type WidgetDisplayMode = "compact" | "full";

interface NeuralPanelProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  subtitle?: string;
  headerAction?: ReactNode;
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
  expandableContent?: ReactNode;
  className?: string;
  accentColor?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export function NeuralPanel({
  title,
  icon: Icon,
  children,
  subtitle,
  headerAction,
  displayMode = "compact",
  onToggleDisplayMode,
  expandableContent,
  className,
  isLoading = false,
  onClick,
}: NeuralPanelProps) {
  const isCompact = displayMode === "compact";
  const showExpandedContent = !isCompact;

  if (isLoading) {
    return (
      <div className={cn(
        "relative h-full w-full overflow-hidden",
        "bg-[var(--nexus-bg)] backdrop-blur-xl",
        "border border-[var(--nexus-border)]",
        className,
      )} style={{ borderRadius: "4px" }}>
        <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top-subtle" />
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 rounded bg-[var(--nexus-hover-bg)] animate-pulse" />
            <div className="h-2.5 w-24 bg-[var(--nexus-hover-bg)] rounded animate-pulse" />
          </div>
          <div className="flex-1 bg-[var(--nexus-inner-bg)] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "group relative h-full w-full flex flex-col overflow-hidden transition-all duration-300",
        "bg-[var(--nexus-bg)] backdrop-blur-xl nexus-shadow",
        "border border-[var(--nexus-border)] hover:border-[var(--nexus-hover-border)]",
        onClick && "cursor-pointer text-left",
        className,
      )}
      style={{ borderRadius: "4px" }}
    >
      {/* Permanent top edge gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top-subtle" />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 px-5 pt-4 pb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className="w-4 h-4 text-primary/60 shrink-0" />
          <h3 className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[var(--nexus-text-label)] truncate">
            {title}
          </h3>
          {subtitle && (
            <span className="text-[9px] font-mono text-[var(--nexus-text-dimmer)] truncate hidden sm:inline tracking-tight">
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {headerAction}
          {(onToggleDisplayMode || expandableContent) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDisplayMode?.();
              }}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-[var(--nexus-hover-bg)] text-[var(--nexus-text-dimmer)] hover:text-[var(--nexus-text-label)] transition-colors"
            >
              {showExpandedContent ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="mx-5 h-px bg-[var(--nexus-separator)]" />

      {/* Body */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <div className="flex-1 px-5 py-3 overflow-auto">{children}</div>

        <AnimatePresence>
          {showExpandedContent && expandableContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-t border-[var(--nexus-separator)]"
            >
              <div className="px-5 py-4">{expandableContent}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right arrow for clickable panels */}
      {onClick && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--nexus-text-dimmer)] group-hover:text-[var(--nexus-text-dim)] transition-all duration-300 group-hover:translate-x-0.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </Wrapper>
  );
}
