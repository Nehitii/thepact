import { motion } from "framer-motion";
import { History, ArrowDownLeft, ArrowUpRight, Package, Sparkles, Star, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAllTransactions, PurchaseHistoryItem } from "@/hooks/usePurchaseHistory";
import { BondIcon } from "@/components/ui/bond-icon";
import { format, formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PurchaseHistory() {
  const { user } = useAuth();
  const { data: transactions = [], isLoading } = useAllTransactions(user?.id);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-card/30 animate-pulse" />
        ))}
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-orbitron text-lg text-foreground mb-2">No Transactions Yet</h3>
        <p className="text-sm text-muted-foreground">
          Your purchase and earning history will appear here
        </p>
      </div>
    );
  }
  
  const getIcon = (item: PurchaseHistoryItem) => {
    if (item.transaction_type === "earn" || item.amount > 0) {
      return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
    }
    
    switch (item.reference_type) {
      case "bundle":
        return <Package className="w-4 h-4 text-purple-400" />;
      case "module":
        return <Star className="w-4 h-4 text-amber-400" />;
      case "cosmetic":
        return <Sparkles className="w-4 h-4 text-blue-400" />;
      default:
        return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
    }
  };
  
  const formatAmount = (amount: number) => {
    if (amount > 0) {
      return `+${amount}`;
    }
    return amount.toString();
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-primary" />
        <h2 className="font-orbitron text-lg text-foreground">Transaction History</h2>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card/30 border border-primary/10 hover:border-primary/20 transition-colors"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.amount > 0 
                  ? "bg-emerald-500/20 border border-emerald-500/30"
                  : "bg-rose-500/10 border border-rose-500/20"
              }`}>
                {getIcon(tx)}
              </div>
              
              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="font-rajdhani font-medium text-foreground truncate">
                  {tx.description || (tx.amount > 0 ? "Earned Bonds" : "Purchase")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                </div>
              </div>
              
              {/* Amount */}
              <div className={`flex items-center gap-1 font-orbitron font-bold ${
                tx.amount > 0 ? "text-emerald-400" : "text-rose-400"
              }`}>
                <BondIcon size={16} />
                {formatAmount(tx.amount)}
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Summary */}
      <div className="pt-4 border-t border-primary/10">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-xs text-emerald-400/70 uppercase tracking-wider mb-1">
              Total Earned
            </div>
            <div className="flex items-center gap-2 text-xl font-orbitron font-bold text-emerald-400">
              <BondIcon size={18} />
              {transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="text-xs text-rose-400/70 uppercase tracking-wider mb-1">
              Total Spent
            </div>
            <div className="flex items-center gap-2 text-xl font-orbitron font-bold text-rose-400">
              <BondIcon size={18} />
              {Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
