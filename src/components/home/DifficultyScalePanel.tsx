import { CornerBrackets } from "./CornerBrackets";
import { getDifficultyColor } from "@/lib/utils";

interface DifficultyProgress {
  difficulty: string;
  completed: number;
  total: number;
}

interface DifficultyScalePanelProps {
  difficultyProgress: DifficultyProgress[];
  customDifficultyName?: string;
  customDifficultyColor?: string;
}

const DIFFICULTY_ORDER = ["easy", "medium", "hard", "extreme", "impossible", "custom"];

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "EASY",
  medium: "MEDIUM",
  hard: "HARD",
  extreme: "EXTREME",
  impossible: "IMPOSSIBLE",
  custom: "ANANTA",
};

const DIFFICULTY_SUBS: Record<string, string> = {
  easy: "missions",
  medium: "missions",
  hard: "missions",
  extreme: "missions",
  impossible: "missions",
  custom: "légendaire",
};

export function DifficultyScalePanel({
  difficultyProgress,
  customDifficultyName,
  customDifficultyColor,
}: DifficultyScalePanelProps) {
  const getColor = (d: string) => getDifficultyColor(d, customDifficultyColor);
  const getLabel = (d: string) => {
    if (d === "custom" && customDifficultyName) return customDifficultyName.toUpperCase();
    return DIFFICULTY_LABELS[d] || d.toUpperCase();
  };

  return (
    <div
      className="relative overflow-hidden border border-[rgba(0,180,255,0.08)] backdrop-blur-xl"
      style={{
        borderRadius: 4,
        background: "rgba(6,11,22,0.92)",
        boxShadow: "0 8px 48px rgba(0,0,0,0.9), inset 0 1px 0 rgba(0,212,255,0.06)",
      }}
    >
      <CornerBrackets />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,210,255,0.12)] to-transparent" />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-[rgba(0,180,255,0.06)]">
        <span className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.4)]">
          // L'ÉCHELLE ANANTA — PROGRESSION PAR DIFFICULTÉ
        </span>
      </div>

      {/* Cards */}
      <div className="px-5 py-5 grid grid-cols-3 md:grid-cols-6 gap-3">
        {DIFFICULTY_ORDER.map((diff) => {
          const item = difficultyProgress.find((p) => p.difficulty === diff);
          const color = getColor(diff);
          const count = item?.completed ?? 0;

          return (
            <div
              key={diff}
              className="relative flex flex-col items-center py-4 px-2 rounded-sm border border-[rgba(0,180,255,0.06)] overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${color}06 0%, rgba(6,11,22,0.95) 100%)`,
              }}
            >
              {/* Top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: color }}
              />
              <span
                className="text-[9px] font-orbitron font-bold uppercase tracking-[0.1em] mb-2"
                style={{ color }}
              >
                {getLabel(diff)}
              </span>
              <span className="text-3xl font-mono font-bold tabular-nums text-white/90">
                {count}
              </span>
              <span
                className="text-[8px] uppercase tracking-wider mt-1"
                style={{ color: `${color}99` }}
              >
                {DIFFICULTY_SUBS[diff] || "missions"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
