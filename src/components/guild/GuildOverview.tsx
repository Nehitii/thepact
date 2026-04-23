import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGuilds, type Guild, type GuildAnnouncement, type GuildActivity } from "@/hooks/useGuilds";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pin, Send, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { CyberEmpty } from "@/components/ui/cyber-states";
import { DSPanel, DSDivider } from "@/components/ds";

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
      {/* Post Announcement (Officer only) */}
      {isOfficer && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[hsl(var(--ds-accent-primary))]">
            [ POST ANNOUNCEMENT ]
          </span>
          <DSPanel tier="muted" hideBrackets className="!p-3">
            <div className="flex gap-2">
              <Textarea
                placeholder={t("friends.writeAnnouncement")}
                value={motd}
                onChange={(e) => setMotd(e.target.value)}
                className="resize-none h-16 text-xs bg-[hsl(var(--ds-surface-2)/0.5)] border-[hsl(var(--ds-border-default)/0.3)] font-rajdhani"
                maxLength={500}
              />
              <Button
                size="sm"
                onClick={handlePostAnnouncement}
                disabled={!motd.trim() || createAnnouncement.isPending}
                className="self-end h-9 px-3 font-orbitron text-[11px] tracking-[0.2em] uppercase border"
                style={{
                  color: "hsl(var(--ds-accent-primary))",
                  background: "hsl(var(--ds-accent-primary) / 0.1)",
                  borderColor: "hsl(var(--ds-accent-primary) / 0.5)",
                }}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </DSPanel>
        </div>
      )}

      {/* Announcements */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--ds-accent-warning))] shrink-0">
            [ ANNOUNCEMENTS ]
          </h3>
          <DSDivider accent="warning" />
        </div>
        {announcements.length === 0 ? (
          <CyberEmpty icon={Megaphone} title={t("friends.noAnnouncements")} subtitle={t("friends.noAnnouncementsDesc")} />
        ) : (
          <div className="space-y-2">
            {announcements.slice(0, 5).map((a: GuildAnnouncement) => (
              <DSPanel key={a.id} tier="secondary" accent="warning" hideBrackets className="!p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--ds-text-muted))] flex items-center gap-1.5">
                    {a.pinned && <Pin className="h-3 w-3" style={{ color: "hsl(var(--ds-accent-warning))" }} />}
                    [ {a.author_name?.toUpperCase() || "?"} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true }).toUpperCase()} ]
                  </span>
                  {(a.author_id === userId || isOfficer) && (
                    <button
                      onClick={() => deleteAnnouncement.mutateAsync({ id: a.id, guildId: guild.id })}
                      className="text-[hsl(var(--ds-text-muted))] hover:text-[hsl(var(--ds-accent-critical))] transition-colors"
                      aria-label="Delete announcement"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-[hsl(var(--ds-text-primary))] font-rajdhani leading-relaxed">{a.content}</p>
              </DSPanel>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--ds-accent-primary))] shrink-0">
            [ RECENT ACTIVITY ]
          </h3>
          <DSDivider accent="primary" />
        </div>
        {activity.length === 0 ? (
          <DSPanel tier="muted" hideBrackets className="!p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ds-text-muted))]">
              // {t("friends.noActivity")}
            </p>
          </DSPanel>
        ) : (
          <DSPanel tier="muted" hideBrackets className="!p-3">
            <div className="space-y-1.5">
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-[11px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      background: "hsl(var(--ds-accent-primary))",
                      boxShadow: "0 0 4px hsl(var(--ds-accent-primary) / 0.6)",
                      animation: "ds-pulse-dot 1.8s ease-in-out infinite",
                    }}
                  />
                  <span className="flex-1 text-[hsl(var(--ds-text-secondary))] font-rajdhani truncate">
                    {activityLabel(a)}
                  </span>
                  <span className="font-mono text-[9px] tabular-nums uppercase tracking-wider text-[hsl(var(--ds-text-muted)/0.7)] shrink-0">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </DSPanel>
        )}
      </div>
    </div>
  );
}
