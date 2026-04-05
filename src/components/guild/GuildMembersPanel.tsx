import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGuilds, type Guild, type GuildMember } from "@/hooks/useGuilds";
import { useFriends } from "@/hooks/useFriends";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Crown, Shield, User, MoreVertical, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { CyberEmpty } from "@/components/ui/cyber-states";

const roleIcon: Record<string, React.ElementType> = { owner: Crown, officer: Shield, member: User };
const roleColor: Record<string, string> = { owner: "text-yellow-400", officer: "text-amber-400", member: "text-muted-foreground" };

interface Props {
  guild: Guild;
  userId: string;
  isOfficer: boolean;
  isOwner: boolean;
}

export function GuildMembersPanel({ guild, userId, isOfficer, isOwner }: Props) {
  const { t } = useTranslation();
  const { useGuildMembers, removeMember, updateMemberRole, inviteMember } = useGuilds();
  const { data: members = [] } = useGuildMembers(guild.id);
  const { friends } = useFriends();
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");

  const filtered = members.filter((m) =>
    !search || (m.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { owner: 0, officer: 1, member: 2 };
    return (order[a.role] ?? 3) - (order[b.role] ?? 3);
  });

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const invitableFriends = friends.filter((f) => !memberUserIds.has(f.friend_id) && (!inviteSearch || f.display_name?.toLowerCase().includes(inviteSearch.toLowerCase())));

  const handleInvite = async (friendId: string) => {
    try {
      await inviteMember.mutateAsync({ guildId: guild.id, inviteeId: friendId });
      toast.success(t("friends.inviteSent"));
    } catch {
      toast.error(t("friends.inviteFailed"));
    }
  };

  const handleRoleChange = async (member: GuildMember, newRole: string) => {
    try {
      await updateMemberRole.mutateAsync({ memberId: member.id, role: newRole });
      toast.success(newRole === "officer" ? t("friends.promoted") : t("friends.demoted"));
    } catch {
      toast.error(t("friends.roleFailed"));
    }
  };

  const handleKick = async (member: GuildMember) => {
    try {
      await removeMember.mutateAsync({ memberId: member.id });
      toast.success(t("friends.memberRemoved"));
    } catch {
      toast.error(t("friends.memberRemoveFailed"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")} className="pl-8 h-8 text-xs" />
        </div>
        {isOfficer && (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowInvite(!showInvite)}>
            <UserPlus className="h-3.5 w-3.5 mr-1" /> {t("friends.invite")}
          </Button>
        )}
      </div>

      {showInvite && (
        <div className="border border-border/50 rounded-lg p-3 space-y-2 bg-card/30">
          <Input value={inviteSearch} onChange={(e) => setInviteSearch(e.target.value)} placeholder={t("friends.searchFriendsInvite")} className="h-7 text-xs" />
          {invitableFriends.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">{t("friends.noFriendsToInvite")}</p>
          ) : (
            invitableFriends.slice(0, 10).map((f) => (
              <div key={f.friend_id} className="flex items-center justify-between">
                <span className="text-xs">{f.display_name}</span>
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => handleInvite(f.friend_id)}>
                  {t("friends.invite")}
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {sorted.length === 0 ? (
        <CyberEmpty icon={User} title={t("friends.noMembers")} />
      ) : (
        <div className="space-y-1">
          {sorted.map((m) => {
            const RoleIcon = roleIcon[m.role] || User;
            const canManage = isOwner || (isOfficer && m.role === "member");
            const isSelf = m.user_id === userId;

            return (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">{(m.display_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold truncate">{m.display_name}</span>
                    {isSelf && <Badge variant="outline" className="text-[8px] px-1 py-0">YOU</Badge>}
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${roleColor[m.role]}`}>
                  <RoleIcon className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase">{m.role}</span>
                </div>
                {canManage && !isSelf && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      {m.role === "member" && isOwner && (
                        <DropdownMenuItem onClick={() => handleRoleChange(m, "officer")}>{t("friends.promoteOfficer")}</DropdownMenuItem>
                      )}
                      {m.role === "officer" && isOwner && (
                        <DropdownMenuItem onClick={() => handleRoleChange(m, "member")}>{t("friends.demoteToMember")}</DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleKick(m)} className="text-destructive">{t("common.remove")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
