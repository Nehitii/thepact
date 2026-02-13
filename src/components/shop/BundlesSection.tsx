import { useState } from "react";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopBundles, usePurchaseBundle, ShopBundle } from "@/hooks/useBundles";
import { useBondBalance, useUserCosmetics, useUserModulePurchases } from "@/hooks/useShop";
import { BundleCard } from "./BundleCard";
import { PurchaseConfirmModal, PurchaseItem } from "./PurchaseConfirmModal";
import { UnlockAnimation } from "./UnlockAnimation";
import { ShopLoadingState } from "./ShopLoadingState";

export function BundlesSection() {
  const { user } = useAuth();
  const { data: bundles = [], isLoading } = useShopBundles();
  const { data: balance } = useBondBalance(user?.id);
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const { data: ownedModules = [] } = useUserModulePurchases(user?.id);
  const purchaseBundle = usePurchaseBundle();

  const [selectedBundle, setSelectedBundle] = useState<ShopBundle | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockedItem, setUnlockedItem] = useState<{ name: string; rarity: string } | null>(null);

  const getOwnedCount = (bundle: ShopBundle) => {
    return bundle.items.filter((item) => {
      if (item.item_type === "module") {
        return ownedModules.includes(item.item_id);
      }
      const cosmeticType = item.item_type.replace("cosmetic_", "") as "frames" | "banners" | "titles";
      return ownedCosmetics?.[cosmeticType]?.includes(item.item_id) || false;
    }).length;
  };

  const handlePurchaseClick = (bundle: ShopBundle) => {
    setSelectedBundle(bundle);
    setShowConfirm(true);
  };

  const handleConfirmPurchase = () => {
    if (!user || !selectedBundle) return;

    purchaseBundle.mutate(
      { userId: user.id, bundle: selectedBundle },
      {
        onSuccess: () => {
          setShowConfirm(false);
          setUnlockedItem({ name: selectedBundle.name, rarity: selectedBundle.rarity });
          setShowUnlock(true);
        },
      },
    );
  };

  if (isLoading) {
    return <ShopLoadingState type="modules" />;
  }

  if (bundles.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-orbitron text-lg text-foreground mb-2">No Bundles Available</h3>
        <p className="text-sm text-muted-foreground">Check back later for special bundle deals</p>
      </div>
    );
  }

  const purchaseItem: PurchaseItem | null = selectedBundle
    ? {
        id: selectedBundle.id,
        name: selectedBundle.name,
        price: selectedBundle.price_bonds,
        rarity: selectedBundle.rarity,
        type: "bundle",
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-purple-400" />
        <h2 className="font-orbitron text-lg text-foreground tracking-wide">Bundles</h2>
        <span className="text-xs text-muted-foreground ml-2">Save more with bundles</span>
      </div>

      <div className="grid gap-4">
        {bundles.map((bundle, index) => (
          <motion.div
            key={bundle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <BundleCard
              bundle={bundle}
              onPurchase={() => handlePurchaseClick(bundle)}
              canAfford={(balance?.balance || 0) >= bundle.price_bonds}
              ownedItemCount={getOwnedCount(bundle)}
            />
          </motion.div>
        ))}
      </div>

      {/* Purchase confirmation */}
      {purchaseItem && (
        <PurchaseConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmPurchase}
          item={purchaseItem}
          currentBalance={balance?.balance || 0}
          // CORRECTION: isPurchasing -> isPending
          isPending={purchaseBundle.isPending}
        />
      )}

      {/* Unlock animation */}
      {unlockedItem && (
        <UnlockAnimation
          isOpen={showUnlock}
          onComplete={() => {
            setShowUnlock(false);
            setUnlockedItem(null);
          }}
          itemName={unlockedItem.name}
          itemType="bundle"
          rarity={unlockedItem.rarity}
        />
      )}
    </div>
  );
}
