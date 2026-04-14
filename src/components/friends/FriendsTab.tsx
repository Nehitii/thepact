import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, UserX, Search, Users } from "lucide-react";
import { FriendAvatar } from "./FriendAvatar";
import { RemoveFriendDialog } from "./RemoveFriendDialog";
import { BlockConfirmDialog } from "./BlockConfirmDialog";
import { FriendProfileDrawer } from "./FriendProfileDrawer";
import { CyberLoader, CyberEmpty } from "@/components/ui/cyber-states";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useMutualFriends } from "@/hooks/useMutualFriends";
import type { Friend } from "@/hooks/useFriends";

interface FriendsTabProps {
  friends: Friend[];
  loading: boolean;
  onRemove: (friendshipId: string) => Promise<void>;
  userId: string;
  onSwitchToSearch?: () => void;
}

export function FriendsTab({ friends, loading, onRemove, userId, onSwitchToSearch }: FriendsTabProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getMutualCount } = useMutualFriends();
  const [filter, setFilter] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Friend | null>(null);
  const [blockTarget, setBlockTarget] = useState<Friend | null>(null);
  const [profileTarget, setProfileTarget] = useState<Friend | null>(null);
  const [mutualCounts, setMutualCounts] = useState<Record<string, number>>({});
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!friends.length) return;
    const ids = friends.map((f) => f.friend_id);
    supabase
      .from("profiles")
      .select("id, last_seen_at")
      .in("id", ids)
      .then(({ data }) => {
        const map: Record<string, string | null> = {};
        data?.forEach((p: any) => { map[p.id] = p.last_seen_at; });
        setLastSeenMap(map);
      });
  }, [friends]);

  const filtered = filter
    ? friends.filter((f) => f.display_name?.toLowerCase().includes(filter.toLowerCase()))
    : friends;

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await onRemove(removeTarget.friendship_id);
      toast.success(t("friends.friendRemoved"));
    } catch {
      toast.error(t("friends.removeFailed"));
    }
    setRemoveTarget(null);
  };

  const handleBlockConfirmed = async () => {
    if (!blockTarget) return;
    try {
      await supabase.from("blocked_users").insert({ user_id: userId, blocked_user_id: blockTarget.friend_id });
      await onRemove(blockTarget.friendship_id);
      toast.success(t("friends.userBlocked"));
    } catch {
      toast.error(t("friends.blockFailed"));
    }
    setBlockTarget(null);
  };

  const handleOpenProfile = async (friend: Friend) => {
    setProfileTarget(friend);
    if (!(friend.friend_id in mutualCounts)) {
      const count = await getMutualCount(friend.friend_id);
      setMutualCounts((prev) => ({ ...prev, [friend.friend_id]: count }));
    }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 max-w-3xl mx-auto">
        {friends.length > 5 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("friends.filterFriends")}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 bg-muted/50 border-border font-rajdhani h-9"
            />
          </div>
        )}

        {loading ? (
          <CyberLoader rows={3} label={t("common.loading")} />
        ) : filtered.length === 0 ? (
          <CyberEmpty
            icon={Users}
            title={filter ? t("friends.noMatchingFriends") : t("friends.noFriendsTitle")}
            subtitle={filter ? t("friends.tryDifferentSearch") : t("friends.noFriendsDesc")}
            action={!filter && onSwitchToSearch ? { label: t("friends.tabSearch"), onClick: onSwitchToSearch } : undefined}
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filtered.map((friend, i) => (
              <motion.div
                key={friend.friendship_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/30 transition-all duration-300 cursor-pointer"
                onClick={() => handleOpenProfile(friend)}
                role="button"
                tabIndex={0}
                aria-label={t("friends.viewProfile", { name: friend.display_name || t("friends.unknownAgent") })}
                onKeyDown={(e) => e.key === "Enter" && handleOpenProfile(friend)}
              >
                <FriendAvatar
                  name={friend.display_name}
                  avatarUrl={friend.avatar_url}
                  lastSeenAt={lastSeenMap[friend.friend_id]}
                  showStatus
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-foreground">
                    {friend.display_name || t("friends.unknownAgent")}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {t("friends.friendsSince", {
                      time: formatDistanceToNow(new Date(friend.created_at), { addSuffix: true })
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10"
                    onClick={() => navigate(`/inbox/thread/${friend.friend_id}`)}
                    aria-label={t("friends.sendMessage")}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setRemoveTarget(friend)}
                    aria-label={t("friends.removeFriend")}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <RemoveFriendDialog
        open={!!removeTarget}
        friendName={removeTarget?.display_name || ""}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      <BlockConfirmDialog
        open={!!blockTarget}
        friendName={blockTarget?.display_name || ""}
        onConfirm={handleBlockConfirmed}
        onCancel={() => setBlockTarget(null)}
      />

      <FriendProfileDrawer
        open={!!profileTarget}
        onClose={() => setProfileTarget(null)}
        friend={profileTarget}
        onRemove={() => { setRemoveTarget(profileTarget); setProfileTarget(null); }}
        onBlock={() => { setBlockTarget(profileTarget); setProfileTarget(null); }}
        mutualCount={profileTarget ? mutualCounts[profileTarget.friend_id] : undefined}
        lastSeenAt={profileTarget ? lastSeenMap[profileTarget.friend_id] : undefined}
      />
    </ScrollArea>
  );
}
