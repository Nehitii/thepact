import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/domaines/boutique/hooks/useWishlist";
import { cn } from "@/socle/outils/utils";
import { useTranslation } from "react-i18next";

interface WishlistButtonProps {
  itemId: string;
  itemType: "cosmetic" | "module" | "bundle";
  className?: string;
  size?: "sm" | "md";
}

export function WishlistButton({ itemId, itemType, className, size = "md" }: WishlistButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: wishlist = [] } = useWishlist(user?.id);
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  
  const isInWishlist = wishlist.some(w => w.item_id === itemId && w.item_type === itemType);
  const isLoading = addToWishlist.isPending || removeFromWishlist.isPending;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    if (isInWishlist) {
      removeFromWishlist.mutate({ userId: user.id, itemId, itemType });
    } else {
      addToWishlist.mutate({ userId: user.id, itemId, itemType });
    }
  };
  
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  
  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading || !user}
      className={cn(
        "p-2 rounded-full transition-all disabled:opacity-50",
        isInWishlist 
          ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" 
          : "bg-card/50 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10",
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={isInWishlist
        ? t("shop.wishlist.removeFromWishlist", "Retirer des souhaits")
        : t("shop.wishlist.addToWishlist", "Ajouter aux souhaits")}
    >
      <Heart 
        className={cn(iconSize, isInWishlist && "fill-current")} 
      />
    </motion.button>
  );
}
