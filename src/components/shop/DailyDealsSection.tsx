import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyDeals, DailyDealWithItem } from "@/hooks/useDailyDeals";
import { useBondBalance, useUserCosmetics, useUserModulePurchases, usePurchaseCosmetic, usePurchaseModule } from "@/hooks/useShop";
import { DailyDealCard } from "./DailyDealCard";
import { PurchaseConfirmModal, PurchaseItem } from "./PurchaseConfirmModal";
import { UnlockAnimation } from "./UnlockAnimation";

export function DailyDealsSection() {
  const { user } = useAuth();
  const { data: deals = [], isLoading } = useDailyDeals();
  const { data: balance } = useBondBalance(user?.id);
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const { data: ownedModules = [] } = useUserModulePurchases(user?.id);
  const purchaseCosmetic = usePurchaseCosmetic();
  const purchaseModule = usePurchaseModule();

  const [selectedDeal, setSelectedDeal] = useState<DailyDealWithItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockedItem, setUnlockedItem] = useState<{ name: string; rarity: string; type: "cosmetic" | "module" } | null>(null);

  const isOwned = (deal: DailyDealWithItem) => {
    if (deal.item_type === "module") return ownedModules.includes(deal.item_id);
    if (deal.item_type === "cosmetic_frame") return ownedCosmetics?.frames.includes(deal.item_id) || false;
    if (deal.item_type === "cosmetic_banner") return ownedCosmetics?.banners.includes(deal.item_id) || false;
    if (deal.item_type === "cosmetic_title") return ownedCosmetics?.titles.includes(deal.item_id) || false;
    return false;
  };

  const handlePurchaseClick = (deal: DailyDealWithItem) => {
    setSelectedDeal(deal);
    setShowConfirm(true);
  };

  const handleConfirmPurchase = () => {
    if (!user || !selectedDeal) return;
    const onSuccess = () => {
      setShowConfirm(false);
      setUnlockedItem({
        name: selectedDeal.item?.name || "Item",
        rarity: selectedDeal.item?.rarity || "common",
        type: selectedDeal.item_type === "module" ? "module" : "cosmetic",
      });
      setShowUnlock(true);
    };
    if (selectedDeal.item_type === "module") {
      purchaseModule.mutate(
        { userId: user.id, moduleId: selectedDeal.item_id, price: selectedDeal.discounted_price },
        { onSuccess }
      );
    } else {
      const cosmeticType = selectedDeal.item_type.replace("cosmetic_", "") as "frame" | "banner" | "title";
      purchaseCosmetic.mutate(
        { userId: user.id, cosmeticId: selectedDeal.item_id, cosmeticType, price: selectedDeal.discounted_price },
        { onSuccess }
      );
    }
  };

  if (isLoading || deals.length === 0) return null;

  const purchaseItem: PurchaseItem | null = selectedDeal ? {
    id: selectedDeal.item_id,
    name: selectedDeal.item?.name || "Daily Deal",
    price: selectedDeal.discounted_price,
    rarity: selectedDeal.item?.rarity || "common",
    type: selectedDeal.item_type === "module" ? "module" : "cosmetic",
    originalPrice: selectedDeal.item?.price,
  } : null;

  return (
    <div className="space-y-4 mb-8">
      {/* Header with LIVE dot */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: "hsl(0 90% 55%)" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[10px] font-orbitron tracking-[0.2em] uppercase" style={{ color: "hsl(0 90% 55%)" }}>
            Live
          </span>
        </div>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <Zap className="w-4 h-4" style={{ color: "hsl(45 100% 60%)" }} />
        </motion.div>
        <h2 className="font-orbitron text-base text-foreground tracking-wide">
          Daily Deals
        </h2>
      </div>

      {/* Horizontal snap-scroll carousel */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2">
        {deals.map((deal, index) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="min-w-[340px] sm:min-w-[400px] flex-shrink-0 snap-start"
          >
            <DailyDealCard
              deal={deal}
              onPurchase={() => handlePurchaseClick(deal)}
              isOwned={isOwned(deal)}
              canAfford={(balance?.balance || 0) >= deal.discounted_price}
            />
          </motion.div>
        ))}
      </div>

      {purchaseItem && (
        <PurchaseConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmPurchase}
          item={purchaseItem}
          currentBalance={balance?.balance || 0}
          isPurchasing={purchaseCosmetic.isPending || purchaseModule.isPending}
        />
      )}

      {unlockedItem && (
        <UnlockAnimation
          isOpen={showUnlock}
          onComplete={() => { setShowUnlock(false); setUnlockedItem(null); }}
          itemName={unlockedItem.name}
          itemType={unlockedItem.type}
          rarity={unlockedItem.rarity}
        />
      )}
    </div>
  );
}
