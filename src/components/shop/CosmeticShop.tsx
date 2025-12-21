import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Image, Frame, Palette, Check, Lock, Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopFrames, useShopBanners, useUserCosmetics, usePurchaseCosmetic, useBondBalance } from "@/hooks/useShop";
import { Button } from "@/components/ui/button";
import { ThemePreviewCard } from "./ThemePreviewCard";
import { FramePreview } from "@/components/ui/avatar-frame";

type CosmeticCategory = "themes" | "frames" | "banners";

const categories = [
  { id: "themes" as const, label: "Themes", icon: Palette },
  { id: "frames" as const, label: "Frames", icon: Frame },
  { id: "banners" as const, label: "Banners", icon: Image },
];

const themesData = [
  { id: "1", name: "Neon Cyber", bg: "#0a0f1a", accent: "#5BB4FF", glow: "#5BB4FF", rarity: "common", price: 1600 },
  { id: "2", name: "Crimson Edge", bg: "#1a0a0f", accent: "#FF5B5B", glow: "#FF5B5B", rarity: "rare", price: 1600 },
  { id: "3", name: "Void Purple", bg: "#0f0a1a", accent: "#A855F7", glow: "#A855F7", rarity: "epic", price: 1600 },
  { id: "4", name: "Golden Dawn", bg: "#1a150a", accent: "#FBB034", glow: "#FBB034", rarity: "legendary", price: 1600 },
];

const rarityColors: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  common: { border: "border-slate-400/50", bg: "bg-slate-500/10", text: "text-slate-400", glow: "" },
  rare: { border: "border-blue-400/50", bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]" },
  epic: { border: "border-purple-400/50", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]" },
  legendary: { border: "border-amber-400/50", bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]" },
};

export function CosmeticShop() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>("themes");
  
  const { data: frames = [] } = useShopFrames();
  const { data: banners = [] } = useShopBanners();
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const purchaseCosmetic = usePurchaseCosmetic();

  const handlePurchase = (cosmeticId: string, type: "frame" | "banner", price: number) => {
    if (!user?.id) return;
    purchaseCosmetic.mutate({
      userId: user.id,
      cosmeticId,
      cosmeticType: type,
      price,
    });
  };

  const isOwned = (id: string, type: "frame" | "banner") => {
    if (!ownedCosmetics) return false;
    return type === "frame" 
      ? ownedCosmetics.frames.includes(id)
      : ownedCosmetics.banners.includes(id);
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left sidebar - Categories */}
      <div className="w-48 flex-shrink-0 space-y-2">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-orbitron mb-4 px-2">
          Categories
        </h3>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 border border-primary/30 text-primary"
                  : "hover:bg-card/50 text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-rajdhani font-medium">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right panel - Items */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {activeCategory === "themes" && themesData.map((theme) => {
              const rarity = rarityColors[theme.rarity];
              return (
                <div
                  key={theme.id}
                  className={`relative p-4 rounded-xl border ${rarity.border} ${rarity.bg} ${rarity.glow} backdrop-blur-sm transition-all hover:scale-[1.02]`}
                >
                  <div className="mb-3">
                    <ThemePreviewCard
                      name={theme.name}
                      bgColor={theme.bg}
                      accentColor={theme.accent}
                      glowColor={theme.glow}
                    />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-rajdhani font-semibold text-foreground">{theme.name}</h4>
                    <div className={`text-xs uppercase tracking-wider ${rarity.text}`}>
                      {theme.rarity}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-primary font-orbitron text-sm">
                        <Coins className="w-4 h-4" />
                        {theme.price}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="text-xs opacity-60"
                      >
                        Soon
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {activeCategory === "frames" && frames.map((frame) => {
              const owned = isOwned(frame.id, "frame") || frame.is_default;
              const rarity = rarityColors[frame.rarity] || rarityColors.common;
              const canAfford = (balance?.balance || 0) >= frame.price;
              
              return (
                <div
                  key={frame.id}
                  className={`relative p-4 rounded-xl border ${rarity.border} ${rarity.bg} ${rarity.glow} backdrop-blur-sm transition-all hover:scale-[1.02]`}
                >
                  {/* Frame preview using proper layered component */}
                  <div className="flex justify-center mb-4">
                    <FramePreview
                      size="lg"
                      frameImage={frame.preview_url}
                      borderColor={frame.border_color}
                      glowColor={frame.glow_color}
                      frameScale={frame.frame_scale}
                      frameOffsetX={frame.frame_offset_x}
                      frameOffsetY={frame.frame_offset_y}
                    />
                  </div>
                  
                  <div className="space-y-2 text-center">
                    <h4 className="font-rajdhani font-semibold text-foreground">{frame.name}</h4>
                    <div className={`text-xs uppercase tracking-wider ${rarity.text}`}>
                      {frame.rarity}
                    </div>
                    
                    {owned ? (
                      <div className="flex items-center justify-center gap-1 text-green-400 text-sm mt-3">
                        <Check className="w-4 h-4" />
                        Owned
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-primary font-orbitron text-sm">
                          <Coins className="w-4 h-4" />
                          {frame.price}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canAfford || purchaseCosmetic.isPending}
                          onClick={() => handlePurchase(frame.id, "frame", frame.price)}
                          className="text-xs border-primary/30 hover:bg-primary/10"
                        >
                          {canAfford ? "Buy" : <Lock className="w-3 h-3" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {activeCategory === "banners" && banners.map((banner) => {
              const owned = isOwned(banner.id, "banner") || banner.is_default;
              const rarity = rarityColors[banner.rarity] || rarityColors.common;
              const canAfford = (balance?.balance || 0) >= banner.price;
              
              return (
                <div
                  key={banner.id}
                  className={`relative p-4 rounded-xl border ${rarity.border} ${rarity.bg} ${rarity.glow} backdrop-blur-sm transition-all hover:scale-[1.02]`}
                >
                  {/* Banner preview */}
                  <div 
                    className="w-full h-16 rounded-lg mb-4"
                    style={{
                      background: banner.banner_url
                        ? `url(${banner.banner_url}) center/cover`
                        : `linear-gradient(135deg, ${banner.gradient_start || '#0a0a12'}, ${banner.gradient_end || '#1a1a2e'})`,
                    }}
                  />
                  
                  <div className="space-y-2">
                    <h4 className="font-rajdhani font-semibold text-foreground">{banner.name}</h4>
                    <div className={`text-xs uppercase tracking-wider ${rarity.text}`}>
                      {banner.rarity}
                    </div>
                    
                    {owned ? (
                      <div className="flex items-center justify-center gap-1 text-green-400 text-sm mt-3">
                        <Check className="w-4 h-4" />
                        Owned
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-primary font-orbitron text-sm">
                          <Coins className="w-4 h-4" />
                          {banner.price}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canAfford || purchaseCosmetic.isPending}
                          onClick={() => handlePurchase(banner.id, "banner", banner.price)}
                          className="text-xs border-primary/30 hover:bg-primary/10"
                        >
                          {canAfford ? "Buy" : <Lock className="w-3 h-3" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
