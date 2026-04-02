import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FriendAvatar, getOnlineStatus } from "./FriendAvatar";
import { MessageSquare, UserX, Ban, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Friend } from "@/hooks/useFriends";

interface FriendProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  friend: Friend | null;
  onRemove: () => void;
  onBlock: () => void;
  mutualCount?: number;
  lastSeenAt?: string | null;
}

export function FriendProfileDrawer({ open, onClose, friend, onRemove, onBlock, mutualCount, lastSeenAt }: FriendProfileDrawerProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!friend) return null;

  const status = getOnlineStatus(lastSeenAt);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="font-rajdhani w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="font-orbitron tracking-wider text-sm">
            {t("friends.agentProfile")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center gap-4 mt-6">
          <FriendAvatar
            name={friend.display_name}
            avatarUrl={friend.avatar_url}
            size="md"
            lastSeenAt={lastSeenAt}
            showStatus
          />
          <div className="text-center">
            <h3 className="text-lg font-bold font-orbitron tracking-wide">
              {friend.display_name || t("friends.unknownAgent")}
            </h3>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {t("friends.friendsSince", {
                time: formatDistanceToNow(new Date(friend.created_at), { addSuffix: true })
              })}
            </p>
            {/* Online status */}
            <p className="text-[10px] font-mono mt-1">
              {status === "online" ? (
                <span className="text-emerald-400">{t("friends.online")}</span>
              ) : lastSeenAt ? (
                <span className="text-muted-foreground">
                  {t("friends.lastSeenAgo", {
                    time: formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })
                  })}
                </span>
              ) : (
                <span className="text-muted-foreground">{t("friends.offline")}</span>
              )}
            </p>
            {/* Mutual friends */}
            {mutualCount != null && mutualCount > 0 && (
              <p className="text-[10px] text-muted-foreground font-mono mt-1 flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                {t("friends.mutualFriends", { count: mutualCount })}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-8">
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => { navigate(`/inbox/thread/${friend.friend_id}`); onClose(); }}
          >
            <MessageSquare className="h-4 w-4" />
            {t("friends.sendMessage")}
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
            onClick={() => { onBlock(); onClose(); }}
          >
            <Ban className="h-4 w-4" />
            {t("friends.blockUser")}
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => { onRemove(); onClose(); }}
          >
            <UserX className="h-4 w-4" />
            {t("friends.removeFriend")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
