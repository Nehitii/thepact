import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Infinity,
  Palette,
  Puzzle,
  RefreshCw,
  Zap,
  X,
  Check,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useShopModules, 
  useUserModulePurchases,
  useShopFrames,
  useShopBanners,
  useUserCosmetics
} from "@/hooks/useShop";
import {
  useAdminForcePurchaseCosmetic,
  useAdminResetCosmetic,
  useAdminForcePurchaseModule,
  useAdminResetModule,
  useAdminResetAll
} from "@/hooks/useAdminMode";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminMode() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Shop data
  const { data: modules = [] } = useShopModules();
  const { data: purchasedModuleIds = [] } = useUserModulePurchases(user?.id);
  const { data: frames = [] } = useShopFrames();
  const { data: banners = [] } = useShopBanners();
  const { data: userCosmetics } = useUserCosmetics(user?.id);

  // Admin mutations
  const forcePurchaseCosmetic = useAdminForcePurchaseCosmetic();
  const resetCosmetic = useAdminResetCosmetic();
  const forcePurchaseModule = useAdminForcePurchaseModule();
  const resetModule = useAdminResetModule();
  const resetAll = useAdminResetAll();

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
          description: "Admin Mode requires admin privileges",
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse font-orbitron">Verifying admin access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const isModulePurchased = (moduleId: string) => purchasedModuleIds.includes(moduleId);
  const isFrameOwned = (frameId: string) => userCosmetics?.frames.includes(frameId) ?? false;
  const isBannerOwned = (bannerId: string) => userCosmetics?.banners.includes(bannerId) ?? false;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "text-amber-400 border-amber-400/50 bg-amber-400/10";
      case "epic": return "text-purple-400 border-purple-400/50 bg-purple-400/10";
      case "rare": return "text-blue-400 border-blue-400/50 bg-blue-400/10";
      default: return "text-primary/60 border-primary/30 bg-primary/5";
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Admin Mode Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/50 px-3 py-1.5 gap-2">
          <Shield className="h-4 w-4" />
          Admin Mode
        </Badge>
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-orbitron text-amber-400 tracking-wider mb-2">
            Admin Mode
          </h1>
          <p className="text-primary/60 font-rajdhani mb-4">
            Testing & Simulation Environment
          </p>

          {/* Infinite Bonds Display */}
          <div className="inline-flex items-center gap-2 bg-card/50 border border-amber-500/30 rounded-xl px-6 py-3">
            <Infinity className="h-6 w-6 text-amber-400" />
            <span className="text-2xl font-orbitron text-amber-400">∞</span>
            <span className="text-amber-400/80 font-rajdhani">Bonds (Admin)</span>
          </div>
        </div>

        {/* Reset All Button */}
        <div className="flex justify-center mb-8">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset All Purchases
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-primary/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-primary flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Reset All Purchases
                </AlertDialogTitle>
                <AlertDialogDescription className="text-primary/60">
                  This will remove all cosmetics and module purchases from your account.
                  This action is reversible by re-granting items.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-primary/30 text-primary">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => user && resetAll.mutate({ userId: user.id })}
                  className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                >
                  Reset All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-primary/20 mb-6">
            <TabsTrigger value="modules" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Puzzle className="h-4 w-4 mr-2" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="frames" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Palette className="h-4 w-4 mr-2" />
              Frames
            </TabsTrigger>
            <TabsTrigger value="banners" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Palette className="h-4 w-4 mr-2" />
              Banners
            </TabsTrigger>
          </TabsList>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4">
            {modules.map((module) => {
              const isPurchased = isModulePurchased(module.id);
              return (
                <Card
                  key={module.id}
                  className={`p-4 border-2 transition-all ${
                    isPurchased 
                      ? "border-green-500/50 bg-green-500/5" 
                      : "border-primary/20 bg-card/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isPurchased ? "bg-green-500/20 border border-green-500/30" : "bg-primary/10 border border-primary/30"
                      }`}>
                        <Puzzle className={`h-6 w-6 ${isPurchased ? "text-green-400" : "text-primary"}`} />
                      </div>
                      <div>
                        <h3 className="font-orbitron text-primary">{module.name}</h3>
                        <p className="text-sm text-primary/60 font-rajdhani">{module.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRarityColor(module.rarity)}>{module.rarity}</Badge>
                          <span className="text-xs text-primary/40">{module.price_bonds} Bonds</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={isPurchased ? "bg-green-500/20 text-green-400" : "bg-primary/10 text-primary/60"}>
                        {isPurchased ? (
                          <><Check className="h-3 w-3 mr-1" /> Purchased</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Not Purchased</>
                        )}
                      </Badge>
                      {isPurchased ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => user && resetModule.mutate({ userId: user.id, moduleId: module.id })}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          disabled={resetModule.isPending}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reset
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => user && forcePurchaseModule.mutate({ userId: user.id, moduleId: module.id })}
                          className="bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30"
                          disabled={forcePurchaseModule.isPending}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Force Purchase
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            {modules.length === 0 && (
              <div className="text-center py-8 text-primary/40">No modules available</div>
            )}
          </TabsContent>

          {/* Frames Tab */}
          <TabsContent value="frames" className="space-y-4">
            {frames.map((frame) => {
              const isOwned = isFrameOwned(frame.id);
              return (
                <Card
                  key={frame.id}
                  className={`p-4 border-2 transition-all ${
                    isOwned 
                      ? "border-green-500/50 bg-green-500/5" 
                      : "border-primary/20 bg-card/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl border-2"
                        style={{ 
                          borderColor: frame.border_color,
                          boxShadow: `0 0 10px ${frame.glow_color}`
                        }}
                      />
                      <div>
                        <h3 className="font-orbitron text-primary">{frame.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRarityColor(frame.rarity)}>{frame.rarity}</Badge>
                          <span className="text-xs text-primary/40">{frame.price} Bonds</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={isOwned ? "bg-green-500/20 text-green-400" : "bg-primary/10 text-primary/60"}>
                        {isOwned ? (
                          <><Check className="h-3 w-3 mr-1" /> Owned</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Not Owned</>
                        )}
                      </Badge>
                      {isOwned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => user && resetCosmetic.mutate({ userId: user.id, cosmeticId: frame.id })}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          disabled={resetCosmetic.isPending}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reset
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => user && forcePurchaseCosmetic.mutate({ 
                            userId: user.id, 
                            cosmeticId: frame.id,
                            cosmeticType: "frame"
                          })}
                          className="bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30"
                          disabled={forcePurchaseCosmetic.isPending}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Force Purchase
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            {frames.length === 0 && (
              <div className="text-center py-8 text-primary/40">No frames available</div>
            )}
          </TabsContent>

          {/* Banners Tab */}
          <TabsContent value="banners" className="space-y-4">
            {banners.map((banner) => {
              const isOwned = isBannerOwned(banner.id);
              return (
                <Card
                  key={banner.id}
                  className={`p-4 border-2 transition-all ${
                    isOwned 
                      ? "border-green-500/50 bg-green-500/5" 
                      : "border-primary/20 bg-card/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-10 rounded-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${banner.gradient_start || '#0a0a12'}, ${banner.gradient_end || '#1a1a2e'})`
                        }}
                      />
                      <div>
                        <h3 className="font-orbitron text-primary">{banner.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRarityColor(banner.rarity)}>{banner.rarity}</Badge>
                          <span className="text-xs text-primary/40">{banner.price} Bonds</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={isOwned ? "bg-green-500/20 text-green-400" : "bg-primary/10 text-primary/60"}>
                        {isOwned ? (
                          <><Check className="h-3 w-3 mr-1" /> Owned</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Not Owned</>
                        )}
                      </Badge>
                      {isOwned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => user && resetCosmetic.mutate({ userId: user.id, cosmeticId: banner.id })}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          disabled={resetCosmetic.isPending}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reset
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => user && forcePurchaseCosmetic.mutate({ 
                            userId: user.id, 
                            cosmeticId: banner.id,
                            cosmeticType: "banner"
                          })}
                          className="bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30"
                          disabled={forcePurchaseCosmetic.isPending}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Force Purchase
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            {banners.length === 0 && (
              <div className="text-center py-8 text-primary/40">No banners available</div>
            )}
          </TabsContent>
        </Tabs>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="text-primary/60 hover:text-primary"
          >
            ← Back to Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
