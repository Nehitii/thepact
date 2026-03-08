import { Shield, Users, Crown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Guild } from "@/hooks/useGuilds";

const iconMap: Record<string, any> = { shield: Shield, crown: Crown, users: Users };
const colorMap: Record<string, string> = {
  violet: "from-violet-500/20 to-violet-900/10 border-violet-500/30",
  emerald: "from-emerald-500/20 to-emerald-900/10 border-emerald-500/30",
  amber: "from-amber-500/20 to-amber-900/10 border-amber-500/30",
  rose: "from-rose-500/20 to-rose-900/10 border-rose-500/30",
  cyan: "from-cyan-500/20 to-cyan-900/10 border-cyan-500/30",
};

interface GuildCardProps {
  guild: Guild;
  isOwner: boolean;
  onClick: () => void;
}

export function GuildCard({ guild, isOwner, onClick }: GuildCardProps) {
  const Icon = iconMap[guild.icon] || Shield;
  const colorClass = colorMap[guild.color] || colorMap.violet;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left p-4 rounded-xl border bg-gradient-to-br transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-lg",
        colorClass,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-card/50 border border-border flex items-center justify-center">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-foreground">
              {guild.name}
            </h3>
            {isOwner && <Crown className="h-3 w-3 text-amber-400 shrink-0" />}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
            <Users className="h-3 w-3" /> {guild.member_count || 1} members
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
      {guild.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{guild.description}</p>
      )}
    </button>
  );
}
