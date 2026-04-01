import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface FriendAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  ring?: "primary" | "violet";
  size?: "sm" | "md";
}

export function FriendAvatar({ name, avatarUrl, ring = "primary", size = "md" }: FriendAvatarProps) {
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
    </div>
  );
}
