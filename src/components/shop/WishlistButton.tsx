import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  itemId: string;
  itemType: "cosmetic" | "module" | "bundle";
  className?: string;
  size?: "sm" | "md";
}

export function WishlistButton({ itemId, itemType, className, size = "md" }: WishlistButtonProps) {
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
      title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart 
        className={cn(iconSize, isInWishlist && "fill-current")} 
      />
    </motion.button>
  );
}
