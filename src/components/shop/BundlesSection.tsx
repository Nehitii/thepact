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
import { SignalLostEmpty } from "./SignalLostEmpty";

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

  const getOwnedCount = (bundle: ShopBundle) =>
    bundle.items.filter(item => {
      if (item.item_type === "module") return ownedModules.includes(item.item_id);
      const cosmeticType = item.item_type.replace("cosmetic_", "") as "frames" | "banners" | "titles";
      return ownedCosmetics?.[cosmeticType]?.includes(item.item_id) || false;
    }).length;

  const handlePurchaseClick = (bundle: ShopBundle) => { setSelectedBundle(bundle); setShowConfirm(true); };

  const handleConfirmPurchase = () => {
    if (!user || !selectedBundle) return;
    purchaseBundle.mutate({ bundleId: selectedBundle.id }, {
      onSuccess: () => { setShowConfirm(false); setUnlockedItem({ name: selectedBundle.name, rarity: selectedBundle.rarity }); setShowUnlock(true); },
    });
  };

  if (isLoading) return <ShopLoadingState type="modules" />;
  if (bundles.length === 0) return <SignalLostEmpty subtitle="No bundles available — check back later" />;

  const purchaseItem: PurchaseItem | null = selectedBundle ? {
    id: selectedBundle.id, name: selectedBundle.name, price: selectedBundle.price_bonds, rarity: selectedBundle.rarity, type: "bundle",
  } : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-purple-400" />
        <h2 className="font-orbitron text-lg text-foreground tracking-wide">Bundles</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bundles.map((bundle, index) => (
          <motion.div key={bundle.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <BundleCard bundle={bundle} onPurchase={() => handlePurchaseClick(bundle)} canAfford={(balance?.balance || 0) >= bundle.price_bonds} ownedItemCount={getOwnedCount(bundle)} />
          </motion.div>
        ))}
      </div>

      {purchaseItem && (
        <PurchaseConfirmModal open={showConfirm} onOpenChange={(open) => !open && setShowConfirm(false)} onConfirm={handleConfirmPurchase} item={purchaseItem} currentBalance={balance?.balance || 0} isPending={purchaseBundle.isPending} />
      )}

      {unlockedItem && (
        <UnlockAnimation isOpen={showUnlock} onComplete={() => { setShowUnlock(false); setUnlockedItem(null); }} itemName={unlockedItem.name} itemType="bundle" rarity={unlockedItem.rarity} />
      )}
    </div>
  );
}
