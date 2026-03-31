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
  Mail,
  RefreshCw,
  Hexagon,
  User,
  TerminalSquare,
  Crown,
  CalendarDays,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ─── CONFIGURATION DE LA NAVIGATION ────────────────────────

type NavCategory = "overview" | "operations" | "lifeSystems" | "network" | "system";

interface NavItem {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  badgeKey?: "friends" | "messages" | "inbox";
  moduleKey?: string;
}

const baseNavigation: Record<NavCategory, NavItem[]> = {
  overview: [
    { to: "/", icon: Home, label: "Dashboard", moduleKey: "dashboard" },
    { to: "/analytics", icon: BarChart3, label: "Analytics", moduleKey: "analytics" },
  ],
  operations: [
    { to: "/goals", icon: Target, label: "Goals", moduleKey: "goals" },
    { to: "/focus", icon: Timer, label: "Focus", moduleKey: "focus" },
    { to: "/calendar", icon: CalendarDays, label: "Calendar", moduleKey: "calendar" },
  ],
  lifeSystems: [],
  network: [
    { to: "/community", icon: Users, label: "Community", moduleKey: "community" },
    { to: "/friends", icon: Handshake, label: "Friends", badgeKey: "friends" },
    // On utilise badgeKey: "inbox" pour englober les messages ET les notifications
    
    { to: "/leaderboard", icon: Crown, label: "Leaderboard", moduleKey: "leaderboard" },
    { to: "/achievements", icon: Trophy, label: "Achievements", moduleKey: "achievements" },
  ],
  system: [{ to: "/shop", icon: ShoppingBag, label: "Shop", moduleKey: "shop" }],
};

const moduleConfig: Record<string, NavItem & { category: NavCategory }> = {
  "todo-list": { icon: ListTodo, to: "/todo", label: "Todo List", category: "operations" },
  "the-call": { icon: Zap, to: "/the-call", label: "The Call", category: "operations" },
  journal: { icon: BookOpen, to: "/journal", label: "Journal", category: "lifeSystems" },
  finance: { icon: Wallet, to: "/finance", label: "Finance", category: "lifeSystems" },
  "track-health": { icon: Heart, to: "/health", label: "Health", category: "lifeSystems" },
  wishlist: { icon: ShoppingCart, to: "/wishlist", label: "Wishlist", category: "lifeSystems" },
};

// Paramètres originaux restaurés
const settingsItems = [
  { to: "/profile", icon: UserCircle, label: "Account" },
  { to: "/profile/bounded", icon: User, label: "Bounded" },
  { to: "/profile/pact-settings", icon: Settings, label: "Pact Rules" },
  { to: "/profile/display-sound", icon: Volume2, label: "A/V Config" },
  { to: "/profile/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile/privacy", icon: Shield, label: "Privacy" },
  { to: "/profile/data", icon: Database, label: "Data Core" },
];

// ─── UI COMPONENTS (HUD STYLE) ─────────────────────────────

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
              "flex items-center justify-center h-10 w-10 mx-auto transition-all duration-300 relative group",
              "border-l-2",
              isActive
                ? "text-primary border-primary bg-primary/10 shadow-[inset_4px_0_15px_-5px_rgba(var(--primary),0.3)]"
                : "text-muted-foreground border-transparent hover:text-primary hover:border-primary/50 hover:bg-primary/5",
            )}
            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)" }}
          >
            <Icon size={18} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),1)]")} />
            {badge != null && badge > 0 && (
              <span className="absolute top-1 right-1 text-[8px] leading-none bg-destructive text-destructive-foreground w-3.5 h-3.5 flex items-center justify-center font-black rounded-sm shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                {badge > 99 ? "99" : badge}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="font-mono font-bold text-xs tracking-wider border-primary/50 bg-black/95 text-primary rounded-none uppercase"
        >
          {label} {badge != null && badge > 0 && `[${badge}]`}
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
          "group relative flex items-center transition-all duration-300 overflow-hidden px-3 py-2.5 mb-1",
          "border-l-2 before:absolute before:inset-0 before:z-0",
          isActive
            ? "text-primary border-primary bg-primary/10 before:bg-[linear-gradient(90deg,rgba(var(--primary),0.1)_1px,transparent_1px)] before:bg-[size:4px_4px]"
            : "text-muted-foreground border-transparent hover:text-primary hover:border-primary/50 hover:bg-primary/5",
        )
      }
      style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
    >
      {({ isActive }) => (
        <>
          <div className="relative z-10 shrink-0 flex items-center justify-center mr-3">
            <Icon
              size={18}
              className={cn(
                "transition-all duration-300",
                isActive
                  ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.9)]"
                  : "group-hover:text-primary group-hover:scale-110",
              )}
            />
          </div>
          <span
            className={cn(
              "relative z-10 text-xs font-bold tracking-[0.1em] font-mono uppercase transition-all duration-300",
              isActive
                ? "text-primary drop-shadow-[0_0_4px_rgba(var(--primary),0.5)] translate-x-1"
                : "group-hover:translate-x-1",
            )}
          >
            {isActive && <span className="opacity-50 mr-1">{">"}</span>}
            {label}
            {!isActive && (
              <span className="opacity-0 group-hover:opacity-100 ml-1 text-primary/50 transition-opacity">_</span>
            )}
          </span>

          {isActive && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-mono text-primary/40 tracking-widest">
              ACTV
            </span>
          )}

          {badge != null && badge > 0 && (
            <span className="relative z-20 ml-auto text-[8px] bg-destructive text-destructive-foreground min-w-[16px] h-[16px] flex items-center justify-center font-black rounded-sm shadow-[0_0_8px_rgba(220,38,38,0.8)]">
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
    <div className="flex items-center gap-2 mb-2 mt-5 px-3">
      <Hexagon size={10} className="text-primary/50 fill-primary/20" />
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 font-orbitron">{label}</p>
      <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
    </div>
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

  const { unreadCount, unreadByModule } = useNotifications();
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

  // Récupère intelligemment les notifications par badgeKey OU moduleKey
  const getBadgeCount = (item: NavItem) => {
    let count = 0;
    if (item.badgeKey === "friends") count += friendRequestCount;
    if (item.badgeKey === "messages") count += messageUnreadCount;
    // INBOX montre la somme des messages ET des notifications globales
    if (item.badgeKey === "inbox") count += messageUnreadCount + unreadCount;
    if (item.moduleKey && unreadByModule[item.moduleKey]) count += unreadByModule[item.moduleKey];
    return count;
  };

  const mini = collapsed && !isMobile;

  const activeCategories = useMemo(() => {
    const categories: Record<NavCategory, NavItem[]> = {
      overview: [...baseNavigation.overview],
      operations: [...baseNavigation.operations],
      lifeSystems: [...baseNavigation.lifeSystems],
      network: [...baseNavigation.network],
      system: [...baseNavigation.system],
    };

    Object.entries(moduleConfig).forEach(([key, config]) => {
      if (purchasedModuleKeys.includes(key)) {
        categories[config.category].push({
          to: config.to,
          icon: config.icon,
          label: config.label,
          moduleKey: key, // On lie la clé du module pour les notifications dynamiques
        });
      }
    });

    return categories;
  }, [purchasedModuleKeys]);

  const hasAnyModule = purchasedModuleKeys.some((k) => k in moduleConfig);

  return (
    <TooltipProvider delayDuration={100}>
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm animate-in fade-in-0 duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-black/80 border border-primary/40 text-primary hover:bg-primary/20 transition-colors shadow-[0_0_15px_rgba(var(--primary),0.3)]"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)" }}
        >
          <ChevronsRight size={20} />
        </button>
      )}

      <aside
        style={{ width: isMobile ? 280 : collapsed ? 72 : 280 }}
        className={cn(
          "flex-shrink-0 z-50 flex flex-col bg-[#050508] border-r border-primary/20 font-rajdhani hide-scrollbar relative",
          "shadow-[8px_0_30px_-10px_rgba(var(--primary),0.15)]",
          "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          !isMobile && "sticky top-0 h-screen overflow-hidden",
          isMobile && "fixed top-0 left-0 h-full transition-transform duration-300",
          isMobile && (mobileOpen ? "translate-x-0" : "-translate-x-full"),
        )}
      >
        {/* HUD Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Decorative Corner Brackets */}
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50 pointer-events-none" />

        {/* ─── HEADER ─── */}
        <div className="relative mb-4" style={{ padding: mini ? "20px 8px" : "24px 20px" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

          <div
            className={cn(
              "flex items-center relative z-10 transition-all duration-300",
              mini ? "justify-center" : "gap-4",
            )}
          >
            {/* HUD Logo */}
            <div
              className="relative shrink-0 group cursor-pointer"
              onClick={() => {
                navigate("/");
                closeMobile();
              }}
            >
              <div className="absolute -inset-3 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
              <div
                className={cn(
                  "relative bg-[#0a0a0c] border border-primary flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)]",
                  mini ? "w-10 h-10" : "w-12 h-12",
                )}
                style={{ clipPath: "polygon(25% 0%, 100% 0%, 100% 75%, 75% 100%, 0% 100%, 0% 25%)" }}
              >
                <span
                  className={cn(
                    "font-black font-orbitron text-primary drop-shadow-[0_0_8px_rgba(var(--primary),1)]",
                    mini ? "text-lg" : "text-2xl",
                  )}
                >
                  ​V
                </span>
              </div>
            </div>

            <div
              className={cn(
                "flex flex-col transition-all duration-300",
                mini ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100 overflow-visible",
              )}
            >
              <h1 className="text-xl font-black font-orbitron text-foreground tracking-[0.25em] leading-none mb-1 drop-shadow-md whitespace-nowrap">
                VOWPACT
              </h1>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                </div>
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-emerald-400 font-mono">
                  SYS.ONLINE // v4.0.1
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop collapse toggle */}
        {!isMobile && (
          <div className={cn("flex mb-2 px-3", mini ? "justify-center" : "justify-end")}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 text-primary/40 hover:text-primary transition-all duration-200 border border-transparent hover:border-primary/40 bg-black/40 hover:bg-primary/10"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)" }}
              aria-label={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
            </button>
          </div>
        )}

        {/* ─── NAVIGATION ─── */}
        <nav className={cn("flex-1 overflow-y-auto hide-scrollbar relative z-10 pb-6", mini ? "px-1.5" : "px-3")}>
          <div className="space-y-0.5 mb-2">
            {!mini && <SectionLabel label="Dashboard" />}
            {activeCategories.overview.map((item) => (
              <SidebarNavItem
                key={item.to}
                {...item}
                badge={getBadgeCount(item)}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}
          </div>

          <div className="space-y-0.5 mb-2">
            {!mini && <SectionLabel label="Operations" />}
            {activeCategories.operations.map((item) => (
              <SidebarNavItem
                key={item.to}
                {...item}
                badge={getBadgeCount(item)}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}

            {!hasAnyModule && !mini && (
              <button
                onClick={() => {
                  navigate("/shop");
                  closeMobile();
                }}
                className="mt-2 px-3 py-2.5 w-full border border-dashed border-primary/30 text-primary/60 hover:text-primary hover:border-primary hover:bg-primary/10 transition-all text-xs font-bold tracking-[0.1em] font-mono text-left flex items-center gap-3 group"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
              >
                <Sparkles size={14} className="opacity-50 group-hover:opacity-100 group-hover:animate-pulse" />
                INSTALL_MODULES
              </button>
            )}
          </div>

          {activeCategories.lifeSystems.length > 0 && (
            <div className="space-y-0.5 mb-2">
              {!mini && <SectionLabel label="Life Systems" />}
              {activeCategories.lifeSystems.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  {...item}
                  badge={getBadgeCount(item)}
                  mini={mini}
                  closeMobile={closeMobile}
                  navigate={navigate}
                  location={location}
                />
              ))}
            </div>
          )}

          <div className="space-y-0.5 mb-2">
            {!mini && <SectionLabel label="Social" />}
            {activeCategories.network.map((item) => (
              <SidebarNavItem
                key={item.to}
                {...item}
                badge={getBadgeCount(item)}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}
          </div>

          <div className="space-y-0.5 mb-2">
            {!mini && <SectionLabel label="System" />}
            {activeCategories.system.map((item) => (
              <SidebarNavItem
                key={item.to}
                {...item}
                badge={getBadgeCount(item)}
                mini={mini}
                closeMobile={closeMobile}
                navigate={navigate}
                location={location}
              />
            ))}
          </div>
        </nav>

        {/* ─── TERMINAL FOOTER (PARAMÈTRES RESTAURÉS) ─── */}
        <div className={cn("mt-auto relative bg-[#0a0a0c] border-t border-primary/30", mini ? "p-1.5" : "p-3")}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/80 to-transparent shadow-[0_0_10px_rgba(var(--primary),0.8)]" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full group outline-none">
                <div
                  className={cn(
                    "flex items-center transition-all duration-300 hover:bg-primary/10 border border-transparent hover:border-primary/40 relative overflow-hidden",
                    mini ? "justify-center p-2 rounded-none" : "gap-3 p-2",
                  )}
                  style={{
                    clipPath: mini
                      ? "none"
                      : "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -translate-y-full group-hover:animate-[scan_2s_linear_infinite]" />

                  <div className="relative shrink-0">
                    <Avatar
                      className={cn(
                        "border border-primary/40 rounded-none transition-all group-hover:border-primary group-hover:shadow-[0_0_10px_rgba(var(--primary),0.5)]",
                        mini ? "h-8 w-8" : "h-9 w-9",
                      )}
                    >
                      <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-black text-primary font-orbitron text-xs rounded-none">
                        {profile?.display_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {totalUnread > 0 && (
                      <NotificationBadge
                        count={totalUnread}
                        size="sm"
                        className="absolute -top-1.5 -right-1.5 shadow-[0_0_8px_rgba(var(--primary),0.8)] rounded-none border border-black"
                      />
                    )}
                  </div>

                  {!mini && (
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold text-primary uppercase tracking-widest font-orbitron truncate group-hover:text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.8)]">
                        {profile?.display_name || "AGENT_UNKNOWN"}
                      </p>
                      <p className="text-[9px] text-primary/50 font-mono tracking-widest truncate">
                        ID:{user?.id?.slice(0, 8).toUpperCase() || "00000000"}
                      </p>
                    </div>
                  )}

                  {!mini && (
                    <div className="text-primary/40 group-hover:text-primary transition-colors">
                      <TerminalSquare size={16} className="group-hover:animate-pulse" />
                    </div>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>

            {/* Menu Dropdown Type Terminal HUD */}
            <DropdownMenuContent
              align={mini ? "start" : "end"}
              side="right"
              className="w-72 bg-[#050508]/95 border border-primary/40 text-primary font-mono shadow-[0_0_30px_rgba(var(--primary),0.15)] rounded-none backdrop-blur-xl p-0"
              sideOffset={16}
            >
              {/* Header du dropdown */}
              <div className="px-3 py-2 bg-primary/10 border-b border-primary/30 flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] font-orbitron drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
                  System_Config
                </span>
                <div className="w-1.5 h-1.5 bg-primary animate-pulse shadow-[0_0_5px_rgba(var(--primary),1)]" />
              </div>

              {/* Grille de paramètres restaurée (2 colonnes) */}
              <div className="p-2 grid grid-cols-2 gap-1 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px]">
                {settingsItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.to}
                      onClick={() => {
                        navigate(item.to);
                        closeMobile();
                      }}
                      className="p-2 focus:bg-primary/20 focus:text-primary cursor-pointer group rounded-none border border-transparent hover:border-primary/30 transition-all flex items-center h-10"
                    >
                      <ItemIcon className="mr-2 h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:text-primary" />
                      <span className="text-[10px] font-bold tracking-wider uppercase truncate">{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </div>

              <div className="h-px bg-primary/20" />

              {/* Actions Globales */}
              <div className="p-2 space-y-1">
                {/* 1. Redirige vers /inbox (au lieu de /notifications)
                  2. Affiche totalUnread pour être strictement cohérent avec la pastille de l'avatar 
                */}
                <DropdownMenuItem
                  onClick={() => {
                    navigate("/inbox");
                    closeMobile();
                  }}
                  className="p-2 focus:bg-primary/20 focus:text-primary cursor-pointer group rounded-none flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Mail className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
                    <span className="text-xs font-bold tracking-widest uppercase">Inbox</span>
                  </div>
                  {totalUnread > 0 && (
                    <span className="bg-primary text-[#050508] text-[9px] px-1.5 py-0.5 font-bold rounded-sm">
                      {totalUnread}
                    </span>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    navigate("/pact-selector");
                    closeMobile();
                  }}
                  className="p-2 focus:bg-primary/20 focus:text-primary cursor-pointer group rounded-none flex items-center"
                >
                  <RefreshCw className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
                  <span className="text-xs font-bold tracking-widest uppercase">Switch_Pact</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="p-2 text-destructive focus:bg-destructive/20 focus:text-destructive cursor-pointer group rounded-none flex items-center"
                >
                  <LogOut className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
                  <span className="text-xs font-bold tracking-widest uppercase">Terminate_Session</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
});
