import { useState, useCallback } from "react";
import { usePurchaseCosmetic, usePurchaseModule, useBondBalance } from "@/hooks/useShop";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";

export type TransactionItemType = "module" | "frame" | "banner" | "title";
export type TransactionStatus = "idle" | "pending" | "success" | "error";

interface TransactionInput {
  itemId: string;
  itemName: string;
  itemType: TransactionItemType;
  price: number;
  rarity?: string;
}

export function useShopTransaction() {
  const { user } = useAuth();
  const { play } = useSound();
  const { data: balance } = useBondBalance(user?.id);
  const purchaseCosmetic = usePurchaseCosmetic();
  const purchaseModule = usePurchaseModule();

  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastPurchased, setLastPurchased] = useState<{ name: string; rarity: string } | null>(null);

  const canAfford = useCallback((price: number) => (balance?.balance ?? 0) >= price, [balance]);

  const initiatePurchase = useCallback(
    async (input: TransactionInput): Promise<boolean> => {
      if (!user?.id) {
        setError("Authentication required");
        return false;
      }

      if (!canAfford(input.price)) {
        setError("Insufficient bonds");
        return false;
      }

      play("ui", "click"); // Son de début
      setTransactionStatus("pending");
      setError(null);

      return new Promise((resolve) => {
        const onSuccess = () => {
          play("success", "reward"); // Son de succès
          setTransactionStatus("success");
          setLastPurchased({ name: input.itemName, rarity: input.rarity || "common" });

          // Reset status after a brief delay to allow animations
          setTimeout(() => setTransactionStatus("idle"), 500);
          resolve(true);
        };

        const onError = (err: Error) => {
          play("ui", "error");
          setError(err.message);
          setTransactionStatus("error");
          setTimeout(() => setTransactionStatus("idle"), 2000);
          resolve(false);
        };

        if (input.itemType === "module") {
          purchaseModule.mutate(
            { userId: user.id, moduleId: input.itemId, price: input.price },
            { onSuccess, onError },
          );
        } else {
          purchaseCosmetic.mutate(
            {
              userId: user.id,
              cosmeticId: input.itemId,
              cosmeticType: input.itemType as "frame" | "banner" | "title",
              price: input.price,
            },
            { onSuccess, onError },
          );
        }
      });
    },
    [user, canAfford, play, purchaseModule, purchaseCosmetic],
  );

  const isPending = transactionStatus === "pending" || purchaseCosmetic.isPending || purchaseModule.isPending;

  return {
    initiatePurchase,
    isPending,
    error,
    transactionStatus,
    currentBalance: balance?.balance ?? 0,
    canAfford,
    lastPurchased,
    clearLastPurchased: () => setLastPurchased(null),
  };
}
