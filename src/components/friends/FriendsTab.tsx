import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { RemoveFriendDialog } from "./RemoveFriendDialog";
import { BlockConfirmDialog } from "./BlockConfirmDialog";
import { FriendProfileDrawer } from "./FriendProfileDrawer";
import { FriendNode } from "./FriendNode";
import { CyberLoader, CyberEmpty } from "@/components/ui/cyber-states";
import { motion } from "framer-motion";
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
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        {friends.length > 5 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--ds-text-muted))]" />
            <Input
              placeholder={t("friends.filterFriends")}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 bg-[hsl(var(--ds-surface-2)/0.5)] border-[hsl(var(--ds-border-default)/0.3)] font-mono uppercase tracking-wider text-xs h-9"
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
            {filtered.map((friend, i) => (
              <motion.div
                key={friend.friendship_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <FriendNode
                  index={i}
                  displayName={friend.display_name}
                  avatarUrl={friend.avatar_url}
                  createdAt={friend.created_at}
                  lastSeenAt={lastSeenMap[friend.friend_id]}
                  onOpen={() => handleOpenProfile(friend)}
                  onMessage={() => navigate(`/inbox/thread/${friend.friend_id}`)}
                  onRemove={() => setRemoveTarget(friend)}
                />
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
