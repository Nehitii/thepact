import { useState } from "react";
/* La feuille du domaine. Elle etait chargee globalement par `main.tsx`
   alors qu elle ne declare que cinq classes, dont aucune n est citee
   hors de la boutique — contrairement a `journal.css`, qui porte
   `font-orbitron` et reste globale pour cette raison. Elle sort donc du
   paquet de demarrage et voyage avec la page. */
import "@/domaines/boutique/boutique.css";
import { ShopTabs, ShopTab } from "@/domaines/boutique/composants/ShopTabs";
import { ShopBondDisplay } from "@/domaines/boutique/composants/ShopBondDisplay";
import { CosmeticShop } from "@/domaines/boutique/composants/CosmeticShop";
import { ModulesShop } from "@/domaines/boutique/composants/ModulesShop";
import { BondsShop } from "@/domaines/boutique/composants/BondsShop";
import { WishlistPanel } from "@/domaines/boutique/composants/WishlistPanel";
import { PurchaseHistory } from "@/domaines/boutique/composants/PurchaseHistory";
import { DailyDealsSection } from "@/domaines/boutique/composants/DailyDealsSection";
import { BundlesSection } from "@/domaines/boutique/composants/BundlesSection";
import { ShopSpotlight } from "@/domaines/boutique/composants/ShopSpotlight";
import { BandeBoutique } from "@/domaines/boutique/composants/BandeBoutique";
import { PurchaseConfirmModal, PurchaseItem } from "@/domaines/boutique/composants/PurchaseConfirmModal";
import { UnlockAnimation } from "@/domaines/boutique/composants/UnlockAnimation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/domaines/boutique/hooks/useWishlist";
import { useBondBalance } from "@/domaines/boutique/hooks/useShop";
import { useShopTransaction } from "@/domaines/boutique/hooks/useShopTransaction";
import { useTranslation } from "react-i18next";
import { Store } from "lucide-react";
import { DSPageShell } from "@/components/ds";
import type { ArticleAchetable } from "@/domaines/boutique/logique/articleAchetable";

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

  const handleSpotlightPurchase = (item: ArticleAchetable, type: string) => {
    setPurchaseItem({
      id: item.id,
      name: item.name,
      type: type as PurchaseItem["type"],
      price: item.price,
      rarity: item.rarity,
    });
  };

  const handleWishlistPurchase = (item: ArticleAchetable, itemType: string) => {
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
    <DSPageShell width="xl" padding="tight" className="!px-0 !pt-0 !pb-0" background={
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    }>
      <div className="relative z-10 page-px pt-4 md:pt-6 pb-6">
        {/* ─── HEADER ─── */}
        <motion.div
          className="relative mb-6 md:mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <div
                className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(270 80% 60% / 0.1))",
                  border: "1px solid hsl(var(--primary) / 0.2)",
                }}
              >
                <Store className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="font-orbitron text-xl sm:text-3xl font-black tracking-tight text-foreground truncate">
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
              /* Les quatre sections ne sont plus de meme nature : la
                 vedette annonce, les offres expirent, les lots
                 assemblent, le catalogue attend. Chacune a desormais
                 son assise. */
              <div className="space-y-10">
                <BandeBoutique>
                  <ShopSpotlight
                    onPurchase={handleSpotlightPurchase}
                    onPreview={handleSpotlightPurchase}
                  />
                </BandeBoutique>

                <BandeBoutique pleineLargeur ton="urgent">
                  <DailyDealsSection />
                </BandeBoutique>

                <BandeBoutique>
                  <BundlesSection />
                </BandeBoutique>

                <BandeBoutique ton="creux" className="px-4 sm:px-5">
                  <CosmeticShop />
                </BandeBoutique>
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
    </DSPageShell>
  );
}
