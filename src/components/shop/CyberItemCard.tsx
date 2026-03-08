import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { Button } from "@/components/ui/button";
import { getRarity } from "./shopRarity";

export type CyberItemType = "module" | "frame" | "banner" | "title";

interface CyberItemCardProps {
  id: string;
  name: string;
  rarity: string;
  price: number;
  owned: boolean;
  canAfford: boolean;
  isComingSoon?: boolean;
  itemType: CyberItemType;
  preview: React.ReactNode;
  onPurchase: () => void;
  onPreview?: () => void;
  index?: number;
}

export function CyberItemCard({
  id, name, rarity, price, owned, canAfford, isComingSoon = false, itemType, preview, onPurchase, onPreview, index = 0,
}: CyberItemCardProps) {
  const r = getRarity(rarity);
  const isCosmetic = itemType !== "module";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className={cn(
          "group relative rounded-2xl overflow-hidden",
          "bg-card/70 backdrop-blur-sm transition-all duration-300",
          !isComingSoon && !owned && "cursor-pointer",
        )}
        whileHover={!owned && !isComingSoon ? { scale: 1.04, y: -4 } : {}}
        style={{
          border: `1px solid ${isHovered && !owned ? r.accent + "60" : "hsl(var(--primary) / 0.12)"}`,
          boxShadow: isHovered && !owned ? `0 0 24px ${r.glow}, 0 12px 40px hsl(var(--background) / 0.5)` : undefined,
        }}
      >
        {/* Rarity top stripe */}
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${r.accent}, transparent)` }} />

        {/* Epic: breathing border */}
        {rarity === "epic" && !owned && (
          <motion.div className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0"
            style={{ border: `1px solid ${r.accent}`, boxShadow: `0 0 12px ${r.glow}` }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        )}

        {/* Legendary: conic border */}
        {rarity === "legendary" && (
          <div className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0 opacity-30 group-hover:opacity-80 transition-opacity duration-500"
            style={{
              background: `conic-gradient(from 0deg, ${r.accent}, transparent 30%, ${r.accent} 50%, transparent 80%, ${r.accent})`,
              animation: "spin 3s linear infinite",
            }} />
        )}

        <div className="relative z-[1] bg-card/95 rounded-b-2xl">
          {/* Legendary: floating particles */}
          {rarity === "legendary" && !owned && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
              {[0, 1, 2, 3].map((i) => (
                <motion.div key={i} className="absolute w-1 h-1 rounded-full"
                  style={{ background: r.accent, boxShadow: `0 0 4px ${r.accent}`, left: `${20 + i * 20}%`, bottom: "0%" }}
                  animate={{ y: [0, -80 - i * 15, 0], opacity: [0, 0.8, 0], x: [0, (i % 2 === 0 ? 8 : -8), 0] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }} />
              ))}
            </div>
          )}

          {/* Wishlist */}
          {!owned && !isComingSoon && (
            <div className="absolute top-2 right-2 z-10">
              <WishlistButton itemId={id} itemType={isCosmetic ? "cosmetic" : "module"} size="sm" />
            </div>
          )}

          {/* Preview */}
          <div className={cn(
            "relative flex items-center justify-center p-5",
            itemType === "module" ? "min-h-[100px]" : "min-h-[130px]"
          )} style={{ background: `linear-gradient(180deg, ${r.glow}, transparent)` }}>
            {preview}

            {/* ACQUIRED badge */}
            {owned && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
                <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px]" />
                <div className="relative w-14 h-14 flex items-center justify-center"
                  style={{ clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)", background: "hsl(142 70% 50% / 0.12)" }}>
                  <Check className="w-6 h-6" style={{ color: "hsl(142 70% 50%)" }} />
                </div>
              </div>
            )}

            {/* Coming Soon */}
            {isComingSoon && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-muted-foreground/30">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-orbitron text-muted-foreground tracking-wider">SOON</span>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="relative z-[2] px-4 pb-4 space-y-2.5 pt-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-orbitron text-[13px] font-semibold tracking-wide truncate flex-1 text-foreground">
                {name}
              </h3>
              <span className={cn(
                "flex items-center gap-1 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0",
                r.badgeBg, r.badgeText, r.badgeBorder
              )}>
                {r.animated && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: r.accent }} />}
                {rarity}
              </span>
            </div>

            <div className="flex items-center justify-between">
              {owned ? (
                <span className="text-xs font-rajdhani font-medium flex items-center gap-1" style={{ color: "hsl(142 70% 50%)" }}>
                  <Check className="w-3 h-3" /> Unlocked
                </span>
              ) : isComingSoon ? (
                <span className="text-xs text-muted-foreground font-rajdhani">TBA</span>
              ) : (
                <div className="flex items-center gap-1.5 font-orbitron text-sm font-bold" style={{ color: r.accent }}>
                  <BondIcon size={16} /> {price.toLocaleString()}
                </div>
              )}

              {!owned && !isComingSoon && (
                <div className="flex items-center gap-1.5">
                  {isCosmetic && onPreview && (
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onPreview(); }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled={!canAfford} onClick={onPurchase}
                    className="text-xs font-rajdhani rounded-lg h-8"
                    style={{ borderColor: r.border, color: canAfford ? r.accent : undefined, background: canAfford ? r.glow : undefined }}>
                    {canAfford ? "BUY" : <Lock className="w-3 h-3" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
