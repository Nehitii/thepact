import { Button } from "@/components/ui/button";
import { AvatarPing, getPingState, type PingState } from "./AvatarPing";
import { MessageSquare, UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { AllianceDensity } from "@/hooks/useAllianceDensity";

interface FriendNodeProps {
  index: number;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastSeenAt?: string | null;
  onOpen: () => void;
  onMessage: () => void;
  onRemove: () => void;
  density?: AllianceDensity;
}

const PING_LABEL: Record<PingState, string> = {
  online: "LIVE",
  idle: "IDLE",
  offline: "OFFLINE",
};

const PING_COLOR_VAR: Record<PingState, string> = {
  online: "var(--ds-accent-success)",
  idle: "var(--ds-accent-warning)",
  offline: "var(--ds-text-muted)",
};

export function FriendNode({
  index,
  displayName,
  avatarUrl,
  createdAt,
  lastSeenAt,
  onOpen,
  onMessage,
  onRemove,
  density = "comfortable",
}: FriendNodeProps) {
  const { t } = useTranslation();
  const ping = getPingState(lastSeenAt);
  const since = formatDistanceToNow(new Date(createdAt), { addSuffix: false });
  const isCompact = density === "compact";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("friends.viewProfile", { name: displayName || t("friends.unknownAgent") })}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={cn(
        "group relative flex items-center cursor-pointer",
        isCompact ? "gap-3 px-2.5 py-2" : "gap-4 px-3 py-3.5",
        "border-b border-[hsl(var(--ds-border-default)/0.1)] last:border-b-0",
        "transition-colors duration-200 hover:bg-[hsl(var(--ds-surface-2)/0.4)]",
      )}
    >
      <AvatarPing
        name={displayName}
        avatarUrl={avatarUrl}
        state={ping}
        size={isCompact ? "sm" : "md"}
        showRing={ping === "online"}
      />

      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-medium font-orbitron tracking-wide truncate text-[hsl(var(--ds-text-primary))]",
            isCompact ? "text-[13px]" : "text-[15px]"
          )}
        >
          {displayName || t("friends.unknownAgent")}
        </h3>
        <div className={cn("flex items-center gap-2", isCompact ? "mt-0.5" : "mt-1")}>
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: `hsl(${PING_COLOR_VAR[ping]})` }}
          >
            <span
              className="h-1 w-1 rounded-full"
              style={{ background: `hsl(${PING_COLOR_VAR[ping]})` }}
            />
            {PING_LABEL[ping]}
          </span>
          {!isCompact && (
            <>
              <span className="font-mono text-[9px] text-[hsl(var(--ds-text-muted)/0.4)]">/</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--ds-text-muted)/0.7)]">
                {since}
              </span>
            </>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex items-center transition-opacity duration-200",
          isCompact ? "gap-0.5 opacity-60 group-hover:opacity-100" : "gap-1 opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "text-[hsl(var(--ds-text-muted))] hover:text-[hsl(var(--ds-accent-special))] hover:bg-transparent",
            isCompact ? "h-7 w-7" : "h-8 w-8"
          )}
          onClick={onMessage}
          aria-label={t("friends.sendMessage")}
        >
          <MessageSquare className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "text-[hsl(var(--ds-text-muted))] hover:text-[hsl(var(--ds-accent-critical))] hover:bg-transparent",
            isCompact ? "h-7 w-7" : "h-8 w-8"
          )}
          onClick={onRemove}
          aria-label={t("friends.removeFriend")}
        >
          <UserX className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </Button>
      </div>
    </div>
  );
}
