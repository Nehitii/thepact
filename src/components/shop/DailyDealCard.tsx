import { motion } from "framer-motion";
import { Clock, Sparkles, Zap, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { DailyDealWithItem } from "@/hooks/useDailyDeals";
import { useEffect, useState } from "react";

interface DailyDealCardProps {
  deal: DailyDealWithItem;
  onPurchase: () => void;
  isOwned: boolean;
  canAfford: boolean;
}

const rarityColors: Record<string, { accent: string; glow: string }> = {
  common: { accent: "hsl(210 15% 60%)", glow: "hsl(210 15% 60% / 0.15)" },
  uncommon: { accent: "hsl(142 70% 50%)", glow: "hsl(142 70% 50% / 0.15)" },
  rare: { accent: "hsl(212 90% 55%)", glow: "hsl(212 90% 55% / 0.15)" },
  epic: { accent: "hsl(270 80% 60%)", glow: "hsl(270 80% 60% / 0.2)" },
  legendary: { accent: "hsl(45 100% 60%)", glow: "hsl(45 100% 60% / 0.2)" },
};

function FlipDigit({ value }: { value: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-6 rounded bg-background/80 border border-primary/20 font-mono text-xs font-bold text-amber-400 tabular-nums"
      style={{ textShadow: "0 0 6px hsl(45 100% 60% / 0.5)" }}
    >
      {value}
    </span>
  );
}

export function DailyDealCard({ deal, onPurchase, isOwned, canAfford }: DailyDealCardProps) {
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      setHours(String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0"));
      setMinutes(String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0"));
      setSeconds(String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0"));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!deal.item) return null;

  const rarity = deal.item.rarity || "common";
  const colors = rarityColors[rarity] || rarityColors.common;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="relative rounded-xl border overflow-hidden bg-card/60 backdrop-blur-sm group"
      style={{
        borderColor: `hsl(45 100% 60% / 0.25)`,
        boxShadow: `0 0 20px hsl(45 100% 60% / 0.08)`,
      }}
    >
      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div
          className="absolute w-full h-[1px]"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(45 100% 60% / 0.6), transparent)",
            animation: "scan-line 3s linear infinite",
          }}
        />
      </div>

      {/* Discount badge with glitch */}
      <motion.div
        className="absolute -top-0.5 -right-0.5 z-10 px-3 py-1 rounded-bl-lg"
        style={{
          background: "linear-gradient(135deg, hsl(45 100% 55%), hsl(25 100% 55%))",
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span
          className="font-orbitron text-[11px] font-black tracking-wider"
          style={{
            color: "hsl(0 0% 5%)",
            textShadow: "1px 0 hsl(0 100% 50% / 0.4), -1px 0 hsl(200 100% 50% / 0.4)",
          }}
        >
          -{deal.discount_percentage}%
        </span>
      </motion.div>

      {/* Wishlist */}
      {!isOwned && (
        <div className="absolute top-2 left-2 z-10">
          <WishlistButton itemId={deal.item_id} itemType="cosmetic" size="sm" />
        </div>
      )}

      <div className="relative flex items-center gap-4 p-4">
        {/* Preview */}
        <div
          className="w-16 h-16 shrink-0 rounded-lg border flex items-center justify-center overflow-hidden"
          style={{
            borderColor: colors.accent + "40",
            boxShadow: `inset 0 0 15px ${colors.glow}`,
            background: `linear-gradient(135deg, ${colors.glow}, transparent)`,
          }}
        >
          {deal.item.preview_url ? (
            <img src={deal.item.preview_url} alt={deal.item.name} className="w-full h-full object-cover" />
          ) : (
            <Sparkles className="w-8 h-8" style={{ color: colors.accent }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="text-[10px] uppercase tracking-[0.2em] font-orbitron text-amber-400/70">
            Daily Deal
          </div>
          <div className="font-rajdhani font-semibold text-foreground truncate text-sm">
            {deal.item.name}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground line-through flex items-center gap-0.5">
              <BondIcon size={11} />
              {deal.item.price}
            </span>
            <span className="text-sm font-bold flex items-center gap-1" style={{ color: "hsl(45 100% 60%)" }}>
              <BondIcon size={14} />
              {deal.discounted_price}
            </span>
          </div>
        </div>

        {/* Timer + Action */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {/* Flip-clock timer */}
          <div className="flex items-center gap-0.5">
            <FlipDigit value={hours[0]} />
            <FlipDigit value={hours[1]} />
            <span className="text-amber-400/50 text-xs font-bold mx-0.5">:</span>
            <FlipDigit value={minutes[0]} />
            <FlipDigit value={minutes[1]} />
            <span className="text-amber-400/50 text-xs font-bold mx-0.5">:</span>
            <FlipDigit value={seconds[0]} />
            <FlipDigit value={seconds[1]} />
          </div>

          {isOwned ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-orbitron tracking-wider" style={{ color: "hsl(142 70% 50%)", background: "hsl(142 70% 50% / 0.1)" }}>
              <Check className="w-3 h-3" /> Owned
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onPurchase}
              disabled={!canAfford}
              className="h-7 text-xs font-orbitron tracking-wider"
              style={{
                background: canAfford ? "hsl(45 100% 60% / 0.15)" : undefined,
                borderColor: "hsl(45 100% 60% / 0.3)",
                color: canAfford ? "hsl(45 100% 60%)" : undefined,
              }}
              variant="outline"
            >
              {canAfford ? "Get" : <Lock className="w-3 h-3" />}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
