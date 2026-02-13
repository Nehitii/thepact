import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { HoldPurchaseButton } from "./HoldPurchaseButton";

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
}: PurchaseConfirmModalProps) {
  const isDialogOpen = open ?? isOpen ?? false;
  const handleOpenChange = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (!value && onClose) onClose();
  };

  if (!item) return null;

  const canAfford = currentBalance >= item.price;
  const newBalance = currentBalance - item.price;
  const rarity = item.rarity || "common";

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md border-2 border-primary/20 bg-black/90 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-orbitron text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Confirm Acquisition
          </AlertDialogTitle>
          <AlertDialogDescription className="font-rajdhani text-muted-foreground">
            You are about to purchase this <span className="text-primary uppercase">{item.type}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6 space-y-6">
          {/* Item Preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
            {item.previewElement && <div className="flex-shrink-0">{item.previewElement}</div>}
            <div>
              <h4 className="font-rajdhani font-semibold text-foreground text-lg">{item.name}</h4>
              <span className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70`}>
                {rarity}
              </span>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 text-sm font-rajdhani">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Balance</span>
              <div className="flex items-center gap-1.5">
                <BondIcon size={16} /> {currentBalance.toLocaleString()}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item Cost</span>
              <div className="flex items-center gap-1.5 text-red-400">
                - <BondIcon size={16} /> {item.price.toLocaleString()}
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between font-bold">
              <span>New Balance</span>
              <div className={`flex items-center gap-1.5 ${canAfford ? "text-emerald-400" : "text-red-500"}`}>
                <BondIcon size={16} /> {Math.max(0, newBalance).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Warning */}
          {!canAfford && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="text-sm font-rajdhani text-red-300">Insufficient Bonds</div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-3 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="font-rajdhani"
          >
            Cancel
          </Button>

          {/* UPDATED: Uses HoldPurchaseButton instead of Click */}
          <div className="w-full sm:w-auto min-w-[160px]">
            <HoldPurchaseButton
              onComplete={onConfirm}
              disabled={!canAfford || isPending}
              isPending={isPending}
              holdDuration={1000} // Faster than fitting room
            />
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
