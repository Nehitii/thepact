import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBondBalance } from "@/hooks/useShop";
import { BondIcon } from "@/components/ui/bond-icon";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface ShopBondDisplayProps {
  onBuyBonds?: () => void;
}

export function ShopBondDisplay({ onBuyBonds }: ShopBondDisplayProps) {
  const { user } = useAuth();
  const { data: balance, isLoading } = useBondBalance(user?.id);
  const [displayBalance, setDisplayBalance] = useState(0);
  const prevBalance = useRef(0);
  const isLow = displayBalance < 500;

  // Animated count-up
  useEffect(() => {
    const target = balance?.balance || 0;
    const start = prevBalance.current;
    if (start === target) {
      setDisplayBalance(target);
      return;
    }
    const diff = target - start;
    const duration = Math.min(800, Math.abs(diff) * 5);
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayBalance(Math.round(start + diff * eased));
      if (step >= steps) {
        clearInterval(timer);
        setDisplayBalance(target);
        prevBalance.current = target;
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [balance?.balance]);

  return (
    <motion.div
      className="relative flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-lg border backdrop-blur-xl overflow-hidden group"
      style={{
        background: "linear-gradient(135deg, hsl(var(--card) / 0.6), hsl(var(--card) / 0.3))",
        borderColor: isLow ? "hsl(0 90% 65% / 0.4)" : "hsl(var(--primary) / 0.3)",
      }}
      animate={isLow ? { boxShadow: ["0 0 8px hsl(0 90% 65% / 0.2)", "0 0 20px hsl(0 90% 65% / 0.4)", "0 0 8px hsl(0 90% 65% / 0.2)"] } : {}}
      transition={isLow ? { duration: 2, repeat: Infinity } : {}}
    >
      {/* Animated border segments */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-3 h-[2px] bg-primary/60 rounded-full" />
        <div className="absolute top-0 left-0 w-[2px] h-3 bg-primary/60 rounded-full" />
        <div className="absolute bottom-0 right-0 w-3 h-[2px] bg-primary/60 rounded-full" />
        <div className="absolute bottom-0 right-0 w-[2px] h-3 bg-primary/60 rounded-full" />
      </div>

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
      </div>

      <div className="relative shrink-0">
        <BondIcon size={22} />
        <div
          className="absolute inset-0 rounded-full blur-md"
          style={{ background: isLow ? "hsl(0 90% 65% / 0.3)" : "hsl(var(--primary) / 0.3)" }}
        />
      </div>

      <span className="font-orbitron text-sm font-bold tracking-wider tabular-nums" style={{ color: isLow ? "hsl(0 90% 65%)" : "hsl(var(--primary))" }}>
        {isLoading ? "···" : displayBalance.toLocaleString()}
      </span>

      {onBuyBonds && (
        <button
          onClick={onBuyBonds}
          className="ml-1 flex items-center justify-center w-6 h-6 rounded bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors"
        >
          <Plus size={12} strokeWidth={3} />
        </button>
      )}
    </motion.div>
  );
}
