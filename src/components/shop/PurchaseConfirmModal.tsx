import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Sparkles } from "lucide-react";
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
import { HoldPurchaseButton } from "@/components/shop/HoldPurchaseButton";

export interface PurchaseItem {
  id: string;
  name: string;
  type: "frame" | "banner" | "title" | "module" | "bundle" | "cosmetic";
  price: number;
  rarity?: string;
  previewElement?: React.ReactNode;
  originalPrice?: number;
}

interface PurchaseConfirmModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  item: PurchaseItem | null;
  currentBalance: number;
  onConfirm: () => void;
  isPending?: boolean;
  isPurchasing?: boolean;
}

const rarityConfig: Record<string, { gradient: string; border: string; particle: string; glow: string }> = {
  common: { gradient: "from-slate-500/20 to-slate-600/10", border: "border-slate-500/30", particle: "#94a3b8", glow: "hsl(215 20% 65% / 0.15)" },
  rare: { gradient: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/30", particle: "#60a5fa", glow: "hsl(217 91% 60% / 0.15)" },
  epic: { gradient: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/30", particle: "#c084fc", glow: "hsl(270 95% 75% / 0.15)" },
  legendary: { gradient: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/30", particle: "#fbbf24", glow: "hsl(45 93% 47% / 0.15)" },
};

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 400;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span className={className}>{display.toLocaleString()}</span>;
}

// Floating particle for background
function FloatingParticle({ color, delay }: { color: string; delay: number }) {
  const x = Math.random() * 100;
  const size = 2 + Math.random() * 3;
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ backgroundColor: color, width: size, height: size, left: `${x}%`, bottom: -10 }}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.8, 0], y: -300 }}
      transition={{ duration: 3 + Math.random() * 2, delay, repeat: Infinity, repeatDelay: Math.random() * 2, ease: "easeOut" }}
    />
  );
}

export function PurchaseConfirmModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  item,
  currentBalance,
  onConfirm,
  isPending,
  isPurchasing,
}: PurchaseConfirmModalProps) {
  const isDialogOpen = open ?? isOpen ?? false;
  const handleOpenChange = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (!value && onClose) onClose();
  };
  const isLoading = isPending ?? isPurchasing ?? false;

  if (!item) return null;

  const canAfford = currentBalance >= item.price;
  const newBalance = currentBalance - item.price;
  const rarity = item.rarity || "common";
  const cfg = rarityConfig[rarity] || rarityConfig.common;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const lowBalanceWarning = canAfford && newBalance < 100;

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className={`max-w-md border-2 ${cfg.border} bg-gradient-to-br ${cfg.gradient} backdrop-blur-xl overflow-hidden`}>
        {/* Particle background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <FloatingParticle key={i} color={cfg.particle} delay={i * 0.4} />
          ))}
        </div>

        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 3px)",
          }}
        />

        <div className="relative z-10">
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
            {/* Item Preview with spotlight */}
            <div className="relative flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-primary/20 overflow-hidden">
              {/* Spotlight glow behind preview */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 30% 50%, ${cfg.glow} 0%, transparent 70%)`,
                }}
              />
              {item.previewElement && (
                <motion.div
                  className="relative flex-shrink-0"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {item.previewElement}
                </motion.div>
              )}
              <div className="relative flex-1 min-w-0">
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

            {/* Price Breakdown with animated numbers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-rajdhani">
                <span className="text-muted-foreground">Current Balance</span>
                <div className="flex items-center gap-1.5">
                  <BondIcon size={16} />
                  <AnimatedNumber value={currentBalance} className="text-foreground font-medium" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm font-rajdhani">
                <span className="text-muted-foreground">Item Cost</span>
                <div className="flex items-center gap-1.5">
                  {hasDiscount && (
                    <span className="text-muted-foreground line-through text-xs flex items-center gap-1">
                      <BondIcon size={12} />
                      {item.originalPrice?.toLocaleString()}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 ${hasDiscount ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span>-</span>
                    <BondIcon size={16} />
                    <span className="font-medium">{item.price.toLocaleString()}</span>
                  </span>
                </div>
              </div>
              <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)" }} />
              <div className="flex items-center justify-between font-rajdhani">
                <span className="text-foreground font-medium">New Balance</span>
                <div className={`flex items-center gap-1.5 ${canAfford ? 'text-primary' : 'text-red-400'}`}>
                  <BondIcon size={18} />
                  <span className="font-orbitron font-bold text-lg">
                    <AnimatedNumber value={Math.max(0, newBalance)} />
                  </span>
                </div>
              </div>
            </div>

            {/* Low balance warning */}
            {lowBalanceWarning && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-xs font-rajdhani text-amber-400">
                  Balance will drop below 100 bonds after this purchase.
                </span>
              </motion.div>
            )}

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
              onClick={() => handleOpenChange(false)}
              className="font-rajdhani"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <div className="flex-1 min-w-[160px]">
              <HoldPurchaseButton
                onComplete={onConfirm}
                disabled={!canAfford}
                isPending={isLoading}
              />
            </div>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
