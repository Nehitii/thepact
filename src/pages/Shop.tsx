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
import { Store } from "lucide-react";

export default function Shop() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ShopTab>("cosmetics");
  const { user } = useAuth();
  const { data: wishlist = [] } = useWishlist(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const transaction = useShopTransaction();

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
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 px-4 pt-6 pb-6 max-w-6xl mx-auto">
        {/* ─── HEADER ─── */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(270 80% 60% / 0.1))",
                  border: "1px solid hsl(var(--primary) / 0.2)",
                }}
              >
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-orbitron text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {t("shop.title")}
                </h1>
                <p className="text-xs text-muted-foreground font-rajdhani tracking-wider mt-0.5">
                  {t("shop.subtitle")}
                </p>
              </div>
            </div>
            <ShopBondDisplay onBuyBonds={() => setActiveTab("bonds")} />
          </div>

          {/* Gradient divider */}
          <div className="mt-5 h-px" style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), hsl(270 80% 60% / 0.15), transparent)",
          }} />
        </motion.div>

        {/* ─── TABS ─── */}
        <div className="mb-8">
          <ShopTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            wishlistCount={wishlist.length}
          />
        </div>

        {/* ─── CONTENT ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "cosmetics" && (
              <div className="space-y-10">
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
