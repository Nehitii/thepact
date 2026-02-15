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
  Terminal,
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

// --- Configuration ---
const mainNavItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/goals", icon: Target, label: "Goals Protocol" },
  { to: "/shop", icon: ShoppingBag, label: "Supply Drop" },
  { to: "/community", icon: Users, label: "Network" },
];

const profileSubItems = [
  { to: "/profile", icon: UserCircle, label: "Identity", exact: true },
  { to: "/profile/bounded", icon: User, label: "Bounded Profile" },
  { to: "/profile/pact-settings", icon: Settings, label: "Pact Config" },
  { to: "/profile/display-sound", icon: Volume2, label: "A/V Settings" },
  { to: "/profile/notifications", icon: Bell, label: "Signals" },
  { to: "/profile/privacy", icon: Shield, label: "Security" },
  { to: "/profile/data", icon: Database, label: "Data Core" },
];

const moduleConfig: Record<string, { icon: any; route: string; label: string }> = {
  "todo-list": { icon: ListTodo, route: "/todo", label: "Task Matrix" },
  journal: { icon: BookOpen, route: "/journal", label: "Log Files" },
  finance: { icon: Wallet, route: "/finance", label: "Credits" },
  "the-call": { icon: Zap, route: "/the-call", label: "The Call" },
  "track-health": { icon: Heart, route: "/health", label: "Bio-Monitor" },
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

  // Composant pour les liens de navigation principaux
  const NavItem = ({ to, icon: Icon, label, end = false }: { to: string; icon: any; label: string; end?: boolean }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-300 overflow-hidden mb-1",
          isActive
            ? "text-primary bg-primary/10 border-l-2 border-primary shadow-[inset_10px_0_20px_-10px_rgba(var(--primary),0.3)]"
            : "text-muted-foreground hover:text-foreground hover:bg-white/5 border-l-2 border-transparent",
        )
      }
    >
      <Icon
        className={cn("h-4 w-4 transition-all duration-300", "group-[.active]:drop-shadow-[0_0_5px_currentColor]")}
      />
      <span className="text-xs font-bold uppercase tracking-widest font-rajdhani flex-1">{label}</span>
      {/* Petit indicateur tech à droite si actif */}
      <div
        className={cn(
          "h-1.5 w-1.5 bg-primary rounded-full opacity-0 transition-opacity",
          location.pathname === to || (to !== "/" && location.pathname.startsWith(to))
            ? "opacity-100 shadow-[0_0_5px_currentColor]"
            : "",
        )}
      />
    </NavLink>
  );

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col bg-[#050505] border-r border-white/10 overflow-hidden font-rajdhani shadow-2xl">
      {/* Background Tech Grid effect (Optionnel, ajoute de la texture) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />

      {/* --- HEADER --- */}
      <div className="relative p-6 pb-2">
        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
          <div className="relative shrink-0 group">
            <div className="absolute -inset-1 bg-primary rounded-lg blur opacity-20 group-hover:opacity-60 transition duration-500 animate-pulse" />
            <div className="relative w-10 h-10 bg-black border border-primary/50 flex items-center justify-center rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-primary/10" />
              <span className="text-xl font-black font-orbitron text-primary relative z-10">P</span>
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black font-orbitron text-white tracking-[0.15em] leading-none mb-1 shadow-black drop-shadow-md">
              THE PACT
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-emerald-500/90 font-mono">
                System_Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- SCROLL AREA --- */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {/* Main Navigation */}
        <div className="mb-6">
          <p className="px-2 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
            <Terminal size={10} /> Main_Comms
          </p>
          <nav className="flex flex-col gap-0.5">
            {mainNavItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
        </div>

        {/* Modules Section */}
        {purchasedModules.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setIsModulesExpanded(!isModulesExpanded)}
              className="w-full flex items-center justify-between px-2 mb-2 group text-slate-500 hover:text-primary transition-colors"
            >
              <span className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <Puzzle size={10} /> Extensions
              </span>
              <div className={cn("transition-transform duration-300", isModulesExpanded ? "rotate-180" : "")}>
                <ChevronDown size={12} />
              </div>
            </button>

            <div
              className={cn(
                "space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out pl-2 border-l border-white/5 ml-1",
                isModulesExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              {purchasedModules.map((m) => (
                <NavLink
                  key={m.id}
                  to={m.config.route}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 text-[10px] uppercase font-bold tracking-[0.1em] rounded-r-md transition-all",
                      isActive
                        ? "text-primary bg-primary/5 border-l border-primary"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l border-transparent",
                    )
                  }
                >
                  <m.config.icon size={13} className={cn(isActive ? "text-primary" : "text-slate-500")} />
                  {m.config.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div>
          <button
            onClick={() => setIsProfileExpanded(!isProfileExpanded)}
            className="w-full flex items-center justify-between px-2 mb-2 group text-slate-500 hover:text-primary transition-colors"
          >
            <span className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <User size={10} /> User_Data
            </span>
            <div className={cn("transition-transform duration-300", isProfileExpanded ? "rotate-180" : "")}>
              <ChevronDown size={12} />
            </div>
          </button>

          <div
            className={cn(
              "space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out pl-2 border-l border-white/5 ml-1",
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
                    "flex items-center gap-3 px-3 py-2 text-[9px] uppercase font-bold tracking-[0.1em] rounded-r-md transition-all",
                    isActive
                      ? "text-primary bg-primary/5 border-l border-primary"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l border-transparent",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="relative p-4 mt-auto">
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full group relative overflow-hidden rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all duration-300 p-3 text-left">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

              <div className="relative flex items-center gap-3 z-10">
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-primary/30 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-black text-primary font-orbitron text-xs font-bold">
                      {profile?.display_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <NotificationBadge count={totalUnread} size="sm" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white uppercase tracking-wider font-orbitron truncate group-hover:text-primary transition-colors">
                    {profile?.display_name || "Agent"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono tracking-tighter truncate">
                    ID: {user?.id?.slice(0, 8).toUpperCase() ?? "UNKNOWN"}
                  </p>
                </div>

                <Settings
                  size={14}
                  className="text-slate-500 group-hover:text-primary group-hover:rotate-90 transition-all duration-500"
                />
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="right"
            sideOffset={10}
            className="w-56 bg-[#0a0a0a] border border-primary/20 text-slate-200 font-rajdhani backdrop-blur-xl shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]"
          >
            <div className="px-2 py-1.5 text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold border-b border-white/5 mb-1">
              System_Controls
            </div>
            <DropdownMenuItem
              onClick={() => navigate("/inbox")}
              className="p-2.5 focus:bg-primary/10 focus:text-primary cursor-pointer group"
            >
              <Inbox className="mr-3 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Inbox</span>
              {totalUnread > 0 && (
                <span className="ml-auto text-[9px] bg-primary text-black px-1.5 py-0.5 font-black rounded-sm shadow-[0_0_5px_currentColor]">
                  {totalUnread}
                </span>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10 my-1" />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="p-2.5 text-red-400 focus:bg-red-950/30 focus:text-red-300 cursor-pointer group"
            >
              <LogOut className="mr-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
