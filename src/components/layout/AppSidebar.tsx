import { useState, memo, useCallback, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useShopModules, useUserModulePurchases } from "@/hooks/useShop";
import { usePendingFriendCount } from "@/hooks/usePendingFriendCount";
import {
  Home,
  Target,
  ShoppingBag,
  ShoppingCart,
  Users,
  LogOut,
  Settings,
  UserCircle,
  Bell,
  Shield,
  Database,
  Volume2,
  ListTodo,
  BookOpen,
  Wallet,
  Zap,
  Heart,
  Sparkles,
  Trophy,
  Timer,
  BarChart3,
  Handshake,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  Mail,
  RefreshCw,
  Hexagon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ─── TYPES & CONFIG ────────────────────────────────────────

type NavCategory = "overview" | "operations" | "lifeSystems" | "network" | "system";

interface NavItem {
  to: string;
  icon: any;
  label: string;
  badgeKey?: "friends" | "messages";
}

// 1. Définition des catégories de base de l'OS
const baseNavigation: Record<NavCategory, NavItem[]> = {
  overview: [
    { to: "/", icon: Home, label: "Home" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
  ],
  operations: [
    { to: "/goals", icon: Target, label: "Goals" },
    { to: "/focus", icon: Timer, label: "Focus" },
  ],
  lifeSystems: [], // Rempli dynamiquement par les modules
  network: [
    { to: "/community", icon: Users, label: "Community" },
    { to: "/friends", icon: Handshake, label: "Friends", badgeKey: "friends" },
    { to: "/inbox", icon: Mail, label: "Inbox", badgeKey: "messages" },
    { to: "/leaderboard", icon: Crown, label: "Leaderboard" },
    { to: "/achievements", icon: Trophy, label: "Achievements" },
  ],
  system: [{ to: "/shop", icon: ShoppingBag, label: "Shop" }],
};

// 2. Configuration des modules achetables et de leur destination
const moduleConfig: Record<string, NavItem & { category: NavCategory }> = {
  "todo-list": { icon: ListTodo, to: "/todo", label: "To-Do List", category: "operations" },
  "the-call": { icon: Zap, to: "/the-call", label: "The Call", category: "operations" },
  journal: { icon: BookOpen, to: "/journal", label: "Journal", category: "lifeSystems" },
  finance: { icon: Wallet, to: "/finance", label: "Finance", category: "lifeSystems" },
  "track-health": { icon: Heart, to: "/health", label: "Health", category: "lifeSystems" },
  wishlist: { icon: ShoppingCart, to: "/wishlist", label: "Wishlist", category: "lifeSystems" },
};

// ─── UI COMPONENTS ─────────────────────────────────────────

interface NavItemProps extends NavItem {
  badge?: number;
  mini: boolean;
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
            onClick={() => {
              navigate(to);
              closeMobile();
            }}
            className={cn(
              "flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-300 relative group",
              isActive
                ? "text-primary bg-primary/15 shadow-[inset_0_0_10px_rgba(var(--primary),0.2)]"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10",
            )}
          >
            <Icon size={20} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]")} />
            {badge != null && badge > 0 && (
              <span className="absolute -top-1 -right-1 text-[8px] leading-none bg-primary text-primary-foreground w-3.5 h-3.5 flex items-center justify-center font-black rounded-full shadow-[0_0_8px_rgba(var(--primary),0.6)]">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="font-rajdhani font-bold text-xs tracking-wider border-primary/30 bg-background/95 backdrop-blur-md"
        >
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
          "group relative flex items-center rounded-lg transition-all duration-300 overflow-hidden gap-3 px-3 py-2.5",
          isActive
            ? "text-primary bg-primary/10 shadow-[inset_0_0_12px_rgba(var(--primary),0.1)]"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active Cyberpunk Edge Glow */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary shadow-[0_0_12px_rgba(var(--primary),1)]" />
          )}

          <div className="relative shrink-0 flex items-center justify-center">
            <Icon
              size={18}
              className={cn(
                "transition-all duration-300",
                isActive
                  ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)] scale-110"
                  : "group-hover:text-primary group-hover:scale-110 group-hover:drop-shadow-[0_0_5px_rgba(var(--primary),0.4)]",
              )}
            />
          </div>
          <span
            className={cn(
              "text-sm font-bold tracking-wider font-rajdhani whitespace-nowrap",
              isActive
                ? "text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]"
                : "group-hover:translate-x-1 transition-transform",
            )}
          >
            {label}
          </span>
          {badge != null && badge > 0 && (
            <span className="ml-auto text-[10px] bg-primary/20 border border-primary/50 text-primary px-1.5 py-0.5 font-black rounded min-w-[20px] text-center shadow-[0_0_5px_rgba(var(--primary),0.3)]">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 mb-2 mt-4 font-orbitron flex items-center gap-2">
      <Hexagon size={8} className="text-primary/40 fill-primary/20" />
      {label}
    </p>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────

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
  const { data: profile } = useProfile(user?.id);

  const purchasedModuleKeys = useMemo(
    () => allModules.filter((m) => purchasedModuleIds.includes(m.id)).map((m) => m.key),
    [allModules, purchasedModuleIds],
  );

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

  // 3. Construction dynamique de la navigation
  const activeCategories = useMemo(() => {
    const categories: Record<NavCategory, NavItem[]> = {
      overview: [...baseNavigation.overview],
      operations: [...baseNavigation.operations],
      lifeSystems: [...baseNavigation.lifeSystems],
      network: [...baseNavigation.network],
      system: [...baseNavigation.system],
    };

    // Injection des modules achetés dans leurs catégories respectives
    Object.entries(moduleConfig).forEach(([key, config]) => {
      if (purchasedModuleKeys.includes(key)) {
        categories[config.category].push({
          to: config.to,
          icon: config.icon,
          label: config.label,
        });
      }
    });

    return categories;
  }, [purchasedModuleKeys]);

  const hasAnyModule = purchasedModuleKeys.some((k) => k in moduleConfig);

  return (
    <TooltipProvider delayDuration={200}>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-card/90 border border-primary/20 backdrop-blur-md text-foreground hover:text-primary transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          aria-label="Open menu"
        >
          <ChevronsRight size={20} />
        </button>
      )}

      <aside
        style={{ width: isMobile ? 288 : collapsed ? 72 : 288 }}
        className={cn(
          "flex-shrink-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl border-r border-primary/10 font-rajdhani hide-scrollbar relative",
          "shadow-[4px_0_24px_-12px_rgba(var(--primary),0.15)] dark:shadow-[4px_0_24px_-12px_rgba(var(--primary),0.3)]",
          "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          !isMobile && "sticky top-0 h-screen overflow-hidden",
          isMobile && "fixed top-0 left-0 h-full transition-transform duration-300",
          isMobile && (mobileOpen ? "translate-x-0" : "-translate-x-full"),
        )}
      >
        {/* Subtle background tech lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* ─── HEADER ─── */}
        <div className="relative mb-2" style={{ padding: mini ? "16px 8px" : "24px" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

          <div
            className={cn(
              "flex items-center relative z-10 transition-all duration-300",
              mini ? "justify-center" : "gap-4",
            )}
          >
            <div
              className="relative shrink-0 group cursor-pointer"
              onClick={() => {
                navigate("/");
                closeMobile();
              }}
            >
              <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div
                className={cn(
                  "relative bg-card border border-primary/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-[0_0_15px_rgba(var(--primary),0.2)]",
                  mini ? "w-10 h-10" : "w-12 h-12",
                )}
                style={{ clipPath: "polygon(25% 0%, 100% 0%, 100% 75%, 75% 100%, 0% 100%, 0% 25%)" }}
              >
                <span
                  className={cn(
                    "font-black font-orbitron text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]",
                    mini ? "text-lg" : "text-2xl",
                  )}
                >
                  P
                </span>
              </div>
            </div>

            <div
              className={cn(
                "flex flex-col transition-all duration-300",
                mini ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100 overflow-visible",
              )}
            >
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

        <div className="h-px mx-4 bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-2" />

        {/* Desktop collapse toggle */}
        {!isMobile && (
          <div className={cn("flex mb-2 px-3", mini ? "justify-center" : "justify-end")}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md text-primary/50 hover:text-primary hover:bg-primary/10 transition-all duration-200 border border-transparent hover:border-primary/20"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
          </div>
        )}

        {/* ─── NAVIGATION ─── */}
        <nav className={cn("flex-1 overflow-y-auto hide-scrollbar relative z-10 pb-6", mini ? "px-2" : "px-3")}>
          {/* OVERVIEW */}
          <div className="space-y-0.5 mb-4">
            {!mini && <SectionLabel label="Overview" />}
            {activeCategories.overview.map((item) => (
              <SidebarNavItem
                key={item.to}
                {...item}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}
          </div>

          {/* OPERATIONS */}
          <div className="space-y-0.5 mb-4">
            {!mini && <SectionLabel label="Operations" />}
            {activeCategories.operations.map((item) => (
              <SidebarNavItem
                key={item.to}
                {...item}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}

            {/* CTA Shop si aucun module d'opération acheté */}
            {!hasAnyModule && !mini && (
              <button
                onClick={() => {
                  navigate("/shop");
                  closeMobile();
                }}
                className="mt-2 px-3 py-2 w-full rounded-lg border border-dashed border-primary/30 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all text-xs font-bold tracking-wider text-left flex items-center gap-3 group"
              >
                <Sparkles size={14} className="opacity-50 group-hover:opacity-100 group-hover:animate-pulse" />
                Install Modules
              </button>
            )}
          </div>

          {/* LIFE SYSTEMS (Affiché uniquement si des modules sont achetés) */}
          {activeCategories.lifeSystems.length > 0 && (
            <div className="space-y-0.5 mb-4">
              {!mini && <SectionLabel label="Life_Systems" />}
              {activeCategories.lifeSystems.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  {...item}
                  mini={mini}
                  closeMobile={closeMobile}
                  navigate={navigate}
                  location={location}
                />
              ))}
            </div>
          )}

          {/* NETWORK */}
          <div className="space-y-0.5 mb-4">
            {!mini && <SectionLabel label="Nexus_Network" />}
            {activeCategories.network.map((item) => (
              <SidebarNavItem
                key={item.to}
                {...item}
                badge={getBadgeCount(item.badgeKey)}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}
          </div>

          {/* SYSTEM */}
          <div className="space-y-0.5 mb-4">
            {!mini && <SectionLabel label="System" />}
            {activeCategories.system.map((item) => (
              <SidebarNavItem
                key={item.to}
                {...item}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}
          </div>
        </nav>

        {/* ─── FOOTER (MENU SIMPLIFIÉ) ─── */}
        <div
          className={cn(
            "mt-auto relative border-t border-primary/20 bg-black/40 backdrop-blur-xl",
            mini ? "p-2" : "p-4",
          )}
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full group outline-none">
                <div
                  className={cn(
                    "flex items-center transition-all duration-300 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/30 relative overflow-hidden",
                    mini ? "justify-center p-1.5" : "gap-3 p-2.5",
                  )}
                >
                  {/* Hover scanline effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]" />

                  <div className="relative shrink-0">
                    <Avatar
                      className={cn(
                        "border border-primary/40 ring-2 ring-transparent transition-all group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(var(--primary),0.5)]",
                        mini ? "h-8 w-8" : "h-10 w-10",
                      )}
                    >
                      <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-muted text-primary font-orbitron text-xs">
                        {profile?.display_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {totalUnread > 0 && (
                      <NotificationBadge
                        count={totalUnread}
                        size="sm"
                        className="absolute -top-1 -right-1 shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                      />
                    )}
                  </div>

                  {!mini && (
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold text-foreground uppercase tracking-wider font-orbitron truncate group-hover:text-primary transition-colors drop-shadow-md">
                        {profile?.display_name || "Agent"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono tracking-widest truncate">
                        ID:{user?.id?.slice(0, 6).toUpperCase() || "UNKNOWN"}
                      </p>
                    </div>
                  )}

                  {!mini && (
                    <div className="text-primary/50 group-hover:text-primary transition-colors">
                      <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                    </div>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>

            {/* Menu Dropdown Allégé */}
            <DropdownMenuContent
              align={mini ? "start" : "end"}
              side="right"
              className="w-56 bg-background/95 border-primary/30 text-popover-foreground font-rajdhani shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl p-1"
              sideOffset={12}
            >
              <div className="px-3 py-2 text-[10px] uppercase font-black text-primary/70 tracking-[0.2em] font-orbitron flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Terminal
              </div>

              <DropdownMenuSeparator className="bg-primary/20 mb-1" />

              <DropdownMenuItem
                onClick={() => {
                  navigate("/profile");
                  closeMobile();
                }}
                className="p-3 focus:bg-primary/15 focus:text-primary cursor-pointer group rounded-sm"
              >
                <UserCircle className="mr-3 h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="text-sm font-bold tracking-wide">My Profile</span>
              </DropdownMenuItem>

              {/* Raccourci vers une future page de settings globale (ou garde le routing actuel vers un onglet spécifique) */}
              <DropdownMenuItem
                onClick={() => {
                  navigate("/profile/settings");
                  closeMobile();
                }}
                className="p-3 focus:bg-primary/15 focus:text-primary cursor-pointer group rounded-sm"
              >
                <Settings className="mr-3 h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="text-sm font-bold tracking-wide">System Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-primary/20 my-1" />

              <DropdownMenuItem
                onClick={() => {
                  navigate("/pact-selector");
                  closeMobile();
                }}
                className="p-3 focus:bg-primary/15 focus:text-primary cursor-pointer group rounded-sm"
              >
                <RefreshCw className="mr-3 h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="text-sm font-bold tracking-wide">Switch Pact</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-primary/20 my-1" />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="p-3 text-red-400 focus:bg-red-500/15 focus:text-red-400 cursor-pointer group rounded-sm"
              >
                <LogOut className="mr-3 h-4 w-4 text-red-400/70 group-hover:text-red-400 transition-colors" />
                <span className="text-sm font-bold tracking-wide">Disconnect</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
});
