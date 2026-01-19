import { motion } from "framer-motion";
import { Clock, Sparkles, Zap } from "lucide-react";
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

const rarityGradients: Record<string, string> = {
  common: "from-slate-500/20 to-slate-600/10",
  uncommon: "from-emerald-500/20 to-emerald-600/10",
  rare: "from-blue-500/20 to-blue-600/10",
  epic: "from-purple-500/20 to-purple-600/10",
  legendary: "from-amber-500/20 to-amber-600/10",
};

export function DailyDealCard({ deal, onPurchase, isOwned, canAfford }: DailyDealCardProps) {
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}h ${minutes}m`);
    };
    
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, []);
  
  if (!deal.item) return null;
  
  const rarity = deal.item.rarity || "common";
  const gradient = rarityGradients[rarity] || rarityGradients.common;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-4 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br ${gradient} backdrop-blur-xl overflow-hidden`}
    >
      {/* Animated deal badge */}
      <motion.div
        className="absolute -top-1 -right-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-bl-xl rounded-tr-xl"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex items-center gap-1 text-xs font-bold text-black">
          <Zap className="w-3 h-3" />
          {deal.discount_percentage}% OFF
        </div>
      </motion.div>
      
      {/* Wishlist button */}
      <div className="absolute top-3 left-3 z-10">
        <WishlistButton 
          itemId={deal.item_id} 
          itemType="cosmetic" 
          size="sm" 
        />
      </div>
      
      {/* Timer */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-amber-400/80">
        <Clock className="w-3 h-3" />
        {timeLeft}
      </div>
      
      <div className="flex items-center gap-4 pr-16">
        {/* Preview */}
        <div className="w-16 h-16 rounded-xl bg-card/50 border border-primary/20 flex items-center justify-center overflow-hidden">
          {deal.item.preview_url ? (
            <img 
              src={deal.item.preview_url} 
              alt={deal.item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Sparkles className="w-8 h-8 text-primary/50" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-amber-400 uppercase tracking-wider mb-0.5">
            Daily Deal
          </div>
          <div className="font-rajdhani font-semibold text-foreground truncate">
            {deal.item.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground line-through flex items-center gap-1">
              <BondIcon size={12} />
              {deal.item.price}
            </span>
            <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
              <BondIcon size={14} />
              {deal.discounted_price}
            </span>
          </div>
        </div>
        
        {/* Action */}
        <div>
          {isOwned ? (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              Owned
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onPurchase}
              disabled={!canAfford}
              className="bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-400"
            >
              Get
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
