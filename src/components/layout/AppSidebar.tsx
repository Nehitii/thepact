import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useShopModules, useUserModulePurchases } from "@/hooks/useShop";
import {
  Home,
  Target,
  ShoppingBag,
  Users,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield,
  Database,
  Settings,
  Volume2,
  UserCircle,
  Bell,
  Inbox,
  Puzzle,
  ListTodo,
  BookOpen,
  Wallet,
  Zap,
  Heart,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
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
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// --- CONFIGURATION DES MENUS ---

const mainNavItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/goals", icon: Target, label: "Goals" },
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
  "track-health": { icon: Heart, route: "/health", label: "Track Health" },
  wishlist: { icon: ShoppingCart, route: "/wishlist", label: "Wishlist" },
};

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // États de navigation
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModulesExpanded, setIsModulesExpanded] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(location.pathname.startsWith("/profile"));

  const { unreadCount } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();
  const totalUnread = unreadCount + messageUnreadCount;

  // Données des modules
  const { data: allModules = [] } = useShopModules();
  const { data: purchasedModuleIds = [] } = useUserModulePurchases(user?.id);

  const purchasedModules = allModules
    .filter((m) => purchasedModuleIds.includes(m.id))
    .filter((m) => moduleConfig[m.key])
    .map((m) => ({ ...m, config: moduleConfig[m.key] }));

  // Profil utilisateur
  const { data: profile } = useQuery({
    queryKey: ["sidebar-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user?.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-all duration-300 ease-in-out font-rajdhani border-r border-border backdrop-blur-md",
        "bg-background/95 dark:bg-[#03060a]/98", // Dark mode spec
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* --- CSS POUR MASQUER LA SCROLLBAR --- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

      {/* --- HEADER: LOGO & COLLAPSE --- */}
      <div className={cn("p-4 flex items-center mb-4", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 animate-in fade-in duration-500 overflow-hidden">
            <div className="w-9 h-9 border border-primary/40 flex items-center justify-center bg-primary/5 rounded-lg shadow-[0_0_15px_rgba(var(--primary),0.1)]">
              <span className="font-orbitron font-black text-primary text-lg">P</span>
            </div>
            <div>
              <h1 className="text-sm font-black font-orbitron text-foreground tracking-widest">THE PACT</h1>
              <p className="text-[8px] text-primary/50 font-bold uppercase tracking-tighter italic">Command_Center</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto no-scrollbar relative z-10">
        {/* Main Items */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive =
              location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center transition-all duration-200 rounded-xl relative",
                    isCollapsed ? "justify-center h-12 w-12 mx-auto" : "px-4 py-2.5 gap-4",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )
                }
              >
                <item.icon
                  size={isCollapsed ? 22 : 18}
                  className={cn("shrink-0", isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]")}
                />
                {!isCollapsed && <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{item.label}</span>}
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full shadow-[0_0_10px_#3bb4ff]" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Modules Section */}
        {purchasedModules.length > 0 && (
          <div className="pt-4">
            {!isCollapsed ? (
              <>
                <button
                  onClick={() => setIsModulesExpanded(!isModulesExpanded)}
                  className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground/40 hover:text-primary transition-colors mb-1"
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">System_Modules</span>
                  {isModulesExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <div
                  className={cn(
                    "space-y-1 transition-all overflow-hidden border-l border-border ml-6 mt-1",
                    isModulesExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  {purchasedModules.map((m) => (
                    <NavLink
                      key={m.id}
                      to={m.config.route}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 pl-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all",
                          isActive ? "text-primary italic" : "text-muted-foreground hover:text-foreground",
                        )
                      }
                    >
                      <m.config.icon size={14} /> {m.config.label}
                    </NavLink>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-px bg-border my-4 mx-4" />
            )}
          </div>
        )}

        {/* Profile Section (Tous les menus réintégrés) */}
        <div className="pt-2">
          {!isCollapsed ? (
            <>
              <button
                onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2 transition-colors",
                  location.pathname.startsWith("/profile")
                    ? "text-primary"
                    : "text-muted-foreground/40 hover:text-primary",
                )}
              >
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Terminal_Config</span>
                {isProfileExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              <div
                className={cn(
                  "space-y-1 transition-all overflow-hidden border-l border-border ml-6 mt-1",
                  isProfileExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
                )}
              >
                {profileSubItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 pl-4 py-2 text-[9px] uppercase font-bold tracking-[0.15em] transition-all",
                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                      )
                    }
                  >
                    <item.icon size={13} /> {item.label}
                  </NavLink>
                ))}
              </div>
            </>
          ) : (
            <NavLink
              to="/profile"
              className="flex h-12 w-12 mx-auto items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-primary transition-all"
            >
              <Settings size={22} />
            </NavLink>
          )}
        </div>
      </nav>

      {/* --- FOOTER: USER PANEL --- */}
      <div
        className={cn(
          "mt-auto p-4 border-t border-border bg-accent/5 backdrop-blur-md transition-all",
          isCollapsed && "px-2 py-6",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full group flex items-center transition-all rounded-xl",
                isCollapsed ? "justify-center" : "gap-3 p-2 hover:bg-accent/50",
              )}
            >
              <div className="relative shrink-0">
                <Avatar
                  className={cn(
                    "border border-border transition-all",
                    isCollapsed ? "h-11 w-11" : "h-9 w-9 ring-1 ring-primary/20",
                  )}
                >
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-orbitron">
                    {profile?.display_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <NotificationBadge count={totalUnread} size="sm" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0 animate-in fade-in duration-300">
                  <p className="text-[10px] font-black text-foreground uppercase tracking-widest truncate font-orbitron">
                    {profile?.display_name || "Agent"}
                  </p>
                  <p className="text-[8px] text-primary/60 font-mono tracking-tighter truncate italic uppercase">
                    Sync_Active
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isCollapsed ? "start" : "end"}
            side={isCollapsed ? "right" : "top"}
            className="w-64 bg-popover border-border shadow-2xl font-rajdhani ml-2 p-1"
          >
            <DropdownMenuItem
              onClick={() => navigate("/inbox")}
              className="p-3 focus:bg-primary/10 cursor-pointer rounded-lg"
            >
              <Inbox size={14} className="mr-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Internal Comms</span>
              {totalUnread > 0 && (
                <span className="ml-auto bg-primary text-black px-1.5 font-black rounded text-[9px] shadow-[0_0_10px_rgba(var(--primary),0.5)]">
                  {totalUnread}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="p-3 text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg"
            >
              <LogOut size={14} className="mr-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Terminate Session</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
