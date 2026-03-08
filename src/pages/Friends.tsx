import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriends";
import { useGuilds } from "@/hooks/useGuilds";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, UserPlus, UserCheck, UserX, Search, MessageSquare, Clock, X, Loader2, Shield, Plus,
} from "lucide-react";
import { GuildCard } from "@/components/friends/GuildCard";
import { GuildCreateModal } from "@/components/friends/GuildCreateModal";
import { GuildDetailPanel } from "@/components/friends/GuildDetailPanel";
import { GuildInviteCard } from "@/components/friends/GuildInviteCard";
import type { Guild } from "@/hooks/useGuilds";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [guildCreateOpen, setGuildCreateOpen] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);

  const {
    friends,
    pendingRequests,
    friendsLoading,
    requestsLoading,
    pendingCount,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    getFriendshipStatus,
    searchProfiles,
  } = useFriends();

  const {
    guilds, guildsLoading, invites,
    createGuild, respondToInvite,
  } = useGuilds();

  if (!user) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchProfiles(searchQuery);
      setSearchResults(results);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      await sendRequest.mutateAsync(receiverId);
      toast.success("Friend request sent!");
      setSearchResults((prev) => prev.filter((p) => p.id !== receiverId));
    } catch {
      toast.error("Could not send request");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden font-rajdhani">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
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
                  Social Network Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-card/80 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            {/* Tabs Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <TabsList className="bg-transparent p-0 gap-6 h-auto">
                <TabItem value="friends" icon={UserCheck} label="Friends" count={friends.length} active={activeTab === "friends"} />
                <TabItem value="requests" icon={Clock} label="Requests" count={pendingCount} active={activeTab === "requests"} color="violet" />
                <TabItem value="guilds" icon={Shield} label="Guilds" count={guilds.length} active={activeTab === "guilds"} />
                <TabItem value="search" icon={Search} label="Search" active={activeTab === "search"} />
              </TabsList>
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-transparent to-muted/30">
              <AnimatePresence mode="wait">
                {/* Friends List */}
                <TabsContent value="friends" className="h-full m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="p-6 max-w-3xl mx-auto">
                      {friendsLoading ? (
                        <SkeletonList />
                      ) : friends.length === 0 ? (
                        <EmptyState
                          icon={Users}
                          title="No friends yet"
                          desc="Search for members and send friend requests to get started."
                        />
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                          {friends.map((friend, i) => (
                            <motion.div
                              key={friend.friendship_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="group relative flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/30 transition-all duration-300"
                            >
                              <UserAvatar name={friend.display_name} avatarUrl={friend.avatar_url} />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-foreground">
                                  {friend.display_name || "Unknown Agent"}
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  Friends since {formatDistanceToNow(new Date(friend.created_at), { addSuffix: true })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10"
                                  onClick={() => navigate(`/inbox/thread/${friend.friend_id}`)}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeFriend.mutate(friend.friendship_id)}
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Requests */}
                <TabsContent value="requests" className="h-full m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="p-6 max-w-3xl mx-auto">
                      {requestsLoading ? (
                        <SkeletonList />
                      ) : pendingRequests.length === 0 ? (
                        <EmptyState
                          icon={Clock}
                          title="No pending requests"
                          desc="You're all caught up — no friend requests waiting."
                          color="text-violet-500/40"
                        />
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                          {pendingRequests.map((req, i) => (
                            <motion.div
                              key={req.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-4 p-4 rounded-xl border border-violet-500/30 bg-violet-500/5"
                            >
                              <UserAvatar
                                name={req.sender_profile?.display_name}
                                avatarUrl={req.sender_profile?.avatar_url}
                                ring="violet"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-foreground">
                                  {req.sender_profile?.display_name || "Unknown Agent"}
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => acceptRequest.mutate(req.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider h-8"
                                >
                                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => declineRequest.mutate(req.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs font-bold uppercase tracking-wider h-8"
                                >
                                  <X className="h-3.5 w-3.5 mr-1.5" />
                                  Decline
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Search */}
                <TabsContent value="search" className="h-full m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="p-6 max-w-3xl mx-auto">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search members by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="pl-10 bg-muted/50 border-border font-rajdhani"
                          />
                        </div>
                        <Button
                          onClick={handleSearch}
                          disabled={searching || !searchQuery.trim()}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider text-xs"
                        >
                          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                      </div>

                      {searchResults.length === 0 ? (
                        <EmptyState
                          icon={Search}
                          title="Find new allies"
                          desc="Search for other members by their display name to send a friend request."
                        />
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                          {searchResults.map((profile, i) => {
                            const status = getFriendshipStatus(profile.id);
                            return (
                              <motion.div
                                key={profile.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                              >
                                <UserAvatar name={profile.display_name} avatarUrl={profile.avatar_url} />
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-foreground">
                                    {profile.display_name || "Unknown"}
                                  </h3>
                                </div>
                                {status === "none" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendRequest(profile.id)}
                                    disabled={sendRequest.isPending}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider h-8"
                                  >
                                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                    Add Friend
                                  </Button>
                                )}
                                {status === "pending_sent" && (
                                  <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                                    Request Sent
                                  </span>
                                )}
                                {status === "pending_received" && (
                                  <span className="text-xs text-violet-400 font-mono uppercase tracking-wider">
                                    Wants to be friends
                                  </span>
                                )}
                                {status === "accepted" && (
                                  <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                                    <UserCheck className="h-3.5 w-3.5" /> Friends
                                  </span>
                                )}
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Guilds */}
                <TabsContent value="guilds" className="h-full m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="p-6 max-w-3xl mx-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black font-orbitron uppercase tracking-widest text-muted-foreground">Your Guilds</h3>
                        <Button size="sm" onClick={() => setGuildCreateOpen(true)} className="text-xs font-bold uppercase tracking-wider h-8">
                          <Plus className="h-3.5 w-3.5 mr-1" /> Create
                        </Button>
                      </div>

                      {invites.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">Pending Invites</h4>
                          {invites.map((inv) => (
                            <GuildInviteCard
                              key={inv.id}
                              invite={inv}
                              onAccept={() => respondToInvite.mutate({ inviteId: inv.id, guildId: inv.guild_id, accept: true })}
                              onDecline={() => respondToInvite.mutate({ inviteId: inv.id, guildId: inv.guild_id, accept: false })}
                            />
                          ))}
                        </div>
                      )}

                      {guildsLoading ? (
                        <SkeletonList />
                      ) : guilds.length === 0 ? (
                        <EmptyState icon={Shield} title="No guilds yet" desc="Create a guild and invite your friends to join forces." />
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                          {guilds.map((guild, i) => (
                            <motion.div key={guild.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                              <GuildCard guild={guild} isOwner={guild.owner_id === user.id} onClick={() => setSelectedGuild(guild)} />
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </AnimatePresence>

              {/* Guild modals */}
              <GuildCreateModal
                open={guildCreateOpen}
                onClose={() => setGuildCreateOpen(false)}
                onCreate={async (data) => { await createGuild.mutateAsync(data); }}
                loading={createGuild.isPending}
              />
              {selectedGuild && (
                <GuildDetailPanel
                  open={!!selectedGuild}
                  onClose={() => setSelectedGuild(null)}
                  guild={selectedGuild}
                  userId={user.id}
                />
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

const TabItem = ({ value, icon: Icon, label, count, active, color = "primary" }: any) => (
  <TabsTrigger
    value={value}
    className={cn(
      "relative flex items-center gap-3 pb-3 pt-2 px-1 rounded-none border-b-2 border-transparent transition-all duration-300 group data-[state=active]:bg-transparent",
      active ? `border-${color} text-${color}` : "text-muted-foreground hover:text-foreground",
    )}
  >
    <Icon className={cn("h-4 w-4", active && "animate-pulse")} />
    <span className={cn("text-sm font-orbitron tracking-wider", active && "font-bold")}>{label}</span>
    {count != null && count > 0 && (
      <span
        className={cn(
          "ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm min-w-[20px]",
          active ? `bg-${color} text-black` : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    )}
    {active && (
      <div className={cn("absolute bottom-0 left-0 right-0 h-[2px] blur-[4px]", color === "violet" ? "bg-violet-500" : "bg-primary")} />
    )}
  </TabsTrigger>
);

const UserAvatar = ({ name, avatarUrl, ring = "primary" }: { name?: string | null; avatarUrl?: string | null; ring?: string }) => (
  <div className="relative shrink-0">
    <Avatar className={cn("h-12 w-12 border-2", ring === "violet" ? "border-violet-500/50" : "border-primary/30")}>
      <AvatarImage src={avatarUrl || undefined} className="object-cover" />
      <AvatarFallback className="bg-muted text-primary font-orbitron text-sm">
        {name?.[0]?.toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
  </div>
);

const SkeletonList = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-20 w-full bg-muted/30 rounded-lg animate-pulse border border-border/50" />
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, title, desc, color = "text-primary/40" }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="w-24 h-24 rounded-full bg-muted/30 border border-border flex items-center justify-center mb-6">
      <Icon className={cn("h-10 w-10", color)} />
    </div>
    <h3 className="text-xl font-orbitron font-bold text-foreground mb-2 tracking-wide">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto font-rajdhani">{desc}</p>
  </motion.div>
);
