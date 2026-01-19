import { motion } from "framer-motion";
import { Package, Sparkles, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { ShopBundle } from "@/hooks/useBundles";

interface BundleCardProps {
  bundle: ShopBundle;
  onPurchase: () => void;
  canAfford: boolean;
  ownedItemCount: number;
}

const rarityStyles: Record<string, { border: string; bg: string; glow: string }> = {
  common: { 
    border: "border-slate-500/30", 
    bg: "from-slate-500/10 to-slate-600/5",
    glow: "bg-slate-500/10"
  },
  uncommon: { 
    border: "border-emerald-500/30", 
    bg: "from-emerald-500/10 to-emerald-600/5",
    glow: "bg-emerald-500/10"
  },
  rare: { 
    border: "border-blue-500/30", 
    bg: "from-blue-500/10 to-blue-600/5",
    glow: "bg-blue-500/10"
  },
  epic: { 
    border: "border-purple-500/30", 
    bg: "from-purple-500/10 to-purple-600/5",
    glow: "bg-purple-500/10"
  },
  legendary: { 
    border: "border-amber-500/30", 
    bg: "from-amber-500/10 to-amber-600/5",
    glow: "bg-amber-500/10"
  },
};

export function BundleCard({ bundle, onPurchase, canAfford, ownedItemCount }: BundleCardProps) {
  const style = rarityStyles[bundle.rarity] || rarityStyles.common;
  const allOwned = ownedItemCount === bundle.items.length;
  const savings = bundle.original_price_bonds 
    ? bundle.original_price_bonds - bundle.price_bonds 
    : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative p-5 rounded-2xl border-2 ${style.border} bg-gradient-to-br ${style.bg} backdrop-blur-xl overflow-hidden group`}
    >
      {/* Glow effect */}
      <div className={`absolute top-0 right-0 w-40 h-40 ${style.glow} blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity`} />
      
      {/* Discount badge */}
      {bundle.discount_percentage && bundle.discount_percentage > 0 && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-rose-500/20 border border-rose-500/30">
          <span className="text-xs font-bold text-rose-400">
            -{bundle.discount_percentage}%
          </span>
        </div>
      )}
      
      {/* Wishlist */}
      <div className="absolute top-3 left-3 z-10">
        <WishlistButton 
          itemId={bundle.id} 
          itemType="bundle" 
          size="sm" 
        />
      </div>
      
      <div className="relative space-y-4 pt-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          {bundle.image_url ? (
            <img 
              src={bundle.image_url} 
              alt={bundle.name}
              className="w-20 h-20 rounded-xl object-cover border border-primary/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
              <Package className="w-10 h-10 text-primary" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="text-xs text-primary/60 uppercase tracking-wider mb-1">
              Bundle
            </div>
            <h3 className="font-orbitron text-lg font-bold text-foreground truncate">
              {bundle.name}
            </h3>
            {bundle.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {bundle.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Items preview */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            Includes {bundle.items.length} items
          </div>
          <div className="flex flex-wrap gap-2">
            {bundle.items.slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-card/50 border border-primary/20 text-xs"
              >
                {item.item_type.includes("cosmetic") ? (
                  <Sparkles className="w-3 h-3 text-primary" />
                ) : (
                  <Star className="w-3 h-3 text-amber-400" />
                )}
                <span className="text-muted-foreground truncate max-w-[80px]">
                  {item.name || item.item_type.replace("cosmetic_", "")}
                </span>
              </div>
            ))}
            {bundle.items.length > 5 && (
              <div className="px-2 py-1 rounded-full bg-primary/10 text-xs text-primary">
                +{bundle.items.length - 5} more
              </div>
            )}
          </div>
        </div>
        
        {/* Ownership indicator */}
        {ownedItemCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400">
              {ownedItemCount}/{bundle.items.length} already owned
            </span>
          </div>
        )}
        
        {/* Price & action */}
        <div className="flex items-center justify-between pt-2 border-t border-primary/10">
          <div className="space-y-1">
            {bundle.original_price_bonds && savings > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground line-through flex items-center gap-1">
                  <BondIcon size={12} />
                  {bundle.original_price_bonds}
                </span>
                <span className="text-xs text-emerald-400">
                  Save {savings}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xl font-orbitron font-bold text-primary">
              <BondIcon size={20} />
              {bundle.price_bonds}
            </div>
          </div>
          
          {allOwned ? (
            <div className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium">
              All Owned
            </div>
          ) : (
            <Button
              onClick={onPurchase}
              disabled={!canAfford}
              className={`${
                bundle.rarity === "legendary"
                  ? "bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30 text-amber-400"
                  : bundle.rarity === "epic"
                    ? "bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30 text-purple-400"
                    : "bg-primary/20 border-primary/30 hover:bg-primary/30 text-primary"
              }`}
            >
              {canAfford ? "Get Bundle" : "Not Enough"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
