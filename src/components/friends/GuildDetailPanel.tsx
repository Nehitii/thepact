import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { UserPlus, Crown, UserX, Loader2, Shield, Search, Trash2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuilds, type Guild, type GuildMember } from "@/hooks/useGuilds";
import { useFriends } from "@/hooks/useFriends";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface GuildDetailPanelProps {
  open: boolean;
  onClose: () => void;
  guild: Guild;
  userId: string;
}

export function GuildDetailPanel({ open, onClose, guild, userId }: GuildDetailPanelProps) {
  const { useGuildMembers, inviteMember, removeMember, deleteGuild, leaveGuild } = useGuilds();
  const { data: members = [], isLoading } = useGuildMembers(guild.id);
  const { friends } = useFriends();
  const { t } = useTranslation();
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isOwner = guild.owner_id === userId;
  const myRole = members.find((m) => m.user_id === userId)?.role || "member";
  const canManage = myRole === "owner" || myRole === "officer";

  const memberIds = new Set(members.map((m) => m.user_id));
  const invitableFriends = friends.filter((f) => !memberIds.has(f.friend_id))
    .filter((f) => !searchQuery || f.display_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleInvite = async (friendId: string) => {
    try {
      await inviteMember.mutateAsync({ guildId: guild.id, inviteeId: friendId });
      toast.success("Invite sent!");
    } catch {
      toast.error("Failed to invite");
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember.mutateAsync({ memberId });
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this guild? This cannot be undone.")) return;
    try {
      await deleteGuild.mutateAsync(guild.id);
      toast.success("Guild deleted");
      onClose();
    } catch {
      toast.error("Failed to delete guild");
    }
  };

  const roleIcon = (role: string) => {
    if (role === "owner") return <Crown className="h-3 w-3 text-amber-400" />;
    if (role === "officer") return <Shield className="h-3 w-3 text-blue-400" />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md font-rajdhani">
        <DialogHeader>
          <DialogTitle className="font-orbitron tracking-wider text-lg flex items-center gap-2">
            {guild.name}
            {isOwner && <Crown className="h-4 w-4 text-amber-400" />}
          </DialogTitle>
        </DialogHeader>

        {guild.description && (
          <p className="text-sm text-muted-foreground">{guild.description}</p>
        )}

        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex-1">
            Members ({members.length})
          </h4>
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => setShowInvite(!showInvite)} className="text-xs h-7">
              <UserPlus className="h-3 w-3 mr-1" /> Invite
            </Button>
          )}
        </div>

        {showInvite && (
          <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs"
            />
            <ScrollArea className="max-h-32">
              {invitableFriends.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No friends to invite</p>
              ) : (
                invitableFriends.map((f) => (
                  <div key={f.friend_id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{f.display_name || "Unknown"}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleInvite(f.friend_id)}>
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        )}

        <ScrollArea className="max-h-60">
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
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(m.id)}>
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {isOwner && (
          <Button variant="destructive" size="sm" onClick={handleDelete} className="w-full text-xs font-bold uppercase tracking-wider">
            <Trash2 className="h-3 w-3 mr-1.5" /> Delete Guild
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
