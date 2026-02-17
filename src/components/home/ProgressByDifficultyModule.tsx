import { useState } from "react";
import { Target, Crosshair, Footprints } from "lucide-react";
import { getDifficultyColor } from "@/lib/utils";
import { DashboardWidgetShell, WidgetDisplayMode } from './DashboardWidgetShell';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DifficultyProgress {
  difficulty: string;
  completed: number;
  total: number;
  percentage: number;
  totalSteps: number;
  completedSteps: number;
  remainingSteps: number;
}

type ViewMode = "goals" | "steps";

interface ProgressByDifficultyModuleProps {
  difficultyProgress: DifficultyProgress[];
  customDifficultyName?: string;
  customDifficultyColor?: string;
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
  hideBackgroundLines?: boolean;
}

export function ProgressByDifficultyModule({
  difficultyProgress,
  customDifficultyName,
  customDifficultyColor,
  displayMode = 'compact',
  onToggleDisplayMode,
}: ProgressByDifficultyModuleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("goals");
  const isCompact = displayMode === 'compact';
  
  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === 'custom' && customDifficultyName) {
      return customDifficultyName;
    }
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const getColor = (difficulty: string) => {
    return getDifficultyColor(difficulty, customDifficultyColor);
  };

  const visibleProgress = isCompact 
    ? difficultyProgress.filter(item => item.total > 0).slice(0, 5)
    : difficultyProgress.filter(item => item.total > 0);

  // Mode toggle rendered as headerAction
  const modeToggle = (
    <div className="flex items-center rounded-md bg-white/[0.04] border border-white/[0.08] p-0.5">
      <button
        onClick={() => setViewMode("goals")}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-orbitron uppercase tracking-wider transition-all duration-300",
          viewMode === "goals"
            ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_8px_hsl(var(--primary)/0.2)]"
            : "text-white/40 hover:text-white/60"
        )}
      >
        <Crosshair className="w-2.5 h-2.5" />
        Goals
      </button>
      <button
        onClick={() => setViewMode("steps")}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-orbitron uppercase tracking-wider transition-all duration-300",
          viewMode === "steps"
            ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_8px_hsl(var(--primary)/0.2)]"
            : "text-white/40 hover:text-white/60"
        )}
      >
        <Footprints className="w-2.5 h-2.5" />
        Steps
      </button>
    </div>
  );

  const renderRow = (item: DifficultyProgress, index: number) => {
    const color = getColor(item.difficulty);
    const isGoals = viewMode === "goals";
    const completed = isGoals ? item.completed : item.completedSteps;
    const total = isGoals ? item.total : item.totalSteps;
    const remaining = total - completed;
    const pct = total > 0 ? (completed / total) * 100 : 0;

    // In steps mode, hide difficulties with no steps
    if (!isGoals && item.totalSteps === 0) return null;

    return (
      <motion.div
        key={`${item.difficulty}-${viewMode}`}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="group/row"
      >
        <div className="flex items-center gap-3">
          {/* Difficulty badge */}
          <div
            className="shrink-0 px-2 py-0.5 text-[9px] rounded border backdrop-blur font-bold uppercase tracking-wider font-orbitron min-w-[60px] text-center"
            style={{ 
              borderColor: `${color}60`,
              color: color,
              backgroundColor: `${color}10`,
            }}
          >
            {getDifficultyLabel(item.difficulty)}
          </div>

          {/* Progress bar area */}
          <div className="flex-1 flex items-center gap-2.5">
            <div className="flex-1 relative h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
              <motion.div
                className="h-full rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.08 }}
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}50, inset 0 1px 0 rgba(255,255,255,0.2)`
                }}
              />
            </div>

            {/* Count */}
            <span
              className="text-[10px] font-orbitron font-bold tabular-nums min-w-[32px] text-right"
              style={{ color }}
            >
              {completed}/{total}
            </span>
          </div>
        </div>

        {/* Remaining label */}
        {remaining > 0 && (
          <div className="mt-0.5 pl-[72px]">
            <span className="text-[9px] text-white/30 font-rajdhani">
              {remaining} remaining
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  // Summary stats for footer
  const totalItems = visibleProgress.reduce((sum, item) => {
    return sum + (viewMode === "goals" ? item.total : item.totalSteps);
  }, 0);
  const completedItems = visibleProgress.reduce((sum, item) => {
    return sum + (viewMode === "goals" ? item.completed : item.completedSteps);
  }, 0);
  const overallPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <DashboardWidgetShell
      title="By Difficulty"
      icon={Target}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      accentColor="primary"
      headerAction={modeToggle}
      footer={
        totalItems > 0 ? (
          <span>
            Overall: {completedItems}/{totalItems} ({overallPct}%)
          </span>
        ) : undefined
      }
    >
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn("space-y-3", isCompact && "flex-1")}
          >
            {visibleProgress.map((item, i) => renderRow(item, i))}
            
            {visibleProgress.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-white/30 font-rajdhani text-sm py-8">
                No goals created yet
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardWidgetShell>
  );
}
