import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WishlistItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: "cosmetic" | "module" | "bundle";
  added_at: string;
}

export function useWishlist(userId: string | undefined) {
  return useQuery({
    queryKey: ["wishlist", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("shop_wishlist")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false });
      
      if (error) throw error;
      return data as WishlistItem[];
    },
    enabled: !!userId,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      itemId, 
      itemType 
    }: { 
      userId: string; 
      itemId: string; 
      itemType: "cosmetic" | "module" | "bundle";
    }) => {
      const { data, error } = await supabase
        .from("shop_wishlist")
        .insert({
          user_id: userId,
          item_id: itemId,
          item_type: itemType,
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === "23505") {
          throw new Error("Already in wishlist");
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", variables.userId] });
      toast({ title: "Added to wishlist", description: "We'll notify you when you can afford it!" });
    },
    onError: (error: Error) => {
      if (error.message !== "Already in wishlist") {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      itemId, 
      itemType 
    }: { 
      userId: string; 
      itemId: string; 
      itemType: "cosmetic" | "module" | "bundle";
    }) => {
      const { error } = await supabase
        .from("shop_wishlist")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", itemId)
        .eq("item_type", itemType);
      
      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", variables.userId] });
      toast({ title: "Removed from wishlist" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useIsInWishlist(userId: string | undefined, itemId: string, itemType: string) {
  const { data: wishlist = [] } = useWishlist(userId);
  return wishlist.some(w => w.item_id === itemId && w.item_type === itemType);
}
