import { useNavigate } from "react-router-dom";
import { Crosshair, Star, FileText, Heart, CheckSquare, Lock } from "lucide-react";
import { CornerBrackets } from "./CornerBrackets";

interface QuickAccessPanelProps {
  ownedModules: {
    "todo-list": boolean;
    journal: boolean;
    "track-health": boolean;
  };
  className?: string;
}

const buttons = [
  { key: "new-goal", label: "NEW GOAL", icon: Crosshair, route: "/goals/new", moduleKey: null },
  { key: "new-task", label: "NEW TASK", icon: Star, route: "/todo", moduleKey: "todo-list" as const },
  { key: "journal", label: "JOURNAL", icon: FileText, route: "/journal", moduleKey: "journal" as const },
  { key: "health", label: "HEALTH", icon: Heart, route: "/health", moduleKey: "track-health" as const },
];

export function QuickAccessPanel({ ownedModules, className = "" }: QuickAccessPanelProps) {
  const navigate = useNavigate();

  const isLocked = (moduleKey: string | null) => {
    if (!moduleKey) return false;
    return !ownedModules[moduleKey as keyof typeof ownedModules];
  };

  return (
    <div
      className={`relative rounded p-4 md:p-5 ${className}`}
      style={{
        backgroundColor: "rgba(6,11,22,0.92)",
        border: "1px solid rgba(0,180,255,0.08)",
      }}
    >
      <CornerBrackets color="rgba(120,130,80,0.4)" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff33] to-transparent" />

      <p className="text-[9px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.3)] mb-3">
        // ACCES RAPIDE
      </p>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {buttons.map((btn) => {
          const locked = isLocked(btn.moduleKey);
          const Icon = btn.icon;
          return (
            <button
              key={btn.key}
              onClick={() => navigate(locked ? "/shop" : btn.route)}
              className="relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded transition-colors"
              style={{
                backgroundColor: "rgba(0,180,255,0.03)",
                border: "1px solid rgba(0,180,255,0.08)",
                opacity: locked ? 0.4 : 1,
              }}
            >
              {locked && (
                <Lock size={10} className="absolute top-1.5 right-1.5 text-[rgba(160,210,255,0.3)]" />
              )}
              <Icon size={18} className="text-[#00d4ff]" style={{ opacity: locked ? 0.5 : 0.8 }} />
              <span className="text-[8px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.5)]">
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Full-width To-Do button */}
      <button
        onClick={() => navigate(ownedModules["todo-list"] ? "/todo" : "/shop")}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded transition-colors"
        style={{
          backgroundColor: "rgba(0,180,255,0.03)",
          border: "1px solid rgba(0,180,255,0.08)",
          opacity: ownedModules["todo-list"] ? 1 : 0.4,
        }}
      >
        <CheckSquare size={14} className="text-[#00d4ff]" />
        <span className="text-[9px] font-orbitron uppercase tracking-[0.12em] text-[rgba(160,210,255,0.5)]">
          TO-DO LIST
        </span>
      </button>
    </div>
  );
}
