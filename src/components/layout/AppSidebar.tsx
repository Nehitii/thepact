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
  PanelLeftClose, PanelLeft, Crown, Mail,
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
const mainNavItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/focus", icon: Timer, label: "Focus" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/achievements", icon: Trophy, label: "Achievements" },
  { to: "/leaderboard", icon: Crown, label: "Leaderboard" },
  { to: "/friends", icon: Handshake, label: "Friends", badgeKey: "friends" as const },
  { to: "/inbox", icon: Mail, label: "Inbox", badgeKey: "messages" as const },
  { to: "/shop", icon: ShoppingBag, label: "Shop" },
  { to: "/community", icon: Users, label: "Community" },
];

const profileSubItems = [
  { to: "/profile", icon: UserCircle, label: "Account Information", exact: true },
  { to: "/profile/bounded", icon: User, label: "Bounded Profile" },
  { to: "/profile/pact-settings", icon: Settings, label: "Pact Settings" },
  { to: "/profile/display-sound", icon: Volume2, label: "Display & Sound" },
  { to: "/profile/notifications", icon: Bell, label: "Notifications" },
  { to: "/profile/privacy", icon: Shield, label: "Privacy & Control" },
  { to: "/profile/data", icon: Database, label: "Data & Portability" },
];

const moduleConfig: Record<string, { icon: any; route: string; label: string }> = {
  "todo-list": { icon: ListTodo, route: "/todo", label: "To-Do List" },
  journal: { icon: BookOpen, route: "/journal", label: "Journal" },
  finance: { icon: Wallet, route: "/finance", label: "Finance" },
  "the-call": { icon: Zap, route: "/the-call", label: "The Call" },
  "track-health": { icon: Heart, route: "/health", label: "Health" },
  wishlist: { icon: ShoppingCart, route: "/wishlist", label: "Wishlist" },
};

// ─── Component ──────────────────────────────────────────────
export const AppSidebar = memo(function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(location.pathname.startsWith("/profile"));
  const [isModulesExpanded, setIsModulesExpanded] = useState(
    Object.values(moduleConfig).some((m) => location.pathname.startsWith(m.route)),
  );

  const { unreadCount } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();
  const { count: friendRequestCount } = usePendingFriendCount();
  const totalUnread = unreadCount + messageUnreadCount + friendRequestCount;

  const { data: allModules = [] } = useShopModules();
  const { data: purchasedModuleIds = [] } = useUserModulePurchases(user?.id);

  const purchasedModules = allModules
    .filter((m) => purchasedModuleIds.includes(m.id))
    .filter((m) => moduleConfig[m.key])
    .map((m) => ({ ...m, config: moduleConfig[m.key] }));

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

  // On mobile, expose open/close via the mobileOpen state
  // The SidebarTrigger in AppLayout will toggle this
  const isVisible = isMobile ? mobileOpen : true;

  return (
    <TooltipProvider delayDuration={300}>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile trigger (hamburger) — always visible on mobile */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-card/90 border border-border backdrop-blur-sm text-foreground hover:text-primary transition-colors"
          aria-label="Open menu"
        >
          <PanelLeft size={20} />
        </button>
      )}

      <aside
        className={cn(
          "flex-shrink-0 z-50 flex flex-col bg-background/95 backdrop-blur-md border-r border-border overflow-hidden font-rajdhani shadow-[4px_0_24px_-12px_rgba(0,0,0,0.15)] dark:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)] hide-scrollbar transition-all duration-300 ease-in-out",
          // Desktop: sticky, collapsed or expanded
          !isMobile && "sticky top-0 h-screen",
          !isMobile && (collapsed ? "w-[4.5rem]" : "w-72"),
          // Mobile: fixed overlay
          isMobile && "fixed top-0 left-0 h-full w-72",
          isMobile && (mobileOpen ? "translate-x-0" : "-translate-x-full"),
        )}
      >
        {/* ─── HEADER ─── */}
        <div className={cn("relative p-6 mb-2", collapsed && !isMobile && "p-3 flex justify-center")}>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          <div className={cn("flex items-center gap-4 relative z-10", collapsed && !isMobile && "justify-center gap-0")}>
            <div className="relative shrink-0 group cursor-pointer" onClick={() => { navigate("/"); closeMobile(); }}>
              <div className="absolute -inset-2 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div
                className="relative w-12 h-12 bg-card border border-primary/50 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                style={{ clipPath: "polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%)" }}
              >
                <span className="text-2xl font-black font-orbitron text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.8)]">
                  P
                </span>
              </div>
            </div>

            {(!collapsed || isMobile) && (
              <div className="flex flex-col">
                <h1 className="text-xl font-black font-orbitron text-foreground tracking-[0.2em] leading-none mb-1.5 drop-shadow-sm">
                  THE PACT
                </h1>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-emerald-500/90 font-mono">
                    System Online
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

        {/* Desktop collapse toggle */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "mx-auto mb-3 flex items-center justify-center p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all",
              collapsed ? "w-10" : "mx-3 w-auto self-end",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}

        {/* ─── NAVIGATION ─── */}
        <nav className="flex-1 px-2 space-y-6 overflow-y-auto hide-scrollbar relative z-10 pb-6">
          <div className="space-y-1">
            {(!collapsed || isMobile) && (
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 font-orbitron">
                Main_Interface
              </p>
            )}
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const badge = getBadgeCount(item.badgeKey);

              const linkContent = (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-md transition-all duration-300 overflow-hidden",
                      collapsed && !isMobile ? "justify-center px-2 py-3" : "px-4 py-3",
                      isActive
                        ? "text-primary bg-primary/10 shadow-[inset_0_0_12px_-4px_rgba(var(--primary),0.3)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                      )}
                      <div className="relative">
                        <Icon
                          className={cn(
                            "h-5 w-5 transition-all duration-300",
                            isActive
                              ? "text-primary drop-shadow-[0_0_6px_rgba(var(--primary),0.6)]"
                              : "group-hover:text-foreground group-hover:drop-shadow-[0_0_4px_rgba(var(--primary),0.3)]",
                          )}
                        />
                        {collapsed && !isMobile && badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-primary text-primary-foreground w-4 h-4 flex items-center justify-center font-black rounded-full animate-pulse">
                            {badge}
                          </span>
                        )}
                      </div>
                      {(!collapsed || isMobile) && (
                        <>
                          <span
                            className={cn(
                              "text-sm font-bold tracking-wider font-rajdhani",
                              isActive ? "text-foreground" : "transition-transform group-hover:translate-x-1",
                            )}
                          >
                            {item.label}
                          </span>
                          {badge > 0 && (
                            <span className="ml-auto text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-black rounded-sm min-w-[18px] text-center animate-pulse">
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              );

              // Wrap in tooltip when collapsed
              if (collapsed && !isMobile) {
                return (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-rajdhani font-bold text-xs">
                      {item.label}
                      {badge > 0 && <span className="ml-2 text-primary">({badge})</span>}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.to}>{linkContent}</div>;
            })}
          </div>

          {/* ─── MODULES ─── */}
          {purchasedModules.length > 0 ? (
            <div className="space-y-1">
              {(!collapsed || isMobile) && (
                <div className="flex items-center justify-between px-4 mb-2 cursor-pointer group" onClick={() => setIsModulesExpanded(!isModulesExpanded)}>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-orbitron group-hover:text-foreground transition-colors">
                    Active_Modules
                  </span>
                  <div className={cn("transition-transform duration-300 text-muted-foreground", isModulesExpanded && "rotate-180")}>
                    <ChevronDown size={12} />
                  </div>
                </div>
              )}
              {collapsed && !isMobile && (
                <div className="h-px mx-3 bg-gradient-to-r from-transparent via-border to-transparent mb-2" />
              )}
              <div className={cn(
                "space-y-1 transition-all duration-500 ease-in-out overflow-hidden",
                (!collapsed || isMobile) ? (isModulesExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0") : "max-h-[500px] opacity-100",
              )}>
                {purchasedModules.map((m) => {
                  const moduleLink = (
                    <NavLink
                      key={m.id}
                      to={m.config.route}
                      onClick={closeMobile}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-md text-xs uppercase font-bold tracking-widest transition-all duration-300 border border-transparent",
                          collapsed && !isMobile ? "justify-center px-2 py-2.5 mx-1" : "px-4 py-2.5 mx-2",
                          isActive
                            ? "text-primary bg-primary/5 border-primary/20 shadow-[0_0_10px_-5px_rgba(var(--primary),0.3)]"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border",
                        )
                      }
                    >
                      <m.config.icon size={14} className={location.pathname.startsWith(m.config.route) ? "text-primary" : "opacity-70"} />
                      {(!collapsed || isMobile) && m.config.label}
                    </NavLink>
                  );

                  if (collapsed && !isMobile) {
                    return (
                      <Tooltip key={m.id}>
                        <TooltipTrigger asChild>{moduleLink}</TooltipTrigger>
                        <TooltipContent side="right" className="font-rajdhani font-bold text-xs">
                          {m.config.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return <div key={m.id}>{moduleLink}</div>;
                })}
              </div>
            </div>
          ) : (!collapsed || isMobile) ? (
            <div className="space-y-1">
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 font-orbitron">
                Modules
              </p>
              <button
                onClick={() => { navigate("/shop"); closeMobile(); }}
                className="mx-2 px-4 py-3 w-[calc(100%-1rem)] rounded-md border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold tracking-wider text-left flex items-center gap-3"
              >
                <Sparkles size={14} className="opacity-50" />
                Explore modules
              </button>
            </div>
          ) : null}

          {/* ─── PROFILE / SETTINGS ─── */}
          {(!collapsed || isMobile) && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-4 mb-2 cursor-pointer group" onClick={() => setIsProfileExpanded(!isProfileExpanded)}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-orbitron group-hover:text-foreground transition-colors">
                  User_Settings
                </span>
                <div className={cn("transition-transform duration-300 text-muted-foreground", isProfileExpanded && "rotate-180")}>
                  <ChevronDown size={12} />
                </div>
              </div>
              <div className={cn("space-y-1 transition-all duration-500 ease-in-out overflow-hidden relative", isProfileExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                <div className="absolute left-[1.15rem] top-0 bottom-2 w-px bg-gradient-to-b from-border to-transparent" />
                {profileSubItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 pl-8 pr-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors relative",
                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={cn(
                          "absolute left-[1rem] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-background transition-all",
                          isActive ? "bg-primary scale-110" : "bg-muted-foreground/30",
                        )} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* ─── FOOTER ─── */}
        <div className="mt-auto relative border-t border-border bg-muted/20 backdrop-blur-xl p-4">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full group outline-none">
                <div className={cn(
                  "flex items-center gap-3 transition-all duration-300 rounded-lg group-hover:bg-muted/50 border border-transparent group-hover:border-border relative overflow-hidden",
                  collapsed && !isMobile ? "justify-center p-2" : "p-2.5",
                )}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-muted/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                  <div className="relative">
                    <Avatar className="h-9 w-9 border border-primary/30 ring-1 ring-background/50 transition-all group-hover:border-primary">
                      <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-muted text-primary font-orbitron text-xs">
                        {profile?.display_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {totalUnread > 0 && (
                      <NotificationBadge count={totalUnread} size="sm" className="shadow-[0_0_5px_rgba(0,0,0,0.3)] animate-pulse" />
                    )}
                  </div>

                  {(!collapsed || isMobile) && (
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider font-orbitron truncate group-hover:text-primary transition-colors">
                        {profile?.display_name || "Agent"}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-mono tracking-tighter truncate">
                        ID :: {user?.id?.slice(0, 8).toUpperCase() || "UNKNOWN"}
                      </p>
                    </div>
                  )}

                  {(!collapsed || isMobile) && (
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                      <Sparkles size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              side="right"
              className="w-56 bg-popover border-border text-popover-foreground font-rajdhani shadow-2xl backdrop-blur-xl"
              sideOffset={10}
            >
              <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Quick Actions
              </div>
              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem onClick={() => { navigate("/profile"); closeMobile(); }} className="p-2.5 focus:bg-primary/10 focus:text-primary cursor-pointer group my-1">
                <UserCircle className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
                <span className="text-xs font-bold tracking-wide">Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => { navigate("/inbox"); closeMobile(); }} className="p-2.5 focus:bg-primary/10 focus:text-primary cursor-pointer group my-1">
                <Inbox className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
                <span className="text-xs font-bold tracking-wide">Inbox</span>
                {messageUnreadCount > 0 && (
                  <span className="ml-auto text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-black rounded-sm">
                    {messageUnreadCount}
                  </span>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => { navigate("/profile/notifications"); closeMobile(); }} className="p-2.5 focus:bg-primary/10 focus:text-primary cursor-pointer group my-1">
                <Bell className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
                <span className="text-xs font-bold tracking-wide">Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-black rounded-sm">
                    {unreadCount}
                  </span>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem onClick={handleSignOut} className="p-2.5 text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer group my-1">
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
