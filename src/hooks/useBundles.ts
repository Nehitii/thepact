import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

/**
 * Purchase bundle via secure atomic DB function.
 * Prevents race conditions and client-side price tampering.
 */
export function usePurchaseBundle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ bundleId }: { bundleId: string }) => {
      const { data, error } = await supabase.rpc("purchase_bundle", {
        p_bundle_id: bundleId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_balance?: number };
      if (!result.success) throw new Error(result.error || "Purchase failed");
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bond-balance"] });
      queryClient.invalidateQueries({ queryKey: ["user-cosmetics"] });
      queryClient.invalidateQueries({ queryKey: ["user-module-purchases"] });
      toast({ title: "Bundle unlocked!", description: "All items added to your collection" });
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
