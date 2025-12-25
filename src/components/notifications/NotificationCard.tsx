import { formatDistanceToNow } from "date-fns";
import { Bell, Gift, Trophy, MessageSquare, Megaphone, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  bell: Bell,
  gift: Gift,
  trophy: Trophy,
  message: MessageSquare,
  announcement: Megaphone,
};

const priorityStyles: Record<string, string> = {
  critical: "border-destructive/40 bg-destructive/5",
  important: "border-amber-500/40 bg-amber-500/5",
  informational: "border-primary/20 bg-primary/5",
  social: "border-violet-500/40 bg-violet-500/5",
  silent: "border-muted/20 bg-muted/5",
};

export function NotificationCard({ notification, onMarkAsRead, onDelete }: NotificationCardProps) {
  const Icon = iconMap[notification.icon_key || "bell"] || Bell;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.cta_url) {
      window.location.href = notification.cta_url;
    }
  };

  return (
    <div
      className={cn(
        "relative group p-4 rounded-lg border transition-all duration-300 cursor-pointer",
        priorityStyles[notification.priority],
        !notification.is_read && "ring-1 ring-primary/30 shadow-[0_0_15px_rgba(91,180,255,0.1)]"
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(91,180,255,0.8)]" />
      )}

      <div className="flex items-start gap-3 pl-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-sm font-rajdhani tracking-wide truncate",
              notification.is_read ? "text-muted-foreground" : "text-foreground font-semibold"
            )}>
              {notification.title}
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted/20 rounded"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>

          {notification.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 font-rajdhani">
              {notification.description}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <span className="text-[10px] text-muted-foreground/60 font-rajdhani">
              {timeAgo}
            </span>

            {notification.reward_amount && notification.reward_type && (
              <span className="text-[10px] text-amber-400 font-semibold font-rajdhani flex items-center gap-1">
                <Gift className="h-3 w-3" />
                +{notification.reward_amount} {notification.reward_type}
              </span>
            )}

            {notification.cta_label && (
              <span className="text-[10px] text-primary font-rajdhani flex items-center gap-1">
                {notification.cta_label}
                <ExternalLink className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>

        {/* Image */}
        {notification.image_url && (
          <img
            src={notification.image_url}
            alt=""
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
}
