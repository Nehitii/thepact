import { motion } from "framer-motion";
import { Package, Sparkles, Star, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { ShopBundle } from "@/hooks/useBundles";
import { useState } from "react";

interface BundleCardProps {
  bundle: ShopBundle;
  onPurchase: () => void;
  canAfford: boolean;
  ownedItemCount: number;
}

const rarityColors: Record<string, { accent: string; glow: string }> = {
  common: { accent: "hsl(210 15% 60%)", glow: "hsl(210 15% 60% / 0.1)" },
  uncommon: { accent: "hsl(142 70% 50%)", glow: "hsl(142 70% 50% / 0.12)" },
  rare: { accent: "hsl(212 90% 55%)", glow: "hsl(212 90% 55% / 0.12)" },
  epic: { accent: "hsl(270 80% 60%)", glow: "hsl(270 80% 60% / 0.15)" },
  legendary: { accent: "hsl(45 100% 60%)", glow: "hsl(45 100% 60% / 0.15)" },
};

export function BundleCard({ bundle, onPurchase, canAfford, ownedItemCount }: BundleCardProps) {
  const colors = rarityColors[bundle.rarity] || rarityColors.common;
  const allOwned = ownedItemCount === bundle.items.length;
  const savings = bundle.original_price_bonds
    ? bundle.original_price_bonds - bundle.price_bonds
    : 0;
  const [isHovered, setIsHovered] = useState(false);
  const isHighRarity = bundle.rarity === "legendary" || bundle.rarity === "epic";

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative rounded-xl border overflow-hidden bg-card/60 backdrop-blur-sm group"
      style={{
        borderColor: colors.accent + "30",
        perspective: "600px",
      }}
    >
      {/* Animated conic border for high rarity */}
      {isHighRarity && (
        <div
          className="absolute -inset-[1px] rounded-xl pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `conic-gradient(from 0deg, ${colors.accent}, transparent 30%, ${colors.accent} 50%, transparent 80%, ${colors.accent})`,
            animation: "spin 4s linear infinite",
          }}
        />
      )}

      {/* Inner card */}
      <div className="relative z-[1] bg-card/95 rounded-xl overflow-hidden">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Inner glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 50%, ${colors.glow}, transparent 60%)`,
          }}
        />

        {/* Savings "VALUE" badge */}
        {savings > 0 && (
          <div
            className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded border text-[10px] font-orbitron font-bold tracking-wider"
            style={{
              color: "hsl(142 70% 50%)",
              borderColor: "hsl(142 70% 50% / 0.3)",
              background: "hsl(142 70% 50% / 0.08)",
              boxShadow: "0 0 10px hsl(142 70% 50% / 0.1)",
            }}
          >
            SAVE {savings}
          </div>
        )}

        {/* Wishlist */}
        <div className="absolute top-3 left-3 z-10">
          <WishlistButton itemId={bundle.id} itemType="bundle" size="sm" />
        </div>

        <div className="relative p-5 pt-10 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            {/* Crate-style icon with 3D effect */}
            <motion.div
              className="w-16 h-16 shrink-0 rounded-lg border flex items-center justify-center overflow-hidden"
              style={{
                borderColor: colors.accent + "40",
                background: `linear-gradient(135deg, ${colors.glow}, hsl(var(--card)))`,
                boxShadow: `inset 0 -3px 6px ${colors.glow}, 0 4px 12px hsl(var(--background) / 0.5)`,
              }}
              animate={isHovered ? { rotateY: 8, rotateX: -4 } : { rotateY: 0, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {bundle.image_url ? (
                <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-8 h-8" style={{ color: colors.accent }} />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[9px] uppercase tracking-[0.2em] font-orbitron px-1.5 py-0.5 rounded border"
                  style={{ color: colors.accent, borderColor: colors.accent + "30", background: colors.glow }}
                >
                  {bundle.rarity}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-orbitron text-muted-foreground">
                  Bundle
                </span>
              </div>
              <h3 className="font-orbitron text-sm font-bold text-foreground truncate">
                {bundle.name}
              </h3>
              {bundle.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-rajdhani">
                  {bundle.description}
                </p>
              )}
            </div>
          </div>

          {/* Items - stacked layer peek */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-orbitron">
              Contains {bundle.items.length} items
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bundle.items.slice(0, 5).map((item, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px]"
                  style={{
                    borderColor: "hsl(var(--primary) / 0.15)",
                    background: "hsl(var(--card) / 0.8)",
                  }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  {item.item_type.includes("cosmetic") ? (
                    <Sparkles className="w-2.5 h-2.5 text-primary" />
                  ) : (
                    <Star className="w-2.5 h-2.5" style={{ color: "hsl(45 100% 60%)" }} />
                  )}
                  <span className="text-muted-foreground truncate max-w-[70px]">
                    {item.name || item.item_type.replace("cosmetic_", "")}
                  </span>
                </motion.div>
              ))}
              {bundle.items.length > 5 && (
                <div className="px-2 py-0.5 rounded text-[10px] text-primary" style={{ background: "hsl(var(--primary) / 0.08)" }}>
                  +{bundle.items.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Ownership */}
          {ownedItemCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "hsl(142 70% 50%)" }}>
              <Check className="w-3 h-3" />
              {ownedItemCount}/{bundle.items.length} already owned
            </div>
          )}

          {/* Price & action */}
          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "hsl(var(--primary) / 0.1)" }}>
            <div className="space-y-0.5">
              {bundle.original_price_bonds && savings > 0 && (
                <span className="text-xs text-muted-foreground line-through flex items-center gap-0.5">
                  <BondIcon size={11} />
                  {bundle.original_price_bonds}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-lg font-orbitron font-bold" style={{ color: colors.accent }}>
                <BondIcon size={18} />
                {bundle.price_bonds}
              </div>
            </div>

            {allOwned ? (
              <div className="px-3 py-1.5 rounded text-[10px] font-orbitron tracking-wider" style={{ color: "hsl(142 70% 50%)", background: "hsl(142 70% 50% / 0.1)" }}>
                All Owned
              </div>
            ) : (
              <Button
                onClick={onPurchase}
                disabled={!canAfford}
                size="sm"
                variant="outline"
                className="font-orbitron text-xs tracking-wider"
                style={{
                  borderColor: colors.accent + "30",
                  color: canAfford ? colors.accent : undefined,
                  background: canAfford ? colors.glow : undefined,
                }}
              >
                {canAfford ? "Get Bundle" : <Lock className="w-3 h-3" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
