import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, Sparkles, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";

export interface PurchaseItem {
  id: string;
  name: string;
  type: "frame" | "banner" | "title" | "module";
  price: number;
  rarity?: string;
  previewElement?: React.ReactNode;
}

interface PurchaseConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PurchaseItem | null;
  currentBalance: number;
  onConfirm: () => void;
  isPending: boolean;
}

const rarityGradients: Record<string, string> = {
  common: "from-slate-500/20 to-slate-600/10",
  rare: "from-blue-500/20 to-blue-600/10",
  epic: "from-purple-500/20 to-purple-600/10",
  legendary: "from-amber-500/20 to-amber-600/10",
};

const rarityBorders: Record<string, string> = {
  common: "border-slate-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-amber-500/30",
};

export function PurchaseConfirmModal({
  open,
  onOpenChange,
  item,
  currentBalance,
  onConfirm,
  isPending,
}: PurchaseConfirmModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  if (!item) return null;
  
  const canAfford = currentBalance >= item.price;
  const newBalance = currentBalance - item.price;
  const rarity = item.rarity || "common";

  const handleConfirm = () => {
    setIsAnimating(true);
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={`max-w-md border-2 ${rarityBorders[rarity]} bg-gradient-to-br ${rarityGradients[rarity]} backdrop-blur-xl`}>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-orbitron text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Confirm Purchase
          </AlertDialogTitle>
          <AlertDialogDescription className="font-rajdhani text-muted-foreground">
            You're about to purchase this {item.type}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6 space-y-6">
          {/* Item Preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-primary/20">
            {item.previewElement && (
              <div className="flex-shrink-0">
                {item.previewElement}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-rajdhani font-semibold text-foreground text-lg truncate">
                {item.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground capitalize">
                  {item.type}
                </span>
                {item.rarity && (
                  <span className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-${rarity === 'legendary' ? 'amber' : rarity === 'epic' ? 'purple' : rarity === 'rare' ? 'blue' : 'slate'}-500/20 text-${rarity === 'legendary' ? 'amber' : rarity === 'epic' ? 'purple' : rarity === 'rare' ? 'blue' : 'slate'}-400`}>
                    {item.rarity}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-rajdhani">
              <span className="text-muted-foreground">Current Balance</span>
              <div className="flex items-center gap-1.5">
                <BondIcon size={16} />
                <span className="text-foreground font-medium">{currentBalance.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm font-rajdhani">
              <span className="text-muted-foreground">Item Cost</span>
              <div className="flex items-center gap-1.5 text-red-400">
                <span>-</span>
                <BondIcon size={16} />
                <span className="font-medium">{item.price.toLocaleString()}</span>
              </div>
            </div>
            <div className="h-px bg-primary/20" />
            <div className="flex items-center justify-between font-rajdhani">
              <span className="text-foreground font-medium">New Balance</span>
              <div className={`flex items-center gap-1.5 ${canAfford ? 'text-primary' : 'text-red-400'}`}>
                <BondIcon size={18} />
                <span className="font-orbitron font-bold text-lg">{Math.max(0, newBalance).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Insufficient Funds Warning */}
          {!canAfford && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="text-sm font-rajdhani">
                <span className="text-red-400 font-medium">Insufficient bonds!</span>
                <span className="text-muted-foreground"> You need {(item.price - currentBalance).toLocaleString()} more bonds.</span>
              </div>
            </motion.div>
          )}
        </div>

        <AlertDialogFooter className="gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="font-rajdhani"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canAfford || isPending}
            className="font-rajdhani font-semibold bg-primary/20 border-2 border-primary/40 hover:bg-primary/30 hover:border-primary/60 text-primary min-w-[120px]"
          >
            <AnimatePresence mode="wait">
              {isPending ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Purchasing...
                </motion.span>
              ) : (
                <motion.span
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
