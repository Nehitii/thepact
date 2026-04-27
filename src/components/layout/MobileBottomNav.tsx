import { NavLink, useLocation } from "react-router-dom";
import { Home, Target, Handshake, Inbox, UserCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePendingFriendCount } from "@/hooks/usePendingFriendCount";
import { useMessages } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

interface NavTab {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badgeKey?: "friends" | "inbox";
  matchPaths?: string[];
}

const TABS: NavTab[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/goals", icon: Target, label: "Goals", matchPaths: ["/goals", "/goals/new"] },
  { to: "/friends", icon: Handshake, label: "Friends", badgeKey: "friends" },
  { to: "/inbox", icon: Inbox, label: "Inbox", badgeKey: "inbox", matchPaths: ["/inbox"] },
  { to: "/profile", icon: UserCircle, label: "Profile", matchPaths: ["/profile"] },
];

/**
 * Mobile-only sticky bottom navigation. Hidden on md+.
 * Provides one-tap access to the 5 most-used destinations.
 * Honors iOS safe-area via env(safe-area-inset-bottom).
 */
export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { count: friendCount } = usePendingFriendCount();
  const { unreadCount: messageCount } = useMessages();

  if (!isMobile) return null;

  return (
    <nav
      role="navigation"
      aria-label="Primary mobile navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 md:hidden",
        "border-t border-[hsl(var(--ds-border-default)/0.4)]",
        "bg-[hsl(var(--background)/0.92)] backdrop-blur-xl",
        "pb-safe"
      )}
      style={{
        boxShadow: "0 -8px 24px -12px rgba(0,0,0,0.5)",
      }}
    >
      <ul className="flex items-stretch justify-around h-16">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const matches = tab.matchPaths ?? [tab.to];
          const isActive = matches.some((p) =>
            p === "/" ? location.pathname === "/" : location.pathname.startsWith(p)
          );
          const badge =
            tab.badgeKey === "friends" ? friendCount :
            tab.badgeKey === "inbox" ? messageCount : 0;

          return (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 h-full",
                  "transition-colors duration-200 touch-target",
                  isActive
                    ? "text-[hsl(var(--ds-accent-primary))]"
                    : "text-[hsl(var(--ds-text-muted))]"
                )}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active indicator — thin top bar */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{
                      background: "hsl(var(--ds-accent-primary))",
                      boxShadow: "0 0 8px hsl(var(--ds-accent-primary) / 0.6)",
                    }}
                  />
                )}
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {badge > 0 && (
                    <span
                      aria-label={`${badge} unread`}
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-[hsl(var(--ds-accent-critical))] text-white"
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  {tab.label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}