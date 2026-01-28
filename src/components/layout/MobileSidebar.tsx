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
  Menu,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";

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

const moduleConfig: Record<string, { icon: typeof ListTodo; route: string; label: string }> = {
  "todo-list": { icon: ListTodo, route: "/todo", label: "To-Do List" },
  "journal": { icon: BookOpen, route: "/journal", label: "Journal" },
  "finance": { icon: Wallet, route: "/finance", label: "Finance" },
  "the-call": { icon: Zap, route: "/the-call", label: "The Call" },
  "track-health": { icon: Heart, route: "/health", label: "Track Health" },
  "wishlist": { icon: ShoppingCart, route: "/wishlist", label: "Wishlist" },
};

export function MobileSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(location.pathname.startsWith("/profile"));
  const [isModulesExpanded, setIsModulesExpanded] = useState(false);

  const { unreadCount } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();
  const totalUnread = unreadCount + messageUnreadCount;

  const { data: allModules = [] } = useShopModules();
  const { data: purchasedModuleIds = [] } = useUserModulePurchases(user?.id);
  
  const purchasedModules = allModules
    .filter(m => purchasedModuleIds.includes(m.id))
    .filter(m => moduleConfig[m.key])
    .map(m => ({ ...m, config: moduleConfig[m.key] }));

  const { data: profile } = useQuery({
    queryKey: ["sidebar-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    setOpen(false);
  };

  const handleNavClick = () => setOpen(false);

  const isProfileActive = location.pathname.startsWith("/profile");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-primary/20"
        >
          <Menu className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-72 p-0 bg-gradient-to-b from-[#0a1525]/98 to-[#050d18]/99 border-r border-primary/20"
      >
        {/* App Identity */}
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 rounded-lg blur-lg" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg border border-primary/40 flex items-center justify-center">
                <span className="text-xl font-orbitron font-bold text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.8)]">
                  P
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-orbitron font-bold text-primary tracking-wider">
                THE PACT
              </h1>
              <p className="text-[10px] text-primary/50 font-rajdhani uppercase tracking-widest">
                Command Center
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative ${
                    isActive
                      ? "text-primary bg-primary/15"
                      : "text-muted-foreground/80 hover:text-primary/90 hover:bg-primary/5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                    <Icon className="h-5 w-5" />
                    <span className="font-rajdhani text-sm tracking-wide">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Modules Section */}
          {purchasedModules.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setIsModulesExpanded(!isModulesExpanded)}
                className="group w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 text-muted-foreground/80 hover:text-primary/90 hover:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <Puzzle className="h-5 w-5" />
                  <span className="font-rajdhani text-sm tracking-wide font-medium">
                    Modules
                  </span>
                </div>
                {isModulesExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {isModulesExpanded && (
                <div className="ml-4 pl-4 border-l border-primary/20 mt-1 space-y-1">
                  {purchasedModules.map((module) => {
                    const Icon = module.config.icon;
                    return (
                      <NavLink
                        key={module.id}
                        to={module.config.route}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 text-sm ${
                            isActive
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground/70 hover:text-primary/80 hover:bg-primary/5"
                          }`
                        }
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-rajdhani tracking-wide">{module.config.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Profile Section */}
          <div className="pt-2">
            <button
              onClick={() => setIsProfileExpanded(!isProfileExpanded)}
              className={`group w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 relative ${
                isProfileActive
                  ? "text-primary bg-primary/15"
                  : "text-muted-foreground/80 hover:text-primary/90 hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-3">
                {isProfileActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <User className="h-5 w-5" />
                <span className="font-rajdhani text-sm tracking-wide font-medium">
                  Profile
                </span>
              </div>
              {isProfileExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {isProfileExpanded && (
              <div className="ml-4 pl-4 border-l border-primary/20 mt-1 space-y-1">
                {profileSubItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 text-sm ${
                          isActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground/70 hover:text-primary/80 hover:bg-primary/5"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-rajdhani tracking-wide">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User Panel */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-primary/20 p-4 bg-gradient-to-t from-[#050d18] to-transparent">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <Avatar className="h-10 w-10 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-orbitron text-sm">
                {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate font-rajdhani">
                {profile?.display_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-primary"
              onClick={() => { navigate("/inbox"); setOpen(false); }}
            >
              <Inbox className="h-4 w-4 mr-2" />
              Inbox
              {totalUnread > 0 && (
                <span className="ml-2 text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
