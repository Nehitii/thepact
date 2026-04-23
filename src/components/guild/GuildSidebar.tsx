import { Home, Users, MessageSquare, Target, CalendarDays, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type GuildSection = "overview" | "members" | "chat" | "goals" | "events" | "leaderboard" | "settings";

const sections: { key: GuildSection; icon: React.ElementType; label: string; accent: "primary" | "success" | "warning" | "special" | "critical" }[] = [
  { key: "overview",    icon: Home,         label: "guild.overview",    accent: "primary" },
  { key: "members",     icon: Users,        label: "guild.members",     accent: "primary" },
  { key: "chat",        icon: MessageSquare,label: "guild.chat",        accent: "primary" },
  { key: "goals",       icon: Target,       label: "guild.goals",       accent: "success" },
  { key: "events",      icon: CalendarDays, label: "guild.events",      accent: "warning" },
  { key: "leaderboard", icon: Trophy,       label: "guild.leaderboard", accent: "special" },
  { key: "settings",    icon: Settings,     label: "common.settings",   accent: "primary" },
];

const ACCENT_VAR = {
  primary: "var(--ds-accent-primary)",
  success: "var(--ds-accent-success)",
  warning: "var(--ds-accent-warning)",
  special: "var(--ds-accent-special)",
  critical: "var(--ds-accent-critical)",
} as const;

interface Props {
  active: GuildSection;
  onChange: (s: GuildSection) => void;
  isOfficer: boolean;
}

/**
 * Tactical Rail vertical — mirror of AllianceTabs, applied to Guild sub-navigation.
 */
export function GuildSidebar({ active, onChange, isOfficer }: Props) {
  const { t } = useTranslation();
  const visibleSections = isOfficer ? sections : sections.filter((s) => s.key !== "settings");

  return (
    <nav className="border border-[hsl(var(--ds-border-default)/0.2)] bg-[hsl(var(--ds-surface-2)/0.5)] rounded-sm p-1 flex flex-col gap-0.5">
      {visibleSections.map(({ key, icon: Icon, label, accent }, idx) => {
        const isActive = active === key;
        const colorVar = ACCENT_VAR[accent];
        const navId = `NAV.${String(idx + 1).padStart(2, "0")}`;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "relative group flex items-center gap-2.5 px-2.5 py-2 rounded-[2px] transition-all duration-200 text-left",
              isActive ? "opacity-100" : "opacity-55 hover:opacity-100",
            )}
            style={
              isActive
                ? {
                    background: `hsl(${colorVar} / 0.08)`,
                    color: `hsl(${colorVar})`,
                    boxShadow: `inset 2px 0 0 0 hsl(${colorVar})`,
                  }
                : undefined
            }
            aria-label={t(label)}
          >
            {isActive && (
              <>
                <span
                  className="absolute top-0 left-0 h-1.5 w-1.5 border-t border-l"
                  style={{ borderColor: `hsl(${colorVar} / 0.7)` }}
                  aria-hidden="true"
                />
                <span
                  className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l"
                  style={{ borderColor: `hsl(${colorVar} / 0.7)` }}
                  aria-hidden="true"
                />
              </>
            )}

            <Icon className="h-4 w-4 shrink-0" />

            <span
              className={cn(
                "hidden lg:inline font-orbitron text-[10px] uppercase tracking-[0.2em] truncate flex-1",
                isActive && "font-bold",
              )}
            >
              {t(label)}
            </span>

            <span
              className="hidden lg:inline font-mono text-[8px] tracking-[0.18em] text-[hsl(var(--ds-text-muted)/0.5)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              aria-hidden="true"
            >
              {navId}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
