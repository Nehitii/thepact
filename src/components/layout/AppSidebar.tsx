import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home, Target, ShoppingBag, Users, User, Settings, LogOut,
  ChevronRight, Bell, Shield, Database, Volume2, UserCircle,
  ListTodo, BookOpen, Wallet, Zap, Heart, ShoppingCart, Puzzle,
  Inbox,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useShopModules, useUserModulePurchases } from "@/hooks/useShop";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";

const mainNavItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/shop", icon: ShoppingBag, label: "Shop" },
  { to: "/community", icon: Users, label: "Community" },
];

const profileItems = [
  { to: "/profile", icon: UserCircle, label: "Account Info" },
  { to: "/profile/bounded", icon: User, label: "Bounded Profile" },
  { to: "/profile/pact-settings", icon: Settings, label: "Pact Settings" },
  { to: "/profile/display-sound", icon: Volume2, label: "Display & Sound" },
  { to: "/profile/notifications", icon: Bell, label: "Notifications" },
  { to: "/profile/privacy", icon: Shield, label: "Privacy" },
  { to: "/profile/data", icon: Database, label: "Data" },
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
  const pathname = location.pathname;

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

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <Sidebar className="border-r border-border font-rajdhani">
      {/* Header */}
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 group">
            <div className="absolute -inset-1.5 bg-primary/40 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-500" />
            <div
              className="relative w-12 h-12 bg-black border-2 border-primary flex items-center justify-center"
              style={{ clipPath: "polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%)" }}
            >
              <span className="text-2xl font-black font-orbitron text-primary drop-shadow-[0_0_8px_#3bb4ff]">P</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black font-orbitron text-foreground tracking-[0.2em] leading-none mb-1">
              THE PACT
            </h1>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-chart-2 animate-pulse" />
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-chart-2/80">System Online</span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 italic">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Modules Section */}
        {purchasedModules.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 italic">
              Modules
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible
                  defaultOpen={purchasedModules.some((m) => isActive(m.config.route))}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Extension Kit">
                        <Puzzle />
                        <span>Extension Kit</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {purchasedModules.map((m) => (
                          <SidebarMenuSubItem key={m.id}>
                            <SidebarMenuSubButton asChild isActive={isActive(m.config.route)}>
                              <Link to={m.config.route}>
                                <m.config.icon />
                                <span>{m.config.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Profile Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 italic">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                defaultOpen={pathname.startsWith("/profile")}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Profile">
                      <User />
                      <span>Profile</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {profileItems.map((item) => (
                        <SidebarMenuSubItem key={item.to}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.to)}>
                            <Link to={item.to}>
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <div className="relative">
                    <Avatar className="h-8 w-8 border border-primary/40">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-sidebar-accent text-primary font-orbitron text-xs">
                        {profile?.display_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {totalUnread > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                        {totalUnread > 9 ? "9+" : totalUnread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider font-orbitron truncate leading-none">
                      {profile?.display_name || "Agent"}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-mono tracking-tighter truncate">
                      ID_{user?.id?.slice(0, 4)}
                    </p>
                  </div>
                  <Settings size={14} className="text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                className="w-56 bg-popover border-border text-foreground font-rajdhani"
              >
                <DropdownMenuItem
                  onClick={() => navigate("/inbox")}
                  className="cursor-pointer"
                >
                  <Inbox className="mr-2 h-4 w-4" />
                  <span>Inbox</span>
                  {totalUnread > 0 && (
                    <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5 font-black rounded-sm">
                      {totalUnread}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
