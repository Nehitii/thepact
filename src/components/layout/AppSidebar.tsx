import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
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
  Scale,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  { to: "/profile/privacy", icon: Shield, label: "Privacy & Control" },
  { to: "/profile/data", icon: Database, label: "Data & Portability" },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileExpanded, setIsProfileExpanded] = useState(
    location.pathname.startsWith("/profile")
  );

  // Fetch user profile for avatar and display name
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
  };

  const isProfileActive = location.pathname.startsWith("/profile");

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col bg-gradient-to-b from-[#0a1525]/98 to-[#050d18]/99 backdrop-blur-2xl border-r border-primary/20">
      {/* Top glow effect */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      {/* Side border glow */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/40 via-primary/20 to-primary/40" />
      
      {/* Holographic grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(91, 180, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(91, 180, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* App Identity - Top */}
      <div className="relative p-6 border-b border-primary/20">
        <div className="flex items-center gap-3">
          {/* Logo with glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 rounded-lg blur-lg" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg border border-primary/40 flex items-center justify-center">
              <span className="text-xl font-orbitron font-bold text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.8)]">
                P
              </span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-orbitron font-bold text-primary tracking-wider drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
              THE PACT
            </h1>
            <p className="text-[10px] text-primary/50 font-rajdhani uppercase tracking-widest">
              Command Center
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
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
                  {/* Active indicator */}
                  {isActive && (
                    <>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(91,180,255,0.6)]" />
                      <div className="absolute inset-0 border border-primary/30 rounded-lg" />
                    </>
                  )}
                  <Icon
                    className={`h-5 w-5 transition-all duration-300 ${
                      isActive
                        ? "drop-shadow-[0_0_8px_rgba(91,180,255,0.8)]"
                        : "group-hover:drop-shadow-[0_0_6px_rgba(91,180,255,0.5)]"
                    }`}
                  />
                  <span
                    className={`font-rajdhani text-sm tracking-wide ${
                      isActive ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Profile Section with Submenu */}
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
                <>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(91,180,255,0.6)]" />
                  <div className="absolute inset-0 border border-primary/30 rounded-lg" />
                </>
              )}
              <User
                className={`h-5 w-5 transition-all duration-300 ${
                  isProfileActive
                    ? "drop-shadow-[0_0_8px_rgba(91,180,255,0.8)]"
                    : "group-hover:drop-shadow-[0_0_6px_rgba(91,180,255,0.5)]"
                }`}
              />
              <span
                className={`font-rajdhani text-sm tracking-wide ${
                  isProfileActive ? "font-semibold" : "font-medium"
                }`}
              >
                Profile
              </span>
            </div>
            {isProfileExpanded ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-300" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform duration-300" />
            )}
          </button>

          {/* Profile Submenu */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isProfileExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="ml-4 pl-4 border-l border-primary/20 mt-1 space-y-1">
              {profileSubItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
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
          </div>
        </div>
      </nav>

      {/* User Identity Panel - Bottom */}
      <div className="relative border-t border-primary/20 p-4">
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-all duration-300 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <Avatar className="h-10 w-10 border-2 border-primary/30 group-hover:border-primary/50 transition-colors">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-orbitron text-sm">
                    {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-foreground truncate font-rajdhani">
                  {profile?.display_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-56 bg-[#0a1525]/95 backdrop-blur-xl border border-primary/30"
          >
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-rajdhani">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
