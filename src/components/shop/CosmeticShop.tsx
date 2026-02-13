import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Frame, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useShopFrames,
  useShopBanners,
  useShopTitles,
  useUserCosmetics,
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
  const [fittingItem, setFittingItem] = useState<
    | { type: "frame"; data: CosmeticFrame }
    | { type: "banner"; data: CosmeticBanner }
    | { type: "title"; data: CosmeticTitle }
    | null
  >(null);

  const { data: frames = [], isLoading: fLoad } = useShopFrames();
  const { data: banners = [], isLoading: bLoad } = useShopBanners();
  const { data: titles = [], isLoading: tLoad } = useShopTitles();
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const transaction = useShopTransaction();

  const isOwned = (id: string, type: "frame" | "banner" | "title") => {
    if (!ownedCosmetics) return false;
    if (type === "frame") return ownedCosmetics.frames.includes(id);
    if (type === "banner") return ownedCosmetics.banners.includes(id);
    return ownedCosmetics.titles.includes(id);
  };

  const handlePurchaseClick = (item: PurchaseItem) => setPurchaseItem(item);

  const handleConfirmPurchase = async () => {
    if (!purchaseItem) return;
    const success = await transaction.initiatePurchase({
      itemId: purchaseItem.id,
      itemName: purchaseItem.name,
      itemType: purchaseItem.type as any,
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
    const name = fittingItem.type === "title" ? (fittingItem.data as CosmeticTitle).title_text : fittingItem.data.name;
    const success = await transaction.initiatePurchase({
      itemId: fittingItem.data.id,
      itemName: name,
      itemType: fittingItem.type,
      price: fittingItem.data.price,
      rarity: fittingItem.data.rarity,
    });
    if (success) {
      setFittingItem(null);
      setShowUnlock(true);
    }
  };

  const filteredFrames = useMemo(
    () => applyShopFilters(frames, filters, (f) => isOwned(f.id, "frame")),
    [frames, filters, ownedCosmetics],
  );
  const filteredBanners = useMemo(
    () => applyShopFilters(banners, filters, (b) => isOwned(b.id, "banner")),
    [banners, filters, ownedCosmetics],
  );
  const filteredTitles = useMemo(
    () =>
      applyShopFilters(
        titles.map((t) => ({ ...t, name: t.title_text })),
        filters,
        (t) => isOwned(t.id, "title"),
      ),
    [titles, filters, ownedCosmetics],
  );

  const isLoading = activeCategory === "frames" ? fLoad : activeCategory === "banners" ? bLoad : tLoad;

  return (
    <div className="flex gap-6 h-full">
      <div className="w-48 flex-shrink-0 space-y-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeCategory === cat.id ? "bg-primary/10 border border-primary/30 text-primary" : "hover:bg-card/50 text-muted-foreground"}`}
          >
            <cat.icon className="w-5 h-5" /> <span className="font-rajdhani font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <ShopFilters filters={filters} onFiltersChange={setFilters} totalItems={0} visibleItems={0} />
        <div className="flex-1 overflow-y-auto hide-scrollbar mt-4">
          {isLoading ? (
            <ShopLoadingState type="cosmetics" count={6} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {activeCategory === "frames" &&
                  filteredFrames.map((f, i) => (
                    <CyberItemCard
                      key={f.id}
                      id={f.id}
                      name={f.name}
                      rarity={f.rarity}
                      price={f.price}
                      owned={isOwned(f.id, "frame")}
                      canAfford={transaction.canAfford(f.price)}
                      itemType="frame"
                      index={i}
                      preview={
                        <FramePreview
                          size="lg"
                          frameImage={f.preview_url}
                          borderColor={f.border_color}
                          glowColor={f.glow_color}
                        />
                      }
                      onPurchase={() =>
                        handlePurchaseClick({ id: f.id, name: f.name, type: "frame", price: f.price, rarity: f.rarity })
                      }
                      onPreview={() => setFittingItem({ type: "frame", data: f })}
                    />
                  ))}
                {activeCategory === "banners" &&
                  filteredBanners.map((b, i) => (
                    <CyberItemCard
                      key={b.id}
                      id={b.id}
                      name={b.name}
                      rarity={b.rarity}
                      price={b.price}
                      owned={isOwned(b.id, "banner")}
                      canAfford={transaction.canAfford(b.price)}
                      itemType="banner"
                      index={i}
                      preview={
                        <div
                          className="w-full h-16 rounded-lg"
                          style={{
                            background: b.banner_url
                              ? `url(${b.banner_url}) center/cover`
                              : `linear-gradient(135deg, ${b.gradient_start}, ${b.gradient_end})`,
                          }}
                        />
                      }
                      onPurchase={() =>
                        handlePurchaseClick({
                          id: b.id,
                          name: b.name,
                          type: "banner",
                          price: b.price,
                          rarity: b.rarity,
                        })
                      }
                      onPreview={() => setFittingItem({ type: "banner", data: b })}
                    />
                  ))}
                {activeCategory === "titles" &&
                  filteredTitles.map((t, i) => (
                    <CyberItemCard
                      key={t.id}
                      id={t.id}
                      name={t.name}
                      rarity={t.rarity}
                      price={t.price}
                      owned={isOwned(t.id, "title")}
                      canAfford={transaction.canAfford(t.price)}
                      itemType="title"
                      index={i}
                      preview={
                        <span
                          className="font-orbitron font-bold"
                          style={{
                            color: t.text_color || "#5bb4ff",
                            textShadow: t.glow_color ? `0 0 10px ${t.glow_color}` : undefined,
                          }}
                        >
                          {t.name}
                        </span>
                      }
                      onPurchase={() =>
                        handlePurchaseClick({ id: t.id, name: t.name, type: "title", price: t.price, rarity: t.rarity })
                      }
                      onPreview={() => setFittingItem({ type: "title", data: t as any })}
                    />
                  ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <PurchaseConfirmModal
        open={!!purchaseItem}
        onOpenChange={(v) => !v && setPurchaseItem(null)}
        item={purchaseItem}
        currentBalance={transaction.currentBalance}
        onConfirm={handleConfirmPurchase}
        isPending={transaction.isPending}
      />
      <FittingRoom
        open={!!fittingItem}
        onOpenChange={(v) => !v && setFittingItem(null)}
        previewItem={fittingItem}
        onPurchase={handleFittingPurchase}
        isPending={transaction.isPending}
        canAfford={fittingItem ? transaction.canAfford(fittingItem.data.price) : false}
        currentBalance={transaction.currentBalance}
      />
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
