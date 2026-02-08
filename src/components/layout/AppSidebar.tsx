import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useShopModules, useUserModulePurchases } from "@/hooks/useShop";
import {
  Home,
  Target,
  ShoppingBag,
  ShoppingCart,
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
  const [isProfileExpanded, setIsProfileExpanded] = useState(location.pathname.startsWith("/profile"));
  const [isModulesExpanded, setIsModulesExpanded] = useState(
    Object.values(moduleConfig).some((m) => location.pathname.startsWith(m.route)),
  );

  const { unreadCount } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();
  const totalUnread = unreadCount + messageUnreadCount;

  const { data: allModules = [] } = useShopModules();
  const { data: purchasedModuleIds = [] } = useUserModulePurchases(user?.id);

  const purchasedModules = allModules
    .filter((m) => purchasedModuleIds.includes(m.id))
    .filter((m) => moduleConfig[m.key])
    .map((m) => ({ ...m, config: moduleConfig[m.key] }));

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
    <aside className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col bg-background border-r border-border overflow-hidden font-rajdhani transition-colors duration-300">
      {/* --- CSS INJECTION POUR MASQUER LA SCROLLBAR --- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

      {/* --- VFX: SCANLINES & GRID (Adaptatifs) --- */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%), linear-gradient(90deg, rgba(255,0,0,0.04), rgba(0,255,0,0.01), rgba(0,0,255,0.04))`,
          backgroundSize: "100% 2px, 3px 100%",
        }}
      />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      {/* --- HEADER: IDENTITY --- */}
      <div className="relative p-8 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 group">
            <div className="absolute -inset-1.5 bg-primary/40 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-500" />
            <div
              className="relative w-12 h-12 bg-card border-2 border-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.2)]"
              style={{ clipPath: "polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%)" }}
            >
              <span className="text-2xl font-black font-orbitron text-primary drop-shadow-[0_0_8px_rgba(59,180,255,0.5)]">
                P
              </span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black font-orbitron text-foreground tracking-[0.2em] leading-none mb-1">
              THE PACT
            </h1>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-emerald-500/80">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto hide-scrollbar relative z-10">
        {/* Main Section */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-4 px-4 py-3 transition-all duration-300 overflow-hidden rounded-md",
                    isActive
                      ? "text-primary bg-primary/10 border-l-2 border-primary shadow-[inset_4px_0_10px_-4px_rgba(var(--primary),0.2)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )
                }
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    isActive
                      ? "scale-110 drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]"
                      : "group-hover:text-foreground",
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-[0.2em]",
                    !isActive && "group-hover:translate-x-1 transition-transform",
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Modules Section */}
        {purchasedModules.length > 0 && (
          <div className="mt-8">
            <div className="px-4 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 italic">
                System_Modules
              </span>
              <div className="h-px flex-1 bg-border ml-4" />
            </div>
            <button
              onClick={() => setIsModulesExpanded(!isModulesExpanded)}
              className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-4">
                <Puzzle size={16} />
                <span className="text-[11px] font-bold uppercase tracking-widest">Extension Kit</span>
              </div>
              {isModulesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <div
              className={cn(
                "mt-1 space-y-0.5 transition-all overflow-hidden border-l border-border ml-6",
                isModulesExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              {purchasedModules.map((m) => (
                <NavLink
                  key={m.id}
                  to={m.config.route}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-4 pl-6 pr-4 py-2.5 text-[10px] uppercase font-bold tracking-[0.15em]",
                      isActive
                        ? "text-primary bg-primary/5 border-l-2 border-primary -ml-[2px]"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    )
                  }
                >
                  <m.config.icon size={14} />
                  {m.config.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="mt-4">
          <button
            onClick={() => setIsProfileExpanded(!isProfileExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2 transition-colors",
              location.pathname.startsWith("/profile") ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <div className="flex items-center gap-4">
              <User size={16} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Security & Profile</span>
            </div>
            {isProfileExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <div
            className={cn(
              "mt-1 space-y-0.5 transition-all overflow-hidden border-l border-border ml-6",
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
                    "flex items-center gap-4 pl-6 pr-4 py-2 text-[9px] uppercase font-bold tracking-widest transition-colors",
                    isActive
                      ? "text-primary italic bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* --- FOOTER: USER PANEL --- */}
      <div className="mt-auto relative border-t border-border bg-card/50 backdrop-blur-xl p-4">
        {/* Glow Line Animé */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-primary/50 animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full group">
              <div className="flex items-center gap-3 p-3 transition-all duration-500 rounded-lg group-hover:bg-accent border border-transparent group-hover:border-border">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-md group-hover:bg-primary/20 transition-colors" />
                  <Avatar className="h-10 w-10 border border-primary/40 ring-2 ring-background">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-primary font-orbitron text-xs">
                      {profile?.display_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <NotificationBadge count={totalUnread} size="sm" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-black text-foreground uppercase tracking-wider font-orbitron truncate leading-none mb-1">
                    {profile?.display_name || "Agent"}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-mono tracking-tighter truncate opacity-70">
                    ID_{user?.id?.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <Settings
                  size={14}
                  className="text-muted-foreground group-hover:rotate-90 transition-transform duration-500"
                />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-64 bg-popover border-border text-popover-foreground font-rajdhani shadow-2xl"
          >
            <DropdownMenuItem onClick={() => navigate("/inbox")} className="p-3 focus:bg-accent cursor-pointer group">
              <Inbox className="mr-3 h-4 w-4 text-primary group-hover:animate-bounce" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Internal Comms</span>
              {totalUnread > 0 && (
                <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5 font-black rounded-sm">
                  {totalUnread}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="p-3 text-destructive focus:bg-destructive/10 cursor-pointer group"
            >
              <LogOut className="mr-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Terminate Access</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
