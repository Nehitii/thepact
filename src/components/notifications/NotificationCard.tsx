import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { 
  Bell, Gift, Trophy, MessageSquare, Megaphone, X, ExternalLink, 
  Star, Zap, Heart, Info, AlertTriangle, Check, Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/hooks/useNotifications";

/**
 * Validates a CTA URL to prevent open redirect attacks.
 * Only allows relative paths starting with "/" (internal navigation).
 * Rejects external URLs, javascript:, data:, and other dangerous protocols.
 */
function isValidInternalUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  
  const trimmedUrl = url.trim();
  
  // Only allow relative paths starting with /
  // This prevents external redirects and dangerous protocols
  if (!trimmedUrl.startsWith("/")) return false;
  
  // Reject protocol-relative URLs (//example.com)
  if (trimmedUrl.startsWith("//")) return false;
  
  // Additional check: ensure it's a clean relative path
  try {
    // Create a URL with a dummy base to validate the path
    const testUrl = new URL(trimmedUrl, "https://internal.app");
    // Ensure the hostname matches our dummy base (wasn't overridden)
    if (testUrl.hostname !== "internal.app") return false;
    return true;
  } catch {
    return false;
  }
}

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
  star: Star,
  zap: Zap,
  heart: Heart,
  info: Info,
  warning: AlertTriangle,
};

const priorityStyles: Record<string, string> = {
  critical: "border-destructive/40 bg-destructive/5",
  important: "border-amber-500/40 bg-amber-500/5",
  informational: "border-primary/20 bg-primary/5",
  social: "border-violet-500/40 bg-violet-500/5",
  silent: "border-muted/20 bg-muted/5",
};

export function NotificationCard({ notification, onMarkAsRead, onDelete }: NotificationCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [claiming, setClaiming] = useState(false);
  
  const Icon = iconMap[notification.icon_key || "bell"] || Bell;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  // Check if notification has a claimable reward
  const hasReward = notification.reward_type && (
    (notification.reward_type === "bonds" && notification.reward_amount && notification.reward_amount > 0) ||
    (notification.reward_type !== "bonds" && (notification as any).reward_cosmetic_id)
  );
  const isClaimed = (notification as any).reward_claimed === true;

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id || claiming || isClaimed) return;

    setClaiming(true);
    try {
      if (notification.reward_type === "bonds" && notification.reward_amount) {
        // Add bonds to user balance
        const { data: balance } = await supabase
          .from("bond_balance")
          .select("id, balance, total_earned")
          .eq("user_id", user.id)
          .maybeSingle();

        if (balance) {
          await supabase
            .from("bond_balance")
            .update({
              balance: balance.balance + notification.reward_amount,
              total_earned: balance.total_earned + notification.reward_amount,
            })
            .eq("id", balance.id);
        } else {
          await supabase.from("bond_balance").insert({
            user_id: user.id,
            balance: notification.reward_amount,
            total_earned: notification.reward_amount,
          });
        }

        // Log transaction
        await supabase.from("bond_transactions").insert({
          user_id: user.id,
          amount: notification.reward_amount,
          transaction_type: "earn",
          description: `Claimed reward: ${notification.title}`,
          reference_id: notification.id,
          reference_type: "notification",
        });
      } else if ((notification as any).reward_cosmetic_id && (notification as any).reward_cosmetic_type) {
        // Add cosmetic to user's collection
        const cosmeticId = (notification as any).reward_cosmetic_id;
        const cosmeticType = (notification as any).reward_cosmetic_type;

        // Check if already owned
        const { data: existing } = await supabase
          .from("user_cosmetics")
          .select("id")
          .eq("user_id", user.id)
          .eq("cosmetic_id", cosmeticId)
          .maybeSingle();

        if (!existing) {
          await supabase.from("user_cosmetics").insert({
            user_id: user.id,
            cosmetic_id: cosmeticId,
            cosmetic_type: cosmeticType,
          });
        }
      }

      // Mark as claimed
      await supabase
        .from("notifications")
        .update({ reward_claimed: true })
        .eq("id", notification.id);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["bond-balance"] });
      queryClient.invalidateQueries({ queryKey: ["user-cosmetics"] });

      toast({
        title: "Reward Claimed!",
        description: notification.reward_type === "bonds" 
          ? `+${notification.reward_amount} Bonds added to your balance`
          : `${notification.reward_type} added to your collection`,
      });
    } catch (error) {
      console.error("Failed to claim reward:", error);
      toast({
        title: "Failed to claim",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.cta_url) {
      // Only navigate to validated internal URLs to prevent open redirect attacks
      if (isValidInternalUrl(notification.cta_url)) {
        navigate(notification.cta_url);
      } else {
        // Log invalid URL attempts for security monitoring (without exposing to user)
        console.warn("Blocked invalid notification CTA URL");
      }
    }
  };

  return (
    <div
      className={cn(
        "relative group p-4 rounded-lg border transition-colors duration-200 cursor-pointer",
        priorityStyles[notification.priority],
        !notification.is_read && "ring-1 ring-primary/30",
        "hover:border-primary/40"
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
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

            {hasReward && (
              <>
                {isClaimed ? (
                  <span className="text-[10px] text-emerald-400 font-semibold font-rajdhani flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Claimed
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleClaim}
                    disabled={claiming}
                    className="h-6 px-2 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30"
                  >
                    {claiming ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Gift className="h-3 w-3 mr-1" />
                    )}
                    Claim {notification.reward_type === "bonds" ? `+${notification.reward_amount}` : notification.reward_type}
                  </Button>
                )}
              </>
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