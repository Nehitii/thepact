import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FriendAvatar } from "./FriendAvatar";
import { MessageSquare, UserX, Ban } from "lucide-react";
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
}

export function FriendProfileDrawer({ open, onClose, friend, onRemove, onBlock }: FriendProfileDrawerProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!friend) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="font-rajdhani w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="font-orbitron tracking-wider text-sm">
            {t("friends.agentProfile")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center gap-4 mt-6">
          <FriendAvatar name={friend.display_name} avatarUrl={friend.avatar_url} size="md" />
          <div className="text-center">
            <h3 className="text-lg font-bold font-orbitron tracking-wide">
              {friend.display_name || t("friends.unknownAgent")}
            </h3>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {t("friends.friendsSince", {
                time: formatDistanceToNow(new Date(friend.created_at), { addSuffix: true })
              })}
            </p>
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
