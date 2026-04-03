import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Loader2 } from "lucide-react";
import { CyberEmpty } from "@/components/ui/cyber-states";
import { useGuilds, type GuildMember } from "@/hooks/useGuilds";
import { useTranslation } from "react-i18next";

interface Props {
  guildId: string;
}

export function GuildLeaderboard({ guildId }: Props) {
  const { t } = useTranslation();
  const { useGuildMembers } = useGuilds();
  const { data: members = [], isLoading } = useGuildMembers(guildId);

  const sorted = [...members].sort((a, b) => {
    const roleOrder: Record<string, number> = { owner: 0, officer: 1, member: 2 };
    return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
  });

  const medalColors = ["text-amber-400", "text-gray-300", "text-amber-600"];

  return (
    <ScrollArea className="max-h-64">
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : sorted.length === 0 ? (
        <CyberEmpty icon={Trophy} title={t("friends.noMembers")} />
      ) : (
        <div className="space-y-1">
          {sorted.map((m: GuildMember, i: number) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
              <span className={`text-sm font-bold w-6 text-center ${i < 3 ? medalColors[i] : "text-muted-foreground"}`}>
                {i < 3 ? "🏆".slice(0, 1) : `#${i + 1}`}
              </span>
              <Avatar className="h-7 w-7">
                <AvatarImage src={m.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-muted">{(m.display_name || "?")[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-bold flex-1 truncate">{m.display_name}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.role}</span>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
