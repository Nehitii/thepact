import { motion } from "framer-motion";
import { Heart, Sparkles, Star, Package, Trash2, ShoppingCart, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useBondBalance, useShopFrames, useShopBanners, useShopTitles, useShopModules, useUserCosmetics, useUserModulePurchases } from "@/hooks/useShop";
import { useShopBundles } from "@/hooks/useBundles";
import { BondIcon } from "@/components/ui/bond-icon";
import { Button } from "@/components/ui/button";
import { SignalLostEmpty } from "./SignalLostEmpty";
import { getRarity } from "./shopRarity";

interface WishlistPanelProps {
  onPurchaseItem: (item: any, itemType: string) => void;
}

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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-card/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (enrichedWishlist.length === 0) {
    return <SignalLostEmpty subtitle="Save items to your loadout for later acquisition" />;
  }

  const getIcon = (itemType: string) => {
    if (itemType === "bundle") return <Package className="w-5 h-5" style={{ color: "hsl(270 80% 60%)" }} />;
    if (itemType === "module") return <Star className="w-5 h-5" style={{ color: "hsl(45 100% 60%)" }} />;
    return <Sparkles className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-5 h-5" style={{ color: "hsl(350 80% 55%)" }} />
          <h2 className="font-orbitron text-lg text-foreground tracking-wide">Wishlist</h2>
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-orbitron font-bold"
            style={{ background: "hsl(350 80% 55% / 0.12)", color: "hsl(350 80% 55%)" }}>
            {enrichedWishlist.length}
          </span>
        </div>
        {affordableCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-orbitron tracking-wider" style={{ color: "hsl(142 70% 50%)" }}>
            <ShoppingBag className="w-3.5 h-3.5" />
            {affordableCount} affordable
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {enrichedWishlist.map((wishlistItem, index) => {
          const canAfford = (balance?.balance || 0) >= (wishlistItem.item?.price || 0);
          const r = getRarity(wishlistItem.item?.rarity || "common");

          return (
            <motion.div
              key={wishlistItem.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ scale: 1.03, y: -3 }}
              className="relative rounded-2xl overflow-hidden group"
              style={{
                background: "hsl(var(--card) / 0.7)",
                border: `1px solid ${wishlistItem.isOwned ? "hsl(142 70% 50% / 0.2)" : r.border}`,
                boxShadow: canAfford && !wishlistItem.isOwned ? `0 0 16px ${r.glow}` : undefined,
              }}
            >
              {/* Rarity stripe */}
              <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${r.accent}, transparent)` }} />

              {/* Can-afford pulse */}
              {canAfford && !wishlistItem.isOwned && (
                <motion.div className="absolute top-4 right-3 w-2 h-2 rounded-full z-10"
                  style={{ background: "hsl(142 70% 50%)" }}
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }} />
              )}

              {/* Remove button */}
              <button onClick={() => handleRemove(wishlistItem)}
                className="absolute top-4 left-3 z-10 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "hsl(var(--background) / 0.8)" }}>
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors" />
              </button>

              <div className="p-4 space-y-3">
                {/* Icon */}
                <div className="flex items-center justify-center h-12"
                  style={{ background: `linear-gradient(180deg, ${r.glow}, transparent)`, borderRadius: "0.75rem" }}>
                  {getIcon(wishlistItem.item_type)}
                </div>

                {/* Name */}
                <div className="text-[13px] font-orbitron font-semibold text-foreground truncate text-center">
                  {wishlistItem.item?.name}
                </div>

                {/* Rarity badge */}
                <div className="flex justify-center">
                  <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${r.badgeBg} ${r.badgeText} ${r.badgeBorder}`}>
                    {wishlistItem.item?.rarity}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-center gap-1.5 text-sm font-orbitron font-bold" style={{ color: r.accent }}>
                  <BondIcon size={14} />
                  {wishlistItem.item?.price}
                </div>

                {/* Action */}
                {wishlistItem.isOwned ? (
                  <div className="text-center text-[10px] font-orbitron tracking-wider py-1" style={{ color: "hsl(142 70% 50%)" }}>
                    Owned
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onPurchaseItem(wishlistItem.item, wishlistItem.item_type)}
                    disabled={!canAfford}
                    className="w-full h-8 text-[10px] font-orbitron tracking-wider rounded-lg"
                    style={{ borderColor: r.border, color: canAfford ? r.accent : undefined, background: canAfford ? r.glow : undefined }}>
                    <ShoppingCart className="w-3 h-3 mr-1" /> Get
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between p-4 rounded-xl" style={{
        background: "hsl(var(--card) / 0.5)", border: "1px solid hsl(var(--primary) / 0.1)",
      }}>
        <div className="text-[10px] font-orbitron tracking-wider text-muted-foreground uppercase">Total Loadout Cost</div>
        <div className="flex items-center gap-1.5 font-orbitron text-sm font-bold text-primary">
          <BondIcon size={15} /> {totalCost.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
