import { useState } from "react";
import { Target, Crosshair, Footprints } from "lucide-react";
import { getDifficultyColor } from "@/lib/utils";
import { NeuralPanel, WidgetDisplayMode } from './NeuralPanel';
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
}

export function ProgressByDifficultyModule({
  difficultyProgress,
  customDifficultyName,
  customDifficultyColor,
  displayMode = 'compact',
  onToggleDisplayMode,
}: ProgressByDifficultyModuleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("goals");
  
  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === 'custom' && customDifficultyName) return customDifficultyName;
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const getColor = (difficulty: string) => getDifficultyColor(difficulty, customDifficultyColor);

  const visibleProgress = difficultyProgress.filter(item => {
    if (viewMode === "steps") return item.totalSteps > 0;
    return item.total > 0;
  });

  const modeToggle = (
    <div className="flex items-center rounded-sm bg-[rgba(0,180,255,0.03)] border border-[rgba(0,180,255,0.08)] p-0.5">
      <button
        onClick={() => setViewMode("goals")}
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] font-orbitron uppercase tracking-wider transition-all duration-300",
          viewMode === "goals" ? "bg-[rgba(0,180,255,0.1)] text-primary border border-[rgba(0,180,255,0.2)]" : "text-[rgba(160,210,255,0.3)]"
        )}
      >
        <Crosshair className="w-2.5 h-2.5" /> Goals
      </button>
      <button
        onClick={() => setViewMode("steps")}
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] font-orbitron uppercase tracking-wider transition-all duration-300",
          viewMode === "steps" ? "bg-[rgba(0,180,255,0.1)] text-primary border border-[rgba(0,180,255,0.2)]" : "text-[rgba(160,210,255,0.3)]"
        )}
      >
        <Footprints className="w-2.5 h-2.5" /> Steps
      </button>
    </div>
  );

  return (
    <NeuralPanel
      title="By Difficulty"
      icon={Target}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      headerAction={modeToggle}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col gap-2"
        >
          {visibleProgress.map((item, i) => {
            const color = getColor(item.difficulty);
            const isGoals = viewMode === "goals";
            const completed = isGoals ? item.completed : item.completedSteps;
            const total = isGoals ? item.total : item.totalSteps;
            const pct = total > 0 ? (completed / total) * 100 : 0;

            return (
              <div key={item.difficulty} className="flex items-center gap-2">
                <div
                  className="shrink-0 w-[62px] text-center px-1 py-0.5 text-[8px] rounded-sm border font-bold uppercase tracking-wider font-orbitron"
                  style={{ borderColor: `${color}30`, color: color, backgroundColor: `${color}08` }}
                >
                  {getDifficultyLabel(item.difficulty)}
                </div>
                <div className="flex-1 h-1.5 bg-[rgba(0,180,255,0.04)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.06 }}
                    style={{ backgroundColor: color, opacity: 0.7 }}
                  />
                </div>
                <span className="shrink-0 text-[9px] font-mono font-bold tabular-nums w-[28px] text-right" style={{ color }}>
                  {completed}/{total}
                </span>
              </div>
            );
          })}
          {visibleProgress.length === 0 && (
            <div className="flex items-center justify-center text-[rgba(160,210,255,0.25)] font-rajdhani text-sm py-6">
              No {viewMode} yet
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </NeuralPanel>
  );
}
