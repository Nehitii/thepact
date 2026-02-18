import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { History, ArrowDownLeft, ArrowUpRight, Package, Sparkles, Star, Terminal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAllTransactions, PurchaseHistoryItem } from "@/hooks/usePurchaseHistory";
import { BondIcon } from "@/components/ui/bond-icon";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    if (diff === 0) { setDisplay(value); return; }
    const steps = 20;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(Math.round(start + diff * (step / steps)));
      if (step >= steps) { clearInterval(timer); setDisplay(value); prev.current = value; }
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

export function PurchaseHistory() {
  const { user } = useAuth();
  const { data: transactions = [], isLoading } = useAllTransactions(user?.id);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-card/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <motion.div
          className="w-16 h-16 mx-auto mb-4 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: "hsl(var(--primary) / 0.15)", background: "hsl(var(--primary) / 0.03)" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Terminal className="w-7 h-7 text-muted-foreground/40" />
        </motion.div>
        <h3 className="font-orbitron text-sm text-foreground mb-1 tracking-wider">No Transactions</h3>
        <p className="text-xs text-muted-foreground font-rajdhani">
          Your transaction ledger will appear here
        </p>
      </div>
    );
  }

  const getIcon = (item: PurchaseHistoryItem) => {
    if (item.transaction_type === "earn" || item.amount > 0) return <ArrowDownLeft className="w-3.5 h-3.5" style={{ color: "hsl(142 70% 50%)" }} />;
    switch (item.reference_type) {
      case "bundle": return <Package className="w-3.5 h-3.5" style={{ color: "hsl(270 80% 60%)" }} />;
      case "module": return <Star className="w-3.5 h-3.5" style={{ color: "hsl(45 100% 60%)" }} />;
      case "cosmetic": return <Sparkles className="w-3.5 h-3.5 text-primary" />;
      default: return <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "hsl(350 80% 55%)" }} />;
    }
  };

  const totalEarned = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-primary" />
        <h2 className="font-orbitron text-sm text-foreground tracking-wider">Transaction Ledger</h2>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">
          {transactions.length} records
        </span>
      </div>

      {/* Terminal-style ledger */}
      <ScrollArea className="h-[380px]">
        <div
          className="relative rounded-lg border overflow-hidden"
          style={{
            borderColor: "hsl(var(--primary) / 0.15)",
            background: "hsl(var(--card) / 0.4)",
          }}
        >
          {/* Scan-line animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            <div
              className="absolute w-full h-[1px]"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)",
                animation: "scan-line 5s linear infinite",
              }}
            />
          </div>

          {/* Rows */}
          {transactions.map((tx, index) => {
            const isCredit = tx.amount > 0;
            const color = isCredit ? "hsl(142 70% 50%)" : "hsl(350 80% 55%)";

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 px-4 py-2.5 border-b hover:bg-primary/[0.03] transition-colors"
                style={{ borderColor: "hsl(var(--primary) / 0.06)" }}
              >
                {/* Timestamp */}
                <span className="text-[9px] font-mono text-muted-foreground/60 w-[70px] shrink-0 tabular-nums">
                  {format(new Date(tx.created_at), "dd/MM HH:mm")}
                </span>

                {/* Icon */}
                <div
                  className="w-6 h-6 shrink-0 rounded flex items-center justify-center"
                  style={{ background: color + "12" }}
                >
                  {getIcon(tx)}
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0 text-xs font-rajdhani text-foreground/80 truncate">
                  {tx.description || (isCredit ? "Earned Bonds" : "Purchase")}
                </div>

                {/* Type tag */}
                <span
                  className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-orbitron font-bold tracking-widest uppercase"
                  style={{
                    color,
                    background: color + "12",
                  }}
                >
                  {isCredit ? "Credit" : "Debit"}
                </span>

                {/* Amount */}
                <span
                  className="shrink-0 w-[60px] text-right text-xs font-orbitron font-bold tabular-nums flex items-center justify-end gap-0.5"
                  style={{ color }}
                >
                  <BondIcon size={12} />
                  {isCredit ? "+" : ""}{tx.amount}
                </span>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Summary with animated counters */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="p-3 rounded-lg border"
          style={{ borderColor: "hsl(142 70% 50% / 0.15)", background: "hsl(142 70% 50% / 0.05)" }}
        >
          <div className="text-[9px] font-orbitron tracking-[0.15em] uppercase mb-1" style={{ color: "hsl(142 70% 50% / 0.6)" }}>
            Total Earned
          </div>
          <div className="flex items-center gap-1.5 text-lg font-orbitron font-bold" style={{ color: "hsl(142 70% 50%)" }}>
            <BondIcon size={16} />
            <AnimatedCounter value={totalEarned} />
          </div>
        </div>
        <div
          className="p-3 rounded-lg border"
          style={{ borderColor: "hsl(350 80% 55% / 0.15)", background: "hsl(350 80% 55% / 0.05)" }}
        >
          <div className="text-[9px] font-orbitron tracking-[0.15em] uppercase mb-1" style={{ color: "hsl(350 80% 55% / 0.6)" }}>
            Total Spent
          </div>
          <div className="flex items-center gap-1.5 text-lg font-orbitron font-bold" style={{ color: "hsl(350 80% 55%)" }}>
            <BondIcon size={16} />
            <AnimatedCounter value={totalSpent} />
          </div>
        </div>
      </div>
    </div>
  );
}
