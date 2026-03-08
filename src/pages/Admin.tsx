import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Palette, Coins, Puzzle, ChevronRight, Sparkles, Bell, AlertTriangle, ScrollText, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useServerAdminCheck } from "@/hooks/useServerAdminCheck";
import { useQuery } from "@tanstack/react-query";
import { AuditLogPanel } from "@/components/admin/AuditLogPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showUpcoming, setShowUpcoming] = useState(false);
  
  const { data: adminCheck, isLoading, error } = useServerAdminCheck(!!user);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (!isLoading && adminCheck && !adminCheck.isAdmin) {
      toast({ title: "Access Denied", description: "You need admin privileges to access this page", variant: "destructive" });
      navigate("/");
    }
  }, [user, adminCheck, isLoading, navigate, toast]);

  // Counters
  const { data: counts } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [frames, banners, titles, modules, packs, offers, promos] = await Promise.all([
        supabase.from("cosmetic_frames").select("id", { count: "exact", head: true }),
        supabase.from("cosmetic_banners").select("id", { count: "exact", head: true }),
        supabase.from("cosmetic_titles").select("id", { count: "exact", head: true }),
        supabase.from("shop_modules").select("id", { count: "exact", head: true }),
        supabase.from("bond_packs").select("id", { count: "exact", head: true }),
        supabase.from("special_offers").select("id", { count: "exact", head: true }),
        supabase.from("promo_codes").select("id", { count: "exact", head: true }),
      ]);
      return {
        cosmetics: (frames.count || 0) + (banners.count || 0) + (titles.count || 0),
        modules: modules.count || 0,
        money: (packs.count || 0) + (offers.count || 0),
        promos: promos.count || 0,
      };
    },
    enabled: adminCheck?.isAdmin === true,
  });

  // Quick stats
  const { data: stats } = useQuery({
    queryKey: ["admin-quick-stats"],
    queryFn: async () => {
      const [users, activeModules] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("shop_modules").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return { totalUsers: users.count || 0, activeModules: activeModules.count || 0 };
    },
    enabled: adminCheck?.isAdmin === true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse font-orbitron">Verifying access...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <div className="text-destructive font-orbitron mb-2">Verification Failed</div>
          <p className="text-muted-foreground mb-4">Unable to verify admin status</p>
          <Button onClick={() => navigate("/")} variant="outline">Return Home</Button>
        </div>
      </div>
    );
  }

  if (!adminCheck?.isAdmin) return null;

  const menuItems = [
    { title: "Admin Mode", description: "Test purchases & simulate flows", icon: Shield, href: "/admin/mode", available: true, highlight: true },
    { title: "Cosmetics Manager", description: "Manage frames, banners, and titles", icon: Palette, href: "/admin/cosmetics", available: true, count: counts?.cosmetics },
    { title: "Money Manager", description: "Manage bond packs and special offers", icon: Coins, href: "/admin/money", available: true, count: counts?.money },
    { title: "Module Manager", description: "Manage purchasable modules", icon: Puzzle, href: "/admin/modules", available: true, count: counts?.modules },
    { title: "Promo Codes", description: "Create and manage promotional codes", icon: Sparkles, href: "/admin/promo-codes", available: true, count: counts?.promos },
    { title: "Notifications & Messages", description: "Send notifications and messages to users", icon: Bell, href: "/admin/notifications", available: true },
  ];

  const upcomingItems = [
    { title: "User Manager", description: "Manage users and permissions", icon: Shield },
    { title: "Analytics", description: "View app statistics", icon: Sparkles },
    { title: "System Settings", description: "Configure global settings", icon: Puzzle },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-orbitron text-primary tracking-wider mb-2">Admin Panel</h1>
          <p className="text-primary/60 font-rajdhani">Manage your application</p>
          {adminCheck?.verifiedAt && <p className="text-xs text-primary/40 mt-2 font-mono">Server verified</p>}
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Card className="p-4 bg-card/30 border border-primary/20 text-center">
              <div className="text-2xl font-orbitron text-primary">{stats.totalUsers}</div>
              <div className="text-xs text-primary/50 font-rajdhani">Total Users</div>
            </Card>
            <Card className="p-4 bg-card/30 border border-primary/20 text-center">
              <div className="text-2xl font-orbitron text-primary">{stats.activeModules}</div>
              <div className="text-xs text-primary/50 font-rajdhani">Active Modules</div>
            </Card>
          </div>
        )}

        {/* Menu */}
        <div className="grid gap-4 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isHighlight = 'highlight' in item && item.highlight;
            return (
              <Button
                key={item.title}
                variant="ghost"
                onClick={() => navigate(item.href)}
                className={`relative w-full h-auto p-6 justify-start rounded-2xl border-2 transition-all ${
                  isHighlight
                    ? "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/70"
                    : "border-primary/30 bg-card/30 hover:bg-primary/10 hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isHighlight ? "bg-amber-500/20 border border-amber-500/50" : "bg-primary/10 border border-primary/30"}`}>
                    <Icon className={`h-6 w-6 ${isHighlight ? "text-amber-400" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-orbitron text-lg tracking-wide ${isHighlight ? "text-amber-400" : "text-primary"}`}>
                      {item.title}
                      {'count' in item && item.count !== undefined && (
                        <span className="ml-2 text-sm font-rajdhani text-primary/40">({item.count})</span>
                      )}
                    </h3>
                    <p className={`text-sm font-rajdhani ${isHighlight ? "text-amber-400/60" : "text-primary/60"}`}>{item.description}</p>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${isHighlight ? "text-amber-400/60" : "text-primary/60"}`} />
                </div>
              </Button>
            );
          })}
        </div>

        {/* Upcoming - toggle */}
        <div className="mb-8">
          <button
            onClick={() => setShowUpcoming(!showUpcoming)}
            className="flex items-center gap-2 text-xs text-primary/30 hover:text-primary/50 transition-colors mx-auto"
          >
            {showUpcoming ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showUpcoming ? "Hide upcoming" : "Show upcoming features"}
          </button>
          {showUpcoming && (
            <div className="grid gap-3 mt-4">
              {upcomingItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="w-full p-4 rounded-2xl border-2 border-primary/10 bg-card/10 opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary/40" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-orbitron text-primary/40">{item.title}</h3>
                        <p className="text-sm font-rajdhani text-primary/30">{item.description}</p>
                      </div>
                      <span className="text-xs uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary/40">Soon</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit Log */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Card className="p-4 bg-card/30 border border-primary/20 cursor-pointer hover:bg-card/50 transition-colors mb-4">
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary/60" />
                <span className="font-orbitron text-sm text-primary">Recent Activity</span>
              </div>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="p-4 bg-card/30 border border-primary/20 mb-4">
              <AuditLogPanel />
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Back */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-primary/60 hover:text-primary">← Back to Home</Button>
        </div>
      </div>
    </div>
  );
}
