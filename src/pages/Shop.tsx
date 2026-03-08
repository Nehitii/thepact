import { useState } from "react";
import { ShopTabs, ShopTab } from "@/components/shop/ShopTabs";
import { ShopBondDisplay } from "@/components/shop/ShopBondDisplay";
import { CosmeticShop } from "@/components/shop/CosmeticShop";
import { ModulesShop } from "@/components/shop/ModulesShop";
import { BondsShop } from "@/components/shop/BondsShop";
import { WishlistPanel } from "@/components/shop/WishlistPanel";
import { PurchaseHistory } from "@/components/shop/PurchaseHistory";
import { DailyDealsSection } from "@/components/shop/DailyDealsSection";
import { BundlesSection } from "@/components/shop/BundlesSection";
import { ShopSpotlight } from "@/components/shop/ShopSpotlight";
import { PurchaseConfirmModal, PurchaseItem } from "@/components/shop/PurchaseConfirmModal";
import { UnlockAnimation } from "@/components/shop/UnlockAnimation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useBondBalance } from "@/hooks/useShop";
import { useShopTransaction } from "@/hooks/useShopTransaction";
import { useTranslation } from "react-i18next";

export default function Shop() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ShopTab>("cosmetics");
  const { user } = useAuth();
  const { data: wishlist = [] } = useWishlist(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const transaction = useShopTransaction();

  // Shared purchase modal state for Spotlight + Wishlist
  const [purchaseItem, setPurchaseItem] = useState<PurchaseItem | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);

  const handleTabChange = (tab: ShopTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  const handleSpotlightPurchase = (item: any, type: string) => {
    setPurchaseItem({
      id: item.id,
      name: item.name,
      type: type as PurchaseItem["type"],
      price: item.price,
      rarity: item.rarity,
    });
  };

  const handleWishlistPurchase = (item: any, itemType: string) => {
    const type = itemType === "module" ? "module" : (item.type || "cosmetic");
    setPurchaseItem({
      id: item.id,
      name: item.name,
      type: type as PurchaseItem["type"],
      price: item.price,
      rarity: item.rarity,
    });
  };

  const handleConfirmSharedPurchase = async () => {
    if (!purchaseItem) return;
    const success = await transaction.initiatePurchase({
      itemId: purchaseItem.id,
      itemName: purchaseItem.name,
      itemType: purchaseItem.type as "frame" | "banner" | "title" | "module",
      price: purchaseItem.price,
      rarity: purchaseItem.rarity,
    });
    if (success) {
      setPurchaseItem(null);
      setShowUnlock(true);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 16v20L30 52 0 36V16z' fill='none' stroke='%2300ffff' stroke-opacity='0.03' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 52px",
        }}
      />

      <div
        className="fixed inset-0 pointer-events-none z-[5]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, hsl(var(--background)) 100%)",
        }}
      />

      <div className="relative z-10 px-4 pt-6 pb-6 max-w-5xl mx-auto">
        <motion.div
          className="relative mb-6 overflow-hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: "linear-gradient(135deg, hsl(var(--background)), hsl(270 30% 8%), hsl(var(--background)))",
            }}
          />
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, hsl(var(--primary) / 0.1) 0%, transparent 60%)",
            }}
          />

          <div className="relative flex items-center justify-between p-5 sm:p-7">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="font-orbitron text-xl sm:text-2xl font-bold tracking-widest">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7), hsl(var(--primary)))",
                      backgroundSize: "200% 100%",
                      animation: "cyber-shimmer 4s linear infinite",
                      filter: "drop-shadow(0 0 16px hsl(var(--primary) / 0.4))",
                    }}
                  >
                    {t("shop.title")}
                  </span>
                </h1>
                <div className="flex items-end gap-[2px] h-5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full bg-primary"
                      style={{ height: `${8 + i * 5}px` }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-[0.3em]">
                {t("shop.subtitle")}
              </p>
            </div>
            <ShopBondDisplay onBuyBonds={() => setActiveTab("bonds")} />
          </div>

          <div className="relative h-[1px] overflow-hidden">
            <div
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)",
              }}
              className="absolute inset-0"
            />
            <motion.div
              className="absolute top-0 w-8 h-[2px] rounded-full"
              style={{
                background: "hsl(var(--primary))",
                boxShadow: "0 0 8px hsl(var(--primary) / 0.8), 0 0 16px hsl(var(--primary) / 0.4)",
              }}
              animate={{ left: ["-5%", "105%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>

        <div className="mb-6">
          <ShopTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            wishlistCount={wishlist.length}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "cosmetics" && (
              <div className="space-y-8">
                <ShopSpotlight
                  onPurchase={handleSpotlightPurchase}
                  onPreview={handleSpotlightPurchase}
                />
                <DailyDealsSection />
                <BundlesSection />
                <CosmeticShop />
              </div>
            )}
            {activeTab === "modules" && <ModulesShop />}
            {activeTab === "bonds" && <BondsShop />}
            {activeTab === "wishlist" && (
              <WishlistPanel onPurchaseItem={handleWishlistPurchase} />
            )}
            {activeTab === "history" && <PurchaseHistory />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Shared purchase modal for Spotlight & Wishlist */}
      <PurchaseConfirmModal
        open={!!purchaseItem}
        onOpenChange={(open) => !open && setPurchaseItem(null)}
        item={purchaseItem}
        currentBalance={balance?.balance || 0}
        onConfirm={handleConfirmSharedPurchase}
        isPending={transaction.isPending}
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
