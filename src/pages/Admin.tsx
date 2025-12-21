import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Palette, 
  Coins, 
  Puzzle,
  ChevronRight,
  Lock,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [user, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#00050B] flex items-center justify-center">
        <div className="text-primary animate-pulse font-orbitron">Verifying access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const menuItems = [
    {
      title: "Cosmetics Manager",
      description: "Manage frames, banners, and titles",
      icon: Palette,
      href: "/admin/cosmetics",
      available: true,
    },
    {
      title: "Money Manager",
      description: "Manage bond packs and special offers",
      icon: Coins,
      href: "/admin/money",
      available: true,
    },
    {
      title: "Module Manager",
      description: "Manage purchasable modules",
      icon: Puzzle,
      href: "/admin/modules",
      available: true,
    },
    {
      title: "User Manager",
      description: "Manage users and permissions",
      icon: Shield,
      href: "/admin/users",
      available: false,
    },
    {
      title: "Analytics",
      description: "View app statistics",
      icon: Sparkles,
      href: "/admin/analytics",
      available: false,
    },
    {
      title: "System Settings",
      description: "Configure global settings",
      icon: Lock,
      href: "/admin/settings",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#00050B] relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-orbitron text-primary tracking-wider mb-2">
            Admin Panel
          </h1>
          <p className="text-primary/60 font-rajdhani">
            Manage your application
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.title}
                variant="ghost"
                onClick={() => item.available && navigate(item.href)}
                disabled={!item.available}
                className={`relative w-full h-auto p-6 justify-start rounded-2xl border-2 transition-all ${
                  item.available
                    ? "border-primary/30 bg-card/30 hover:bg-primary/10 hover:border-primary/50"
                    : "border-primary/10 bg-card/10 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    item.available ? "bg-primary/10 border border-primary/30" : "bg-primary/5 border border-primary/10"
                  }`}>
                    <Icon className={`h-6 w-6 ${item.available ? "text-primary" : "text-primary/40"}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-orbitron text-lg tracking-wide ${item.available ? "text-primary" : "text-primary/40"}`}>
                      {item.title}
                    </h3>
                    <p className={`text-sm font-rajdhani ${item.available ? "text-primary/60" : "text-primary/30"}`}>
                      {item.description}
                    </p>
                  </div>
                  {item.available ? (
                    <ChevronRight className="h-5 w-5 text-primary/60" />
                  ) : (
                    <span className="text-xs uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary/40">
                      Soon
                    </span>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-primary/60 hover:text-primary"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
