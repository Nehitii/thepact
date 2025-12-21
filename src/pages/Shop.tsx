import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { CyberBackground } from "@/components/CyberBackground";
import { ShopTabs } from "@/components/shop/ShopTabs";
import { ShopBondDisplay } from "@/components/shop/ShopBondDisplay";
import { CosmeticShop } from "@/components/shop/CosmeticShop";
import { ModulesShop } from "@/components/shop/ModulesShop";
import { BondsShop } from "@/components/shop/BondsShop";
import { motion, AnimatePresence } from "framer-motion";

type ShopTab = "cosmetics" | "modules" | "bonds";

export default function Shop() {
  const [activeTab, setActiveTab] = useState<ShopTab>("cosmetics");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      
      <div className="relative z-10 px-4 pt-6 pb-24 max-w-5xl mx-auto">
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
          <ShopTabs activeTab={activeTab} onTabChange={setActiveTab} />
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
            {activeTab === "cosmetics" && <CosmeticShop />}
            {activeTab === "modules" && <ModulesShop />}
            {activeTab === "bonds" && <BondsShop />}
          </motion.div>
        </AnimatePresence>
      </div>

      <Navigation />
    </div>
  );
}
