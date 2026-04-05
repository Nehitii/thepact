import { Home, Users, MessageSquare, Target, CalendarDays, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type GuildSection = "overview" | "members" | "chat" | "goals" | "events" | "leaderboard" | "settings";

const sections: { key: GuildSection; icon: React.ElementType; label: string }[] = [
  { key: "overview", icon: Home, label: "guild.overview" },
  { key: "members", icon: Users, label: "guild.members" },
  { key: "chat", icon: MessageSquare, label: "guild.chat" },
  { key: "goals", icon: Target, label: "guild.goals" },
  { key: "events", icon: CalendarDays, label: "guild.events" },
  { key: "leaderboard", icon: Trophy, label: "guild.leaderboard" },
  { key: "settings", icon: Settings, label: "common.settings" },
];

interface Props {
  active: GuildSection;
  onChange: (s: GuildSection) => void;
  isOfficer: boolean;
}

export function GuildSidebar({ active, onChange, isOfficer }: Props) {
  const { t } = useTranslation();
  const visibleSections = isOfficer ? sections : sections.filter((s) => s.key !== "settings");

  return (
    <nav className="flex flex-col gap-1 p-2">
      {visibleSections.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
            active === key
              ? "bg-primary/15 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="hidden lg:inline">{t(label)}</span>
        </button>
      ))}
    </nav>
  );
}
