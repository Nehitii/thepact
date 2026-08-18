import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { CornerBrackets } from "./CornerBrackets";

interface QuickAccessPanelProps {
  ownedModules: {
    "todo-list": boolean;
    journal: boolean;
    "track-health": boolean;
  };
  onWeeklyReview?: () => void;
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

/* Les deux actions qui vivaient en boutons larges separes rejoignent la
   meme liste : six accès, un seul rythme. */
const EXTRA = [
  {
    key: "todo", label: "TO-DO LIST", color: "#ffd700", hotkey: "F5",
    moduleKey: "todo-list" as const, route: "/todo",
    icon: (c: string) => (
      <svg width={22} height={22} viewBox="0 0 26 26" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="20" height="20" rx="2" strokeOpacity="0.45" />
        <polyline points="7,9 10,12 19,7" strokeOpacity="0.95" />
        <line x1="7" y1="14" x2="19" y2="14" strokeOpacity="0.55" />
        <line x1="7" y1="18" x2="14" y2="18" strokeOpacity="0.45" />
      </svg>
    ),
  },
  {
    key: "weekly", label: "WEEKLY REVIEW", color: "#818cf8", hotkey: "F6",
    moduleKey: null, route: null,
    icon: (c: string) => (
      <svg width={22} height={22} viewBox="0 0 26 26" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="18" height="22" rx="2" strokeOpacity="0.55" />
        <line x1="8" y1="7" x2="18" y2="7" strokeOpacity="0.75" />
        <line x1="8" y1="11" x2="18" y2="11" strokeOpacity="0.55" />
        <line x1="8" y1="15" x2="14" y2="15" strokeOpacity="0.45" />
        <path d="M15 18 L17 20 L21 16" strokeOpacity="0.95" strokeWidth="1.6" />
      </svg>
    ),
  },
];

/**
 * Barre d'acces rapide.
 *
 * Etait un panneau en colonne : une grille 2x2 plus deux boutons larges,
 * occupant cinq douziemes de la rangee pour six raccourcis. Trois defauts
 * s'y cumulaient — le fond --nexus-inner-bg a rgba(0,0,0,0.2) rendait les
 * tuiles illisibles, un triangle de 10px en bas a droite de chaque tuile
 * salissait le bord, et le volume occupe etait sans rapport avec le
 * contenu.
 *
 * En barre horizontale sous le hub : les six accès sur une rangee, la
 * colonne de droite liberee, et les coins supprimes. Sous 900px la rangee
 * defile lateralement plutot que de comprimer les libelles.
 */
export function QuickAccessPanel({ ownedModules, onWeeklyReview, className = "" }: QuickAccessPanelProps) {
  const navigate = useNavigate();

  const isLocked = (moduleKey: string | null) => {
    if (!moduleKey) return false;
    return !ownedModules[moduleKey as keyof typeof ownedModules];
  };

  const actions = [...buttons, ...EXTRA];

  return (
    <div
      className={`relative ${className}`}
      style={{
        background: "var(--nexus-bg)",
        border: "1px solid var(--nexus-border)",
        borderRadius: 4,
        boxShadow: "var(--nexus-shadow)",
        padding: "10px 12px",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top" />

      <div className="flex items-stretch gap-2 overflow-x-auto scrollbar-thin-x">
        <span
          className="hidden lg:flex items-center shrink-0 pr-3 mr-1"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "max(11px, 0.6875rem)", letterSpacing: 3,
            color: "var(--nexus-text-dim)",
            textTransform: "uppercase" as const,
            borderRight: "1px solid var(--nexus-separator)",
          }}
        >
          // ACCÈS RAPIDE
        </span>

        {actions.map((btn) => {
          const locked = isLocked(btn.moduleKey);
          return (
            <button
              key={btn.key}
              onClick={() => {
                if (btn.key === "weekly") { onWeeklyReview?.(); return; }
                navigate(locked ? "/shop" : (btn.route as string));
              }}
              title={locked ? `${btn.label} — verrouille` : btn.label}
              className="relative flex items-center gap-2.5 shrink-0 cursor-pointer group"
              style={{
                padding: "9px 14px 9px 12px",
                /* Fond eclairci : --nexus-inner-bg a 0.2 d'opacite laissait
                   les tuiles quasi noires sur un panneau deja sombre. */
                background: "rgba(255,255,255,0.035)",
                border: "1px solid var(--nexus-border)",
                borderRadius: 4,
                opacity: locked ? 0.45 : 1,
                transition: "background 0.2s, border-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                if (locked) return;
                e.currentTarget.style.borderColor = btn.color;
                e.currentTarget.style.background = "rgba(255,255,255,0.075)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--nexus-border)";
                e.currentTarget.style.background = "rgba(255,255,255,0.035)";
                e.currentTarget.style.transform = "none";
              }}
            >
              {locked && (
                <Lock size={11} className="shrink-0" style={{ color: "var(--nexus-text-dimmer)" }} />
              )}
              <span className="shrink-0 flex items-center">{btn.icon(btn.color)}</span>
              <span
                className="whitespace-nowrap"
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "max(11px, 0.6875rem)", letterSpacing: 2,
                  color: "var(--nexus-text-label)",
                  textTransform: "uppercase" as const,
                }}
              >
                {btn.label}
              </span>
              <span
                className="shrink-0 hidden xl:inline"
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "max(11px, 0.6875rem)",
                  color: btn.color, opacity: 0.85, letterSpacing: 1,
                  marginLeft: 2,
                }}
              >
                {btn.hotkey}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
