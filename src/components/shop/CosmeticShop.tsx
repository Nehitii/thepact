import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Frame, Crown, Check, Lock, Type } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useShopFrames, 
  useShopBanners, 
  useShopTitles,
  useUserCosmetics, 
  usePurchaseCosmetic, 
  useBondBalance 
} from "@/hooks/useShop";
import { Button } from "@/components/ui/button";
import { FramePreview } from "@/components/ui/avatar-frame";
import { BondIcon } from "@/components/ui/bond-icon";

type CosmeticCategory = "frames" | "banners" | "titles";

const categories = [
  { id: "frames" as const, label: "Frames", icon: Frame },
  { id: "banners" as const, label: "Banners", icon: Image },
  { id: "titles" as const, label: "Titles", icon: Crown },
];

const rarityColors: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  common: { border: "border-slate-400/50", bg: "bg-slate-500/10", text: "text-slate-400", glow: "" },
  rare: { border: "border-blue-400/50", bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]" },
  epic: { border: "border-purple-400/50", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]" },
  legendary: { border: "border-amber-400/50", bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]" },
};

export function CosmeticShop() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>("frames");
  
  const { data: frames = [] } = useShopFrames();
  const { data: banners = [] } = useShopBanners();
  const { data: titles = [] } = useShopTitles();
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const purchaseCosmetic = usePurchaseCosmetic();

  const handlePurchase = (cosmeticId: string, type: "frame" | "banner" | "title", price: number) => {
    if (!user?.id) return;
    purchaseCosmetic.mutate({
      userId: user.id,
      cosmeticId,
      cosmeticType: type,
      price,
    });
  };

  const isOwned = (id: string, type: "frame" | "banner" | "title") => {
    if (!ownedCosmetics) return false;
    if (type === "frame") return ownedCosmetics.frames.includes(id);
    if (type === "banner") return ownedCosmetics.banners.includes(id);
    return ownedCosmetics.titles.includes(id);
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

      {/* Right panel - Items (hidden scrollbar) */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {/* Frames */}
            {activeCategory === "frames" && frames.map((frame) => {
              const owned = isOwned(frame.id, "frame") || frame.is_default;
              const rarity = rarityColors[frame.rarity] || rarityColors.common;
              const canAfford = (balance?.balance || 0) >= frame.price;
              
              return (
                <div
                  key={frame.id}
                  className={`relative p-4 rounded-xl border ${rarity.border} ${rarity.bg} backdrop-blur-sm shop-card overflow-hidden`}
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
                        <div className="flex items-center gap-1.5 text-primary font-orbitron text-sm">
                          <BondIcon size={18} />
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

            {/* Banners */}
            {activeCategory === "banners" && banners.map((banner) => {
              const owned = isOwned(banner.id, "banner") || banner.is_default;
              const rarity = rarityColors[banner.rarity] || rarityColors.common;
              const canAfford = (balance?.balance || 0) >= banner.price;
              
              return (
                <div
                  key={banner.id}
                  className={`relative p-4 rounded-xl border ${rarity.border} ${rarity.bg} backdrop-blur-sm shop-card overflow-hidden`}
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
                        <div className="flex items-center gap-1.5 text-primary font-orbitron text-sm">
                          <BondIcon size={18} />
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

            {/* Titles */}
            {activeCategory === "titles" && titles.map((title) => {
              const owned = isOwned(title.id, "title") || title.is_default;
              const rarity = rarityColors[title.rarity] || rarityColors.common;
              const canAfford = (balance?.balance || 0) >= title.price;
              
              return (
                <div
                  key={title.id}
                  className={`relative p-4 rounded-xl border ${rarity.border} ${rarity.bg} backdrop-blur-sm shop-card overflow-hidden`}
                >
                  {/* Title preview */}
                  <div className="flex justify-center items-center h-16 mb-4">
                    <span
                      className="font-orbitron text-lg font-bold tracking-wider"
                      style={{
                        color: title.text_color || '#5bb4ff',
                        textShadow: title.glow_color 
                          ? `0 0 10px ${title.glow_color}, 0 0 20px ${title.glow_color}` 
                          : undefined,
                      }}
                    >
                      {title.title_text}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-center">
                    <div className={`text-xs uppercase tracking-wider ${rarity.text}`}>
                      {title.rarity}
                    </div>
                    
                    {owned ? (
                      <div className="flex items-center justify-center gap-1 text-green-400 text-sm mt-3">
                        <Check className="w-4 h-4" />
                        Owned
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1.5 text-primary font-orbitron text-sm">
                          <BondIcon size={18} />
                          {title.price}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canAfford || purchaseCosmetic.isPending}
                          onClick={() => handlePurchase(title.id, "title", title.price)}
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

            {/* Empty state */}
            {activeCategory === "frames" && frames.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Frame className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-rajdhani">No frames available yet</p>
              </div>
            )}
            {activeCategory === "banners" && banners.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-rajdhani">No banners available yet</p>
              </div>
            )}
            {activeCategory === "titles" && titles.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Crown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-rajdhani">No titles available yet</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
