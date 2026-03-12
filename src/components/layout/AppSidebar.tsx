import { useState, memo, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useShopModules, useUserModulePurchases } from "@/hooks/useShop";
import { usePendingFriendCount } from "@/hooks/usePendingFriendCount";
import {
  Home, Target, ShoppingBag, ShoppingCart, Users, User, LogOut, ChevronDown,
  Shield, Database, Settings, Volume2, UserCircle, Bell, Inbox, ListTodo,
  BookOpen, Wallet, Zap, Heart, Sparkles, Trophy, Timer, BarChart3, Handshake,
  ChevronsLeft, ChevronsRight, Crown, Mail, RefreshCw,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ─── Navigation config ─────────────────────────────────────

// Command Center items — core daily tools
// Modules are interleaved at logical positions via insertionIndex
const commandCenterBase = [
  { to: "/", icon: Home, label: "Home", insertionIndex: 0 },
  { to: "/goals", icon: Target, label: "Goals", insertionIndex: 1 },
  // module: todo-list inserted here (index 2)
  { to: "/focus", icon: Timer, label: "Focus", insertionIndex: 3 },
  // module: journal inserted here (index 4)
  // module: finance inserted here (index 5)
  // module: track-health inserted here (index 6)
  // module: wishlist inserted here (index 7)
  { to: "/analytics", icon: BarChart3, label: "Analytics", insertionIndex: 8 },
];

const networkItems = [
  { to: "/community", icon: Users, label: "Community" },
  { to: "/friends", icon: Handshake, label: "Friends", badgeKey: "friends" as const },
  { to: "/inbox", icon: Mail, label: "Inbox", badgeKey: "messages" as const },
  { to: "/leaderboard", icon: Crown, label: "Leaderboard" },
  { to: "/achievements", icon: Trophy, label: "Achievements" },
];

const standaloneItems = [
  { to: "/shop", icon: ShoppingBag, label: "Shop", alwaysVisible: true },
];

const moduleConfig: Record<string, { icon: any; route: string; label: string; insertionIndex: number }> = {
  "todo-list": { icon: ListTodo, route: "/todo", label: "To-Do List", insertionIndex: 2 },
  journal: { icon: BookOpen, route: "/journal", label: "Journal", insertionIndex: 4 },
  finance: { icon: Wallet, route: "/finance", label: "Finance", insertionIndex: 5 },
  "track-health": { icon: Heart, route: "/health", label: "Health", insertionIndex: 6 },
  wishlist: { icon: ShoppingCart, route: "/wishlist", label: "Wishlist", insertionIndex: 7 },
};

const theCallModule = { icon: Zap, route: "/the-call", label: "The Call", key: "the-call" };

const settingsItems = [
  { to: "/profile", icon: UserCircle, label: "Profile & Account" },
  { to: "/profile/bounded", icon: User, label: "Bounded Profile" },
  { to: "/profile/pact-settings", icon: Settings, label: "Pact Settings" },
  { to: "/profile/display-sound", icon: Volume2, label: "Display & Sound" },
  { to: "/profile/notifications", icon: Bell, label: "Notifications" },
  { to: "/profile/privacy", icon: Shield, label: "Privacy" },
  { to: "/profile/data", icon: Database, label: "Data & Export" },
];

// ─── Shared nav link renderer ──────────────────────────────

interface NavItemProps {
  to: string;
  icon: any;
  label: string;
  badge?: number;
  mini: boolean;
  isModule?: boolean;
  closeMobile: () => void;
  navigate: (to: string) => void;
  location: { pathname: string };
}

function SidebarNavItem({ to, icon: Icon, label, badge, mini, closeMobile, navigate, location }: NavItemProps) {
  const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  if (mini) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => { navigate(to); closeMobile(); }}
            className={cn(
              "flex items-center justify-center h-10 w-10 mx-auto rounded-md transition-all duration-200 relative",
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10",
            )}
          >
            <Icon size={20} />
            {badge != null && badge > 0 && (
              <span className="absolute -top-1 -right-1 text-[7px] leading-none bg-primary text-primary-foreground w-3.5 h-3.5 flex items-center justify-center font-black rounded-full ring-2 ring-background">
                {badge}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-rajdhani font-bold text-xs tracking-wide">
          {label}
          {badge != null && badge > 0 && <span className="ml-1.5 text-primary">({badge})</span>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={closeMobile}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center rounded-md transition-all duration-200 overflow-hidden gap-3 px-3 py-2.5",
          isActive
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
          )}
          <div className="relative shrink-0 flex items-center justify-center">
            <Icon
              size={18}
              className={cn(
                "transition-all duration-200",
                isActive
                  ? "text-primary drop-shadow-[0_0_6px_rgba(var(--primary),0.6)]"
                  : "group-hover:text-foreground",
              )}
            />
          </div>
          <span className={cn(
            "text-sm font-bold tracking-wider font-rajdhani whitespace-nowrap",
            isActive ? "text-foreground" : "group-hover:translate-x-0.5 transition-transform",
          )}>
            {label}
          </span>
          {badge != null && badge > 0 && (
            <span className="ml-auto text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-black rounded-sm min-w-[18px] text-center">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Section label ─────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 font-orbitron">
      {label}
    </p>
  );
}

function SectionDivider() {
  return <div className="h-px mx-2 bg-gradient-to-r from-transparent via-border to-transparent my-3" />;
}

// ─── Main component ────────────────────────────────────────

export const AppSidebar = memo(function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { unreadCount } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();
  const { count: friendRequestCount } = usePendingFriendCount();
  const totalUnread = unreadCount + messageUnreadCount + friendRequestCount;

  const { data: allModules = [] } = useShopModules();
  const { data: purchasedModuleIds = [] } = useUserModulePurchases(user?.id);

  const purchasedModuleKeys = allModules
    .filter((m) => purchasedModuleIds.includes(m.id))
    .map((m) => m.key);

  const hasTheCall = purchasedModuleKeys.includes("the-call");

  const { data: profile } = useProfile(user?.id);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const closeMobile = useCallback(() => {
    if (isMobile) setMobileOpen(false);
  }, [isMobile]);

  const getBadgeCount = (key?: "friends" | "messages") => {
    if (key === "friends") return friendRequestCount;
    if (key === "messages") return messageUnreadCount;
    return 0;
  };

  const mini = collapsed && !isMobile;

  // Build Command Center list: base items + purchased modules interleaved by insertionIndex
  const commandCenterItems: { to: string; icon: any; label: string; badgeKey?: "friends" | "messages"; insertionIndex: number }[] = [
    ...commandCenterBase,
  ];

  Object.entries(moduleConfig).forEach(([key, config]) => {
    if (purchasedModuleKeys.includes(key)) {
      commandCenterItems.push({
        to: config.route,
        icon: config.icon,
        label: config.label,
        insertionIndex: config.insertionIndex,
      });
    }
  });

  commandCenterItems.sort((a, b) => a.insertionIndex - b.insertionIndex);

  const hasAnyModule = purchasedModuleKeys.some((k) => k in moduleConfig);

  return (
    <TooltipProvider delayDuration={200}>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-card/90 border border-border backdrop-blur-sm text-foreground hover:text-primary transition-colors"
          aria-label="Open menu"
        >
          <ChevronsRight size={20} />
        </button>
      )}

      <aside
        style={{ width: isMobile ? 288 : collapsed ? 68 : 288 }}
        className={cn(
          "flex-shrink-0 z-50 flex flex-col bg-background/95 backdrop-blur-md border-r border-border font-rajdhani hide-scrollbar",
          "shadow-[4px_0_24px_-12px_rgba(0,0,0,0.15)] dark:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]",
          "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          !isMobile && "sticky top-0 h-screen overflow-hidden",
          isMobile && "fixed top-0 left-0 h-full transition-transform duration-300",
          isMobile && (mobileOpen ? "translate-x-0" : "-translate-x-full"),
        )}
      >
        {/* ─── HEADER ─── */}
        <div className="relative mb-2" style={{ padding: mini ? "16px 8px" : "24px" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          <div className={cn("flex items-center relative z-10 transition-all duration-300", mini ? "justify-center" : "gap-4")}>
            <div className="relative shrink-0 group cursor-pointer" onClick={() => { navigate("/"); closeMobile(); }}>
              <div className="absolute -inset-2 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div
                className={cn("relative bg-card border border-primary/50 flex items-center justify-center transition-all duration-300 group-hover:scale-105", mini ? "w-10 h-10" : "w-12 h-12")}
                style={{ clipPath: "polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%)" }}
              >
                <span className={cn("font-black font-orbitron text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.8)] transition-all duration-300", mini ? "text-lg" : "text-2xl")}>
                  P
                </span>
              </div>
            </div>

            <div className={cn("flex flex-col transition-all duration-300", mini ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100 overflow-visible")}>
              <h1 className="text-xl font-black font-orbitron text-foreground tracking-[0.2em] leading-none mb-1.5 drop-shadow-sm whitespace-nowrap">
                THE PACT
              </h1>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-emerald-500/90 font-mono">
                  System Online
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px mx-3 bg-gradient-to-r from-transparent via-border to-transparent mb-2" />

        {/* Desktop collapse toggle */}
        {!isMobile && (
          <div className={cn("flex mb-2 px-2", mini ? "justify-center" : "justify-end")}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
          </div>
        )}

        {/* ─── NAVIGATION ─── */}
        <nav className={cn("flex-1 space-y-1 overflow-y-auto hide-scrollbar relative z-10 pb-6", mini ? "px-1.5" : "px-2")}>

          {/* ── COMMAND_CENTER ── */}
          <div className="space-y-0.5">
            {!mini && <SectionLabel label="Command_Center" />}
            {commandCenterItems.map((item) => (
              <SidebarNavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                badge={getBadgeCount(item.badgeKey)}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}
            {/* Explore modules CTA when none purchased */}
            {!hasAnyModule && !mini && (
              <button
                onClick={() => { navigate("/shop"); closeMobile(); }}
                className="mx-1 mt-1 px-3 py-2.5 w-[calc(100%-0.5rem)] rounded-md border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold tracking-wider text-left flex items-center gap-3"
              >
                <Sparkles size={14} className="opacity-50" />
                Explore modules
              </button>
            )}
            {!hasAnyModule && mini && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { navigate("/shop"); closeMobile(); }}
                    className="flex items-center justify-center h-10 w-10 mx-auto rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  >
                    <Sparkles size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-rajdhani font-bold text-xs tracking-wide">
                  Explore modules
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {!mini && <SectionDivider />}
          {mini && <div className="h-px mx-2 bg-gradient-to-r from-transparent via-border to-transparent my-2" />}

          {/* ── NETWORK ── */}
          <div className="space-y-0.5">
            {!mini && <SectionLabel label="Network" />}
            {networkItems.map((item) => (
              <SidebarNavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                badge={getBadgeCount(item.badgeKey)}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}
          </div>

          {!mini && <SectionDivider />}
          {mini && <div className="h-px mx-2 bg-gradient-to-r from-transparent via-border to-transparent my-2" />}

          {/* ── STANDALONE (Shop + The Call) ── */}
          <div className="space-y-0.5">
            {standaloneItems.map((item) => (
              <SidebarNavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}
            {hasTheCall && (
              <SidebarNavItem
                to={theCallModule.route}
                icon={theCallModule.icon}
                label={theCallModule.label}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            )}
          </div>
        </nav>

        {/* ─── FOOTER ─── */}
        <div className={cn("mt-auto relative border-t border-border bg-muted/20 backdrop-blur-xl", mini ? "p-2" : "p-4")}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full group outline-none">
                <div className={cn(
                  "flex items-center transition-all duration-200 rounded-lg group-hover:bg-muted/50 border border-transparent group-hover:border-border relative overflow-hidden",
                  mini ? "justify-center p-1.5" : "gap-3 p-2.5",
                )}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-muted/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                  <div className="relative shrink-0">
                    <Avatar className={cn("border border-primary/30 ring-1 ring-background/50 transition-all group-hover:border-primary", mini ? "h-8 w-8" : "h-9 w-9")}>
                      <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-muted text-primary font-orbitron text-xs">
                        {profile?.display_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {totalUnread > 0 && (
                      <NotificationBadge count={totalUnread} size="sm" className="shadow-[0_0_5px_rgba(0,0,0,0.3)]" />
                    )}
                  </div>

                  {!mini && (
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider font-orbitron truncate group-hover:text-primary transition-colors">
                        {profile?.display_name || "Agent"}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-mono tracking-tighter truncate">
                        ID :: {user?.id?.slice(0, 8).toUpperCase() || "UNKNOWN"}
                      </p>
                    </div>
                  )}

                  {!mini && (
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                      <Sparkles size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align={mini ? "start" : "end"}
              side="right"
              className="w-56 bg-popover border-border text-popover-foreground font-rajdhani shadow-2xl backdrop-blur-xl"
              sideOffset={8}
            >
              <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Settings
              </div>
              <DropdownMenuSeparator className="bg-border" />

              {settingsItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.to}
                    onClick={() => { navigate(item.to); closeMobile(); }}
                    className="p-2.5 focus:bg-primary/10 focus:text-primary cursor-pointer group my-0.5"
                  >
                    <ItemIcon className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
                    <span className="text-xs font-bold tracking-wide">{item.label}</span>
                    {item.to === "/profile/notifications" && unreadCount > 0 && (
                      <span className="ml-auto text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-black rounded-sm">
                        {unreadCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem onClick={() => { navigate("/pact-selector"); closeMobile(); }} className="p-2.5 focus:bg-primary/10 focus:text-primary cursor-pointer group my-0.5">
                <RefreshCw className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
                <span className="text-xs font-bold tracking-wide">Switch Pact</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem onClick={handleSignOut} className="p-2.5 text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer group my-0.5">
                <LogOut className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
                <span className="text-xs font-bold tracking-wide">Disconnect</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
});
