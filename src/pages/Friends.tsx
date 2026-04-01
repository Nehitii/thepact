import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriends";
import { useGuilds } from "@/hooks/useGuilds";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, Clock, Search, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { FriendsTab } from "@/components/friends/FriendsTab";
import { RequestsTab } from "@/components/friends/RequestsTab";
import { SearchTab } from "@/components/friends/SearchTab";
import { GuildsTab } from "@/components/friends/GuildsTab";
import type { LucideIcon } from "lucide-react";

export default function Friends() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("friends");

  const {
    friends, pendingRequests, sentRequests, friendsLoading, requestsLoading,
    pendingCount, sendRequest, acceptRequest, declineRequest, removeFriend,
    getFriendshipStatus, searchProfiles,
  } = useFriends();

  const { guilds, guildsLoading, invites, createGuild, respondToInvite } = useGuilds();

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden font-rajdhani">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 md:p-8 relative z-10 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-violet-500 rounded-xl blur opacity-25 group-hover:opacity-60 transition duration-500" />
              <div className="relative w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center shadow-2xl">
                <Users className="h-7 w-7 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black font-orbitron text-foreground tracking-widest uppercase">
                Friends
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-mono tracking-widest uppercase opacity-70">
                  {t("friends.networkActive")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-card/80 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" aria-hidden="true" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <TabsList className="bg-transparent p-0 gap-6 h-auto">
                <FriendsTabItem value="friends" icon={UserCheck} label={t("friends.tabFriends")} count={friends.length} active={activeTab === "friends"} />
                <FriendsTabItem value="requests" icon={Clock} label={t("friends.tabRequests")} count={pendingCount} active={activeTab === "requests"} color="violet" />
                <FriendsTabItem value="guilds" icon={Shield} label={t("friends.tabGuilds")} count={guilds.length} active={activeTab === "guilds"} />
                <FriendsTabItem value="search" icon={Search} label={t("friends.tabSearch")} active={activeTab === "search"} />
              </TabsList>
            </div>

            <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-transparent to-muted/30">
              <TabsContent value="friends" className="h-full m-0 data-[state=inactive]:hidden">
                <FriendsTab
                  friends={friends}
                  loading={friendsLoading}
                  onRemove={async (id) => { await removeFriend.mutateAsync(id); }}
                  userId={user.id}
                />
              </TabsContent>

              <TabsContent value="requests" className="h-full m-0 data-[state=inactive]:hidden">
                <RequestsTab
                  pendingRequests={pendingRequests}
                  sentRequests={sentRequests}
                  loading={requestsLoading}
                  onAccept={async (id) => { await acceptRequest.mutateAsync(id); }}
                  onDecline={async (id) => { await declineRequest.mutateAsync(id); }}
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

// --- Typed TabItem ---
interface FriendsTabItemProps {
  value: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  active: boolean;
  color?: "primary" | "violet";
}

function FriendsTabItem({ value, icon: Icon, label, count, active, color = "primary" }: FriendsTabItemProps) {
  const colorStyles = {
    primary: { border: "border-primary", text: "text-primary", bg: "bg-primary", glow: "bg-primary" },
    violet: { border: "border-violet-500", text: "text-violet-400", bg: "bg-violet-500", glow: "bg-violet-500" },
  };
  const c = colorStyles[color];

  return (
    <TabsTrigger
      value={value}
      className={cn(
        "relative flex items-center gap-3 pb-3 pt-2 px-1 rounded-none border-b-2 border-transparent transition-all duration-300 group data-[state=active]:bg-transparent",
        active ? `${c.border} ${c.text}` : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4", active && "animate-pulse")} />
      <span className={cn("text-sm font-orbitron tracking-wider", active && "font-bold")}>{label}</span>
      {count != null && count > 0 && (
        <span className={cn(
          "ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm min-w-[20px]",
          active ? `${c.bg} text-black` : "bg-muted text-muted-foreground",
        )}>
          {count}
        </span>
      )}
      {active && <div className={cn("absolute bottom-0 left-0 right-0 h-[2px] blur-[4px]", c.glow)} />}
    </TabsTrigger>
  );
}
