import { ReactNode, useState } from 'react';
import { LucideIcon, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export type WidgetDisplayMode = 'compact' | 'full';

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
  
  // Expandable content (for full mode)
  expandableContent?: ReactNode;
  defaultExpanded?: boolean;
  
  // Styling
  className?: string;
  accentColor?: 'primary' | 'accent' | 'health' | 'amber' | 'orange';
  isLoading?: boolean;
}

const accentStyles = {
  primary: {
    glow: 'bg-primary/5',
    border: 'border-primary/30 hover:border-primary/50',
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
    headerBorder: 'border-primary/20',
  },
  accent: {
    glow: 'bg-accent/5',
    border: 'border-accent/30 hover:border-accent/50',
    iconBg: 'bg-accent/20',
    iconColor: 'text-accent',
    headerBorder: 'border-accent/20',
  },
  health: {
    glow: 'bg-health/5',
    border: 'border-health/30 hover:border-health/50',
    iconBg: 'bg-health/20',
    iconColor: 'text-health',
    headerBorder: 'border-health/20',
  },
  amber: {
    glow: 'bg-amber-500/5',
    border: 'border-amber-500/30 hover:border-amber-500/50',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-500',
    headerBorder: 'border-amber-500/20',
  },
  orange: {
    glow: 'bg-orange-500/5',
    border: 'border-orange-500/30 hover:border-orange-500/50',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-500',
    headerBorder: 'border-orange-500/20',
  },
};

// Fixed widget height for uniformity
const WIDGET_MIN_HEIGHT = '280px';

export function DashboardWidgetShell({
  title,
  icon: Icon,
  children,
  subtitle,
  headerAction,
  footer,
  displayMode = 'compact',
  onToggleDisplayMode,
  showDisplayModeToggle = true,
  expandableContent,
  defaultExpanded = false,
  className,
  accentColor = 'primary',
  isLoading = false,
}: DashboardWidgetShellProps) {
  // FIX: Remove intermediate state - expand immediately on toggle
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const styles = accentStyles[accentColor];
  
  // Immediate toggle handler - no intermediate "show more" text state
  const handleExpandToggle = () => {
    setIsExpanded(prev => !prev);
  };
  const isCompact = displayMode === 'compact';

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("relative group animate-fade-in h-full", className)}>
        <div className={cn("absolute inset-0 rounded-lg blur-xl", styles.glow)} />
        <div 
          className={cn(
            "relative bg-card/20 backdrop-blur-xl border-2 rounded-lg overflow-hidden transition-all flex flex-col",
            styles.border
          )}
          style={{ minHeight: WIDGET_MIN_HEIGHT }}
        >
          {/* Double border effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
          </div>
          
          {/* Loading skeleton */}
          <div className="relative z-10 p-5 flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-primary/10 rounded animate-pulse" />
                <div className="h-2 w-16 bg-primary/5 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-20 bg-primary/5 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-primary/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group animate-fade-in h-full", className)}>
      {/* Outer glow */}
      <div className={cn("absolute inset-0 rounded-lg blur-xl group-hover:blur-2xl transition-all", styles.glow)} />
      
      {/* Main card with shimmer wave hover effect */}
      <div 
        className={cn(
          "relative bg-card/20 backdrop-blur-xl border-2 rounded-lg overflow-hidden transition-all flex flex-col h-full",
          "hover-shimmer-wave",
          styles.border
        )}
        style={{ minHeight: WIDGET_MIN_HEIGHT }}
      >
        {/* Double border effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* ===== HEADER ===== */}
          <div className={cn("p-4 border-b flex-shrink-0", styles.headerBorder)}>
            <div className="flex items-center justify-between gap-3">
              {/* Left: Icon + Title */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <div className={cn("absolute inset-0 blur-md rounded-full", styles.iconBg)} />
                  <div className={cn(
                    "relative p-2 rounded-lg",
                    styles.iconBg.replace('/20', '/10')
                  )}>
                    <Icon className={cn("h-4 w-4 relative z-10 animate-glow-pulse", styles.iconColor)} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary truncate">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-[10px] text-primary/50 font-rajdhani mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Right: Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Display mode toggle */}
                {showDisplayModeToggle && onToggleDisplayMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleDisplayMode}
                    className={cn(
                      "h-7 w-7 p-0 rounded-md",
                      "bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50"
                    )}
                    title={isCompact ? "Switch to Full view" : "Switch to Compact view"}
                  >
                    {isCompact ? (
                      <Maximize2 className="h-3 w-3 text-primary" />
                    ) : (
                      <Minimize2 className="h-3 w-3 text-primary" />
                    )}
                  </Button>
                )}
                
                {/* Custom header action */}
                {headerAction}
              </div>
            </div>
          </div>
          
          {/* ===== BODY ===== */}
          <div className="p-4 flex-1 overflow-hidden flex flex-col">
            {children}
          </div>
          
          {/* ===== EXPANDABLE SECTION (Full mode only) ===== */}
          {/* FIX: Immediate expansion - removed intermediate "Show More" text toggle */}
          {/* Now controlled via the header expand/collapse button (Maximize2/Minimize2) */}
          {!isCompact && expandableContent && (
            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 border-t border-primary/20">
                  {expandableContent}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
          
          {/* ===== FOOTER ===== */}
          {footer && (
            <div className={cn(
              "px-4 py-2 border-t flex-shrink-0",
              styles.headerBorder
            )}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
