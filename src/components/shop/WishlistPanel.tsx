import { motion } from "framer-motion";
import { Heart, Sparkles, Star, Package, Trash2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useBondBalance, useShopFrames, useShopBanners, useShopTitles, useShopModules, useUserCosmetics, useUserModulePurchases } from "@/hooks/useShop";
import { useShopBundles } from "@/hooks/useBundles";
import { BondIcon } from "@/components/ui/bond-icon";
import { Button } from "@/components/ui/button";
import { SignalLostEmpty } from "./SignalLostEmpty";

interface WishlistPanelProps {
  onPurchaseItem: (item: any, itemType: string) => void;
}

const rarityColors: Record<string, string> = {
  common: "hsl(210 15% 60%)",
  rare: "hsl(212 90% 55%)",
  epic: "hsl(270 80% 60%)",
  legendary: "hsl(45 100% 60%)",
};

export function WishlistPanel({ onPurchaseItem }: WishlistPanelProps) {
  const { user } = useAuth();
  const { data: wishlist = [], isLoading } = useWishlist(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const removeFromWishlist = useRemoveFromWishlist();

  const { data: frames = [] } = useShopFrames();
  const { data: banners = [] } = useShopBanners();
  const { data: titles = [] } = useShopTitles();
  const { data: modules = [] } = useShopModules();
  const { data: bundles = [] } = useShopBundles();
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const { data: ownedModules = [] } = useUserModulePurchases(user?.id);

  const enrichedWishlist = wishlist.map(w => {
    let item = null;
    let itemData: any = null;
    let isOwned = false;

    if (w.item_type === "cosmetic") {
      itemData = frames.find(f => f.id === w.item_id);
      if (itemData) { item = { ...itemData, type: "frame" }; isOwned = ownedCosmetics?.frames.includes(w.item_id) || false; }
      if (!item) { itemData = banners.find(b => b.id === w.item_id); if (itemData) { item = { ...itemData, type: "banner" }; isOwned = ownedCosmetics?.banners.includes(w.item_id) || false; } }
      if (!item) { itemData = titles.find(t => t.id === w.item_id); if (itemData) { item = { ...itemData, name: itemData.title_text, type: "title" }; isOwned = ownedCosmetics?.titles.includes(w.item_id) || false; } }
    } else if (w.item_type === "module") {
      itemData = modules.find(m => m.id === w.item_id);
      if (itemData) { item = { ...itemData, price: itemData.price_bonds }; isOwned = ownedModules.includes(w.item_id); }
    } else if (w.item_type === "bundle") {
      itemData = bundles.find(b => b.id === w.item_id);
      if (itemData) { item = { ...itemData, price: itemData.price_bonds }; }
    }

    return { ...w, item, isOwned };
  }).filter(w => w.item !== null);

  const handleRemove = (wishlistItem: typeof enrichedWishlist[0]) => {
    if (!user) return;
    removeFromWishlist.mutate({ userId: user.id, itemId: wishlistItem.item_id, itemType: wishlistItem.item_type });
  };

  const totalCost = enrichedWishlist.filter(w => !w.isOwned).reduce((sum, w) => sum + (w.item?.price || 0), 0);
  const affordableCount = enrichedWishlist.filter(w => !w.isOwned && (balance?.balance || 0) >= (w.item?.price || 0)).length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-card/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (enrichedWishlist.length === 0) {
    return <SignalLostEmpty subtitle="Save items to your loadout for later acquisition" />;
  }

  const getIcon = (itemType: string) => {
    if (itemType === "bundle") return <Package className="w-4 h-4" style={{ color: "hsl(270 80% 60%)" }} />;
    if (itemType === "module") return <Star className="w-4 h-4" style={{ color: "hsl(45 100% 60%)" }} />;
    return <Sparkles className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4" style={{ color: "hsl(350 80% 55%)" }} />
          <h2 className="font-orbitron text-sm text-foreground tracking-wider">Mission Loadout</h2>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-orbitron" style={{ background: "hsl(350 80% 55% / 0.15)", color: "hsl(350 80% 55%)" }}>
            {enrichedWishlist.length}
          </span>
        </div>
        {affordableCount > 0 && (
          <span className="text-[10px] font-orbitron tracking-wider" style={{ color: "hsl(142 70% 50%)" }}>
            {affordableCount} affordable
          </span>
        )}
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-2 gap-3">
        {enrichedWishlist.map((wishlistItem, index) => {
          const canAfford = (balance?.balance || 0) >= (wishlistItem.item?.price || 0);
          const color = rarityColors[wishlistItem.item?.rarity] || "hsl(var(--primary))";

          return (
            <motion.div
              key={wishlistItem.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
              className="relative rounded-xl border overflow-hidden bg-card/60 backdrop-blur-sm group"
              style={{
                borderColor: wishlistItem.isOwned
                  ? "hsl(142 70% 50% / 0.2)"
                  : canAfford
                    ? color + "30"
                    : "hsl(var(--primary) / 0.1)",
                boxShadow: canAfford && !wishlistItem.isOwned ? `0 0 12px ${color}15` : undefined,
              }}
            >
              {/* Can-afford pulse indicator */}
              {canAfford && !wishlistItem.isOwned && (
                <motion.div
                  className="absolute top-2 right-2 w-2 h-2 rounded-full z-10"
                  style={{ background: "hsl(142 70% 50%)" }}
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Remove button */}
              <button
                onClick={() => handleRemove(wishlistItem)}
                className="absolute top-2 left-2 z-10 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "hsl(var(--background) / 0.8)" }}
              >
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors" />
              </button>

              <div className="p-3 space-y-2">
                {/* Icon */}
                <div className="flex items-center justify-center h-10">
                  {getIcon(wishlistItem.item_type)}
                </div>

                {/* Name */}
                <div className="text-xs font-rajdhani font-semibold text-foreground truncate text-center">
                  {wishlistItem.item?.name}
                </div>

                {/* Price */}
                <div className="flex items-center justify-center gap-1 text-xs font-orbitron font-bold" style={{ color }}>
                  <BondIcon size={13} />
                  {wishlistItem.item?.price}
                </div>

                {/* Action */}
                {wishlistItem.isOwned ? (
                  <div className="text-center text-[9px] font-orbitron tracking-wider" style={{ color: "hsl(142 70% 50%)" }}>
                    Owned
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPurchaseItem(wishlistItem.item, wishlistItem.item_type)}
                    disabled={!canAfford}
                    className="w-full h-7 text-[10px] font-orbitron tracking-wider"
                    style={{
                      borderColor: color + "30",
                      color: canAfford ? color : undefined,
                      background: canAfford ? color + "10" : undefined,
                    }}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Get
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total cost summary bar */}
      <div
        className="flex items-center justify-between p-3 rounded-lg border"
        style={{
          borderColor: "hsl(var(--primary) / 0.15)",
          background: "hsl(var(--card) / 0.5)",
        }}
      >
        <div className="text-[10px] font-orbitron tracking-wider text-muted-foreground uppercase">
          Total Loadout Cost
        </div>
        <div className="flex items-center gap-1.5 font-orbitron text-sm font-bold text-primary">
          <BondIcon size={15} />
          {totalCost.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
