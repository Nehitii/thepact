import { motion } from "framer-motion";
import { Sparkles, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { DailyDealWithItem } from "@/hooks/useDailyDeals";
import { useEffect, useState } from "react";
import { getRarity } from "./shopRarity";

interface DailyDealCardProps {
  deal: DailyDealWithItem;
  onPurchase: () => void;
  isOwned: boolean;
  canAfford: boolean;
}

function FlipDigit({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-7 rounded-md font-mono text-xs font-bold tabular-nums"
      style={{ background: "hsl(var(--background) / 0.8)", border: "1px solid hsl(45 100% 60% / 0.2)", color: "hsl(45 100% 60%)", textShadow: "0 0 8px hsl(45 100% 60% / 0.5)" }}>
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
  const r = getRarity(rarity);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative rounded-2xl overflow-hidden group"
      style={{
        background: "hsl(var(--card) / 0.7)",
        border: `1px solid ${r.border}`,
        boxShadow: `0 0 24px ${r.glow}`,
      }}
    >
      {/* Discount badge */}
      <div className="absolute top-3 right-3 z-10">
        <motion.div
          className="px-2.5 py-1 rounded-lg font-orbitron text-[11px] font-black"
          style={{ background: "hsl(0 80% 50%)", color: "hsl(0 0% 100%)" }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          -{deal.discount_percentage}%
        </motion.div>
      </div>

      {/* Wishlist */}
      {!isOwned && (
        <div className="absolute top-3 left-3 z-10">
          <WishlistButton itemId={deal.item_id} itemType="cosmetic" size="sm" />
        </div>
      )}

      {/* Preview area */}
      <div className="relative flex items-center justify-center p-6 pt-10 pb-4 min-h-[120px]"
        style={{ background: `linear-gradient(180deg, ${r.glow}, transparent)` }}>
        {deal.item.preview_url ? (
          <img src={deal.item.preview_url} alt={deal.item.name} className="w-20 h-20 object-contain" />
        ) : (
          <Sparkles className="w-12 h-12" style={{ color: r.accent }} />
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] uppercase tracking-[0.15em] font-orbitron font-bold px-2 py-0.5 rounded-md border ${r.badgeBg} ${r.badgeText} ${r.badgeBorder}`}>
            {rarity}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-orbitron text-amber-400/70">Daily Deal</span>
        </div>

        <h3 className="font-orbitron text-sm font-bold text-foreground truncate">{deal.item.name}</h3>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground line-through flex items-center gap-0.5">
            <BondIcon size={11} /> {deal.item.price}
          </span>
          <span className="text-base font-bold font-orbitron flex items-center gap-1" style={{ color: "hsl(45 100% 60%)" }}>
            <BondIcon size={16} /> {deal.discounted_price}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1">
          <FlipDigit value={hours[0]} /><FlipDigit value={hours[1]} />
          <span className="text-amber-400/40 font-bold mx-0.5">:</span>
          <FlipDigit value={minutes[0]} /><FlipDigit value={minutes[1]} />
          <span className="text-amber-400/40 font-bold mx-0.5">:</span>
          <FlipDigit value={seconds[0]} /><FlipDigit value={seconds[1]} />
        </div>

        {/* Action */}
        {isOwned ? (
          <div className="flex items-center gap-1.5 text-[10px] font-orbitron tracking-wider" style={{ color: "hsl(142 70% 50%)" }}>
            <Check className="w-3.5 h-3.5" /> Owned
          </div>
        ) : (
          <Button onClick={onPurchase} disabled={!canAfford} variant="outline" className="w-full h-9 font-orbitron text-xs tracking-wider rounded-lg"
            style={{ borderColor: "hsl(45 100% 60% / 0.3)", color: canAfford ? "hsl(45 100% 60%)" : undefined, background: canAfford ? "hsl(45 100% 60% / 0.1)" : undefined }}>
            {canAfford ? "Grab Deal" : <Lock className="w-3 h-3" />}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
