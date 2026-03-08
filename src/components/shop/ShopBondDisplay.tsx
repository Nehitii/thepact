import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBondBalance } from "@/hooks/useShop";
import { BondIcon } from "@/components/ui/bond-icon";
import { motion } from "framer-motion";
import { Plus, AlertTriangle } from "lucide-react";

interface ShopBondDisplayProps {
  onBuyBonds?: () => void;
}

export function ShopBondDisplay({ onBuyBonds }: ShopBondDisplayProps) {
  const { user } = useAuth();
  const { data: balance, isLoading } = useBondBalance(user?.id);
  const [displayBalance, setDisplayBalance] = useState(0);
  const prevBalance = useRef(0);
  const isLow = displayBalance < 500;

  useEffect(() => {
    const target = balance?.balance || 0;
    const start = prevBalance.current;
    if (start === target) { setDisplayBalance(target); return; }
    const diff = target - start;
    const duration = Math.min(800, Math.abs(diff) * 5);
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayBalance(Math.round(start + diff * eased));
      if (step >= steps) { clearInterval(timer); setDisplayBalance(target); prevBalance.current = target; }
    }, stepTime);
    return () => clearInterval(timer);
  }, [balance?.balance]);

  return (
    <motion.div
      className="flex items-center gap-3 pl-4 pr-2.5 py-2.5 rounded-xl border backdrop-blur-xl"
      style={{
        background: "hsl(var(--card) / 0.6)",
        borderColor: isLow ? "hsl(0 80% 60% / 0.35)" : "hsl(var(--primary) / 0.2)",
        boxShadow: isLow ? "0 0 16px hsl(0 80% 60% / 0.1)" : "0 0 16px hsl(var(--primary) / 0.05)",
      }}
    >
      <div className="relative shrink-0">
        <BondIcon size={22} />
      </div>

      <span
        className="font-orbitron text-sm font-bold tracking-wider tabular-nums"
        style={{ color: isLow ? "hsl(0 80% 60%)" : "hsl(var(--primary))" }}
      >
        {isLoading ? "···" : displayBalance.toLocaleString()}
      </span>

      {isLow && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: "hsl(0 80% 60%)" }} />
        </motion.div>
      )}

      {onBuyBonds && (
        <button
          onClick={onBuyBonds}
          className="ml-0.5 flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus size={13} strokeWidth={3} />
        </button>
      )}
    </motion.div>
  );
}
