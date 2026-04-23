import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useGuilds } from "@/hooks/useGuilds";
import { GuildHeader } from "@/components/guild/GuildHeader";
import { GuildSidebar, type GuildSection } from "@/components/guild/GuildSidebar";
import { GuildOverview } from "@/components/guild/GuildOverview";
import { GuildMembersPanel } from "@/components/guild/GuildMembersPanel";
import { GuildChat } from "@/components/guild/GuildChat";
import { GuildGoalsPanel } from "@/components/friends/GuildGoalsPanel";
import { GuildEventsPanel } from "@/components/guild/GuildEventsPanel";
import { GuildLeaderboard } from "@/components/friends/GuildLeaderboard";
import { GuildSettingsPage } from "@/components/guild/GuildSettingsPage";
import { CyberLoader } from "@/components/ui/cyber-states";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DSCornerBrackets, DSDataNoise } from "@/components/ds";

export default function GuildPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { guilds, guildsLoading, useGuildMembers, leaveGuild } = useGuilds();
  const [section, setSection] = useState<GuildSection>("overview");

  const guild = guilds.find((g) => g.id === id);
  const { data: members = [], isLoading: membersLoading } = useGuildMembers(id || "");

  if (guildsLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CyberLoader rows={3} label={t("common.loading")} />
      </div>
    );
  }

  if (!guild || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-sm text-muted-foreground">{t("guild.notFound")}</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/friends")}>{t("common.back")}</Button>
      </div>
    );
  }

  const myMembership = members.find((m) => m.user_id === user.id);
  const isOwner = guild.owner_id === user.id;
  const isOfficer = isOwner || myMembership?.role === "officer";

  const handleLeave = async () => {
    if (isOwner) {
      toast.error(t("guild.ownerCantLeave"));
      return;
    }
    try {
      await leaveGuild.mutateAsync(guild.id);
      toast.success(t("friends.leftGuild"));
      navigate("/friends");
    } catch {
      toast.error(t("friends.leaveFailed"));
    }
  };

  const renderSection = () => {
    switch (section) {
      case "overview":
        return <GuildOverview guild={guild} userId={user.id} isOfficer={isOfficer} />;
      case "members":
        return <GuildMembersPanel guild={guild} userId={user.id} isOfficer={isOfficer} isOwner={isOwner} />;
      case "chat":
        return <GuildChat guildId={guild.id} userId={user.id} />;
      case "goals":
        return <GuildGoalsPanel guildId={guild.id} canManage={isOfficer} />;
      case "events":
        return <GuildEventsPanel guildId={guild.id} userId={user.id} isOfficer={isOfficer} />;
      case "leaderboard":
        return <GuildLeaderboard guildId={guild.id} />;
      case "settings":
        return <GuildSettingsPage guild={guild} userId={user.id} isOwner={isOwner} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden font-rajdhani">
      <DSDataNoise count={12} />

      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 md:px-8 py-6 relative z-10">
        <div className="relative bg-[hsl(var(--ds-surface-1)/0.55)] border border-[hsl(var(--ds-border-default)/0.25)] rounded-sm shadow-2xl">
          <DSCornerBrackets size={16} color="hsl(var(--ds-accent-primary) / 0.6)" />
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(to right, transparent, hsl(var(--ds-accent-primary) / 0.5), transparent)" }}
            aria-hidden="true"
          />

          <div className="p-4 sm:p-6 space-y-6">
            <GuildHeader guild={guild} memberCount={members.length} />

            <div className="flex gap-4 sm:gap-6">
              <div className="w-14 lg:w-52 shrink-0">
                <div className="sticky top-20 space-y-2">
                  <GuildSidebar active={section} onChange={setSection} isOfficer={isOfficer} />
                  {!isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ds-accent-critical))] hover:text-[hsl(var(--ds-accent-critical))] hover:bg-[hsl(var(--ds-accent-critical)/0.08)]"
                      onClick={handleLeave}
                      disabled={leaveGuild.isPending}
                    >
                      {leaveGuild.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3 mr-1" />}
                      <span className="hidden lg:inline">{t("friends.leaveGuild")}</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {renderSection()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
