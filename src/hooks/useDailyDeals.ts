import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DailyDeal {
  id: string;
  item_id: string;
  item_type: "cosmetic_frame" | "cosmetic_banner" | "cosmetic_title" | "module" | "bundle";
  discount_percentage: number;
  deal_date: string;
  is_active: boolean;
}

export interface DailyDealWithItem extends DailyDeal {
  item?: {
    id: string;
    name: string;
    price: number;
    rarity: string;
    preview_url?: string | null;
    description?: string | null;
  };
  discounted_price: number;
}

export function useDailyDeals() {
  return useQuery({
    queryKey: ["daily-deals"],
    queryFn: async () => {
      const { data: deals, error } = await supabase
        .from("shop_daily_deals")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      if (!deals || deals.length === 0) return [];
      
      const typedDeals = deals as DailyDeal[];

      // Group item IDs by type for batch fetching
      const idsByType: Record<string, string[]> = {};
      for (const deal of typedDeals) {
        if (!idsByType[deal.item_type]) idsByType[deal.item_type] = [];
        idsByType[deal.item_type].push(deal.item_id);
      }

      // Batch fetch all items in parallel
      const itemMap = new Map<string, { id: string; name: string; price: number; rarity: string; preview_url?: string | null; description?: string | null }>();

      const fetches: Promise<void>[] = [];

      if (idsByType["cosmetic_frame"]?.length) {
        fetches.push(
          supabase.from("cosmetic_frames").select("id, name, price, rarity, preview_url").in("id", idsByType["cosmetic_frame"])
            .then(({ data }) => { data?.forEach(d => itemMap.set(d.id, d)); })
        );
      }
      if (idsByType["cosmetic_banner"]?.length) {
        fetches.push(
          supabase.from("cosmetic_banners").select("id, name, price, rarity, preview_url").in("id", idsByType["cosmetic_banner"])
            .then(({ data }) => { data?.forEach(d => itemMap.set(d.id, d)); })
        );
      }
      if (idsByType["cosmetic_title"]?.length) {
        fetches.push(
          supabase.from("cosmetic_titles").select("id, title_text, price, rarity").in("id", idsByType["cosmetic_title"])
            .then(({ data }) => { data?.forEach(d => itemMap.set(d.id, { ...d, name: d.title_text })); })
        );
      }
      if (idsByType["module"]?.length) {
        fetches.push(
          supabase.from("shop_modules").select("id, name, price_bonds, rarity, description").in("id", idsByType["module"])
            .then(({ data }) => { data?.forEach(d => itemMap.set(d.id, { ...d, price: d.price_bonds })); })
        );
      }

      await Promise.all(fetches);

      // Enrich deals
      const enrichedDeals: DailyDealWithItem[] = [];
      for (const deal of typedDeals) {
        const item = itemMap.get(deal.item_id);
        if (item) {
          const discounted_price = Math.floor(item.price * (1 - deal.discount_percentage / 100));
          enrichedDeals.push({ ...deal, item: item as any, discounted_price });
        }
      }
      
      return enrichedDeals;
    },
    refetchInterval: 60000,
  });
}

/**
 * Purchase a daily deal via secure atomic DB function.
 * Server validates the deal, computes the discounted price, and handles the transaction.
 */
export function usePurchaseDailyDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ dealId }: { dealId: string }) => {
      const { data, error } = await supabase.rpc("purchase_daily_deal", {
        p_deal_id: dealId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; new_balance?: number; price?: number };
      if (!result.success) throw new Error(result.error || "Purchase failed");

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bond-balance"] });
      queryClient.invalidateQueries({ queryKey: ["user-cosmetics"] });
      queryClient.invalidateQueries({ queryKey: ["user-module-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["daily-deals"] });
      toast({ title: "Deal secured!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
