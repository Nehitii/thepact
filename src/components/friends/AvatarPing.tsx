import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type PingState = "online" | "idle" | "offline";

interface AvatarPingProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  state?: PingState;
  showRing?: boolean;
  showBadge?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { wrap: "h-9 w-9", avatar: "h-9 w-9", ring: 40, badge: "text-[7px] px-1 py-[1px]" },
  md: { wrap: "h-12 w-12", avatar: "h-12 w-12", ring: 52, badge: "text-[8px] px-1 py-[1px]" },
  lg: { wrap: "h-16 w-16", avatar: "h-16 w-16", ring: 68, badge: "text-[8px] px-1 py-[1px]" },
};

const STATE_COLOR: Record<PingState, string> = {
  online: "var(--ds-accent-success)",
  idle: "var(--ds-accent-warning)",
  offline: "var(--ds-text-muted)",
};

const STATE_LABEL: Record<PingState, string> = {
  online: "LIVE",
  idle: "IDLE",
  offline: "OFFLINE",
};

/**
 * Pacte OS — Tactical avatar with rotating ring (online only) + status badge.
 */
export function AvatarPing({
  name,
  avatarUrl,
  size = "md",
  state = "offline",
  showRing = true,
  showBadge = false,
  className,
}: AvatarPingProps) {
  const s = SIZE_MAP[size];
  const color = STATE_COLOR[state];
  const isOnline = state === "online";

  return (
    <div className={cn("relative shrink-0", s.wrap, className)}>
      {/* Rotating SVG ring — only when online (perf) */}
      {showRing && isOnline && (
        <svg
          aria-hidden="true"
          className="absolute inset-0 motion-reduce:hidden pointer-events-none"
          viewBox="0 0 100 100"
          style={{
            animation: "ds-ring-rotate 8s linear infinite",
            willChange: "transform",
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={`hsl(${color})`}
            strokeWidth="1.4"
            strokeDasharray="60 220"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      )}

      <Avatar
        className={cn(
          "relative",
          s.avatar,
          "border",
          isOnline ? "border-[hsl(var(--ds-accent-success)/0.5)]" : "border-[hsl(var(--ds-border-default)/0.35)]",
        )}
        style={{
          padding: 2,
          background: "hsl(var(--ds-surface-2))",
        }}
      >
        <AvatarImage src={avatarUrl || undefined} className="object-cover rounded-full" />
        <AvatarFallback className="bg-[hsl(var(--ds-surface-3))] text-[hsl(var(--ds-accent-primary))] font-orbitron text-sm">
          {name?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      {showBadge && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 inline-flex items-center gap-1 font-mono uppercase tracking-[0.18em] rounded-[2px] border",
            s.badge,
          )}
          style={{
            color: `hsl(${color})`,
            background: `hsl(var(--ds-surface-3))`,
            borderColor: `hsl(${color} / 0.45)`,
            boxShadow: isOnline ? `0 0 6px hsl(${color} / 0.5)` : undefined,
          }}
        >
          <span
            className="h-1 w-1 rounded-full"
            style={{
              background: `hsl(${color})`,
              animation: isOnline ? "ds-pulse-dot 1.6s ease-in-out infinite" : undefined,
            }}
          />
          {STATE_LABEL[state]}
        </span>
      )}
    </div>
  );
}

export function getPingState(lastSeenAt?: string | null): PingState {
  if (!lastSeenAt) return "offline";
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < 5 * 60 * 1000) return "online";
  if (diff < 30 * 60 * 1000) return "idle";
  return "offline";
}
