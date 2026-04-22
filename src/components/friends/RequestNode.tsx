import { Button } from "@/components/ui/button";
import { DSPanel } from "@/components/ds";
import { AvatarPing } from "./AvatarPing";
import { Check, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface RequestNodeProps {
  variant: "incoming" | "sent";
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  loading?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
}

export function RequestNode({
  variant,
  displayName,
  avatarUrl,
  createdAt,
  loading = false,
  onAccept,
  onDecline,
  onCancel,
}: RequestNodeProps) {
  const { t } = useTranslation();
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const isIncoming = variant === "incoming";

  return (
    <DSPanel
      tier={isIncoming ? "secondary" : "muted"}
      hideBrackets={!isIncoming}
      className={cn(
        "!p-0 relative animate-fade-in",
        isIncoming && "border-l-2 !border-l-[hsl(var(--ds-accent-special)/0.7)]",
      )}
    >
      <div className="px-3 sm:px-4 pt-2 pb-1 flex items-center justify-between border-b border-[hsl(var(--ds-border-subtle)/0.1)]">
        <span
          className="font-mono text-[8px] uppercase tracking-[0.22em]"
          style={{
            color: isIncoming
              ? "hsl(var(--ds-accent-special))"
              : "hsl(var(--ds-text-muted))",
          }}
        >
          [{isIncoming ? "INCOMING SIGNAL" : "TRANSMITTED"}]
        </span>
        <span className="font-mono text-[8px] uppercase tracking-wider text-[hsl(var(--ds-text-muted)/0.7)]">
          {isIncoming ? timeAgo : t("friends.awaiting", { defaultValue: "awaiting response" })}
        </span>
      </div>

      <div className="flex items-center gap-3 p-3 sm:p-4">
        <AvatarPing
          name={displayName}
          avatarUrl={avatarUrl}
          size={isIncoming ? "md" : "sm"}
          state="offline"
          showRing={false}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-[hsl(var(--ds-text-primary))]">
            {displayName || t("friends.unknownAgent")}
          </h3>
          {!isIncoming && (
            <p className="text-[9px] font-mono uppercase tracking-wider text-[hsl(var(--ds-text-muted)/0.6)] mt-0.5">
              {t("friends.sentTo")} · {timeAgo}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isIncoming ? (
            <>
              <Button
                size="sm"
                onClick={onAccept}
                disabled={loading}
                className="h-8 text-xs font-bold uppercase tracking-wider border"
                style={{
                  color: "hsl(var(--ds-accent-success))",
                  background: "hsl(var(--ds-accent-success) / 0.1)",
                  borderColor: "hsl(var(--ds-accent-success) / 0.5)",
                }}
                aria-label={t("friends.acceptRequest")}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {t("friends.accept")}
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDecline}
                disabled={loading}
                className="h-8 text-xs font-bold uppercase tracking-wider"
                style={{ color: "hsl(var(--ds-accent-critical))" }}
                aria-label={t("friends.declineRequest")}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                {t("friends.decline")}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
              className="h-7 text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--ds-text-muted))] hover:text-[hsl(var(--ds-accent-critical))]"
              aria-label={t("friends.cancelRequest")}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <X className="h-3 w-3 mr-1" />
                  {t("common.cancel")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </DSPanel>
  );
}
