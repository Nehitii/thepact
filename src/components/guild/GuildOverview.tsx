import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGuilds, type Guild, type GuildAnnouncement, type GuildActivity } from "@/hooks/useGuilds";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pin, Send, Trash2, Activity, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { CyberEmpty } from "@/components/ui/cyber-states";

interface Props {
  guild: Guild;
  userId: string;
  isOfficer: boolean;
}

export function GuildOverview({ guild, userId, isOfficer }: Props) {
  const { t } = useTranslation();
  const { useAnnouncements, useGuildActivity, createAnnouncement, deleteAnnouncement } = useGuilds();
  const { data: announcements = [] } = useAnnouncements(guild.id);
  const { data: activity = [] } = useGuildActivity(guild.id);
  const [motd, setMotd] = useState("");

  const handlePostAnnouncement = async () => {
    if (!motd.trim()) return;
    try {
      await createAnnouncement.mutateAsync({ guildId: guild.id, content: motd.trim(), pinned: false });
      toast.success(t("friends.announcementPosted"));
      setMotd("");
    } catch {
      toast.error(t("friends.announcementFailed"));
    }
  };

  const activityLabel = (a: GuildActivity) => {
    switch (a.action_type) {
      case "guild_created": return t("friends.activityCreated", { name: a.display_name || "?" });
      case "member_joined": return t("friends.activityJoined", { name: a.display_name || "?" });
      case "member_left": return t("friends.activityLeft", { name: a.display_name || "?" });
      case "goal_contribution": return t("friends.activityContributed", { name: a.display_name || "?", amount: (a.metadata as any)?.amount || 0 });
      case "xp_gained": return `${a.display_name || "?"} earned ${(a.metadata as any)?.amount || 0} XP`;
      default: return `${a.display_name || "?"}: ${a.action_type}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* MOTD / Announcements */}
      {isOfficer && (
        <div className="flex gap-2">
          <Textarea
            placeholder={t("friends.writeAnnouncement")}
            value={motd}
            onChange={(e) => setMotd(e.target.value)}
            className="resize-none h-16 text-xs"
            maxLength={500}
          />
          <Button size="sm" onClick={handlePostAnnouncement} disabled={!motd.trim() || createAnnouncement.isPending} className="self-end">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Pinned + Announcements */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Megaphone className="h-3.5 w-3.5" /> {t("guild.announcements")}
        </h3>
        {announcements.length === 0 ? (
          <CyberEmpty icon={Megaphone} title={t("friends.noAnnouncements")} subtitle={t("friends.noAnnouncementsDesc")} />
        ) : (
          <div className="space-y-2">
            {announcements.slice(0, 5).map((a: GuildAnnouncement) => (
              <div key={a.id} className="bg-card/50 border border-border/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {a.pinned && <Pin className="h-3 w-3 text-primary" />}
                    <span className="font-bold">{a.author_name}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                  </div>
                  {(a.author_id === userId || isOfficer) && (
                    <button onClick={() => deleteAnnouncement.mutateAsync({ id: a.id, guildId: guild.id })} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-foreground">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" /> {t("guild.recentActivity")}
        </h3>
        {activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("friends.noActivity")}</p>
        ) : (
          <div className="space-y-1.5">
            {activity.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                <span className="flex-1">{activityLabel(a)}</span>
                <span className="text-[9px] shrink-0">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
