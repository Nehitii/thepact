import { Button } from "@/components/ui/button";
import { DSPanel } from "@/components/ds";
import { AvatarPing, getPingState, type PingState } from "./AvatarPing";
import { MessageSquare, UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface FriendNodeProps {
  index: number;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastSeenAt?: string | null;
  onOpen: () => void;
  onMessage: () => void;
  onRemove: () => void;
}

const PING_LABEL: Record<PingState, string> = {
  online: "● LIVE",
  idle: "◐ IDLE",
  offline: "○ OFFLINE",
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
}: FriendNodeProps) {
  const { t } = useTranslation();
  const ping = getPingState(lastSeenAt);
  const id = `AGT.${String(index + 1).padStart(3, "0")}`;
  const since = formatDistanceToNow(new Date(createdAt), { addSuffix: false });

  return (
    <DSPanel
      tier="secondary"
      className={cn(
        "!p-0 group cursor-pointer transition-transform duration-200",
        "hover:-translate-y-px hover:border-[hsl(var(--ds-accent-primary)/0.45)]",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={t("friends.viewProfile", { name: displayName || t("friends.unknownAgent") })}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className="relative flex items-center gap-3 p-3 sm:p-4"
      >
        {/* Top-right ID */}
        <span className="absolute top-1.5 right-3 font-mono text-[8px] tracking-[0.18em] text-[hsl(var(--ds-text-muted)/0.6)]">
          [{id}]
        </span>

        <AvatarPing
          name={displayName}
          avatarUrl={avatarUrl}
          state={ping}
          size="md"
          showRing
        />

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-[hsl(var(--ds-text-primary))]">
            {displayName || t("friends.unknownAgent")}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="font-mono text-[9px] uppercase tracking-[0.18em]"
              style={{ color: `hsl(${PING_COLOR_VAR[ping]})` }}
            >
              {PING_LABEL[ping]}
            </span>
            <span className="font-mono text-[9px] text-[hsl(var(--ds-text-muted)/0.6)]">·</span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--ds-text-muted))]">
              {t("friends.allyFor", { defaultValue: "ally for" })} {since}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-[hsl(var(--ds-text-muted))] hover:text-[hsl(var(--ds-accent-special))] hover:bg-[hsl(var(--ds-accent-special)/0.1)]"
            onClick={onMessage}
            aria-label={t("friends.sendMessage")}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-[hsl(var(--ds-text-muted))] hover:text-[hsl(var(--ds-accent-critical))] hover:bg-[hsl(var(--ds-accent-critical)/0.1)]"
            onClick={onRemove}
            aria-label={t("friends.removeFriend")}
          >
            <UserX className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DSPanel>
  );
}
