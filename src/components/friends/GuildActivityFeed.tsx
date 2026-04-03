import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Loader2, UserPlus, Crown, Target, Megaphone, LogOut, Shield } from "lucide-react";
import { CyberEmpty } from "@/components/ui/cyber-states";
import { useGuilds, type GuildActivity } from "@/hooks/useGuilds";
import { formatDistanceToNow } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { useTranslation } from "react-i18next";

const actionIcons: Record<string, typeof Activity> = {
  guild_created: Crown,
  member_joined: UserPlus,
  member_left: LogOut,
  member_promoted: Shield,
  member_demoted: Shield,
  goal_contribution: Target,
  announcement_posted: Megaphone,
};

interface Props {
  guildId: string;
}

export function GuildActivityFeedPanel({ guildId }: Props) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { useGuildActivity } = useGuilds();
  const { data: activities = [], isLoading } = useGuildActivity(guildId);

  const getLabel = (a: GuildActivity) => {
    const name = a.display_name || t("friends.unknownAgent");
    switch (a.action_type) {
      case "guild_created": return t("friends.activityCreated", { name });
      case "member_joined": return t("friends.activityJoined", { name });
      case "member_left": return t("friends.activityLeft", { name });
      case "goal_contribution": return t("friends.activityContributed", { name, amount: (a.metadata as any)?.amount || 1 });
      default: return `${name} — ${a.action_type}`;
    }
  };

  return (
    <ScrollArea className="max-h-64">
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : activities.length === 0 ? (
        <CyberEmpty icon={Activity} title={t("friends.noActivity")} subtitle={t("friends.noActivityDesc")} />
      ) : (
        <div className="space-y-1.5">
          {activities.map((a: GuildActivity) => {
            const Icon = actionIcons[a.action_type] || Activity;
            return (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">{getLabel(a)}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
}
