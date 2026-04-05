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
        return <GuildGoalsPanel guildId={guild.id} isOfficer={isOfficer} />;
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
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <GuildHeader guild={guild} memberCount={members.length} />

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-14 lg:w-48 shrink-0">
          <div className="sticky top-20 space-y-2">
            <GuildSidebar active={section} onChange={setSection} isOfficer={isOfficer} />
            {!isOwner && (
              <Button variant="ghost" size="sm" className="w-full text-[10px] text-destructive hover:text-destructive" onClick={handleLeave} disabled={leaveGuild.isPending}>
                {leaveGuild.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3 mr-1" />}
                <span className="hidden lg:inline">{t("friends.leaveGuild")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
