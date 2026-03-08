import { motion } from "framer-motion";
import { Package, Sparkles, Star, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { ShopBundle } from "@/hooks/useBundles";
import { getRarity } from "./shopRarity";

interface BundleCardProps {
  bundle: ShopBundle;
  onPurchase: () => void;
  canAfford: boolean;
  ownedItemCount: number;
}

export function BundleCard({ bundle, onPurchase, canAfford, ownedItemCount }: BundleCardProps) {
  const r = getRarity(bundle.rarity);
  const allOwned = ownedItemCount === bundle.items.length;
  const savings = bundle.original_price_bonds ? bundle.original_price_bonds - bundle.price_bonds : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      className="relative rounded-2xl border overflow-hidden group"
      style={{ borderColor: r.border, background: "hsl(var(--card) / 0.7)" }}
    >
      {/* Conic border for high rarity */}
      {r.animated && (
        <div className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0 opacity-30 group-hover:opacity-70 transition-opacity duration-500" style={{
          background: `conic-gradient(from 0deg, ${r.accent}, transparent 30%, ${r.accent} 50%, transparent 80%, ${r.accent})`,
          animation: "spin 4s linear infinite",
        }} />
      )}

      <div className="relative z-[1] bg-card/95 rounded-2xl overflow-hidden">
        {/* Inner glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 20% 50%, ${r.glow}, transparent 60%)` }} />

        {/* Savings badge */}
        {savings > 0 && (
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg font-orbitron text-[10px] font-black"
            style={{ background: "hsl(142 70% 50% / 0.15)", color: "hsl(142 70% 50%)", border: "1px solid hsl(142 70% 50% / 0.25)" }}>
            SAVE {savings}
          </div>
        )}

        {/* Wishlist */}
        <div className="absolute top-3 left-3 z-10">
          <WishlistButton itemId={bundle.id} itemType="bundle" size="sm" />
        </div>

        <div className="relative p-5 pt-12 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 shrink-0 rounded-xl border flex items-center justify-center" style={{
              borderColor: r.border, background: `linear-gradient(135deg, ${r.glow}, hsl(var(--card)))`,
              boxShadow: `inset 0 -3px 8px ${r.glow}, 0 4px 16px hsl(var(--background) / 0.5)`,
            }}>
              {bundle.image_url ? (
                <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Package className="w-10 h-10" style={{ color: r.accent }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[9px] uppercase tracking-[0.15em] font-orbitron px-2 py-0.5 rounded-md border ${r.badgeBg} ${r.badgeText} ${r.badgeBorder}`}>
                  {bundle.rarity}
                </span>
              </div>
              <h3 className="font-orbitron text-base font-bold text-foreground truncate">{bundle.name}</h3>
              {bundle.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-rajdhani">{bundle.description}</p>
              )}
            </div>
          </div>

          {/* Items grid */}
          <div className="space-y-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-orbitron">
              Contains {bundle.items.length} items
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {bundle.items.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px]"
                  style={{ background: "hsl(var(--card) / 0.8)", border: "1px solid hsl(var(--primary) / 0.1)" }}>
                  {item.item_type.includes("cosmetic") ? <Sparkles className="w-3 h-3 text-primary shrink-0" /> : <Star className="w-3 h-3 shrink-0" style={{ color: "hsl(45 100% 60%)" }} />}
                  <span className="text-muted-foreground truncate">{item.name || item.item_type.replace("cosmetic_", "")}</span>
                </div>
              ))}
            </div>
            {bundle.items.length > 4 && (
              <div className="text-[10px] text-primary font-orbitron" style={{ background: "hsl(var(--primary) / 0.06)" }}>
                +{bundle.items.length - 4} more
              </div>
            )}
          </div>

          {/* Ownership */}
          {ownedItemCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "hsl(142 70% 50%)" }}>
              <Check className="w-3 h-3" /> {ownedItemCount}/{bundle.items.length} already owned
            </div>
          )}

          {/* Price + CTA */}
          <div className="pt-3 border-t space-y-3" style={{ borderColor: "hsl(var(--primary) / 0.08)" }}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                {bundle.original_price_bonds && savings > 0 && (
                  <span className="text-xs text-muted-foreground line-through flex items-center gap-0.5">
                    <BondIcon size={11} /> {bundle.original_price_bonds}
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-xl font-orbitron font-bold" style={{ color: r.accent }}>
                  <BondIcon size={20} /> {bundle.price_bonds}
                </div>
              </div>
            </div>

            {allOwned ? (
              <div className="w-full py-2.5 rounded-lg text-center text-[10px] font-orbitron tracking-wider" style={{ color: "hsl(142 70% 50%)", background: "hsl(142 70% 50% / 0.1)" }}>
                All Owned
              </div>
            ) : (
              <Button onClick={onPurchase} disabled={!canAfford} variant="outline"
                className="w-full h-10 font-orbitron text-xs tracking-wider rounded-lg"
                style={{ borderColor: r.border, color: canAfford ? r.accent : undefined, background: canAfford ? r.glow : undefined }}>
                {canAfford ? "Get Bundle" : <><Lock className="w-3 h-3 mr-1.5" /> Need More Bonds</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
