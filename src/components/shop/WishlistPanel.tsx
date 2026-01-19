import { motion } from "framer-motion";
import { Heart, Sparkles, Star, Package, Trash2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useBondBalance, useShopFrames, useShopBanners, useShopTitles, useShopModules, useUserCosmetics, useUserModulePurchases } from "@/hooks/useShop";
import { useShopBundles } from "@/hooks/useBundles";
import { BondIcon } from "@/components/ui/bond-icon";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WishlistPanelProps {
  onPurchaseItem: (item: any, itemType: string) => void;
}

export function WishlistPanel({ onPurchaseItem }: WishlistPanelProps) {
  const { user } = useAuth();
  const { data: wishlist = [], isLoading } = useWishlist(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const removeFromWishlist = useRemoveFromWishlist();
  
  // Fetch all item data
  const { data: frames = [] } = useShopFrames();
  const { data: banners = [] } = useShopBanners();
  const { data: titles = [] } = useShopTitles();
  const { data: modules = [] } = useShopModules();
  const { data: bundles = [] } = useShopBundles();
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const { data: ownedModules = [] } = useUserModulePurchases(user?.id);
  
  // Map wishlist items to their full data
  const enrichedWishlist = wishlist.map(w => {
    let item = null;
    let itemData: any = null;
    let isOwned = false;
    
    if (w.item_type === "cosmetic") {
      // Check frames, banners, titles
      itemData = frames.find(f => f.id === w.item_id);
      if (itemData) {
        item = { ...itemData, type: "frame" };
        isOwned = ownedCosmetics?.frames.includes(w.item_id) || false;
      }
      if (!item) {
        itemData = banners.find(b => b.id === w.item_id);
        if (itemData) {
          item = { ...itemData, type: "banner" };
          isOwned = ownedCosmetics?.banners.includes(w.item_id) || false;
        }
      }
      if (!item) {
        itemData = titles.find(t => t.id === w.item_id);
        if (itemData) {
          item = { ...itemData, name: itemData.title_text, type: "title" };
          isOwned = ownedCosmetics?.titles.includes(w.item_id) || false;
        }
      }
    } else if (w.item_type === "module") {
      itemData = modules.find(m => m.id === w.item_id);
      if (itemData) {
        item = { ...itemData, price: itemData.price_bonds };
        isOwned = ownedModules.includes(w.item_id);
      }
    } else if (w.item_type === "bundle") {
      itemData = bundles.find(b => b.id === w.item_id);
      if (itemData) {
        item = { ...itemData, price: itemData.price_bonds };
      }
    }
    
    return {
      ...w,
      item,
      isOwned,
    };
  }).filter(w => w.item !== null);
  
  const handleRemove = (wishlistItem: typeof enrichedWishlist[0]) => {
    if (!user) return;
    removeFromWishlist.mutate({
      userId: user.id,
      itemId: wishlistItem.item_id,
      itemType: wishlistItem.item_type,
    });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-card/30 animate-pulse" />
        ))}
      </div>
    );
  }
  
  if (enrichedWishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-orbitron text-lg text-foreground mb-2">Wishlist Empty</h3>
        <p className="text-sm text-muted-foreground">
          Items you save will appear here so you can buy them later
        </p>
      </div>
    );
  }
  
  const getIcon = (itemType: string, subType?: string) => {
    if (itemType === "bundle") return <Package className="w-5 h-5 text-purple-400" />;
    if (itemType === "module") return <Star className="w-5 h-5 text-amber-400" />;
    return <Sparkles className="w-5 h-5 text-blue-400" />;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400" />
          <h2 className="font-orbitron text-lg text-foreground">Wishlist</h2>
          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs">
            {enrichedWishlist.length}
          </span>
        </div>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {enrichedWishlist.map((wishlistItem, index) => {
            const canAfford = (balance?.balance || 0) >= (wishlistItem.item?.price || 0);
            
            return (
              <motion.div
                key={wishlistItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  wishlistItem.isOwned
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : canAfford
                      ? "bg-card/30 border-primary/20 hover:border-primary/40"
                      : "bg-card/20 border-primary/10"
                }`}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-card/50 border border-primary/20 flex items-center justify-center">
                  {getIcon(wishlistItem.item_type, wishlistItem.item?.type)}
                </div>
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-rajdhani font-semibold text-foreground truncate">
                    {wishlistItem.item?.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground capitalize">
                      {wishlistItem.item?.type || wishlistItem.item_type}
                    </span>
                    {canAfford && !wishlistItem.isOwned && (
                      <span className="text-xs text-emerald-400">• Can afford!</span>
                    )}
                  </div>
                </div>
                
                {/* Price */}
                <div className="flex items-center gap-1 font-orbitron font-bold text-primary">
                  <BondIcon size={16} />
                  {wishlistItem.item?.price}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {wishlistItem.isOwned ? (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                      Owned
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onPurchaseItem(wishlistItem.item, wishlistItem.item_type)}
                      disabled={!canAfford}
                      className="bg-primary/20 border-primary/30 hover:bg-primary/30 text-primary"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(wishlistItem)}
                    className="text-muted-foreground hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
