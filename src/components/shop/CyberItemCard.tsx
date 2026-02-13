import { motion } from "framer-motion";
import { Check, Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { Button } from "@/components/ui/button";

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

const rarityConfig: Record<string, { border: string; bg: string; text: string; glow: string; animated: boolean }> = {
  common: { border: "border-slate-500/30", bg: "bg-slate-500/5", text: "text-slate-400", glow: "", animated: false },
  rare: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    animated: false,
  },
  epic: {
    border: "border-purple-500/50",
    bg: "bg-purple-500/5",
    text: "text-purple-400",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    animated: true,
  },
  legendary: {
    border: "border-amber-500/50",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.25)]",
    animated: true,
  },
};

export function CyberItemCard({
  id,
  name,
  rarity,
  price,
  owned,
  canAfford,
  isComingSoon = false,
  itemType,
  preview,
  onPurchase,
  onPreview,
  index = 0,
}: CyberItemCardProps) {
  const config = rarityConfig[rarity] || rarityConfig.common;
  const isCosmetic = itemType !== "module";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "group relative rounded-xl border overflow-hidden",
        "bg-card/60 backdrop-blur-sm transition-all duration-300",
        config.border,
        config.glow,
        config.animated && "cyber-card--animated",
        owned && "opacity-80 grayscale-[0.3]",
        !isComingSoon && !owned && "hover:scale-[1.02] hover:border-primary/50",
      )}
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[1] mix-blend-overlay">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent animate-scan" />
      </div>

      {/* Blueprint Grid for Modules */}
      {itemType === "module" && (
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      )}

      {/* Wishlist */}
      {!owned && !isComingSoon && (
        <div className="absolute top-2 right-2 z-20">
          <WishlistButton itemId={id} itemType={isCosmetic ? "cosmetic" : "module"} size="sm" />
        </div>
      )}

      {/* Preview Area */}
      <div
        className={cn(
          "relative flex items-center justify-center p-6",
          itemType === "module" ? "min-h-[120px]" : "min-h-[140px]",
        )}
      >
        {preview}
        {owned && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-orbitron text-emerald-400 tracking-wider">OWNED</span>
          </div>
        )}
        {isComingSoon && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-muted-foreground/30">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-orbitron text-muted-foreground tracking-wider">LOCKED</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="relative z-[2] px-4 pb-4 space-y-3 border-t border-primary/10 pt-3 bg-card/30">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-orbitron text-sm text-foreground font-medium tracking-wide truncate flex-1">{name}</h3>
          <span
            className={cn(
              "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
              config.bg,
              config.text,
              config.border,
            )}
          >
            {rarity}
          </span>
        </div>

        <div className="flex items-center justify-between">
          {owned ? (
            <span className="text-xs text-emerald-400 font-rajdhani font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Acquired
            </span>
          ) : isComingSoon ? (
            <span className="text-xs text-muted-foreground font-rajdhani">Coming Soon</span>
          ) : (
            <div className="flex items-center gap-1.5 font-orbitron text-sm text-primary">
              <BondIcon size={16} /> {price.toLocaleString()}
            </div>
          )}

          {!owned && !isComingSoon && (
            <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
              {isCosmetic && onPreview && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview();
                  }}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={!canAfford}
                onClick={onPurchase}
                className="h-8 text-xs border-primary/30 hover:bg-primary/10 font-rajdhani"
              >
                {canAfford ? "BUY" : <Lock className="w-3 h-3" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
