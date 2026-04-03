import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, Crown, UserX, Loader2, Shield, Trash2, LogOut, MoreVertical, ArrowUp, ArrowDown, ArrowRightLeft, Megaphone, Target, Activity, Link, Settings, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuilds, type Guild } from "@/hooks/useGuilds";
import { useFriends } from "@/hooks/useFriends";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { GuildAnnouncementsPanel } from "./GuildAnnouncementsPanel";
import { GuildGoalsPanel } from "./GuildGoalsPanel";
import { GuildActivityFeedPanel } from "./GuildActivityFeed";
import { GuildInviteCodePanel } from "./GuildInviteCodePanel";
import { GuildSettingsPanel } from "./GuildSettingsPanel";
import { GuildLeaderboard } from "./GuildLeaderboard";

interface GuildDetailPanelProps {
  open: boolean;
  onClose: () => void;
  guild: Guild;
  userId: string;
}

export function GuildDetailPanel({ open, onClose, guild, userId }: GuildDetailPanelProps) {
  const { useGuildMembers, inviteMember, removeMember, deleteGuild, leaveGuild, updateMemberRole, transferOwnership } = useGuilds();
  const { data: members = [], isLoading } = useGuildMembers(guild.id);
  const { friends } = useFriends();
  const { t } = useTranslation();
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("members");

  const isOwner = guild.owner_id === userId;
  const myRole = members.find((m) => m.user_id === userId)?.role || "member";
  const canManage = myRole === "owner" || myRole === "officer";

  const memberIds = new Set(members.map((m) => m.user_id));
  const invitableFriends = friends.filter((f) => !memberIds.has(f.friend_id))
    .filter((f) => !searchQuery || f.display_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleInvite = async (friendId: string) => {
    try {
      await inviteMember.mutateAsync({ guildId: guild.id, inviteeId: friendId });
      toast.success(t("friends.inviteSent"));
    } catch { toast.error(t("friends.inviteFailed")); }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember.mutateAsync({ memberId });
      toast.success(t("friends.memberRemoved"));
    } catch { toast.error(t("friends.memberRemoveFailed")); }
  };

  const handleDelete = async () => {
    if (!confirm(t("friends.deleteGuildConfirm"))) return;
    try {
      await deleteGuild.mutateAsync(guild.id);
      toast.success(t("friends.guildDeleted"));
      onClose();
    } catch { toast.error(t("friends.guildDeleteFailed")); }
  };

  const handlePromote = async (memberId: string) => {
    try { await updateMemberRole.mutateAsync({ memberId, role: "officer" }); toast.success(t("friends.promoted")); }
    catch { toast.error(t("friends.roleFailed")); }
  };

  const handleDemote = async (memberId: string) => {
    try { await updateMemberRole.mutateAsync({ memberId, role: "member" }); toast.success(t("friends.demoted")); }
    catch { toast.error(t("friends.roleFailed")); }
  };

  const handleTransfer = async (member: { user_id: string; id: string; display_name?: string }) => {
    if (!confirm(t("friends.transferConfirm", { name: member.display_name || "?" }))) return;
    try { await transferOwnership.mutateAsync({ guildId: guild.id, newOwnerId: member.user_id }); toast.success(t("friends.ownershipTransferred")); }
    catch { toast.error(t("friends.roleFailed")); }
  };

  const roleIcon = (role: string) => {
    if (role === "owner") return <Crown className="h-3 w-3 text-amber-400" />;
    if (role === "officer") return <Shield className="h-3 w-3 text-blue-400" />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg font-rajdhani max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-orbitron tracking-wider text-lg flex items-center gap-2">
            {guild.name}
            {isOwner && <Crown className="h-4 w-4 text-amber-400" />}
            {guild.is_public && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-mono">{t("friends.public")}</span>}
          </DialogTitle>
        </DialogHeader>

        {guild.description && <p className="text-sm text-muted-foreground">{guild.description}</p>}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
          <TabsList className="w-full grid grid-cols-6 h-8">
            <TabsTrigger value="members" className="text-[10px] px-1"><UserPlus className="h-3 w-3" /></TabsTrigger>
            <TabsTrigger value="announcements" className="text-[10px] px-1"><Megaphone className="h-3 w-3" /></TabsTrigger>
            <TabsTrigger value="goals" className="text-[10px] px-1"><Target className="h-3 w-3" /></TabsTrigger>
            <TabsTrigger value="activity" className="text-[10px] px-1"><Activity className="h-3 w-3" /></TabsTrigger>
            <TabsTrigger value="codes" className="text-[10px] px-1"><Link className="h-3 w-3" /></TabsTrigger>
            {isOwner && <TabsTrigger value="settings" className="text-[10px] px-1"><Settings className="h-3 w-3" /></TabsTrigger>}
          </TabsList>

          <TabsContent value="members" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex-1">
                {t("friends.members")} ({members.length}/{guild.max_members || 25})
              </h4>
              {canManage && (
                <Button size="sm" variant="outline" onClick={() => setShowInvite(!showInvite)} className="text-xs h-7">
                  <UserPlus className="h-3 w-3 mr-1" /> {t("friends.invite")}
                </Button>
              )}
            </div>

            {showInvite && (
              <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
                <Input placeholder={t("friends.searchFriendsInvite")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 text-xs" />
                <ScrollArea className="max-h-32">
                  {invitableFriends.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">{t("friends.noFriendsToInvite")}</p>
                  ) : invitableFriends.map((f) => (
                    <div key={f.friend_id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm">{f.display_name || t("friends.unknownAgent")}</span>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleInvite(f.friend_id)} aria-label={t("friends.invite")}>
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}

            <ScrollArea className="max-h-52">
              {isLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.avatar_url || undefined} />
                        <AvatarFallback className="text-xs font-bold bg-muted">{(m.display_name || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold truncate">{m.display_name}</span>
                          {roleIcon(m.role)}
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.role}</span>
                      </div>
                      {isOwner && m.user_id !== userId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground"><MoreVertical className="h-3.5 w-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-rajdhani">
                            {m.role === "member" && (
                              <DropdownMenuItem onClick={() => handlePromote(m.id)}>
                                <ArrowUp className="h-3.5 w-3.5 mr-2" /> {t("friends.promoteOfficer")}
                              </DropdownMenuItem>
                            )}
                            {m.role === "officer" && (
                              <DropdownMenuItem onClick={() => handleDemote(m.id)}>
                                <ArrowDown className="h-3.5 w-3.5 mr-2" /> {t("friends.demoteToMember")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleTransfer(m)}>
                              <ArrowRightLeft className="h-3.5 w-3.5 mr-2" /> {t("friends.transferOwnership")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRemove(m.id)} className="text-destructive">
                              <UserX className="h-3.5 w-3.5 mr-2" /> {t("common.remove")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="announcements" className="mt-3">
            <GuildAnnouncementsPanel guildId={guild.id} canWrite={canManage} />
          </TabsContent>

          <TabsContent value="goals" className="mt-3">
            <GuildGoalsPanel guildId={guild.id} canManage={canManage} />
          </TabsContent>

          <TabsContent value="activity" className="mt-3">
            <GuildActivityFeedPanel guildId={guild.id} />
          </TabsContent>

          <TabsContent value="codes" className="mt-3">
            <GuildInviteCodePanel guildId={guild.id} canManage={canManage} />
          </TabsContent>

          {isOwner && (
            <TabsContent value="settings" className="mt-3">
              <GuildSettingsPanel guild={guild} onClose={onClose} />
            </TabsContent>
          )}
        </Tabs>

        <div className="flex gap-2 pt-2 border-t border-border">
          {!isOwner && (
            <Button
              variant="outline" size="sm"
              onClick={async () => {
                if (!confirm(t("friends.leaveGuildConfirm"))) return;
                try { await leaveGuild.mutateAsync(guild.id); toast.success(t("friends.leftGuild")); onClose(); }
                catch { toast.error(t("friends.leaveFailed")); }
              }}
              className="flex-1 text-xs font-bold uppercase tracking-wider text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
            >
              <LogOut className="h-3 w-3 mr-1.5" /> {t("friends.leaveGuild")}
            </Button>
          )}
          {isOwner && (
            <Button variant="destructive" size="sm" onClick={handleDelete} className="flex-1 text-xs font-bold uppercase tracking-wider">
              <Trash2 className="h-3 w-3 mr-1.5" /> {t("friends.deleteGuild")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
