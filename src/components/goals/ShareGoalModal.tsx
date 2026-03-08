import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link2, Loader2, Check } from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { useSharedGoals } from "@/hooks/useSharedGoals";
import { toast } from "sonner";

interface ShareGoalModalProps {
  open: boolean;
  onClose: () => void;
  goalId: string;
  goalName: string;
}

export function ShareGoalModal({ open, onClose, goalId, goalName }: ShareGoalModalProps) {
  const { friends } = useFriends();
  const { sentSharedGoals, shareGoal } = useSharedGoals();
  const [sharing, setSharing] = useState<string | null>(null);

  const alreadySharedWith = new Set(
    sentSharedGoals.filter((s) => s.goal_id === goalId).map((s) => s.shared_with_id)
  );

  const handleShare = async (friendId: string) => {
    setSharing(friendId);
    try {
      await shareGoal.mutateAsync({ goalId, friendId });
      toast.success("Goal shared!");
    } catch {
      toast.error("Failed to share goal");
    } finally {
      setSharing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md font-rajdhani">
        <DialogHeader>
          <DialogTitle className="font-orbitron tracking-wider text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5 text-cyan-400" />
            Share Goal
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Share "<span className="text-foreground font-bold">{goalName}</span>" with a friend. They'll see it as read-only.
        </p>
        <ScrollArea className="max-h-72">
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No friends to share with</p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => {
                const isShared = alreadySharedWith.has(friend.friend_id);
                return (
                  <div key={friend.friend_id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback className="text-xs font-bold bg-muted">{(friend.display_name || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-bold truncate">{friend.display_name || "Unknown"}</span>
                    {isShared ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono uppercase">
                        <Check className="h-3 w-3" /> Shared
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        disabled={sharing === friend.friend_id}
                        onClick={() => handleShare(friend.friend_id)}
                      >
                        {sharing === friend.friend_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Share"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
