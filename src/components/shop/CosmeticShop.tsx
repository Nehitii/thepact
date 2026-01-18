import { useState, useMemo } from "react";
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
import { ShopFilters, ShopFilterState, applyShopFilters } from "./ShopFilters";
import { PurchaseConfirmModal, PurchaseItem } from "./PurchaseConfirmModal";
import { ShopLoadingState } from "./ShopLoadingState";

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
  const [purchaseItem, setPurchaseItem] = useState<PurchaseItem | null>(null);
  const [filters, setFilters] = useState<ShopFilterState>({
    search: "",
    sort: "price-asc",
    rarity: "all",
    hideOwned: false,
  });
  
  const { data: frames = [], isLoading: framesLoading } = useShopFrames();
  const { data: banners = [], isLoading: bannersLoading } = useShopBanners();
  const { data: titles = [], isLoading: titlesLoading } = useShopTitles();
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const purchaseCosmetic = usePurchaseCosmetic();

  const isLoading = activeCategory === "frames" ? framesLoading : 
                    activeCategory === "banners" ? bannersLoading : titlesLoading;

  const handlePurchaseClick = (item: PurchaseItem) => {
    setPurchaseItem(item);
  };

  const handleConfirmPurchase = () => {
    if (!user?.id || !purchaseItem) return;
    purchaseCosmetic.mutate({
      userId: user.id,
      cosmeticId: purchaseItem.id,
      cosmeticType: purchaseItem.type as "frame" | "banner" | "title",
      price: purchaseItem.price,
    }, {
      onSuccess: () => setPurchaseItem(null),
    });
  };

  const isOwned = (id: string, type: "frame" | "banner" | "title") => {
    if (!ownedCosmetics) return false;
    if (type === "frame") return ownedCosmetics.frames.includes(id);
    if (type === "banner") return ownedCosmetics.banners.includes(id);
    return ownedCosmetics.titles.includes(id);
  };

  // Apply filters to current category items
  const filteredFrames = useMemo(() => 
    applyShopFilters(frames, filters, (f) => isOwned(f.id, "frame")), 
    [frames, filters, ownedCosmetics]
  );
  
  const filteredBanners = useMemo(() => 
    applyShopFilters(banners, filters, (b) => isOwned(b.id, "banner")), 
    [banners, filters, ownedCosmetics]
  );
  
  const filteredTitles = useMemo(() => 
    applyShopFilters(
      titles.map(t => ({ ...t, name: t.title_text })), 
      filters, 
      (t) => isOwned(t.id, "title")
    ), 
    [titles, filters, ownedCosmetics]
  );

  const totalItems = activeCategory === "frames" ? frames.length : 
                     activeCategory === "banners" ? banners.length : titles.length;
  const visibleItems = activeCategory === "frames" ? filteredFrames.length : 
                       activeCategory === "banners" ? filteredBanners.length : filteredTitles.length;

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
          const count = cat.id === "frames" ? frames.length : 
                       cat.id === "banners" ? banners.length : titles.length;
          
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 border border-primary/30 text-primary"
                  : "hover:bg-card/50 text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-rajdhani font-medium">{cat.label}</span>
              </div>
              <span className="text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Right panel - Items */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Filters */}
        <div className="flex-shrink-0 mb-4">
          <ShopFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalItems={totalItems}
            visibleItems={visibleItems}
          />
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {isLoading ? (
            <ShopLoadingState type="cosmetics" count={6} />
          ) : (
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
                {activeCategory === "frames" && filteredFrames.map((frame) => {
                  const owned = isOwned(frame.id, "frame") || frame.is_default;
                  const rarity = rarityColors[frame.rarity] || rarityColors.common;
                  const canAfford = (balance?.balance || 0) >= frame.price;
                  
                  return (
                    <div
                      key={frame.id}
                      className={`relative p-4 rounded-xl border ${rarity.border} ${rarity.bg} backdrop-blur-sm shop-card overflow-hidden`}
                    >
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
                              disabled={!canAfford}
                              onClick={() => handlePurchaseClick({
                                id: frame.id,
                                name: frame.name,
                                type: "frame",
                                price: frame.price,
                                rarity: frame.rarity,
                                previewElement: (
                                  <FramePreview
                                    size="md"
                                    frameImage={frame.preview_url}
                                    borderColor={frame.border_color}
                                    glowColor={frame.glow_color}
                                  />
                                ),
                              })}
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
                {activeCategory === "banners" && filteredBanners.map((banner) => {
                  const owned = isOwned(banner.id, "banner") || banner.is_default;
                  const rarity = rarityColors[banner.rarity] || rarityColors.common;
                  const canAfford = (balance?.balance || 0) >= banner.price;
                  
                  return (
                    <div
                      key={banner.id}
                      className={`relative p-4 rounded-xl border ${rarity.border} ${rarity.bg} backdrop-blur-sm shop-card overflow-hidden`}
                    >
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
                              disabled={!canAfford}
                              onClick={() => handlePurchaseClick({
                                id: banner.id,
                                name: banner.name,
                                type: "banner",
                                price: banner.price,
                                rarity: banner.rarity,
                                previewElement: (
                                  <div 
                                    className="w-16 h-8 rounded"
                                    style={{
                                      background: banner.banner_url
                                        ? `url(${banner.banner_url}) center/cover`
                                        : `linear-gradient(135deg, ${banner.gradient_start || '#0a0a12'}, ${banner.gradient_end || '#1a1a2e'})`,
                                    }}
                                  />
                                ),
                              })}
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
                {activeCategory === "titles" && filteredTitles.map((title) => {
                  const owned = isOwned(title.id, "title") || title.is_default;
                  const rarity = rarityColors[title.rarity] || rarityColors.common;
                  const canAfford = (balance?.balance || 0) >= title.price;
                  
                  return (
                    <div
                      key={title.id}
                      className={`relative p-4 rounded-xl border ${rarity.border} ${rarity.bg} backdrop-blur-sm shop-card overflow-hidden`}
                    >
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
                              disabled={!canAfford}
                              onClick={() => handlePurchaseClick({
                                id: title.id,
                                name: title.title_text,
                                type: "title",
                                price: title.price,
                                rarity: title.rarity,
                                previewElement: (
                                  <span
                                    className="font-orbitron text-sm font-bold"
                                    style={{
                                      color: title.text_color || '#5bb4ff',
                                      textShadow: title.glow_color 
                                        ? `0 0 8px ${title.glow_color}` 
                                        : undefined,
                                    }}
                                  >
                                    {title.title_text}
                                  </span>
                                ),
                              })}
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

                {/* Empty states */}
                {activeCategory === "frames" && filteredFrames.length === 0 && !framesLoading && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Frame className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-rajdhani">
                      {frames.length === 0 ? "No frames available yet" : "No frames match your filters"}
                    </p>
                  </div>
                )}
                {activeCategory === "banners" && filteredBanners.length === 0 && !bannersLoading && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-rajdhani">
                      {banners.length === 0 ? "No banners available yet" : "No banners match your filters"}
                    </p>
                  </div>
                )}
                {activeCategory === "titles" && filteredTitles.length === 0 && !titlesLoading && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Crown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-rajdhani">
                      {titles.length === 0 ? "No titles available yet" : "No titles match your filters"}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      <PurchaseConfirmModal
        open={!!purchaseItem}
        onOpenChange={(open) => !open && setPurchaseItem(null)}
        item={purchaseItem}
        currentBalance={balance?.balance || 0}
        onConfirm={handleConfirmPurchase}
        isPending={purchaseCosmetic.isPending}
      />
    </div>
  );
}
