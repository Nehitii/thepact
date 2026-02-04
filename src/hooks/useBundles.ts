import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface BundleItem {
  item_id: string;
  item_type: "cosmetic_frame" | "cosmetic_banner" | "cosmetic_title" | "module";
  name?: string;
}

export interface ShopBundle {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_bonds: number;
  original_price_bonds: number | null;
  discount_percentage: number | null;
  items: BundleItem[];
  rarity: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  display_order: number;
}

export function useShopBundles() {
  return useQuery({
    queryKey: ["shop-bundles"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("shop_bundles")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      
      // Filter by date in JS to avoid complex OR queries
      const filtered = (data || []).filter(bundle => {
        const startsOk = !bundle.starts_at || new Date(bundle.starts_at) <= new Date(now);
        const endsOk = !bundle.ends_at || new Date(bundle.ends_at) >= new Date(now);
        return startsOk && endsOk;
      });
      
      return filtered.map(bundle => ({
        ...bundle,
        items: Array.isArray(bundle.items) ? (bundle.items as unknown as BundleItem[]) : []
      })) as unknown as ShopBundle[];
    },
  });
}

export function usePurchaseBundle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      bundle 
    }: { 
      userId: string; 
      bundle: ShopBundle;
    }) => {
      // Get current balance
      const { data: balance, error: balanceError } = await supabase
        .from("bond_balance")
        .select("balance, total_spent")
        .eq("user_id", userId)
        .single();
      
      if (balanceError) throw balanceError;
      if (balance.balance < bundle.price_bonds) throw new Error("Insufficient bonds");
      
      // Deduct bonds
      const { error: updateError } = await supabase
        .from("bond_balance")
        .update({ 
          balance: balance.balance - bundle.price_bonds,
          total_spent: balance.total_spent + bundle.price_bonds
        })
        .eq("user_id", userId);
      
      if (updateError) throw updateError;
      
      // Add each item from the bundle
      for (const item of bundle.items) {
        if (item.item_type === "module") {
          await supabase.from("user_module_purchases").insert({
            user_id: userId,
            module_id: item.item_id,
          });
        } else {
          const cosmeticType = item.item_type.replace("cosmetic_", "") as "frame" | "banner" | "title";
          await supabase.from("user_cosmetics").insert({
            user_id: userId,
            cosmetic_id: item.item_id,
            cosmetic_type: cosmeticType,
          });
        }
      }
      
      // Log transaction
      await supabase.from("bond_transactions").insert({
        user_id: userId,
        amount: -bundle.price_bonds,
        transaction_type: "spend",
        description: `Purchased bundle: ${bundle.name}`,
        reference_id: bundle.id,
        reference_type: "bundle",
      });
      
      return { userId, bundle };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bond-balance"] });
      queryClient.invalidateQueries({ queryKey: ["user-cosmetics"] });
      queryClient.invalidateQueries({ queryKey: ["user-module-purchases"] });
      toast({ title: "Bundle unlocked!", description: `${data.bundle.items.length} items added to your collection` });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Purchase failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}
