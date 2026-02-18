import { useState, useEffect } from "react";
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
import { ShopSpotlight } from "@/components/shop/ShopSpotlight";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useTranslation } from "react-i18next";

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse text-primary/60">|</span>
    </span>
  );
}

export default function Shop() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ShopTab>("cosmetics");
  const [showGlitch, setShowGlitch] = useState(false);
  const { user } = useAuth();
  const { data: wishlist = [] } = useWishlist(user?.id);

  const handleTabChange = (tab: ShopTab) => {
    if (tab === activeTab) return;
    setShowGlitch(true);
    setTimeout(() => {
      setActiveTab(tab);
      setShowGlitch(false);
    }, 120);
  };

  const handlePurchaseFromWishlist = (item: any, itemType: string) => {
    if (itemType === "module") {
      setActiveTab("modules");
    } else {
      setActiveTab("cosmetics");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />

      {/* Vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[5]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, hsl(var(--background)) 100%)",
        }}
      />

      {/* Glitch flash on tab change */}
      <AnimatePresence>
        {showGlitch && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.06 }}
          >
            <div className="absolute inset-0" style={{
              background: "linear-gradient(transparent 0%, hsl(var(--primary) / 0.04) 50%, transparent 100%)",
              backgroundSize: "100% 4px",
              animation: "scanline-move 0.1s linear",
            }} />
            <div className="absolute inset-0 bg-primary/[0.03]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-4 pt-6 pb-6 max-w-5xl mx-auto">
        {/* ── Cinematic Header ── */}
        <motion.div
          className="relative mb-6 rounded-xl overflow-hidden border border-primary/15"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Grid BG */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Radial glow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
            }}
          />

          {/* Floating orbs */}
          <motion.div
            className="absolute w-20 h-20 rounded-full blur-3xl pointer-events-none"
            style={{ background: "hsl(var(--primary) / 0.15)", top: "10%", right: "15%" }}
            animate={{ y: [0, -12, 0], x: [0, 6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-12 h-12 rounded-full blur-2xl pointer-events-none"
            style={{ background: "hsl(var(--accent) / 0.12)", bottom: "15%", left: "10%" }}
            animate={{ y: [0, 8, 0], x: [0, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          <div className="relative flex items-center justify-between p-5 sm:p-6">
            <div className="space-y-1.5">
              {/* Shimmer title */}
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
              {/* Typewriter subtitle */}
              <TypewriterText
                text={t("shop.subtitle")}
                className="text-xs sm:text-sm text-muted-foreground font-rajdhani tracking-wide"
              />
            </div>
            <ShopBondDisplay onBuyBonds={() => setActiveTab("bonds")} />
          </div>

          {/* Bottom edge line */}
          <div
            className="h-[1px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)",
            }}
          />
        </motion.div>

        {/* ── Tabs ── */}
        <div className="mb-6">
          <ShopTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            wishlistCount={wishlist.length}
          />
        </div>

        {/* ── Content ── */}
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
                <ShopSpotlight />
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
