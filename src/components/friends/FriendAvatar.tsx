import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface FriendAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  ring?: "primary" | "violet";
  size?: "sm" | "md";
  lastSeenAt?: string | null;
  showStatus?: boolean;
}

function getOnlineStatus(lastSeenAt?: string | null): "online" | "idle" | "offline" {
  if (!lastSeenAt) return "offline";
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < 5 * 60 * 1000) return "online"; // 5 min
  if (diff < 30 * 60 * 1000) return "idle"; // 30 min
  return "offline";
}

export function FriendAvatar({ name, avatarUrl, ring = "primary", size = "md", lastSeenAt, showStatus = false }: FriendAvatarProps) {
  const status = getOnlineStatus(lastSeenAt);

  return (
    <div className="relative shrink-0">
      <Avatar className={cn(
        "border-2",
        size === "sm" ? "h-8 w-8" : "h-12 w-12",
        ring === "violet" ? "border-violet-500/50" : "border-primary/30"
      )}>
        <AvatarImage src={avatarUrl || undefined} className="object-cover" />
        <AvatarFallback className="bg-muted text-primary font-orbitron text-sm">
          {name?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full border-2 border-background",
            size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
            status === "online" && "bg-emerald-500",
            status === "idle" && "bg-amber-400",
            status === "offline" && "bg-muted-foreground/40",
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export { getOnlineStatus };
