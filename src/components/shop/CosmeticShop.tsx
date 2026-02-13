import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Frame, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useShopFrames,
  useShopBanners,
  useShopTitles,
  useUserCosmetics,
  useBondBalance,
  CosmeticFrame,
  CosmeticBanner,
  CosmeticTitle,
} from "@/hooks/useShop";
import { FramePreview } from "@/components/ui/avatar-frame";
import { ShopFilters, ShopFilterState, applyShopFilters } from "./ShopFilters";
import { PurchaseConfirmModal, PurchaseItem } from "./PurchaseConfirmModal";
import { ShopLoadingState } from "./ShopLoadingState";
import { UnlockAnimation } from "./UnlockAnimation";
import { CyberItemCard } from "./CyberItemCard";
import { FittingRoom } from "./FittingRoom";
import { useShopTransaction } from "@/hooks/useShopTransaction";

type CosmeticCategory = "frames" | "banners" | "titles";

const categories = [
  { id: "frames" as const, label: "Frames", icon: Frame },
  { id: "banners" as const, label: "Banners", icon: Image },
  { id: "titles" as const, label: "Titles", icon: Crown },
];

export function CosmeticShop() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>("frames");
  const [purchaseItem, setPurchaseItem] = useState<PurchaseItem | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const [filters, setFilters] = useState<ShopFilterState>({
    search: "",
    sort: "price-asc",
    rarity: "all",
    hideOwned: false,
  });

  // Fitting Room state
  const [fittingItem, setFittingItem] = useState<
    | { type: "frame"; data: CosmeticFrame }
    | { type: "banner"; data: CosmeticBanner }
    | { type: "title"; data: CosmeticTitle }
    | null
  >(null);

  const { data: frames = [], isLoading: framesLoading } = useShopFrames();
  const { data: banners = [], isLoading: bannersLoading } = useShopBanners();
  const { data: titles = [], isLoading: titlesLoading } = useShopTitles();
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const { data: balance } = useBondBalance(user?.id);

  const transaction = useShopTransaction();

  const isLoading = activeCategory === "frames" ? framesLoading :
    activeCategory === "banners" ? bannersLoading : titlesLoading;

  const handlePurchaseClick = (item: PurchaseItem) => {
    setPurchaseItem(item);
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseItem) return;
    const success = await transaction.initiatePurchase({
      itemId: purchaseItem.id,
      itemName: purchaseItem.name,
      itemType: purchaseItem.type as "frame" | "banner" | "title",
      price: purchaseItem.price,
      rarity: purchaseItem.rarity,
    });
    if (success) {
      setShowUnlock(true);
      setPurchaseItem(null);
    }
  };

  const handleFittingPurchase = async () => {
    if (!fittingItem) return;
    const itemName = fittingItem.type === "title"
      ? (fittingItem.data as CosmeticTitle).title_text
      : fittingItem.data.name;
    const success = await transaction.initiatePurchase({
      itemId: fittingItem.data.id,
      itemName,
      itemType: fittingItem.type,
      price: fittingItem.data.price,
      rarity: fittingItem.data.rarity,
    });
    if (success) {
      setFittingItem(null);
      setShowUnlock(true);
    }
  };

  const isOwned = (id: string, type: "frame" | "banner" | "title") => {
    if (!ownedCosmetics) return false;
    if (type === "frame") return ownedCosmetics.frames.includes(id);
    if (type === "banner") return ownedCosmetics.banners.includes(id);
    return ownedCosmetics.titles.includes(id);
  };

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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${isActive
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 mb-4">
          <ShopFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalItems={totalItems}
            visibleItems={visibleItems}
          />
        </div>

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
                {activeCategory === "frames" && filteredFrames.map((frame, i) => (
                  <CyberItemCard
                    key={frame.id}
                    id={frame.id}
                    name={frame.name}
                    rarity={frame.rarity}
                    price={frame.price}
                    owned={isOwned(frame.id, "frame") || frame.is_default}
                    canAfford={(balance?.balance || 0) >= frame.price}
                    itemType="frame"
                    index={i}
                    preview={
                      <FramePreview
                        size="lg"
                        frameImage={frame.preview_url}
                        borderColor={frame.border_color}
                        glowColor={frame.glow_color}
                        frameScale={frame.frame_scale}
                        frameOffsetX={frame.frame_offset_x}
                        frameOffsetY={frame.frame_offset_y}
                      />
                    }
                    onPurchase={() => handlePurchaseClick({
                      id: frame.id, name: frame.name, type: "frame",
                      price: frame.price, rarity: frame.rarity,
                    })}
                    onPreview={() => setFittingItem({ type: "frame", data: frame })}
                  />
                ))}

                {activeCategory === "banners" && filteredBanners.map((banner, i) => (
                  <CyberItemCard
                    key={banner.id}
                    id={banner.id}
                    name={banner.name}
                    rarity={banner.rarity}
                    price={banner.price}
                    owned={isOwned(banner.id, "banner") || banner.is_default}
                    canAfford={(balance?.balance || 0) >= banner.price}
                    itemType="banner"
                    index={i}
                    preview={
                      <div
                        className="w-full h-16 rounded-lg"
                        style={{
                          background: banner.banner_url
                            ? `url(${banner.banner_url}) center/cover`
                            : `linear-gradient(135deg, ${banner.gradient_start || '#0a0a12'}, ${banner.gradient_end || '#1a1a2e'})`,
                        }}
                      />
                    }
                    onPurchase={() => handlePurchaseClick({
                      id: banner.id, name: banner.name, type: "banner",
                      price: banner.price, rarity: banner.rarity,
                    })}
                    onPreview={() => setFittingItem({ type: "banner", data: banner })}
                  />
                ))}

                {activeCategory === "titles" && filteredTitles.map((title, i) => {
                  const originalTitle = titles.find(t => t.id === title.id);
                  return (
                    <CyberItemCard
                      key={title.id}
                      id={title.id}
                      name={title.name}
                      rarity={title.rarity}
                      price={title.price}
                      owned={isOwned(title.id, "title") || title.is_default}
                      canAfford={(balance?.balance || 0) >= title.price}
                      itemType="title"
                      index={i}
                      preview={
                        <span
                          className="font-orbitron text-lg font-bold tracking-wider"
                          style={{
                            color: originalTitle?.text_color || '#5bb4ff',
                            textShadow: originalTitle?.glow_color
                              ? `0 0 10px ${originalTitle.glow_color}, 0 0 20px ${originalTitle.glow_color}`
                              : undefined,
                          }}
                        >
                          {originalTitle?.title_text || title.name}
                        </span>
                      }
                      onPurchase={() => handlePurchaseClick({
                        id: title.id, name: title.name, type: "title",
                        price: title.price, rarity: title.rarity,
                      })}
                      onPreview={() => originalTitle && setFittingItem({ type: "title", data: originalTitle })}
                    />
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
        isPending={transaction.isPending}
      />

      {/* Fitting Room */}
      <FittingRoom
        open={!!fittingItem}
        onOpenChange={(open) => !open && setFittingItem(null)}
        previewItem={fittingItem}
        onPurchase={handleFittingPurchase}
        isPending={transaction.isPending}
        canAfford={fittingItem ? transaction.canAfford(fittingItem.data.price) : false}
        currentBalance={transaction.currentBalance}
      />

      {/* Unlock Animation */}
      {transaction.lastPurchased && (
        <UnlockAnimation
          isOpen={showUnlock}
          onComplete={() => {
            setShowUnlock(false);
            transaction.clearLastPurchased();
          }}
          itemName={transaction.lastPurchased.name}
          itemType="cosmetic"
          rarity={transaction.lastPurchased.rarity}
        />
      )}
    </div>
  );
}
