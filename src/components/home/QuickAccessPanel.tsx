import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
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
  {
    key: "new-goal", label: "NEW GOAL", color: "#00d4ff", hotkey: "F1", moduleKey: null, route: "/goals/new",
    icon: (c: string) => (
      <svg width={26} height={26} viewBox="0 0 26 26" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}>
        <circle cx="13" cy="13" r="10" strokeOpacity="0.5" />
        <circle cx="13" cy="13" r="5" strokeOpacity="0.8" />
        <circle cx="13" cy="13" r="1" fill={c} fillOpacity="0.8" stroke="none" />
        <line x1="13" y1="1" x2="13" y2="6" strokeOpacity="0.6" />
        <line x1="13" y1="20" x2="13" y2="25" strokeOpacity="0.6" />
        <line x1="1" y1="13" x2="6" y2="13" strokeOpacity="0.6" />
        <line x1="20" y1="13" x2="25" y2="13" strokeOpacity="0.6" />
      </svg>
    ),
  },
  {
    key: "new-task", label: "NEW TASK", color: "#ff8c00", hotkey: "F2", moduleKey: "todo-list" as const, route: "/todo",
    icon: (c: string) => (
      <svg width={26} height={26} viewBox="0 0 26 26" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}>
        <polygon points="13,2 16,10 25,10 18,15 20,24 13,19 6,24 8,15 1,10 10,10" strokeOpacity="0.8" />
        <circle cx="13" cy="13" r="3" fill={`${c}40`} stroke="none" />
      </svg>
    ),
  },
  {
    key: "journal", label: "JOURNAL", color: "#aa44ff", hotkey: "F3", moduleKey: "journal" as const, route: "/journal",
    icon: (c: string) => (
      <svg width={26} height={26} viewBox="0 0 26 26" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}>
        <rect x="5" y="3" width="16" height="20" rx="1" strokeOpacity="0.5" />
        <rect x="3" y="3" width="4" height="20" rx="1" fill={`${c}26`} strokeOpacity="0.8" />
        <line x1="9" y1="9" x2="19" y2="9" strokeOpacity="0.7" />
        <line x1="9" y1="13" x2="19" y2="13" strokeOpacity="0.7" />
        <line x1="9" y1="17" x2="15" y2="17" strokeOpacity="0.5" />
      </svg>
    ),
  },
  {
    key: "health", label: "HEALTH", color: "#00ff88", hotkey: "F4", moduleKey: "track-health" as const, route: "/health",
    icon: (c: string) => (
      <svg width={26} height={26} viewBox="0 0 26 26" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}>
        <path d="M13 22 C13 22 3 16 3 9 C3 6 5.5 4 8.5 4 C10.5 4 12 5 13 6.5 C14 5 15.5 4 17.5 4 C20.5 4 23 6 23 9 C23 16 13 22 13 22Z" strokeOpacity="0.8" />
        <line x1="10" y1="13" x2="16" y2="13" strokeOpacity="0.9" />
        <line x1="13" y1="10" x2="13" y2="16" strokeOpacity="0.9" />
      </svg>
    ),
  },
];

export function QuickAccessPanel({ ownedModules, className = "" }: QuickAccessPanelProps) {
  const navigate = useNavigate();

  const isLocked = (moduleKey: string | null) => {
    if (!moduleKey) return false;
    return !ownedModules[moduleKey as keyof typeof ownedModules];
  };

  return (
    <div
      className={`relative ${className}`}
      style={{
        backgroundColor: "rgba(6,11,22,0.92)",
        border: "1px solid rgba(0,180,255,0.12)",
        borderRadius: 4,
        boxShadow: "0 8px 48px rgba(0,0,0,0.9), inset 0 1px 0 rgba(0,212,255,0.06)",
        padding: 22,
      }}
    >
      <CornerBrackets color="rgba(120,130,80,0.4)" />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,210,255,0.4), transparent)" }} />

      <p
        className="mb-4"
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9, letterSpacing: 3,
          color: "rgba(160,210,255,0.5)",
          textTransform: "uppercase" as const,
        }}
      >
        // ACCÈS RAPIDE
      </p>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-[10px] mb-[10px]">
        {buttons.map((btn) => {
          const locked = isLocked(btn.moduleKey);
          return (
            <button
              key={btn.key}
              onClick={() => navigate(locked ? "/shop" : btn.route)}
              className="relative flex flex-col items-center gap-[9px] cursor-pointer overflow-hidden group"
              style={{
                padding: "16px 14px 13px",
                background: "rgba(0,0,0,0.2)",
                border: `1px solid rgba(0,180,255,0.12)`,
                borderRadius: 4,
                opacity: locked ? 0.4 : 1,
                transition: "all 0.22s cubic-bezier(0.2, 0, 0, 1)",
                ["--pc" as string]: btn.color,
              }}
              onMouseEnter={(e) => {
                if (!locked) {
                  e.currentTarget.style.borderColor = btn.color;
                  e.currentTarget.style.background = "rgba(0,0,0,0.35)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${btn.color}, inset 0 0 20px rgba(0,0,0,0.2)`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,180,255,0.12)";
                e.currentTarget.style.background = "rgba(0,0,0,0.2)";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${btn.color}, transparent)`,
                  opacity: 0.3,
                }}
              />
              {/* Corner notch */}
              <div
                className="absolute bottom-0 right-0"
                style={{
                  width: 10, height: 10,
                  background: btn.color,
                  clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                  opacity: 0.25,
                }}
              />
              {/* Hotkey */}
              <span
                className="absolute"
                style={{
                  top: 5, right: 7,
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 7, color: btn.color,
                  opacity: 0.3, letterSpacing: 1,
                }}
              >
                {btn.hotkey}
              </span>

              {locked && (
                <Lock size={10} className="absolute top-1.5 left-1.5" style={{ color: "rgba(160,210,255,0.3)" }} />
              )}
              {btn.icon(btn.color)}
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9, letterSpacing: 2.5,
                  color: "rgba(160,210,255,0.5)",
                  textTransform: "uppercase" as const,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* TO-DO wide button */}
      <button
        onClick={() => navigate(ownedModules["todo-list"] ? "/todo" : "/shop")}
        className="w-full relative flex items-center justify-center gap-[14px] cursor-pointer overflow-hidden"
        style={{
          padding: "12px 20px",
          background: "rgba(0,0,0,0.2)",
          border: "1px solid rgba(0,180,255,0.12)",
          borderRadius: 4,
          opacity: ownedModules["todo-list"] ? 1 : 0.4,
          transition: "all 0.22s cubic-bezier(0.2, 0, 0, 1)",
        }}
        onMouseEnter={(e) => {
          if (ownedModules["todo-list"]) {
            e.currentTarget.style.borderColor = "#ffd700";
            e.currentTarget.style.background = "rgba(0,0,0,0.35)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,180,255,0.12)";
          e.currentTarget.style.background = "rgba(0,0,0,0.2)";
          e.currentTarget.style.transform = "none";
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #ffd700, transparent)", opacity: 0.3 }} />
        <div className="absolute bottom-0 right-0" style={{ width: 10, height: 10, background: "#ffd700", clipPath: "polygon(100% 0, 100% 100%, 0 100%)", opacity: 0.25 }} />
        <span className="absolute" style={{ top: 5, right: 10, fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: "#ffd700", opacity: 0.3, letterSpacing: 1 }}>F5</span>
        <svg width={20} height={20} viewBox="0 0 26 26" fill="none" stroke="#ffd700" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}>
          <rect x="3" y="3" width="20" height="20" rx="2" strokeOpacity="0.4" />
          <polyline points="7,9 10,12 19,7" strokeOpacity="0.9" />
          <line x1="7" y1="14" x2="19" y2="14" strokeOpacity="0.5" />
          <line x1="7" y1="18" x2="14" y2="18" strokeOpacity="0.4" />
        </svg>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: 2.5, color: "rgba(160,210,255,0.5)", textTransform: "uppercase" as const }}>
          TO-DO LIST
        </span>
      </button>
    </div>
  );
}
