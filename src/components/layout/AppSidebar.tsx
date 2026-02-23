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
  Shield,
  Database,
  Settings,
  Volume2,
  UserCircle,
  Bell,
  Inbox,
  ListTodo,
  BookOpen,
  Wallet,
  Zap,
  Heart,
  Sparkles,
  Trophy,
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
  { to: "/achievements", icon: Trophy, label: "Achievements" },
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
    <aside className="sticky top-0 h-screen flex-shrink-0 z-40 w-72 flex flex-col bg-background/95 backdrop-blur-md border-r border-white/10 overflow-hidden font-rajdhani shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)] hide-scrollbar">

      {/* --- HEADER --- */}
      <div className="relative p-6 mb-2">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="relative shrink-0 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div
              className="relative w-12 h-12 bg-black border border-primary/50 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{ clipPath: "polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%)" }}
            >
              <span className="text-2xl font-black font-orbitron text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.8)]">
                P
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-xl font-black font-orbitron text-foreground tracking-[0.2em] leading-none mb-1.5 drop-shadow-sm">
              THE PACT
            </h1>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-emerald-500/90 font-mono">
                System Online
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto hide-scrollbar relative z-10 pb-6">
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 font-orbitron">
            Main_Interface
          </p>
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
                    "group relative flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 overflow-hidden",
                    isActive
                      ? "text-primary bg-primary/10 shadow-[inset_0_0_12px_-4px_rgba(var(--primary),0.3)]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5",
                  )
                }
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                )}

                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive
                      ? "text-primary drop-shadow-[0_0_6px_rgba(var(--primary),0.6)]"
                      : "group-hover:text-slate-200 group-hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-bold tracking-wider font-rajdhani",
                    isActive ? "text-foreground" : "transition-transform group-hover:translate-x-1",
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>

        {/* Modules Section */}
        {purchasedModules.length > 0 && (
          <div className="space-y-1">
            <div
              className="flex items-center justify-between px-4 mb-2 cursor-pointer group"
              onClick={() => setIsModulesExpanded(!isModulesExpanded)}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-orbitron group-hover:text-slate-300 transition-colors">
                Active_Modules
              </span>
              <div
                className={cn("transition-transform duration-300 text-slate-600", isModulesExpanded && "rotate-180")}
              >
                <ChevronDown size={12} />
              </div>
            </div>

            <div
              className={cn(
                "space-y-1 transition-all duration-500 ease-in-out overflow-hidden",
                isModulesExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              {purchasedModules.map((m) => (
                <NavLink
                  key={m.id}
                  to={m.config.route}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-xs uppercase font-bold tracking-widest transition-all duration-300 border border-transparent",
                      isActive
                        ? "text-primary bg-primary/5 border-primary/20 shadow-[0_0_10px_-5px_rgba(var(--primary),0.3)]"
                        : "text-slate-500 hover:text-slate-200 hover:bg-white/5 hover:border-white/5",
                    )
                  }
                >
                  <m.config.icon
                    size={14}
                    className={location.pathname === m.config.route ? "text-primary" : "opacity-70"}
                  />
                  {m.config.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="space-y-1">
          <div
            className="flex items-center justify-between px-4 mb-2 cursor-pointer group"
            onClick={() => setIsProfileExpanded(!isProfileExpanded)}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-orbitron group-hover:text-slate-300 transition-colors">
              User_Settings
            </span>
            <div className={cn("transition-transform duration-300 text-slate-600", isProfileExpanded && "rotate-180")}>
              <ChevronDown size={12} />
            </div>
          </div>

          <div
            className={cn(
              "space-y-1 transition-all duration-500 ease-in-out overflow-hidden relative",
              isProfileExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
            )}
          >
            <div className="absolute left-[1.15rem] top-0 bottom-2 w-px bg-gradient-to-b from-white/10 to-transparent" />

            {profileSubItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 pl-8 pr-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors relative",
                    isActive ? "text-primary" : "text-slate-500 hover:text-slate-300",
                  )
                }
              >
                <div
                  className={cn(
                    "absolute left-[1rem] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-background transition-all",
                    location.pathname === item.to || (!item.exact && location.pathname.startsWith(item.to + "/"))
                      ? "bg-primary scale-110"
                      : "bg-slate-700",
                  )}
                />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* --- FOOTER --- */}
      <div className="mt-auto relative border-t border-white/10 bg-black/20 backdrop-blur-xl p-4">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full group outline-none">
              <div className="flex items-center gap-3 p-2.5 transition-all duration-300 rounded-lg group-hover:bg-white/5 border border-transparent group-hover:border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                <div className="relative">
                  <Avatar className="h-9 w-9 border border-primary/30 ring-1 ring-black/50 transition-all group-hover:border-primary">
                    <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-slate-900 text-primary font-orbitron text-xs">
                      {profile?.display_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {/* Correction : Badge placé directement en sibling de l'Avatar, sans wrapper positionné */}
                  <NotificationBadge count={totalUnread} size="sm" className="shadow-[0_0_5px_rgba(0,0,0,0.8)]" />
                </div>

                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-wider font-orbitron truncate group-hover:text-primary transition-colors">
                    {profile?.display_name || "Agent"}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono tracking-tighter truncate">
                    ID :: {user?.id?.slice(0, 8).toUpperCase() || "UNKNOWN"}
                  </p>
                </div>

                <div className="text-slate-600 group-hover:text-primary transition-colors">
                  <Sparkles size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="right"
            className="w-56 bg-[#0a0f18] border-white/10 text-slate-200 font-rajdhani shadow-2xl backdrop-blur-xl"
            sideOffset={10}
          >
            <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
              Quick Actions
            </div>
            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem
              onClick={() => navigate("/inbox")}
              className="p-2.5 focus:bg-primary/10 focus:text-primary cursor-pointer group my-1"
            >
              <Inbox className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
              <span className="text-xs font-bold tracking-wide">Inbox</span>
              {totalUnread > 0 && (
                <span className="ml-auto text-[9px] bg-primary text-black px-1.5 py-0.5 font-black rounded-sm">
                  {totalUnread}
                </span>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleSignOut}
              className="p-2.5 text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer group my-1"
            >
              <LogOut className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
              <span className="text-xs font-bold tracking-wide">Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
