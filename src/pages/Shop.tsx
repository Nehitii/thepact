import { useState } from "react";
import { CyberBackground } from "@/components/CyberBackground";
import { ShopTabs, ShopTab } from "@/components/shop/ShopTabs";
import { ShopBondDisplay } from "@/components/shop/ShopBondDisplay";
import { CosmeticShop } from "@/components/shop/CosmeticShop";
import { ModulesShop } from "@/components/shop/ModulesShop";
import { BondsShop } from "@/components/shop/BondsShop";
import { WishlistPanel } from "@/components/shop/WishlistPanel";
import { PurchaseHistory } from "@/components/shop/PurchaseHistory";
import { DailyDealsSection } from "@/components/shop/DailyDealsSection";
import { BundlesSection } from "@/components/shop/BundlesSection";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";

export default function Shop() {
  const [activeTab, setActiveTab] = useState<ShopTab>("cosmetics");
  const { user } = useAuth();
  const { data: wishlist = [] } = useWishlist(user?.id);

  const handlePurchaseFromWishlist = (item: any, itemType: string) => {
    // Switch to appropriate tab and let the shop handle the purchase
    if (itemType === "module") {
      setActiveTab("modules");
    } else {
      setActiveTab("cosmetics");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      
      <div className="relative z-10 px-4 pt-6 pb-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h1 className="font-orbitron text-2xl font-bold tracking-wider">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(91,180,255,0.5)]">
                SHOP
              </span>
            </h1>
            <p className="text-sm text-muted-foreground font-rajdhani">
              Expand your experience
            </p>
          </div>
          <ShopBondDisplay />
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <ShopTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            wishlistCount={wishlist.length}
          />
        </div>

        {/* Content */}
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
                <DailyDealsSection />
                <BundlesSection />
                <CosmeticShop />
              </div>
            )}
            {activeTab === "modules" && <ModulesShop />}
            {activeTab === "bonds" && <BondsShop />}
            {activeTab === "wishlist" && (
              <WishlistPanel onPurchaseItem={handlePurchaseFromWishlist} />
            )}
            {activeTab === "history" && <PurchaseHistory />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
