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
  PanelLeftClose,
  PanelLeftOpen,
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

const mainNavItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/shop", icon: ShoppingBag, label: "Shop" },
  { to: "/community", icon: Users, label: "Community" },
];

const moduleConfig: Record<string, { icon: any; route: string; label: string }> = {
  "todo-list": { icon: ListTodo, route: "/todo", label: "To-Do List" },
  journal: { icon: BookOpen, route: "/journal", label: "Journal" },
  finance: { icon: Wallet, route: "/finance", label: "Finance" },
  "track-health": { icon: Heart, route: "/health", label: "Health" },
  wishlist: { icon: ShoppingCart, route: "/wishlist", label: "Wishlist" },
};

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // État pour le mode réduit
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModulesExpanded, setIsModulesExpanded] = useState(false);

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

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-all duration-300 ease-in-out font-rajdhani border-r border-border backdrop-blur-md",
        "bg-background/95 dark:bg-[#03060a]/95", // Adaptation Dark/Light
        isCollapsed ? "w-20" : "w-60 shadow-[20px_0_50px_rgba(0,0,0,0.1)] dark:shadow-[20px_0_50px_rgba(0,0,0,0.5)]",
      )}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

      {/* --- HEADER & COLLAPSE CONTROL --- */}
      <div
        className={cn(
          "p-6 mb-2 flex items-center transition-all",
          isCollapsed ? "justify-center px-2" : "justify-between",
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden animate-in fade-in slide-in-from-left-4">
            <div className="relative w-8 h-8 border border-primary flex items-center justify-center bg-primary/10 rounded-sm">
              <span className="font-orbitron font-black text-primary text-base">P</span>
            </div>
            <h1 className="text-sm font-black font-orbitron text-foreground tracking-widest truncate">THE PACT</h1>
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
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto no-scrollbar relative">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group flex items-center rounded-lg transition-all duration-200 relative",
                  isCollapsed ? "justify-center h-12 w-12 mx-auto" : "px-4 py-2.5 gap-4",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )
              }
            >
              <item.icon
                size={isCollapsed ? 22 : 18}
                className={cn("shrink-0", isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]")}
              />
              {!isCollapsed && (
                <span className="text-[11px] font-bold uppercase tracking-widest animate-in fade-in duration-500">
                  {item.label}
                </span>
              )}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full shadow-[0_0_10px_#3bb4ff]" />
              )}
            </NavLink>
          );
        })}

        {/* --- MODULES (ICÔNE UNIQUE SI REDUIT) --- */}
        {purchasedModules.length > 0 && (
          <div className="pt-4">
            {isCollapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-12 w-12 mx-auto items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-all">
                    <Puzzle size={22} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  className="w-48 ml-2 bg-popover font-rajdhani border-border shadow-xl"
                >
                  {purchasedModules.map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      onClick={() => navigate(m.config.route)}
                      className="text-[10px] font-bold uppercase tracking-widest p-3 cursor-pointer"
                    >
                      <m.config.icon size={14} className="mr-3" /> {m.config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <button
                  onClick={() => setIsModulesExpanded(!isModulesExpanded)}
                  className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground/60 hover:text-primary transition-colors mb-1"
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">System_Modules</span>
                  {isModulesExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <div
                  className={cn(
                    "space-y-1 transition-all overflow-hidden border-l border-border ml-5",
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
            )}
          </div>
        )}
      </nav>

      {/* --- FOOTER: USER PANEL --- */}
      <div
        className={cn(
          "mt-auto p-4 border-t border-border bg-accent/20 backdrop-blur-md transition-all",
          isCollapsed && "px-2 py-6",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full group flex items-center transition-all rounded-xl",
                isCollapsed ? "justify-center" : "gap-3 p-2 hover:bg-accent",
              )}
            >
              <div className="relative shrink-0">
                <Avatar className={cn("border border-border transition-all", isCollapsed ? "h-10 w-10" : "h-8 w-8")}>
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/5 text-primary text-[10px]">
                    {profile?.display_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <NotificationBadge count={totalUnread} size="sm" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0 animate-in fade-in duration-300">
                  <p className="text-[10px] font-black text-foreground uppercase tracking-wider truncate font-orbitron">
                    {profile?.display_name || "Agent"}
                  </p>
                  <p className="text-[8px] text-primary font-mono tracking-tighter truncate opacity-70 italic uppercase">
                    Kernel_Linked
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isCollapsed ? "start" : "end"}
            side={isCollapsed ? "right" : "top"}
            className="w-56 bg-popover border-border shadow-2xl font-rajdhani ml-2"
          >
            <DropdownMenuItem onClick={() => navigate("/profile")} className="p-3 focus:bg-primary/10 cursor-pointer">
              <Settings size={14} className="mr-3 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/inbox")} className="p-3 focus:bg-primary/10 cursor-pointer">
              <Inbox size={14} className="mr-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Inbox</span>
              {totalUnread > 0 && (
                <span className="ml-auto text-[9px] bg-primary text-black px-1.5 font-black rounded-sm">
                  {totalUnread}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="p-3 text-destructive focus:bg-destructive/10 cursor-pointer"
            >
              <LogOut size={14} className="mr-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Terminate</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
