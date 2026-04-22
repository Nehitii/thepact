import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriends";
import { useGuilds } from "@/hooks/useGuilds";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UserCheck, Clock, Search, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { DSCornerBrackets, DSDataNoise } from "@/components/ds";
import { supabase } from "@/integrations/supabase/client";

import { FriendsTab } from "@/components/friends/FriendsTab";
import { RequestsTab } from "@/components/friends/RequestsTab";
import { SearchTab } from "@/components/friends/SearchTab";
import { GuildsTab } from "@/components/friends/GuildsTab";
import { AllianceInsightStrip } from "@/components/friends/AllianceInsightStrip";
import { AllianceTabs } from "@/components/friends/AllianceTabs";

export default function Friends() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("friends");
  const [onlineCount, setOnlineCount] = useState(0);

  const {
    friends, pendingRequests, sentRequests, friendsLoading, requestsLoading,
    pendingCount, sendRequest, acceptRequest, declineRequest, removeFriend,
    cancelSentRequest, getFriendshipStatus, searchProfiles,
  } = useFriends();

  const { guilds, guildsLoading, invites, createGuild, respondToInvite } = useGuilds();

  // Compute online allies count for the InsightStrip
  useEffect(() => {
    if (!friends.length) {
      setOnlineCount(0);
      return;
    }
    const ids = friends.map((f) => f.friend_id);
    let cancelled = false;
    supabase
      .from("profiles")
      .select("id, last_seen_at")
      .in("id", ids)
      .then(({ data }) => {
        if (cancelled) return;
        const now = Date.now();
        const c = (data ?? []).filter((p: any) => {
          if (!p.last_seen_at) return false;
          return now - new Date(p.last_seen_at).getTime() < 5 * 60 * 1000;
        }).length;
        setOnlineCount(c);
      });
    return () => { cancelled = true; };
  }, [friends]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden font-rajdhani">
      {/* Ambient data noise — replaces heavy blur orbs */}
      <DSDataNoise count={12} />

      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 md:px-8 relative z-10">
        <ModuleHeader
          systemLabel="ALLIANCE_GRID // SYS.ACTIVE"
          title="FRIEN"
          titleAccent="DS"
          badges={[
            { label: "ALLIES", value: friends.length, color: "#5BB4FF" },
            ...(pendingCount > 0 ? [{ label: "PENDING", value: pendingCount, color: "#9D5BFF" }] : []),
          ]}
        />

        {/* Main Shell — DS canonical */}
        <div className="flex-1 flex flex-col min-h-0 relative bg-[hsl(var(--ds-surface-1)/0.55)] border border-[hsl(var(--ds-border-default)/0.25)] rounded-sm overflow-hidden shadow-2xl">
          <DSCornerBrackets size={16} color="hsl(var(--ds-accent-primary) / 0.6)" />

          {/* Top hairline */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(to right, transparent, hsl(var(--ds-accent-primary) / 0.5), transparent)" }}
            aria-hidden="true"
          />

          <AllianceInsightStrip
            alliesCount={friends.length}
            onlineCount={onlineCount}
            pendingCount={pendingCount}
            guildsCount={guilds.length}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            <AllianceTabs
              activeTab={activeTab}
              items={[
                { value: "friends", icon: UserCheck, label: t("friends.tabFriends"), count: friends.length, accent: "primary" },
                { value: "requests", icon: Clock, label: t("friends.tabRequests"), count: pendingCount, accent: "special" },
                { value: "guilds", icon: Shield, label: t("friends.tabGuilds"), count: guilds.length, accent: "warning" },
                { value: "search", icon: Search, label: t("friends.tabSearch"), accent: "primary" },
              ]}
            />

            <div className="flex-1 relative overflow-hidden">
              <TabsContent value="friends" className="h-full m-0 data-[state=inactive]:hidden">
                <FriendsTab
                  friends={friends}
                  loading={friendsLoading}
                  onRemove={async (id) => { await removeFriend.mutateAsync(id); }}
                  userId={user.id}
                  onSwitchToSearch={() => setActiveTab("search")}
                />
              </TabsContent>

              <TabsContent value="requests" className="h-full m-0 data-[state=inactive]:hidden">
                <RequestsTab
                  pendingRequests={pendingRequests}
                  sentRequests={sentRequests}
                  loading={requestsLoading}
                  onAccept={async (id) => { await acceptRequest.mutateAsync(id); }}
                  onDecline={async (id) => { await declineRequest.mutateAsync(id); }}
                  onCancelSent={async (id) => { await cancelSentRequest.mutateAsync(id); }}
                />
              </TabsContent>

              <TabsContent value="search" className="h-full m-0 data-[state=inactive]:hidden">
                <SearchTab
                  onSearch={searchProfiles}
                  onSendRequest={async (id) => { await sendRequest.mutateAsync(id); }}
                  sendingRequest={sendRequest.isPending}
                  getFriendshipStatus={getFriendshipStatus}
                />
              </TabsContent>

              <TabsContent value="guilds" className="h-full m-0 data-[state=inactive]:hidden">
                <GuildsTab
                  guilds={guilds}
                  guildsLoading={guildsLoading}
                  invites={invites}
                  userId={user.id}
                  createGuild={createGuild}
                  respondToInvite={respondToInvite}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
