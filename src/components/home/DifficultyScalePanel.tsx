import { CornerBrackets } from "./CornerBrackets";
import { getDifficultyColor } from "@/lib/utils";

interface DifficultyProgress {
  difficulty: string;
  completed: number;
  total: number;
  percentage: number;
}

interface DifficultyScalePanelProps {
  difficultyProgress: DifficultyProgress[];
  customDifficultyName?: string;
  customDifficultyColor?: string;
}

const DIFFICULTY_ORDER = ["easy", "medium", "hard", "extreme", "impossible", "custom"];

const REF_COLORS: Record<string, string> = {
  easy: "#00ff88",
  medium: "#00d4ff",
  hard: "#ff8c00",
  extreme: "#ff3366",
  impossible: "#cc00ff",
  custom: "#ff00aa",
};

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
  const getColor = (d: string) => {
    if (d === "custom" && customDifficultyColor) return customDifficultyColor;
    return REF_COLORS[d] || "#ffffff";
  };
  const getLabel = (d: string) => {
    if (d === "custom" && customDifficultyName) return customDifficultyName.toUpperCase();
    return DIFFICULTY_LABELS[d] || d.toUpperCase();
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 4,
        background: "rgba(6,11,22,0.92)",
        border: "1px solid rgba(0,180,255,0.12)",
        boxShadow: "0 8px 48px rgba(0,0,0,0.9), inset 0 1px 0 rgba(0,212,255,0.06)",
        backdropFilter: "blur(16px)",
        padding: 28,
      }}
    >
      <CornerBrackets />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,210,255,0.4), transparent)" }} />

      {/* Panel label */}
      <div
        className="flex items-center gap-2 mb-4"
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9, letterSpacing: 3,
          color: "rgba(160,210,255,0.5)",
          textTransform: "uppercase" as const,
        }}
      >
        <span style={{ color: "rgba(0,212,255,0.6)" }}>//</span>
        L'Échelle Ananta — Progression par Difficulté
        <span className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(0,180,255,0.12), transparent)" }} />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3" style={{ marginTop: 16 }}>
        {DIFFICULTY_ORDER.map((diff) => {
          const item = difficultyProgress.find((p) => p.difficulty === diff);
          const color = getColor(diff);
          const count = item?.completed ?? 0;
          const total = item?.total ?? 0;
          const fillPct = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div
              key={diff}
              className="relative flex flex-col items-center overflow-hidden cursor-default"
              style={{
                padding: "16px 12px",
                border: `1px solid ${color}40`,
                borderRadius: 4,
                background: "rgba(0,0,0,0.2)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
            >
              {/* Bottom fill effect */}
              <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-700"
                style={{
                  height: `${fillPct}%`,
                  background: `${color}12`,
                }}
              />

              {/* Top indicator bar with glow */}
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  height: 2,
                  background: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
              />

              <span
                className="relative z-[1]"
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9, letterSpacing: 2,
                  color: color,
                  textTransform: "uppercase" as const,
                  textShadow: `0 0 8px ${color}`,
                  marginBottom: 12,
                }}
              >
                {getLabel(diff)}
              </span>
              <span
                className="relative z-[1]"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 22, fontWeight: 700,
                  color: color,
                  textShadow: `0 0 10px ${color}b3`,
                  lineHeight: 1,
                }}
              >
                {count < 10 ? `0${count}` : count}
              </span>
              <span
                className="relative z-[1]"
                style={{
                  fontSize: 8, letterSpacing: 1,
                  color: "rgba(255,255,255,0.32)",
                  marginTop: 4,
                }}
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
