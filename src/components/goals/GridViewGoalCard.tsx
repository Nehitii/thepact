import React, { useState } from "react";
import { Star } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  difficulty?: string | null;
  image_url?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  totalStepsCount?: number;
  completedStepsCount?: number;
  status?: string | null;
}

interface GridViewGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "fully_completed":
      return "Completed";
    case "paused":
      return "Paused";
    case "validated":
      return "Validated";
    default:
      return status || "Unknown";
  }
};

// Thème couleur par difficulté (badge, gradient panel, barre de progression + énergie)
const getDifficultyTheme = (difficulty: string, customColor?: string) => {
  switch (difficulty) {
    case "easy":
      return {
        color: "#16a34a",
        glow: "rgba(22,163,74,0.5)",
        background: "rgba(22,163,74,0.18)",
        border: "rgba(22,163,74,0.75)",
        gradientFrom: "#22c55e",
        gradientTo: "#16a34a",
        progressFrom: "#4ade80",
        progressTo: "#16a34a",
        energyFrom: "#bbf7d0",
        energyTo: "#22c55e",
      };
    case "medium":
      return {
        color: "#eab308",
        glow: "rgba(234,179,8,0.5)",
        background: "rgba(234,179,8,0.18)",
        border: "rgba(234,179,8,0.75)",
        gradientFrom: "#facc15",
        gradientTo: "#eab308",
        progressFrom: "#fde047",
        progressTo: "#eab308",
        energyFrom: "#fef9c3",
        energyTo: "#facc15",
      };
    case "hard":
      return {
        color: "#f97316",
        glow: "rgba(249,115,22,0.5)",
        background: "rgba(249,115,22,0.18)",
        border: "rgba(249,115,22,0.8)",
        gradientFrom: "#fb923c",
        gradientTo: "#f97316",
        progressFrom: "#fed7aa",
        progressTo: "#f97316",
        energyFrom: "#ffedd5",
        energyTo: "#fb923c",
      };
    case "extreme":
      return {
        color: "#dc2626",
        glow: "rgba(220,38,38,0.55)",
        background: "rgba(220,38,38,0.18)",
        border: "rgba(220,38,38,0.8)",
        gradientFrom: "#f97373",
        gradientTo: "#dc2626",
        progressFrom: "#fecaca",
        progressTo: "#dc2626",
        energyFrom: "#fee2e2",
        energyTo: "#f97373",
      };
    case "impossible":
      return {
        color: "#a855f7",
        glow: "rgba(168,85,247,0.55)",
        background: "rgba(168,85,247,0.20)",
        border: "rgba(168,85,247,0.85)",
        gradientFrom: "#c4b5fd",
        gradientTo: "#a855f7",
        progressFrom: "#e9d5ff",
        progressTo: "#a855f7",
        energyFrom: "#f5f3ff",
        energyTo: "#c4b5fd",
      };
    case "custom": {
      const base = customColor || "#a855f7";
      return {
        color: base,
        glow: `${base}80`,
        background: `${base}30`,
        border: `${base}D9`,
        gradientFrom: base,
        gradientTo: base,
        progressFrom: base,
        progressTo: base,
        energyFrom: "#ffffff",
        energyTo: base,
      };
    }
    default:
      return {
        color: "#6b7280",
        glow: "rgba(107,114,128,0.4)",
        background: "rgba(107,114,128,0.18)",
        border: "rgba(107,114,128,0.8)",
        gradientFrom: "#9ca3af",
        gradientTo: "#4b5563",
        progressFrom: "#d1d5db",
        progressTo: "#6b7280",
        energyFrom: "#f9fafb",
        energyTo: "#9ca3af",
      };
  }
};

export function GridViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor,
  onNavigate,
  onToggleFocus,
}: GridViewGoalCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const difficulty = goal.difficulty || "easy";
  const goalType = goal.goal_type || "standard";

  const isHabitGoal = goalType === "habit";
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;

  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const getDifficultyLabel = (diff: string): string => {
    if (diff === "custom") return customDifficultyName || "Custom";
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };

  const statusLabel = isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started");

  const theme = getDifficultyTheme(difficulty, customDifficultyColor);

  return (
    <div
      className="card-container cursor-pointer"
      onClick={() => onNavigate(goal.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "300px",
        height: "300px",
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* keyframes pour l'énergie (si tu utilises encore la barre animée) */}
      <style>
        {`
          @keyframes energy-move {
            0% { transform: translateX(-40%); opacity: 0; }
            15% { opacity: 1; }
            50% { opacity: 1; }
            100% { transform: translateX(140%); opacity: 0; }
          }
        `}
      </style>

      <div
        className="card"
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          borderRadius: "inherit",
          overflow: "hidden",
          backgroundColor: "#05050a", // fond base sous le pattern
        }}
      >
        <style>
          {`
    .jp-matrix > span {
      text-align: center;
      text-shadow: 0 0 5px rgba(0, 150, 255, 0.5);
      user-select: none;
      transition: color 0.5s, text-shadow 0.5s;
      line-height: 1;
    }

    .jp-matrix > span:nth-child(19n + 2) {
      animation: smooth-pulse 3.5s ease-in-out infinite 0.2s;
    }
    .jp-matrix > span:nth-child(29n + 1) {
      animation: smooth-pulse 4.1s ease-in-out infinite 0.7s;
    }
    .jp-matrix > span:nth-child(11n) {
      color: rgba(100, 200, 255, 0.7);
      animation: smooth-pulse 2.9s ease-in-out infinite 1.1s;
    }
    .jp-matrix > span:nth-child(37n + 10) {
      animation: smooth-pulse 5.3s ease-in-out infinite 1.5s;
    }
    .jp-matrix > span:nth-child(41n + 1) {
      animation: smooth-pulse 3.9s ease-in-out infinite 0.4s;
    }
    .jp-matrix > span:nth-child(17n + 9) {
      animation: smooth-pulse 2.8s ease-in-out infinite 0.9s;
    }
    .jp-matrix > span:nth-child(23n + 18) {
      animation: smooth-pulse 4.3s ease-in-out infinite 1.3s;
    }
    .jp-matrix > span:nth-child(31n + 4) {
      animation: smooth-pulse 5.6s ease-in-out infinite 0.1s;
    }
    .jp-matrix > span:nth-child(43n + 20) {
      animation: smooth-pulse 3.6s ease-in-out infinite 1.8s;
    }
    .jp-matrix > span:nth-child(13n + 6) {
      animation: smooth-pulse 3.2s ease-in-out infinite 1.2s;
    }
    .jp-matrix > span:nth-child(53n + 5) {
      animation: smooth-pulse 4.9s ease-in-out infinite 0.5s;
    }
    .jp-matrix > span:nth-child(47n + 15) {
      animation: smooth-pulse 5.9s ease-in-out infinite 1s;
    }

    @keyframes smooth-pulse {
      0%, 100% {
        color: rgba(0, 150, 255, 0.4);
        text-shadow: 0 0 5px rgba(0, 150, 255, 0.5);
      }
      30% {
        color: rgba(100, 200, 255, 1);
        text-shadow:
          0 0 10px rgba(100, 200, 255, 1),
          0 0 15px rgba(100, 200, 255, 1);
      }
      50% {
        color: rgba(255, 105, 180, 1);
        text-shadow:
          0 0 10px rgba(255, 105, 180, 1),
          0 0 15px rgba(255, 105, 180, 1);
      }
      70% {
        color: #ffffff;
        text-shadow:
          0 0 10px #fff,
          0 0 15px #fff,
          0 0 20px #fff;
      }
    }
  `}
        </style>
        {/* ========= FOND JP-MATRIX ========= */}
        <div
          className="jp-matrix"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
        >
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span> <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span> <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span> <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span> <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span> <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span> <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span> <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span> <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
          <span>マ</span>
          <span>ミ</span>
          <span>ム</span>
          <span>メ</span>
          <span>モ</span>
          <span>ヤ</span>
          <span>ユ</span>
          <span>ヨ</span>
          <span>ラ</span>
          <span>リ</span>
          <span>ル</span>
          <span>レ</span>
          <span>ロ</span>
          <span>ワ</span>
          <span>ヲ</span>
          <span>ン</span>
          <span>ガ</span>
          <span>ギ</span>
          <span>グ</span>
          <span>ゲ</span>
          <span>ゴ</span>
          <span>ザ</span>
          <span>ジ</span>
          <span>ズ</span>
          <span>ゼ</span>
          <span>ゾ</span>
          <span>ダ</span>
          <span>ヂ</span>
          <span>ヅ</span>
          <span>デ</span>
          <span>ド</span>
          <span>バ</span>
          <span>ビ</span>
          <span>ブ</span>
          <span>ベ</span>
          <span>ボ</span>
          <span>パ</span>
          <span>ピ</span>
          <span>プ</span>
          <span>ペ</span>
          <span>ポ</span>
          <span>ア</span>
          <span>イ</span>
          <span>ウ</span>
          <span>エ</span>
          <span>オ</span>
          <span>カ</span>
          <span>キ</span>
          <span>ク</span>
          <span>ケ</span>
          <span>コ</span>
          <span>サ</span>
          <span>シ</span>
          <span>ス</span>
          <span>セ</span>
          <span>ソ</span>
          <span>タ</span>
          <span>チ</span>
          <span>ツ</span>
          <span>テ</span>
          <span>ト</span>
          <span>ナ</span>
          <span>ニ</span>
          <span>ヌ</span>
          <span>ネ</span>
          <span>ノ</span>
          <span>ハ</span>
          <span>ヒ</span>
          <span>フ</span>
          <span>ヘ</span>
          <span>ホ</span>
        </div>

        {/* ========= CONTENU PAR-DESSUS (z-index 1+) ========= */}

        {/* Bouton Focus */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus(goal.id, goal.is_focus || false, e);
          }}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 2,
            background: "rgba(0, 0, 0, 0.45)",
            border: "1px solid rgba(255, 255, 255, 0.35)",
            backdropFilter: "blur(4px)",
          }}
        >
          <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-white/70"}`} />
        </button>

        {/* FACE AVANT */}
        <div
          className="front-content"
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 18px",
          }}
        >
          <p
            style={{
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "1px",
              background: "linear-gradient(135deg, #ff0f7b, #f89b29)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 4px 14px rgba(0, 0, 0, 0.5)",
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
            title={goal.name}
          >
            {goal.name}
          </p>
        </div>

        {/* PANEL DÉPLIANT */}
        <div
          className="content"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "96%",
            height: "100%",
            background: `linear-gradient(-45deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            color: "#fff",
            padding: "24px 22px",
            borderRadius: "inherit",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "inset 0 0 40px rgba(255, 255, 255, 0.1)",
            transform: isHovered ? "translateX(0)" : "translateX(96%)",
            transition: "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            zIndex: 3,
          }}
        >
          {/* HEADER */}
          <div
            className="panel-header"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <h3
              className="heading"
              style={{
                fontSize: "20px",
                fontWeight: 900,
                margin: 0,
                textShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
              title={goal.name}
            >
              {goal.name}
            </h3>

            <span
              className="difficulty-badge"
              style={{
                padding: "7px 18px",
                borderRadius: "999px",
                fontWeight: 800,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#ffffff",
                background: `linear-gradient(135deg, rgba(255,255,255,0.28), ${theme.background})`,
                border: `1px solid ${theme.border}`,
                backdropFilter: "blur(10px)",
                boxShadow: `
                  0 0 0 1px rgba(0,0,0,0.2),
                  0 0 10px ${theme.glow},
                  0 0 22px ${theme.glow}
                `,
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.6)",
              }}
            >
              {getDifficultyLabel(difficulty)}
            </span>
          </div>

          {/* PROGRESSION */}
          <div
            className="panel-progress"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              className="progress-bar"
              style={{
                width: "80%",
                height: "9px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.18)",
                overflow: "hidden",
              }}
            >
              <div
                className="progress-fill"
                style={{
                  height: "100%",
                  borderRadius: "inherit",
                  background: `linear-gradient(90deg, ${theme.progressFrom}, ${theme.progressTo})`,
                  boxShadow: `0 0 12px ${theme.glow}`,
                  transition: "width 0.3s ease",
                  width: `${progress}%`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Spark d'énergie électrique */}
                {progress > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-40%",
                      left: 0,
                      width: "40%",
                      height: "180%",
                      background: `linear-gradient(90deg, transparent, ${theme.energyFrom}, ${theme.energyTo}, transparent)`,
                      filter: "blur(2px)",
                      opacity: 0.9,
                      animation: "energy-move 0.7s linear infinite",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>

            <div
              className="steps-text"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                opacity: 0.95,
                textAlign: "center",
              }}
            >
              <span>{completedSteps}</span>
              <span>
                {" "}
                / {totalSteps} {isHabitGoal ? "days" : "steps"}
              </span>
              {totalSteps > 0 && <span> • {Math.round(progress)}%</span>}
            </div>
          </div>

          {/* FOOTER / STATUT */}
          <div
            className="panel-footer"
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <p
              className="status"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.18)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                backdropFilter: "blur(6px)",
                margin: 0,
              }}
            >
              {statusLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
